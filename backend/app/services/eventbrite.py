
import httpx
from app.core.config import settings

async def get_eventbrite_events(query: str):
    """
    Fetches events from the Eventbrite API based on a query.
    """
    headers = {
        "Authorization": f"Bearer {settings.EVENTBRITE_API_KEY}",
        "Content-Type": "application/json",
    }
    params = {
        "q": query,
        "expand": "venue",
    }
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{settings.EVENTBRITE_API_URL}/events/search/",
            headers=headers,
            params=params,
        )
        response.raise_for_status()
        return response.json()
