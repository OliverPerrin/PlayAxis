from __future__ import annotations
import httpx
from typing import List
from app.core.config import settings
from app.schemas.event import Event

EVENTBRITE_BASE = settings.EVENTBRITE_API_URL.rstrip("/")
EVENTBRITE_KEY = settings.EVENTBRITE_API_KEY

async def fetch_eventbrite_events(query: str = "sports", page: int = 1, size: int = 20) -> List[Event]:
    if not EVENTBRITE_KEY:
        return []
    params = {
        "q": query,
        "page": page,
        "expand": "venue",
        "sort_by": "date"
    }
    headers = {"Authorization": f"Bearer {EVENTBRITE_KEY}"}
    async with httpx.AsyncClient(timeout=20.0) as client:
        r = await client.get(f"{EVENTBRITE_BASE}/events/search/", params=params, headers=headers)
        r.raise_for_status()
        raw = r.json()

    out: List[Event] = []
    for ev in raw.get("events", []):
        venue = ev.get("venue") or {}
        try:
            out.append(Event(
                id=str(ev.get("id")),
                source="eventbrite",
                name=ev.get("name", {}).get("text") or "Untitled",
                description=(ev.get("summary") or ev.get("description", {}).get("text")),
                url=ev.get("url"),
                start=ev.get("start", {}).get("utc"),
                end=ev.get("end", {}).get("utc"),
                timezone=ev.get("start", {}).get("timezone"),
                venue=venue.get("name"),
                city=venue.get("address", {}).get("city"),
                country=venue.get("address", {}).get("country"),
                latitude=float(venue.get("latitude")) if venue.get("latitude") else None,
                longitude=float(venue.get("longitude")) if venue.get("longitude") else None,
                category=(ev.get("category", {}) or {}).get("short_name"),
                image=(ev.get("logo", {}) or {}).get("url"),
                price=None
            ))
        except Exception:
            continue
    return out