from fastapi import APIRouter, HTTPException, Query
from app.services.events import aggregate_events
from app.schemas.event import EventsResponse

router = APIRouter()

@router.get("/", response_model=EventsResponse)
async def list_events_slash(
    q: str = Query(""),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=50)
):
    try:
        return await aggregate_events(query=q, page=page, limit=limit)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Events fetch failed: {e}")

@router.get("", response_model=EventsResponse)
async def list_events_no_slash(
    q: str = Query(""),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=50)
):
    return await list_events_slash(q=q, page=page, limit=limit)