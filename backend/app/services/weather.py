import httpx
from app.core.config import settings

async def get_weather(lat: float, lon: float):
    """
    Fetches weather information from the Open-Meteo API.
    """
    params = {
        "latitude": lat,
        "longitude": lon,
        "current_weather": "true",
    }
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{settings.WEATHER_API_URL}/forecast",
            params=params,
        )
        response.raise_for_status()
        return response.json()