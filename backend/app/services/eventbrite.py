import httpx
import logging
from typing import Optional, List
from app.core.config import settings
from app.models.user import User

logger = logging.getLogger(__name__)

async def get_eventbrite_events(query: str,
                                lat: float | None = None,
                                lon: float | None = None,
                                current_user: User | None = None) -> dict:
    """
    Returns raw Eventbrite search response (original behavior).
    """
    try:
        token = settings.EVENTBRITE_PUBLIC_TOKEN
        if not token:
            logger.warning("Eventbrite: missing token")
            return {"events": []}

        headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/json",
        }
        params: dict = {
            # If query is empty or None, omit 'q' to get all events
            "expand": "venue,ticket_availability",
            "sort_by": "date",
        }
        if query:
            params["q"] = query
        if lat is not None and lon is not None:
            params.update({
                "location.latitude": lat,
                "location.longitude": lon,
                "location.within": "50km",
            })
        else:
            # Avoid over-restrictive "online only"; use a broad default region to return results
            params["location.address"] = "United States"

        base = settings.EVENTBRITE_API_URL
        url = f"{base}/events/search/"
        async with httpx.AsyncClient(timeout=30.0) as client:
            r = await client.get(url, headers=headers, params=params)
            if r.status_code != 200:
                # Retry with token as query parameter (some setups require this)
                params_with_token = dict(params)
                params_with_token["token"] = token
                # Also try path without trailing slash as a fallback
                alt_url = f"{base}/events/search"
                r2 = await client.get(alt_url, params=params_with_token)
                if r2.status_code != 200:
                    logger.error(f"Eventbrite {r.status_code} params={params} body={r.text[:300]}")
                    logger.error(f"Eventbrite retry {r2.status_code} params={params_with_token} body={r2.text[:300]}")
                    return {"events": []}
                data = r2.json()
            else:
                data = r.json()
            for ev in data.get("events", []):
                venue = ev.get("venue") or {}
                for key in ("latitude", "longitude"):
                    if key in venue and venue[key] not in (None, ""):
                        try:
                            venue[key] = float(venue[key])
                        except Exception:
                            venue[key] = None
            return data
    except Exception as exc:
        logger.exception(f"Eventbrite API exception: {exc}")
        return {"events": []}


# ---- New code below: normalization + wrapper ----
from app.schemas.event import Event  # imported here to avoid circulars

def _normalize_eventbrite_event(raw: dict) -> Event | None:
    try:
        venue = raw.get("venue") or {}
        address = venue.get("address") or {}
        return Event(
            id=str(raw.get("id")),
            source="eventbrite",
            name=(raw.get("name") or {}).get("text") or "Untitled",
            description=raw.get("summary") or (raw.get("description") or {}).get("text"),
            url=raw.get("url"),
            start=(raw.get("start") or {}).get("utc"),
            end=(raw.get("end") or {}).get("utc"),
            timezone=(raw.get("start") or {}).get("timezone"),
            venue=venue.get("name"),
            city=address.get("city"),
            country=address.get("country"),
            latitude=venue.get("latitude"),
            longitude=venue.get("longitude"),
            category=(raw.get("category") or {}).get("short_name"),
            image=(raw.get("logo") or {}).get("url"),
            price=None,  # Could augment later
        )
    except Exception as e:
        logger.debug(f"Failed to normalize eventbrite event id={raw.get('id')} err={e}")
        return None

async def fetch_eventbrite_events(query: str = "sports",
                                  page: int = 1,
                                  size: int = 20,
                                  lat: float | None = None,
                                  lon: float | None = None,
                                  current_user: User | None = None) -> List[Event]:
    """
    Wrapper expected by services/events.py (aggregator).
    Produces a list of normalized Event objects.
    """
    raw = await get_eventbrite_events(query=query, lat=lat, lon=lon, current_user=current_user)
    out: List[Event] = []
    for ev in raw.get("events", []):
        norm = _normalize_eventbrite_event(ev)
        if norm:
            out.append(norm)
    if size:
        out = out[:size]
    return out