import httpx
import logging
from typing import Optional
from app.core.config import settings
from app.models.user import User

logger = logging.getLogger(__name__)

async def get_eventbrite_events(query: str,
                                lat: float | None = None,
                                lon: float | None = None,
                                current_user: User | None = None) -> dict:
    try:
        token = getattr(current_user, "eventbrite_access_token", None) or settings.EVENTBRITE_API_KEY
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

        url = f"{settings.EVENTBRITE_API_URL}/events/search/"
        async with httpx.AsyncClient(timeout=30.0) as client:
            r = await client.get(url, headers=headers, params=params)
            if r.status_code != 200:
                logger.error(f"Eventbrite {r.status_code} params={params} body={r.text[:300]}")
                return {"events": []}
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
    except Exception:
        logger.exception("Eventbrite API exception")
        return {"events": []}