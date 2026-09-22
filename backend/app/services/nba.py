"""Free NBA fixtures and complete, explicitly derived regular-season records."""

import asyncio
import hashlib
import json
import time
from datetime import datetime, timezone, timedelta
import httpx
from fastapi import HTTPException
from app.core.config import settings
from app.db.session import SessionLocal
from app.models.participation import DiscoveryCache
from app.services.local_discovery import _store

_lock = asyncio.Lock()
_next = 0.0
_jobs = {}


def _read(key, max_age=3600):
    with SessionLocal() as db:
        row = db.get(DiscoveryCache, key)
        if not row:
            return None
        stamp = (
            row.stored_at.replace(tzinfo=timezone.utc)
            if row.stored_at.tzinfo is None
            else row.stored_at
        )
        if (
            max_age is None
            or (datetime.now(timezone.utc) - stamp).total_seconds() < max_age
        ):
            return row.data
    return None


async def request(path, params=None):
    if not settings.BALLDONTLIE_API_KEY:
        raise HTTPException(503, "NBA data is not connected on this server.")
    key = (
        "bdl:"
        + hashlib.sha256(
            (path + json.dumps(params or {}, sort_keys=True)).encode()
        ).hexdigest()
    )
    found = await asyncio.to_thread(_read, key, 3600)
    if found is not None:
        return found
    global _next
    async with _lock:
        found = await asyncio.to_thread(_read, key, 3600)
        if found is not None:
            return found
        await asyncio.sleep(max(0, _next - time.monotonic()))
        try:
            async with httpx.AsyncClient(timeout=18) as client:
                response = await client.get(
                    "https://api.balldontlie.io/v1/" + path,
                    params=params,
                    headers={"Authorization": settings.BALLDONTLIE_API_KEY},
                )
            _next = time.monotonic() + 12.6
            response.raise_for_status()
            raw = response.json()
            await asyncio.to_thread(_store, key, raw)
            return raw
        except (httpx.HTTPError, ValueError) as exc:
            raise HTTPException(
                503,
                "NBA data is refreshing or temporarily unavailable. Please try again in a minute.",
            ) from exc


def normalize(row):
    h, a = row["home_team"], row["visitor_team"]
    state = row.get("status_state")
    played = state in ["final", "live", "in_progress"] or row.get("status") == "Final"
    return {
        "id": f"nba-{row['id']}",
        "name": f"{h['full_name']} vs {a['full_name']}",
        "title": f"{h['full_name']} vs {a['full_name']}",
        "sport": "Basketball",
        "league": "NBA",
        "source": "BALLDONTLIE",
        "start": row.get("datetime"),
        "date_text": row.get("date") if not row.get("datetime") else None,
        "home_team": h["full_name"],
        "away_team": a["full_name"],
        "home_score": row.get("home_team_score") if played else None,
        "away_score": row.get("visitor_team_score") if played else None,
        "completed": state == "final" or row.get("status") == "Final",
        "status": (
            "Final"
            if state == "final"
            else "Scheduled" if state == "scheduled" else row.get("status")
        ),
        "season": row.get("season"),
        "url": "https://www.nba.com/games",
        "description": "Fixtures and results supplied by BALLDONTLIE. Check the official game listing for final tip-off details.",
    }


async def events():
    today = datetime.now(timezone.utc).date()
    raw = await request(
        "games",
        {
            "start_date": str(today - timedelta(days=2)),
            "end_date": str(today + timedelta(days=40)),
            "per_page": 100,
        },
    )
    return [normalize(r) for r in raw.get("data", [])]


async def detail(id):
    if not id.isdigit():
        raise HTTPException(404, "NBA game not found")
    raw = await request("games/" + id)
    if not raw.get("data"):
        raise HTTPException(404, "NBA game not found")
    return normalize(raw["data"])


def derive_records(games):
    records = {}
    for row in games:
        if row.get("postseason"):
            continue
        for team in [row["home_team"], row["visitor_team"]]:
            records.setdefault(
                team["id"],
                {
                    "team": team["full_name"],
                    "conference": team.get("conference"),
                    "division": team.get("division"),
                    "played": 0,
                    "wins": 0,
                    "losses": 0,
                },
            )
        if row.get("status_state") != "final" and row.get("status") != "Final":
            continue
        h, a = row.get("home_team_score"), row.get("visitor_team_score")
        if h is None or a is None or h == a:
            continue
        home, away = records[row["home_team"]["id"]], records[row["visitor_team"]["id"]]
        for record, won in [(home, h > a), (away, a > h)]:
            record["played"] += 1
            record["wins"] += int(won)
            record["losses"] += int(not won)
    return sorted(
        records.values(),
        key=lambda r: (
            r["conference"] or "",
            -r["wins"] / max(1, r["played"]),
            r["team"],
        ),
    )


async def _refresh(season):
    try:
        games = []
        cursor = None
        for _ in range(20):
            params = {"seasons[]": season, "postseason": "false", "per_page": 100}
            if cursor is not None:
                params["cursor"] = cursor
            raw = await request("games", params)
            games.extend(raw.get("data", []))
            cursor = raw.get("meta", {}).get("next_cursor")
            if cursor is None:
                break
        if cursor is not None:
            raise ValueError("Incomplete season")
        games = list({r["id"]: r for r in games}.values())
        data = {
            "season": season,
            "records": derive_records(games),
            "completed_games": sum(
                r.get("status_state") == "final" or r.get("status") == "Final"
                for r in games
            ),
            "retrieved_at": datetime.now(timezone.utc).isoformat(),
            "complete": True,
        }
        await asyncio.to_thread(_store, "nba-records:" + str(season), data)
    except Exception:
        _jobs[season] = {"failed_at": time.monotonic()}
        return
    _jobs.pop(season, None)


async def standings():
    now = datetime.now(timezone.utc)
    season = now.year if now.month >= 10 else now.year - 1
    data = await asyncio.to_thread(_read, "nba-records:" + str(season), 86400)
    stale = False
    if not data:
        data = await asyncio.to_thread(_read, "nba-records:" + str(season), None)
        stale = bool(data)
        job = _jobs.get(season)
        if not job or (
            isinstance(job, dict) and time.monotonic() - job["failed_at"] > 120
        ):
            _jobs[season] = asyncio.create_task(_refresh(season))
    if not data:
        return {
            "sport": "nba",
            "source": "BALLDONTLIE",
            "season": f"{season}/{str(season+1)[-2:]}",
            "tables": [],
            "pending": True,
            "coverage": "Preparing the full regular-season records. The free provider allows five requests per minute; the first refresh can take a few minutes.",
        }
    rows = [
        {
            "Team": r["team"],
            "Conference": r["conference"],
            "Division": r["division"],
            "Played": r["played"],
            "Win": r["wins"],
            "Loss": r["losses"],
            "PCT": round(r["wins"] / r["played"], 3) if r["played"] else None,
        }
        for r in data["records"]
    ]
    return {
        "sport": "nba",
        "source": "BALLDONTLIE",
        "season": f"{season}/{str(season+1)[-2:]}",
        "limited": False,
        "stale": stale,
        "updated_at": data["retrieved_at"],
        "coverage": f"Team records calculated from {data['completed_games']} completed regular-season games. Conference ordering uses win percentage; official tiebreak rankings are not included.",
        "tables": [
            {
                "name": "NBA team records",
                "columns": [
                    "Team",
                    "Conference",
                    "Division",
                    "Played",
                    "Win",
                    "Loss",
                    "PCT",
                ],
                "rows": rows,
            }
        ],
    }
