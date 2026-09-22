"""Compatibility route for public event discovery."""

from fastapi import APIRouter, Query
from .events import list_events

router = APIRouter()


@router.get("/events")
async def aggregate_events(q: str = Query(""), sport: str | None = None):
    return await list_events(
        q=q,
        sport=sport,
        page=1,
        limit=100,
        min_lat=None,
        max_lat=None,
        min_lon=None,
        max_lon=None,
    )
