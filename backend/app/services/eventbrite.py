import httpx
from app.core.config import settings
import logging
from app.models.user import User

logger = logging.getLogger(__name__)

async def get_eventbrite_events(query: str, lat: float | None = None, lon: float | None = None, current_user: User | None = None):
    """
    Fetch events from Eventbrite using either a user-scoped token (if present) or org-level private token.
    """
    try:
        token = settings.EVENTBRITE_PRIVATE_TOKEN
        if current_user and getattr(current_user, "eventbrite_access_token", None):
            token = current_user.eventbrite_access_token

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
            # fallback to broader discovery
            params["location.address"] = "online"

        async with httpx.AsyncClient(timeout=30.0) as client:
            r = await client.get("https://www.eventbriteapi.com/v3/events/search/", headers=headers, params=params)
            if r.status_code != 200:
                logger.error(f"Eventbrite error {r.status_code}: {r.text}")
                return {"events": []}
            data = r.json()
            return data
    except Exception as e:
        logger.exception("Eventbrite API error")
        return {"events": []}