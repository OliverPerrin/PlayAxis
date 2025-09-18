
from fastapi import APIRouter, HTTPException
from app.services.sportsdb import unified_events

router = APIRouter()

@router.get("/{sport}")
async def read_sports_events(sport: str):
    """Return upcoming and recent events for a given sport key (NFL, NBA, EPL, etc)."""
    try:
        data = await unified_events(sport)
        return data
    except Exception as e:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=str(e))
