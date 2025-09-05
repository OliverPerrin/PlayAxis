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
    try:
        api_key = getattr(settings, "X_RAPIDAPI_KEY", None)
        if not api_key:
            logger.warning("Sportsbook: missing X_RAPIDAPI_KEY")
            return []

        headers = {
            "X-RapidAPI-Key": api_key,
            "X-RapidAPI-Host": "sportsbook-api.p.rapidapi.com"
        }
        sport_param = SPORT_MAP.get(sport.lower(), sport)
        params = {"sport": sport_param}

        async with httpx.AsyncClient(timeout=30.0) as client:
            r = await client.get("https://sportsbook-api.p.rapidapi.com/v1/scores",
                                 headers=headers, params=params)
            if r.status_code != 200:
                logger.error(f"Sportsbook {r.status_code} sport={sport_param} body={r.text[:300]}")
                return []
            data = r.json()
            if isinstance(data, dict):
                return data.get("data", []) or []
            return []
    except Exception as e:
        logger.error(f"Sportsbook exception: {e}")
        return []