from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional

from app.core.dependencies import get_current_user
from app.models.user import User
from app.services.eventbrite import get_eventbrite_events   # raw
from app.services.events import aggregate_events            # normalized list
from app.schemas.event import EventsResponse

router = APIRouter()

@router.get("/raw")
async def read_events_raw(
    q: str = Query("sports"),
    lat: Optional[float] = None,
    lon: Optional[float] = None,
    current_user: User = Depends(get_current_user)
):
    try:
        data = await get_eventbrite_events(q, lat, lon, current_user)
        return data
    except Exception as e:
        return {"events": [], "error": str(e)}

@router.get("/", response_model=EventsResponse)
async def read_events(
    q: str = Query("sports"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=50),
):
    """
    Normalized event feed (aggregated, ready for frontend consumption).
    """
    try:
        return await aggregate_events(query=q, page=page, limit=limit)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Events aggregation failed: {e}")