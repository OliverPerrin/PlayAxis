import httpx
from app.core.config import settings
import logging
from typing import Optional
from app.models.user import User

logger = logging.getLogger(__name__)

async def get_eventbrite_events(query: str, lat: float | None = None, lon: float | None = None, current_user: User | None = None):
    """
    Fetches events from the Eventbrite API based on a query and optional location.
    Returns the Eventbrite API JSON payload (with 'events': []).
    """
    try:
        token = getattr(current_user, "eventbrite_access_token", None) or settings.EVENTBRITE_PRIVATE_TOKEN
        if not token:
            logger.warning("Eventbrite token not configured")
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
            response = await client.get(
                "https://www.eventbriteapi.com/v3/events/search/",
                headers=headers,
                params=params,
            )
            if response.status_code != 200:
                logger.error(f"Eventbrite API error {response.status_code}: {response.text}")
                return {"events": []}
            return response.json()
    except Exception:
        logger.exception("Eventbrite API error")
        return {"events": []}