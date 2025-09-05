import httpx
import logging
from app.core.config import settings

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
    try:
        api_key = settings.X_RapidAPI_KEY
        if not api_key:
            logger.warning("Sportsbook: missing X_RapidAPI_KEY")
            return []

        headers = {
            "X-RapidAPI-Key": api_key,
            "X-RapidAPI-Host": "sportsbook-api.p.rapidapi.com"
        }
        sport_param = SPORT_MAP.get(sport.lower(), sport)
        params = {"sport": sport_param}

        # Keep the endpoint explicit (safer if base URL changes)
        url = "https://sportsbook-api.p.rapidapi.com/v1/scores"
        async with httpx.AsyncClient(timeout=30.0) as client:
            r = await client.get(url, headers=headers, params=params)
            if r.status_code != 200:
                logger.error(f"Sportsbook {r.status_code} sport={sport_param} body={r.text[:300]}")
                return []
            data = r.json()
            return data.get("data", []) if isinstance(data, dict) else []
    except Exception as e:
        logger.error(f"Sportsbook exception: {e}")
        return []