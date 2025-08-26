import httpx
from app.core.config import settings

async def get_sportsdataio_events(sport: str):
    """
    Fetches sports events from the SportsData.io API.
    """
    params = {
        "key": settings.SPORTSDATAIO_API_KEY,
    }
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{settings.SPORTSDATAIO_API_URL}/{sport}/scores/json/Schedules/2024",
            params=params,
        )
        response.raise_for_status()
        return response.json()