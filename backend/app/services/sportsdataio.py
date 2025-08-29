import httpx
from app.core.config import settings
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

async def get_sportsdataio_events(sport: str):
    """
    Fetches sports events from the SportsData.io API.
    """
    try:
        # Map sport names to API endpoints
        sport_mappings = {
            "nfl": "nfl",
            "nba": "nba", 
            "mlb": "mlb",
            "soccer": "soccer",
            "tennis": "tennis"
        }
        
        api_sport = sport_mappings.get(sport.lower(), sport.lower())
        current_year = datetime.now().year
        
        # Try current year first, then next year
        for year in [current_year, current_year + 1]:
            try:
                params = {
                    "key": settings.X_RapidAPI_KEY,
                }
                
                async with httpx.AsyncClient(timeout=30.0) as client:
                    # Try schedules endpoint first
                    response = await client.get(
                        f"{settings.SPORTSDATAIO_API_URL}/{api_sport}/scores/json/Schedules/{year}",
                        params=params,
                    )
                    
                    if response.status_code == 200:
                        data = response.json()
                        # Filter for future events only if data has Date field
                        future_events = []
                        for event in data:
                            if event.get('Date'):
                                try:
                                    event_date = datetime.fromisoformat(event['Date'].replace('Z', '+00:00'))
                                    if event_date > datetime.now():
                                        future_events.append(event)
                                except Exception:
                                    # If date parsing fails, include the event anyway
                                    future_events.append(event)
                        
                        # Return limited number of events
                        return future_events[:10]
                        
            except Exception as e:
                logger.warning(f"Failed to get {sport} events for {year}: {str(e)}")
                continue
        
        return []
        
    except Exception as e:
        logger.error(f"SportsData.io API error: {str(e)}")
        return []
