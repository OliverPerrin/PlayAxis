"""Public, no-key sports adapters. Never synthesize scores or missing events."""

import asyncio
import math
import time
from datetime import datetime, timezone, timedelta

import httpx
from fastapi import HTTPException
from app.core.cache import cache
from app.core import place_cache
from app.services import nba
from app.services.league_feeds import (
    football_events,
    football_table,
    football_request,
    football_event,
    nfl_events,
    nfl_table,
)
from app.core.config import settings

HEADERS = {
    "User-Agent": "PlayAxis/2.0 (https://github.com/OliverPerrin/PlayAxis)",
    "Accept": "application/json",
}
SPORTS = [
    {
        "key": "bundesliga",
        "name": "Bundesliga",
        "sport": "Football",
        "source": "OpenLigaDB",
        "coverage": "Season fixtures and full league table",
    },
    {
        "key": "f1",
        "name": "Formula 1",
        "sport": "Motorsport",
        "source": "Jolpica F1",
        "coverage": "Season calendar and driver standings",
    },
    {
        "key": "mlb",
        "name": "MLB",
        "sport": "Baseball",
        "source": "MLB",
        "coverage": "Weekly fixtures and division standings",
    },
    {
        "key": "nhl",
        "name": "NHL",
        "sport": "Ice hockey",
        "source": "NHL",
        "coverage": "Weekly fixtures and full standings",
    },
    {
        "key": "epl",
        "name": "Premier League",
        "sport": "Football",
        "source": (
            "football-data.org" if settings.FOOTBALL_DATA_API_KEY else "TheSportsDB"
        ),
        "coverage": (
            "Full season fixtures and complete table. Scores delayed."
            if settings.FOOTBALL_DATA_API_KEY
            else "Free sample: one upcoming and one recent fixture; up to five standings rows"
        ),
    },
    {
        "key": "nba",
        "name": "NBA",
        "sport": "Basketball",
        "source": "BALLDONTLIE" if settings.BALLDONTLIE_API_KEY else "TheSportsDB",
        "coverage": (
            "Up to 100 recent and upcoming games in a 40-day window; complete team records"
            if settings.BALLDONTLIE_API_KEY
            else "Free fixture sample"
        ),
    },
    {
        "key": "nfl",
        "name": "NFL",
        "sport": "American football",
        "source": "nflverse / Lee Sharpe",
        "coverage": "Full season schedule, final scores and division tables",
    },
]
_locks = {}
_sportsdb_lock = asyncio.Lock()
_last_sportsdb = 0.0


async def get_json(url, params=None, ttl=300, method="GET"):
    key = f"public:{method}:{url}:{sorted((params or {}).items())}"
    found = await cache.get(key)
    if found is not None:
        return found
    lock = _locks.setdefault(key, asyncio.Lock())
    try:
        async with lock:
            found = await cache.get(key)
            if found is not None:
                return found
            try:
                async with httpx.AsyncClient(
                    timeout=18, headers=HEADERS, follow_redirects=True
                ) as client:
                    if "thesportsdb.com" in url:
                        global _last_sportsdb
                        async with _sportsdb_lock:
                            await asyncio.sleep(
                                max(0, 2.1 - (time.monotonic() - _last_sportsdb))
                            )
                            _last_sportsdb = time.monotonic()
                            response = await client.get(url, params=params)
                    else:
                        response = await client.request(
                            method,
                            url,
                            params=params if method == "GET" else None,
                            data=params if method == "POST" else None,
                        )
                    response.raise_for_status()
                    data = response.json()
                    if isinstance(data, dict) and data.get("remark"):
                        raise HTTPException(
                            503,
                            "The place provider could not complete this search. Please try again shortly.",
                        )
                    await cache.set(key, data, ttl)
                    return data
            except (httpx.HTTPError, ValueError) as exc:
                raise HTTPException(
                    503,
                    "This data provider is temporarily unavailable. Please try again shortly.",
                ) from exc
    finally:
        if not lock.locked():
            _locks.pop(key, None)


def stamp():
    return datetime.now(timezone.utc).isoformat()


def known_sport(key):
    key = {
        "soccer": "epl",
        "football": "epl",
        "basketball": "nba",
        "ice_hockey": "nhl",
        "baseball": "mlb",
        "formula1": "f1",
    }.get(key, key)
    item = next((s for s in SPORTS if s["key"] == key), None)
    if item is None:
        raise HTTPException(
            404, "This league is not available. Choose a league from the list."
        )
    return item


def event(id, name, sport, start=None, **extra):
    return {
        "id": str(id),
        "name": name,
        "title": name,
        "sport": sport,
        "start": start,
        **extra,
    }


def split_events(items):
    now = datetime.now(timezone.utc)
    upcoming, recent = [], []
    for item in items:
        try:
            date = datetime.fromisoformat(
                (item.get("start") or "").replace("Z", "+00:00")
            )
            if not date.tzinfo:
                date = date.replace(tzinfo=timezone.utc)
        except ValueError:
            date = now
        (recent if item.get("completed") or date < now else upcoming).append(item)
    return sorted(upcoming, key=lambda e: e.get("start") or ""), sorted(
        recent, key=lambda e: e.get("start") or "", reverse=True
    )


def openliga_event(row):
    h, a = row["team1"], row["team2"]
    scores = sorted(
        row.get("matchResults", []),
        key=lambda r: r.get("resultTypeID", 0),
        reverse=True,
    )
    score = scores[0] if scores else {}
    loc = row.get("location") or {}
    return event(
        f"ol-{row['matchID']}",
        f"{h['teamName']} vs {a['teamName']}",
        "Football",
        row.get("matchDateTimeUTC"),
        source="OpenLigaDB",
        league="Bundesliga",
        home_team=h["teamName"],
        away_team=a["teamName"],
        home_badge=h.get("teamIconUrl"),
        away_badge=a.get("teamIconUrl"),
        home_score=score.get("pointsTeam1"),
        away_score=score.get("pointsTeam2"),
        completed=row.get("matchIsFinished", False),
        status="Full time" if row.get("matchIsFinished") else "Scheduled",
        venue=loc.get("locationStadium"),
        city=loc.get("locationCity"),
        url="https://www.bundesliga.com/en/bundesliga/matchday",
    )


def f1_event(row):
    circuit = row["Circuit"]
    loc = circuit["Location"]
    return event(
        f"f1-{row['season']}-{row['round']}",
        row["raceName"],
        "Motorsport",
        f"{row['date']}T{row.get('time', '00:00:00Z')}",
        source="Jolpica F1",
        league="Formula 1",
        venue=circuit["circuitName"],
        city=loc["locality"],
        country=loc["country"],
        latitude=float(loc["lat"]),
        longitude=float(loc["long"]),
        url=row.get("url"),
        description=f"Round {row['round']} of the {row['season']} Formula 1 season.",
        status="Race weekend",
    )


def nhl_event(row):
    h, a = row["homeTeam"], row["awayTeam"]

    def name(team):
        return (
            team.get("placeName", {}).get("default", team.get("abbrev", ""))
            + " "
            + team.get("commonName", {}).get("default", "")
        ).strip()

    hn, an = name(h), name(a)
    status = {
        "FUT": "Scheduled",
        "PRE": "Pre-game",
        "LIVE": "Live",
        "CRIT": "Live",
        "FINAL": "Full time",
        "OFF": "Full time",
    }.get(row.get("gameState"), row.get("gameState"))
    return event(
        f"nhl-{row['id']}",
        f"{hn} vs {an}",
        "Ice hockey",
        row["startTimeUTC"],
        source="NHL",
        league="NHL",
        home_team=hn,
        away_team=an,
        home_score=h.get("score"),
        away_score=a.get("score"),
        home_badge=h.get("logo"),
        away_badge=a.get("logo"),
        venue=row.get("venue", {}).get("default"),
        status=status,
        completed=row.get("gameState") in ["FINAL", "OFF"],
        url=f"https://www.nhl.com/gamecenter/{row['id']}",
    )


def mlb_event(row):
    h, a = row["teams"]["home"], row["teams"]["away"]
    venue = row.get("venue", {})
    loc = venue.get("location", {})
    coords = loc.get("defaultCoordinates", {})
    return event(
        f"mlb-{row['gamePk']}",
        f"{h['team']['name']} vs {a['team']['name']}",
        "Baseball",
        row.get("gameDate"),
        source="MLB",
        league="MLB",
        home_team=h["team"]["name"],
        away_team=a["team"]["name"],
        home_score=h.get("score"),
        away_score=a.get("score"),
        venue=venue.get("name"),
        city=loc.get("city"),
        latitude=coords.get("latitude"),
        longitude=coords.get("longitude"),
        status=row["status"].get("detailedState"),
        completed=row["status"].get("abstractGameState") == "Final",
        url=f"https://www.mlb.com/gameday/{row['gamePk']}",
    )


async def sports_events(key):
    meta = known_sport(key)
    key = meta["key"]
    existing = await cache.get("sports-snapshot:" + key)
    if existing is not None:
        return existing
    items = []
    if key == "nba" and settings.BALLDONTLIE_API_KEY:
        items = await nba.events()
    elif key == "epl" and settings.FOOTBALL_DATA_API_KEY:
        items = await football_events()
    elif key == "nfl":
        items = await nfl_events()
    elif key == "bundesliga":
        current = await get_json("https://api.openligadb.de/getmatchdata/bl1")
        season = (
            current[0].get("leagueSeason")
            if current
            else datetime.now(timezone.utc).year
        )
        data = await get_json(
            f"https://api.openligadb.de/getmatchdata/bl1/{season}", ttl=900
        )
        items = [openliga_event(row) for row in data]
    elif key == "f1":
        data = await get_json(
            "https://api.jolpi.ca/ergast/f1/current.json", {"limit": 100}, ttl=3600
        )
        items = [f1_event(row) for row in data["MRData"]["RaceTable"]["Races"]]
    elif key == "nhl":
        data = await get_json("https://api-web.nhle.com/v1/schedule/now")
        items = [
            nhl_event(row)
            for day in data.get("gameWeek", [])
            for row in day.get("games", [])
        ]
    elif key == "mlb":
        today = datetime.now(timezone.utc).date()
        data = await get_json(
            "https://statsapi.mlb.com/api/v1/schedule",
            {
                "sportId": 1,
                "startDate": str(today - timedelta(days=2)),
                "endDate": str(today + timedelta(days=7)),
                "hydrate": "venue(location),linescore",
            },
        )
        candidates = [
            row for day in data.get("dates", []) for row in day.get("games", [])
        ]
        latest = {
            row["gamePk"]: row
            for row in sorted(candidates, key=lambda r: r.get("gameDate", ""))
        }
        items = [mlb_event(row) for row in latest.values()]
    else:
        league = {"epl": "4328", "nba": "4387", "nfl": "4391"}[key]
        base = f"https://www.thesportsdb.com/api/v1/json/{settings.THESPORTSDB_API_KEY or '123'}"
        results = await asyncio.gather(
            get_json(f"{base}/eventsnextleague.php", {"id": league}, ttl=900),
            get_json(f"{base}/eventspastleague.php", {"id": league}, ttl=900),
        )
        items = [
            sportsdb_event(row)
            for result in results
            for row in result.get("events") or []
        ]
    upcoming, recent = split_events(items)
    result = {
        "sport": key,
        "league": meta["name"],
        "source": meta["source"],
        "coverage": meta["coverage"],
        "limited": (key == "nba" and not settings.BALLDONTLIE_API_KEY)
        or (key == "epl" and not settings.FOOTBALL_DATA_API_KEY),
        "upcoming": upcoming,
        "recent": recent,
        "updated_at": stamp(),
    }
    await cache.set("sports-snapshot:" + key, result, 120)
    return result


def sportsdb_event(row):
    start = row.get("strTimestamp")
    if start:
        try:
            parsed = datetime.fromisoformat(start.replace("Z", "+00:00"))
            if not parsed.tzinfo:
                start = parsed.replace(tzinfo=timezone.utc).isoformat()
        except ValueError:
            start = None
    if not start and row.get("dateEvent"):
        start = f"{row['dateEvent']}T{row.get('strTime') or '00:00:00'}+00:00"
    return event(
        f"tsdb-{row['idEvent']}",
        row.get("strEvent") or "Sports event",
        row.get("strSport"),
        start,
        source="TheSportsDB",
        league=row.get("strLeague"),
        home_team=row.get("strHomeTeam"),
        away_team=row.get("strAwayTeam"),
        home_score=row.get("intHomeScore"),
        away_score=row.get("intAwayScore"),
        home_badge=row.get("strHomeTeamBadge"),
        away_badge=row.get("strAwayTeamBadge"),
        venue=row.get("strVenue"),
        city=row.get("strCity"),
        country=row.get("strCountry"),
        image=row.get("strThumb"),
        description=row.get("strDescriptionEN"),
        status=row.get("strStatus"),
        completed=(row.get("strStatus") or "").casefold()
        in {"match finished", "ft", "aet", "ap", "finished", "final"},
        url=f"https://www.thesportsdb.com/event/{row['idEvent']}",
    )


async def event_detail(event_id):
    found = await cache.get("event:" + event_id)
    if found:
        return found
    for meta in SPORTS:
        snapshot = await cache.get("sports-snapshot:" + meta["key"])
        if snapshot:
            match = next(
                (
                    e
                    for e in snapshot["upcoming"] + snapshot["recent"]
                    if e["id"] == event_id
                ),
                None,
            )
            if match:
                return match
    if event_id.startswith("nba-"):
        return await nba.detail(event_id[4:])
    if event_id.startswith("fd-") and event_id[3:].isdigit():
        return football_event(await football_request("matches/" + event_id[3:]))
    if event_id.startswith("nflv-"):
        return await nfl_events(event_id)
    if event_id.startswith("tsdb-") and event_id[5:].isdigit():
        data = await get_json(
            f"https://www.thesportsdb.com/api/v1/json/{settings.THESPORTSDB_API_KEY or '123'}/lookupevent.php",
            {"id": event_id[5:]},
            ttl=300,
        )
        if data.get("events"):
            return sportsdb_event(data["events"][0])
    elif event_id.startswith("ol-") and event_id[3:].isdigit():
        data = await get_json(f"https://api.openligadb.de/getmatchdata/{event_id[3:]}")
        if isinstance(data, dict) and data.get("team1"):
            return openliga_event(data)
    elif event_id.startswith("mlb-") and event_id[4:].isdigit():
        data = await get_json(
            "https://statsapi.mlb.com/api/v1/schedule",
            {"gamePk": event_id[4:], "hydrate": "venue(location),linescore"},
        )
        games = [g for d in data.get("dates", []) for g in d.get("games", [])]
        if games:
            return mlb_event(max(games, key=lambda r: r.get("gameDate", "")))
    elif event_id.startswith("nhl-") and event_id[4:].isdigit():
        data = await get_json(
            f"https://api-web.nhle.com/v1/gamecenter/{event_id[4:]}/landing"
        )
        if data.get("id"):
            return nhl_event(data)
    elif event_id.startswith("f1-"):
        parts = event_id.split("-")
        if len(parts) == 3 and parts[1].isdigit() and parts[2].isdigit():
            data = await get_json(
                f"https://api.jolpi.ca/ergast/f1/{parts[1]}/{parts[2]}.json", ttl=3600
            )
            races = data["MRData"]["RaceTable"]["Races"]
            if races:
                return f1_event(races[0])
    raise HTTPException(
        404, "This event could not be found. Browse the current events instead."
    )


async def standings(key):
    meta = known_sport(key)
    key = meta["key"]
    rows = []
    season = None
    columns = ["Rank", "Team", "Played", "Win", "Draw", "Loss", "Points"]
    if key == "nba" and settings.BALLDONTLIE_API_KEY:
        return await nba.standings()
    if key == "epl" and settings.FOOTBALL_DATA_API_KEY:
        return await football_table()
    if key == "nfl":
        return await nfl_table()
    if key == "bundesliga":
        matches = await get_json("https://api.openligadb.de/getmatchdata/bl1")
        season = matches[0].get("leagueSeason") if matches else datetime.now().year
        raw = await get_json(
            f"https://api.openligadb.de/getbltable/bl1/{season}", ttl=900
        )
        rows = [
            {
                "Rank": i + 1,
                "Team": r["teamName"],
                "Played": r["matches"],
                "Win": r["won"],
                "Draw": r["draw"],
                "Loss": r["lost"],
                "Points": r["points"],
            }
            for i, r in enumerate(raw)
        ]
    elif key == "f1":
        raw = await get_json(
            "https://api.jolpi.ca/ergast/f1/current/driverStandings.json",
            {"limit": 100},
            ttl=900,
        )
        lists = raw["MRData"]["StandingsTable"]["StandingsLists"]
        columns = ["Rank", "Driver", "Team", "Wins", "Points"]
        if lists:
            season = lists[0]["season"]
            rows = [
                {
                    "Rank": r["position"],
                    "Driver": r["Driver"]["givenName"]
                    + " "
                    + r["Driver"]["familyName"],
                    "Team": ", ".join(c["name"] for c in r["Constructors"]),
                    "Wins": r["wins"],
                    "Points": r["points"],
                }
                for r in lists[0]["DriverStandings"]
            ]
    elif key == "nhl":
        raw = await get_json("https://api-web.nhle.com/v1/standings/now", ttl=900)
        columns = ["Rank", "Team", "Division", "Played", "Win", "Loss", "OT", "Points"]
        rows = [
            {
                "Rank": r["leagueSequence"],
                "Team": r["teamName"]["default"],
                "Division": r["divisionName"],
                "Played": r["gamesPlayed"],
                "Win": r["wins"],
                "Loss": r["losses"],
                "OT": r["otLosses"],
                "Points": r["points"],
            }
            for r in raw.get("standings", [])
        ]
        if raw.get("standings"):
            season = raw["standings"][0].get("seasonId")
    elif key == "mlb":
        raw = await get_json(
            "https://statsapi.mlb.com/api/v1/standings",
            {
                "leagueId": "103,104",
                "standingsTypes": "regularSeason",
                "hydrate": "division",
            },
            ttl=900,
        )
        columns = ["Rank", "Team", "Division", "Win", "Loss", "PCT", "GB"]
        for group in raw.get("records", []):
            season = group.get("division", {}).get("season") or (
                group.get("teamRecords") or [{}]
            )[0].get("season")
            rows.extend(
                {
                    "Rank": r["divisionRank"],
                    "Team": r["team"]["name"],
                    "Division": group.get("division", {}).get("name", ""),
                    "Win": r["wins"],
                    "Loss": r["losses"],
                    "PCT": r["winningPercentage"],
                    "GB": r["gamesBack"],
                }
                for r in group["teamRecords"]
            )
    elif key == "epl":
        year = datetime.now(timezone.utc).year
        year -= datetime.now(timezone.utc).month < 7
        season = f"{year}-{year+1}"
        raw = await get_json(
            f"https://www.thesportsdb.com/api/v1/json/{settings.THESPORTSDB_API_KEY or '123'}/lookuptable.php",
            {"l": "4328", "s": season},
            ttl=1800,
        )
        rows = [
            {
                "Rank": r.get("intRank"),
                "Team": r.get("strTeam"),
                "Played": r.get("intPlayed"),
                "Win": r.get("intWin"),
                "Draw": r.get("intDraw"),
                "Loss": r.get("intLoss"),
                "Points": r.get("intPoints"),
            }
            for r in raw.get("table") or []
        ]
    else:
        return {
            "sport": key,
            "source": meta["source"],
            "tables": [],
            "coverage": "This provider does not include reliable standings for this league on its free tier. Choose Bundesliga, Formula 1, MLB or NHL.",
            "limited": True,
            "updated_at": stamp(),
        }
    return {
        "sport": key,
        "source": meta["source"],
        "season": season,
        "coverage": meta["coverage"],
        "limited": key == "epl",
        "updated_at": stamp(),
        "tables": [{"name": meta["name"], "columns": columns, "rows": rows}],
    }


async def places(lat, lon, radius=1500):
    # Small, user-driven searches. Cache repeats and never fetch tiles server-side.
    key = f"places:{lat:.3f}:{lon:.3f}:{radius}"
    error = "Nearby place search is temporarily busy. The map still works. Please retry in a moment or search a smaller area."
    found = await cache.get(key)
    if found is not None:
        return found
    saved = await asyncio.to_thread(place_cache.read, key)
    if saved and saved[1] < 3600:
        return saved[0]
    if await cache.get(key + ":busy"):
        if saved:
            return {**saved[0], "stale": True}
        raise HTTPException(503, error)
    query = f'[out:json][timeout:10];nwr(around:{radius},{lat},{lon})[name][leisure~"^(sports_centre|pitch|swimming_pool|fitness_centre|track|stadium|park|recreation_ground)$"];out center tags 100;'
    regional = "https://overpass.atownsend.org.uk/api/interpreter"
    hosts = [settings.OVERPASS_API_URL] if settings.OVERPASS_API_URL else []
    if not hosts:
        if 49.5 <= lat <= 61 and -11 <= lon <= 2:
            hosts.append(regional)
        hosts.extend(
            [
                "https://overpass.private.coffee/api/interpreter",
                "https://overpass-api.de/api/interpreter",
            ]
        )
    raw = None
    deadline = time.monotonic() + 28
    for host in hosts:
        remaining = min(14, deadline - time.monotonic())
        if remaining <= 0:
            break
        try:
            candidate = await asyncio.wait_for(
                get_json(host, {"data": query}, ttl=3600, method="POST"),
                timeout=remaining,
            )
            if candidate.get("remark") or not isinstance(
                candidate.get("elements"), list
            ):
                continue
            # Regional service cannot establish absence outside its dataset.
            if host == regional and not candidate["elements"]:
                continue
            raw = candidate
            break
        except (HTTPException, asyncio.TimeoutError):
            continue
    if raw is None:
        await cache.set(key + ":busy", True, 30)
        if saved:
            return {**saved[0], "stale": True}
        raise HTTPException(503, error)
    items = []
    for item in raw["elements"]:
        tags = item.get("tags", {})
        pos = item.get("center", item)
        y, x = pos.get("lat"), pos.get("lon")
        if y is None or x is None or not math.isfinite(y) or not math.isfinite(x):
            continue
        if tags.get("access") in ["private", "no"]:
            continue
        items.append(
            {
                "id": f"osm-{item['type']}-{item['id']}",
                "name": tags.get("name"),
                "latitude": y,
                "longitude": x,
                "sport": tags.get("sport", "").replace(";", ", "),
                "kind": tags.get("leisure", "").replace("_", " "),
                "address": ", ".join(
                    filter(None, [tags.get("addr:street"), tags.get("addr:city")])
                ),
                "city": tags.get("addr:city"),
                "opening_hours": tags.get("opening_hours"),
                "access": tags.get("access"),
                "fee": tags.get("fee"),
                "url": f"https://www.openstreetmap.org/{item['type']}/{item['id']}",
                "source": "OpenStreetMap",
            }
        )
    result = {
        "places": items,
        "source": "OpenStreetMap",
        "updated_at": stamp(),
        "radius": radius,
        "limited": len(raw["elements"]) >= 100,
    }
    await cache.set(key, result, 3600)
    await asyncio.to_thread(place_cache.write, key, result)
    return result
