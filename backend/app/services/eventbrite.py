import httpx
from app.core.config import settings
import logging
from typing import Optional
from app.models.user import User

logger = logging.getLogger(__name__)

async def get_eventbrite_events(query: str,
                                lat: float | None = None,
                                lon: float | None = None,
                                current_user: User | None = None) -> dict:
    """
    Return raw Eventbrite search payload or {'events': []} on error.
    """
    try:
        token = getattr(current_user, "eventbrite_access_token", None) or settings.EVENTBRITE_PRIVATE_TOKEN
        if not token:
            logger.warning("Eventbrite: missing token")
            return {"events": []}

        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        }
        params: dict = {
            "q": query or "sports",
            "expand": "venue,ticket_availability",
            "sort_by": "date",
        }
        if lat is not None and lon is not None:
            params.update({
                "location.latitude": lat,
                "location.longitude": lon,
                "location.within": "50km",
            })
        else:
            params["location.address"] = "online"

        async with httpx.AsyncClient(timeout=30.0) as client:
            r = await client.get("https://www.eventbriteapi.com/v3/events/search/",
                                 headers=headers, params=params)
            if r.status_code != 200:
                body_snip = r.text[:300]
                logger.error(f"Eventbrite {r.status_code} params={params} body={body_snip}")
                return {"events": []}
            data = r.json()
            # Normalize venue lat/lon to floats if possible
            for ev in data.get("events", []):
                venue = ev.get("venue") or {}
                if "latitude" in venue and venue["latitude"] not in (None, ""):
                    try:
                        venue["latitude"] = float(venue["latitude"])
                    except Exception:
                        venue["latitude"] = None
                if "longitude" in venue and venue["longitude"] not in (None, ""):
                    try:
                        venue["longitude"] = float(venue["longitude"])
                    except Exception:
                        venue["longitude"] = None
            return data
    except Exception:
        logger.exception("Eventbrite API exception")
        return {"events": []}