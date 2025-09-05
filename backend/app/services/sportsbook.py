import httpx
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

SPORT_MAP = {
    "f1": "formula-1",
    "formula1": "formula-1",
    "nfl": "american-football",
    "nba": "basketball",
    "mlb": "baseball",
    "nhl": "ice-hockey",
    "soccer": "soccer",
    "epl": "soccer",
    "trail-running": "running",
    "skiing": "alpine-skiing",
}

async def get_sportsbook_events(sport: str):
    """
    Fetches sports events from a Sportsbook API via RapidAPI.
    Returns a list (may be empty on error or if schema mismatches).
    """
    try:
        # Accept either env var naming (some .envs use X_RapidAPI_KEY)
        api_key = getattr(settings, "X_RAPIDAPI_KEY", None) or getattr(settings, "X_RapidAPI_KEY", None)
        if not api_key:
            logger.warning("RapidAPI key not configured (X_RAPIDAPI_KEY)")
            return []

        headers = {
            "X-RapidAPI-Key": api_key,
            "X-RapidAPI-Host": "sportsbook-api.p.rapidapi.com"
        }

        sport_param = SPORT_MAP.get(str(sport).lower(), sport)
        params = {"sport": sport_param}

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                "https://sportsbook-api.p.rapidapi.com/v1/scores",
                headers=headers,
                params=params,
            )

            if response.status_code == 200:
                data = response.json()
                return data.get("data", []) if isinstance(data, dict) else []
            else:
                logger.error(f"Sportsbook API request failed {response.status_code}: {response.text}")
                return []
    except Exception as e:
        logger.error(f"Sportsbook API error: {str(e)}")
        return []