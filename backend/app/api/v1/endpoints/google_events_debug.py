from fastapi import APIRouter, Query
from app.services.google_events import fetch_google_events
from typing import Optional

router = APIRouter()

@router.get("/raw")
async def google_events_raw(
    q: str = Query("Events near me"),
    start: int = Query(0, ge=0),
    htichips: Optional[str] = Query(None),
):
    events = await fetch_google_events(q, start=start, htichips=htichips)
    return {
        "query": q,
        "count": len(events),
        "events": [e.model_dump() for e in events]
    }
