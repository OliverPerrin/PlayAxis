from __future__ import annotations
from typing import List
from app.schemas.event import Event, EventsResponse
from app.services.eventbrite import fetch_eventbrite_events

# Extend here later with additional sources

async def aggregate_events(
    query: str = "sports",
    page: int = 1,
    limit: int = 20
) -> EventsResponse:
    events: List[Event] = await fetch_eventbrite_events(query=query, page=page, size=limit)
    # Already sorted by Eventbrite's date order; ensure stable ordering if needed
    events.sort(key=lambda e: (e.start or "9999"))
    return EventsResponse(total=len(events), data=events)