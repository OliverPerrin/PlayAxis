
from fastapi import APIRouter, HTTPException
from backend.app.services.sportsbook import get_sportsbook_events

router = APIRouter()

@router.get("/{sport}")
async def read_sports_events(sport: str):
    try:
        events = await get_sportsbook_events(sport)
        return events
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
