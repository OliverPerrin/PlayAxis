from fastapi import APIRouter, HTTPException
from app.services.eventbrite import get_eventbrite_events
from typing import Optional
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/")
async def read_events(q: str = "sports", lat: Optional[float] = None, lon: Optional[float] = None):
    try:
        logger.info(f"Fetching events with query: {q}, lat: {lat}, lon: {lon}")
        events = await get_eventbrite_events(q, lat, lon)
        
        if not events or "events" not in events:
            logger.warning("No events returned from Eventbrite API")
            return {"events": []}
        
        logger.info(f"Successfully fetched {len(events['events'])} events")
        return events
        
    except Exception as e:
        logger.error(f"Error in read_events: {str(e)}")
        # Return empty events instead of 500 error
        return {"events": []}
