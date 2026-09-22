import asyncio
from fastapi import APIRouter, Query, HTTPException, Depends
from app.db.session import get_db
from app.core.dependencies import get_optional_user
from app.api.v1.endpoints.participation import session as get_session
from app.services.local_discovery import local_detail
from app.services.public_data import (
    SPORTS,
    sports_events,
    event_detail,
    stamp,
    known_sport,
)

from app.core.cache import cache

router = APIRouter()
_catalogue_locks = {}


async def catalogue(sport):
    key = "catalogue:" + (sport or "all")
    existing = await cache.get(key)
    if existing is not None:
        return existing
    async with _catalogue_locks.setdefault(key, asyncio.Lock()):
        existing = await cache.get(key)
        if existing is not None:
            return existing
        keys = [sport] if sport else [item["key"] for item in SPORTS]
        results = await asyncio.gather(
            *(asyncio.wait_for(sports_events(k), timeout=25) for k in keys),
            return_exceptions=True
        )
        valid = [r for r in results if isinstance(r, dict)]
        if not valid:
            if isinstance(results[0], HTTPException):
                raise results[0]
            raise HTTPException(
                503, "Event feeds are temporarily unavailable. Please try again."
            )
        unavailable = [k for k, r in zip(keys, results) if isinstance(r, Exception)]
        result = {"valid": valid, "unavailable": unavailable, "updated_at": stamp()}
        await cache.set(key, result, 30 if unavailable else 120)
        return result


@router.get("")
@router.get("/")
@router.get("/viewport")
async def list_events(
    q: str = Query("", max_length=150),
    sport: str | None = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    min_lat: float | None = Query(None, ge=-90, le=90),
    max_lat: float | None = Query(None, ge=-90, le=90),
    min_lon: float | None = Query(None, ge=-180, le=180),
    max_lon: float | None = Query(None, ge=-180, le=180),
):
    canonical = known_sport(sport)["key"] if sport else None
    bounds = [min_lat, max_lat, min_lon, max_lon]
    if any(v is not None for v in bounds) and not all(v is not None for v in bounds):
        raise HTTPException(422, "Provide all four map bounds")
    if all(v is not None for v in bounds) and (min_lat > max_lat or min_lon > max_lon):
        raise HTTPException(422, "Invalid map bounds")
    snapshot = await catalogue(canonical)
    valid = snapshot["valid"]
    items = {e["id"]: e for r in valid for e in r["upcoming"]}
    data = list(items.values())
    if q.strip():
        words = q.casefold().split()
        data = [
            e
            for e in data
            if all(
                w
                in " ".join(
                    str(e.get(k) or "")
                    for k in ["name", "sport", "league", "city", "country", "venue"]
                ).casefold()
                for w in words
            )
        ]
    if all(v is not None for v in [min_lat, max_lat, min_lon, max_lon]):
        data = [
            e
            for e in data
            if e.get("latitude") is not None
            and e.get("longitude") is not None
            and min_lat <= e["latitude"] <= max_lat
            and min_lon <= e["longitude"] <= max_lon
        ]
    data.sort(key=lambda e: e.get("start") or "")
    total = len(data)
    data = data[(page - 1) * limit : page * limit]
    return {
        "events": data,
        "data": data,
        "total": total,
        "page": page,
        "updated_at": snapshot["updated_at"],
        "sources": [
            {"name": r["source"], "coverage": r["coverage"], "limited": r["limited"]}
            for r in valid
        ],
        "unavailable": snapshot["unavailable"],
    }


@router.get("/{event_id}")
async def detail(event_id: str, db=Depends(get_db), user=Depends(get_optional_user)):
    if event_id.startswith("local-") and event_id[6:].isdigit():
        return get_session(int(event_id[6:]), db, user)
    if event_id.startswith(("localweb-", "tm-")):
        return await local_detail(event_id)
    return await event_detail(event_id)
