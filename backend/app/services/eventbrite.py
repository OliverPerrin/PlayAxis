import httpx
from app.core.config import settings
import logging
from app.models.user import User

logger = logging.getLogger(__name__)

async def get_eventbrite_events(query: str, lat: float = None, lon: float = None, current_user: User = None):
    """
    Fetches events from the Eventbrite API based on a query.
    """
    try:
        token = settings.EVENTBRITE_PRIVATE_TOKEN
        if current_user and current_user.eventbrite_access_token:
            token = current_user.eventbrite_access_token

        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        }
        
        params = {
            "q": query,
            "expand": "venue,ticket_availability",
            "location.address": "online" if not lat else None,
            "sort_by": "date",
        }
        
        if lat and lon:
            params.update({
                "location.latitude": lat,
                "location.longitude": lon,
                "location.within": "50km"
            })
        
        # Remove None values
        params = {k: v for k, v in params.items() if v is not None}
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"{settings.EVENTBRITE_API_URL}events/search/",
                headers=headers,
                params=params,
            )
            
            if response.status_code == 401:
                logger.error("Eventbrite API authentication failed")
                return {"events": []}
            
            response.raise_for_status()
            return response.json()
            
    except httpx.TimeoutException:
        logger.error("Eventbrite API request timed out")
        return {"events": []}
    except Exception as e:
        logger.error(f"Eventbrite API error: {str(e)}")
        return {"events": []}
