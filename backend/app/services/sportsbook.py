import httpx
from app.core.config import settings
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

async def get_sportsbook_events(sport: str):
    """
    Fetches sports events from the Sportsbook API on RapidAPI.
    """
    try:
        headers = {
            "X-RapidAPI-Key": settings.X_RapidAPI_KEY,
            "X-RapidAPI-Host": "sportsbook-api.p.rapidapi.com"
        }
        
        # The Sportsbook API might use different sport identifiers.
        # We can create a mapping if needed, but for now, we'll use the provided sport directly.
        params = {
            "sport": sport
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                "https://sportsbook-api.p.rapidapi.com/v1/scores",
                headers=headers,
                params=params,
            )
            
            if response.status_code == 200:
                data = response.json()
                # The response structure is likely different from sportsdata.io
                # We need to adapt the code to the new structure.
                # Assuming the API returns a list of events in the 'data' key.
                if "data" in data and isinstance(data["data"], list):
                    return data["data"]
                else:
                    return []
            else:
                logger.error(f"Sportsbook API request failed with status code: {response.status_code}")
                return []

    except Exception as e:
        logger.error(f"Sportsbook API error: {str(e)}")
        return []