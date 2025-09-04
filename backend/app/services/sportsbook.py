import httpx
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

SPORT_MAP = {
    # Add/adjust to match your provider's codes
    "f1": "formula-1",
    "formula1": "formula-1",
    "trail-running": "running",
    "skiing": "alpine-skiing",
}

async def get_sportsbook_events(sport: str):
    try:
        headers = {
            "X-RapidAPI-Key": settings.X_RAPIDAPI_KEY,
            "X-RapidAPI-Host": "sportsbook-api.p.rapidapi.com",
        }
        sport_param = SPORT_MAP.get(sport.lower(), sport)
        params = { "sport": sport_param }

        async with httpx.AsyncClient(timeout=30.0) as client:
            r = await client.get("https://sportsbook-api.p.rapidapi.com/v1/scores", headers=headers, params=params)
            if r.status_code != 200:
                logger.error(f"Sportsbook error {r.status_code}: {r.text}")
                return []
            data = r.json()
            return data.get("data", []) if isinstance(data, dict) else []
    except Exception as e:
        logger.error(f"Sportsbook API error: {e}")
        return []