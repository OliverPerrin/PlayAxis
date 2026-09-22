"""Complete free-tier league feeds, with source-aware season and rate limits."""

import asyncio
import csv
import io
import time
from datetime import datetime, timezone
from zoneinfo import ZoneInfo
import httpx
from fastapi import HTTPException
from app.core.config import settings
from app.core.cache import cache

_HEADERS = {"User-Agent": "PlayAxis/3.0 (https://github.com/OliverPerrin/PlayAxis)"}
_football_lock = asyncio.Lock()
_football_next = 0.0


async def football_request(path):
    if not settings.FOOTBALL_DATA_API_KEY:
        raise HTTPException(
            503, "Full football coverage needs a football-data.org key on the server."
        )
    key = f"football-data:{path}"
    value = await cache.get(key)
    if value is not None:
        return value
    global _football_next
    async with _football_lock:
        value = await cache.get(key)
        if value is not None:
            return value
        delay = max(0, _football_next - time.monotonic())
        if delay > 12:
            raise HTTPException(
                503, "Football data is refreshing. Try again in a minute."
            )
        await asyncio.sleep(delay)
        try:
            async with httpx.AsyncClient(
                timeout=18,
                headers={**_HEADERS, "X-Auth-Token": settings.FOOTBALL_DATA_API_KEY},
            ) as client:
                response = await client.get("https://api.football-data.org/v4/" + path)
            _football_next = time.monotonic() + 6.2
            if response.headers.get("x-requests-available-minute") == "0":
                _football_next = time.monotonic() + min(
                    60, int(response.headers.get("x-requestcounter-reset", "60"))
                )
            response.raise_for_status()
            value = response.json()
            await cache.set(key, value, 900)
            return value
        except (httpx.HTTPError, ValueError) as exc:
            raise HTTPException(
                503,
                "The football data source is temporarily unavailable. Please retry shortly.",
            ) from exc


def football_event(row):
    h, a = row["homeTeam"], row["awayTeam"]
    score = (row.get("score") or {}).get("fullTime") or {}
    return {
        "id": f"fd-{row['id']}",
        "name": f"{h['name']} vs {a['name']}",
        "title": f"{h['name']} vs {a['name']}",
        "sport": "Football",
        "league": row.get("competition", {}).get("name", "Premier League"),
        "start": row.get("utcDate"),
        "source": "football-data.org",
        "home_team": h["name"],
        "away_team": a["name"],
        "home_badge": h.get("crest"),
        "away_badge": a.get("crest"),
        "home_score": score.get("home"),
        "away_score": score.get("away"),
        "completed": row.get("status") == "FINISHED",
        "status": {
            "TIMED": "Scheduled",
            "SCHEDULED": "Date scheduled",
            "FINISHED": "Full time",
            "IN_PLAY": "In progress",
            "PAUSED": "Half time",
        }.get(row.get("status"), row.get("status")),
        "venue": row.get("venue"),
        "url": "https://www.premierleague.com/en/matches",
        "description": "Scores from football-data.org are delayed on the free plan.",
    }


async def football_events():
    raw = await football_request("competitions/PL/matches")
    return [football_event(r) for r in raw.get("matches", [])]


async def football_table():
    raw = await football_request("competitions/PL/standings")
    table = next(
        (
            t.get("table", [])
            for t in raw.get("standings", [])
            if t.get("type") == "TOTAL"
        ),
        [],
    )
    rows = [
        {
            "Rank": r["position"],
            "Team": r["team"]["name"],
            "Played": r["playedGames"],
            "Win": r["won"],
            "Draw": r["draw"],
            "Loss": r["lost"],
            "GD": r["goalDifference"],
            "Points": r["points"],
        }
        for r in table
    ]
    return {
        "sport": "epl",
        "source": "football-data.org",
        "season": str(raw.get("season", {}).get("startDate", ""))[:4],
        "coverage": "Complete league table. Free-plan scores are delayed.",
        "limited": False,
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "tables": [
            {
                "name": "Premier League",
                "columns": [
                    "Rank",
                    "Team",
                    "Played",
                    "Win",
                    "Draw",
                    "Loss",
                    "GD",
                    "Points",
                ],
                "rows": rows,
            }
        ],
    }


async def csv_feed(url, ttl=3600):
    key = "csv:" + url
    value = await cache.get(key)
    if value is not None:
        return value
    try:
        async with httpx.AsyncClient(
            timeout=18, headers=_HEADERS, follow_redirects=True
        ) as client:
            response = await client.get(url)
        response.raise_for_status()
        if len(response.content) > 8_000_000:
            raise ValueError("Response too large")
        value = list(csv.DictReader(io.StringIO(response.text)))
        if len(value) > 30000:
            raise ValueError("Too many rows")
        await cache.set(key, value, ttl)
        return value
    except (httpx.HTTPError, ValueError) as exc:
        raise HTTPException(
            503, "The NFL dataset is temporarily unavailable. Please retry shortly."
        ) from exc


NFL_GAMES = (
    "https://github.com/nflverse/nflverse-data/releases/download/schedules/games.csv"
)
NFL_TABLE = (
    "https://raw.githubusercontent.com/nflverse/nfldata/master/data/standings.csv"
)
NFL_TEAMS = "https://github.com/nflverse/nflverse-data/releases/download/teams/teams_colors_logos.csv"


def number(value):
    try:
        return int(float(value)) if value not in [None, "", "NA"] else None
    except (ValueError, TypeError):
        return None


def nfl_event(row, teams):
    h, a = teams.get(row["home_team"], {}), teams.get(row["away_team"], {})
    hn = h.get("team_name") or row["home_team"]
    an = a.get("team_name") or row["away_team"]
    start = None
    if row.get("gametime") and row["gametime"] != "NA":
        try:
            start = (
                datetime.fromisoformat(row["gameday"] + "T" + row["gametime"])
                .replace(tzinfo=ZoneInfo("America/New_York"))
                .astimezone(timezone.utc)
                .isoformat()
            )
        except ValueError:
            pass
    hs, avs = number(row.get("home_score")), number(row.get("away_score"))
    return {
        "id": "nflv-" + row["game_id"],
        "name": f"{hn} vs {an}",
        "title": f"{hn} vs {an}",
        "sport": "American football",
        "league": "NFL",
        "start": start,
        "date_text": row.get("gameday") if not start else None,
        "source": "nflverse / Lee Sharpe",
        "home_team": hn,
        "away_team": an,
        "home_badge": h.get("team_logo_espn"),
        "away_badge": a.get("team_logo_espn"),
        "home_score": hs,
        "away_score": avs,
        "completed": hs is not None and avs is not None,
        "status": "Final" if hs is not None and avs is not None else "Scheduled",
        "venue": row.get("stadium"),
        "season": number(row.get("season")),
        "week": number(row.get("week")),
        "url": "https://www.nfl.com/schedules/",
        "description": "NFL schedule and final results from nflverse. This is not a live scoring feed.",
    }


async def nfl_events(event_id=None):
    games, team_rows = await asyncio.gather(
        csv_feed(NFL_GAMES), csv_feed(NFL_TEAMS, 86400)
    )
    teams = {r["team_abbr"]: r for r in team_rows}
    if event_id:
        row = next((g for g in games if "nflv-" + g["game_id"] == event_id), None)
        if not row:
            raise HTTPException(404, "NFL fixture not found")
        return nfl_event(row, teams)
    season = max(int(r["season"]) for r in games if r.get("season", "").isdigit())
    return [
        nfl_event(row, teams) for row in games if number(row.get("season")) == season
    ]


async def nfl_table():
    data, team_rows = await asyncio.gather(
        csv_feed(NFL_TABLE), csv_feed(NFL_TEAMS, 86400)
    )
    teams = {r["team_abbr"]: r for r in team_rows}
    season = max(int(r["season"]) for r in data if r.get("season", "").isdigit())
    rows = [
        {
            "Rank": number(r.get("div_rank")),
            "Team": teams.get(r["team"], {}).get("team_name", r["team"]),
            "Division": r.get("division"),
            "Win": number(r.get("wins")),
            "Loss": number(r.get("losses")),
            "Tie": number(r.get("ties")),
            "PCT": r.get("pct"),
            "PF": number(r.get("scored")),
            "PA": number(r.get("allowed")),
        }
        for r in data
        if number(r.get("season")) == season
    ]
    rows.sort(key=lambda r: (r["Division"] or "", r["Rank"] or 99))
    return {
        "sport": "nfl",
        "source": "nflverse / Lee Sharpe",
        "season": season,
        "coverage": "Division standings with source tiebreakers. Updated periodically, not live.",
        "limited": False,
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "tables": [
            {
                "name": "NFL",
                "columns": [
                    "Rank",
                    "Team",
                    "Division",
                    "Win",
                    "Loss",
                    "Tie",
                    "PCT",
                    "PF",
                    "PA",
                ],
                "rows": rows,
            }
        ],
    }
