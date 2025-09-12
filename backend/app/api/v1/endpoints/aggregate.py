from fastapi import APIRouter, Query, Depends
from typing import Optional, Dict, Any, List
from app.services.google_events import fetch_google_events
from app.services.sportsbook import get_sportsbook_events
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
    current_user: User | None = Depends(get_optional_user),
):
    google_query = q or "Events near me"
    google_events = await fetch_google_events(google_query)
    google_items = [normalize_google(e) for e in google_events]

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

    return {"events": google_items + sports_items}