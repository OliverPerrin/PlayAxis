from fastapi import APIRouter, HTTPException
from app.services.eventbrite import get_eventbrite_events
from typing import Optional

router = APIRouter()

@router.get("/")
async def read_events(q: str = "sports", lat: Optional[float] = None, lon: Optional[float] = None):
    try:
        events = await get_eventbrite_events(q)
        # In a real application, you would use lat/lon to filter or refine results
        # For Eventbrite, you might need to filter on the frontend or use a different API
        return events
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))