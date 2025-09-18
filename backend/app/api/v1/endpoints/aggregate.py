from fastapi import APIRouter, Query, Depends
from typing import Optional, Dict, Any, List
from app.services.google_events import fetch_google_events
from app.services.sportsdb import unified_events
from app.core.dependencies import get_optional_user
from app.models.user import User

router = APIRouter()

def normalize_google(ev_model) -> Dict[str, Any]:
    return {
        "id": f"google:{ev_model.id}",
        "source": ev_model.source,
        "title": ev_model.name,
        "description": ev_model.description or "",
        "start_time": ev_model.start,
        "end_time": ev_model.end,
        "latitude": ev_model.latitude,
        "longitude": ev_model.longitude,
        "city": ev_model.city,
        "country": ev_model.country,
        "url": ev_model.url,
    }

def normalize_sportsdb(ev: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": f"sportsdb:{ev.get('id')}",
        "source": "sportsdb",
        "title": f"{ev.get('home_team') or ''} vs {ev.get('away_team') or ''}".strip(),
        "description": ev.get("league") or ev.get("sport") or "",
        "start_time": ev.get("date") + (f"T{ev.get('time')}" if ev.get('date') and ev.get('time') else ""),
        "end_time": None,
        "latitude": None,
        "longitude": None,
        "city": ev.get("venue") or "",
        "country": ev.get("country"),
        "url": ev.get("video") or "",
    }

@router.get("/events")
async def aggregate_events(
    q: str = Query(default="sports"),
    lat: Optional[float] = Query(default=None),
    lon: Optional[float] = Query(default=None),
    include_sports: bool = Query(default=True),
    current_user: User | None = Depends(get_optional_user),
):
    google_query = q or "Events near me"
    google_events = await fetch_google_events(google_query)
    google_items = [normalize_google(e) for e in google_events]

    sports_items: List[Dict[str, Any]] = []
    if include_sports:
        snapshots: List[Dict[str, Any]] = []
        for s in ["nfl", "nba", "epl"]:
            try:
                snap = await unified_events(s)
                snapshots.append(snap)
            except Exception:
                continue
        # Flatten upcoming + recent limited to avoid huge payload
        raw_events: List[Dict[str, Any]] = []
        for snap in snapshots:
            raw_events.extend(snap.get('upcoming', [])[:5])
            raw_events.extend(snap.get('recent', [])[:3])
        sports_items = [normalize_sportsdb(e) for e in raw_events]

    return {"events": google_items + sports_items}