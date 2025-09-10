from __future__ import annotations
from typing import List
import hashlib
import json
from app.schemas.event import Event, EventsResponse
from app.services.eventbrite import fetch_eventbrite_events
from app.core.cache import cache

EVENTS_CACHE_TTL = 180  # seconds

def _cache_key(query: str, page: int, limit: int) -> str:
    raw = json.dumps({"q": query, "page": page, "limit": limit}, sort_keys=True)
    return "events:" + hashlib.sha256(raw.encode()).hexdigest()

async def aggregate_events(query: str = "", page: int = 1, limit: int = 20) -> EventsResponse:
    key = _cache_key(query, page, limit)

    async def producer():
        safe_query = (query or '').strip()
        events: List[Event] = await fetch_eventbrite_events(query=safe_query, page=page, size=limit)
        events.sort(key=lambda e: (e.start or "9999"))
        if limit:
            trimmed = events[:limit]
        else:
            trimmed = events
        return EventsResponse(total=len(trimmed), data=trimmed)

    cached = await cache.get(key)
    if cached:
        return cached
    result = await producer()
    await cache.set(key, result, EVENTS_CACHE_TTL)
    return result