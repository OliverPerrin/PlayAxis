from fastapi import APIRouter, Query, Depends
from typing import Optional, Dict, Any, List
from app.services.eventbrite import get_eventbrite_events
from app.services.sportsbook import get_sportsbook_events
from app.core.dependencies import get_current_user
from app.models.user import User

router = APIRouter()

def normalize_eventbrite(ev: Dict[str, Any]) -> Dict[str, Any]:
    venue = ev.get("venue") or {}
    addr = venue.get("address") or {}
    lat = venue.get("latitude")
    lon = venue.get("longitude")
    try:
        lat = float(lat) if lat is not None else None
        lon = float(lon) if lon is not None else None
    except Exception:
        lat = lon = None
    return {
        "id": f"eventbrite:{ev.get('id')}",
        "source": "eventbrite",
        "title": (ev.get("name") or {}).get("text") or "",
        "description": (ev.get("description") or {}).get("text") or "",
        "start_time": (ev.get("start") or {}).get("local"),
        "end_time": (ev.get("end") or {}).get("local"),
        "latitude": lat,
        "longitude": lon,
        "city": addr.get("city"),
        "country": addr.get("country"),
        "url": ev.get("url"),
    }

def normalize_sportsbook(ev: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": f"sportsbook:{ev.get('id') or ev.get('GameKey') or ev.get('EventId') or ev.get('game_id')}",
        "source": "sportsbook",
        "title": f"{ev.get('home_team') or ev.get('HomeTeam') or ''} vs {ev.get('away_team') or ev.get('AwayTeam') or ''}".strip(),
        "description": ev.get("league") or ev.get("Sport") or "",
        "start_time": ev.get("commence_time") or ev.get("DateTime"),
        "end_time": None,
        "latitude": None,
        "longitude": None,
        "city": ev.get("venue") or "",
        "country": None,
        "url": ev.get("url") or ev.get("link") or "",
    }

@router.get("/events")
async def aggregate_events(
    q: str = Query(default="sports"),
    lat: Optional[float] = Query(default=None),
    lon: Optional[float] = Query(default=None),
    include_sports: bool = Query(default=True),
    current_user: User = Depends(get_current_user),
):
    eb_payload = await get_eventbrite_events(q, lat, lon, current_user)
    eb_items = [normalize_eventbrite(e) for e in eb_payload.get("events", [])]

    sports_items: List[Dict[str, Any]] = []
    if include_sports:
        # Extend this list as needed (f1, nfl, nba, etc.)
        all_s: List[Dict[str, Any]] = []
        for s in ["f1", "nfl", "nba"]:
            try:
                data = await get_sportsbook_events(s)
                all_s.extend(data or [])
            except Exception:
                continue
        sports_items = [normalize_sportsbook(e) for e in all_s]

    return {"events": eb_items + sports_items}