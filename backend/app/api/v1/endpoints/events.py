from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from app.services.eventbrite import get_eventbrite_events
from typing import Optional
import logging
import httpx

from app.core.config import settings
from app.core.dependencies import get_db, get_current_user
from app.models.user import User
from app.crud import user as crud_user

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/")
async def read_events(q: str = "sports", lat: Optional[float] = None, lon: Optional[float] = None, current_user: User = Depends(get_current_user)):
    try:
        logger.info(f"Fetching events with query: {q}, lat: {lat}, lon: {lon}")
        events = await get_eventbrite_events(q, lat, lon, current_user)
        
        if not events or "events" not in events:
            logger.warning("No events returned from Eventbrite API")
            return {"events": []}
        
        logger.info(f"Successfully fetched {len(events['events'])} events")
        return events
        
    except Exception as e:
        logger.error(f"Error in read_events: {str(e)}")
        # Return empty events instead of 500 error
        return {"events": []}

@router.get("/eventbrite/login")
async def eventbrite_login():
    redirect_uri = f"{settings.FRONTEND_URL}/eventbrite/callback"
    return RedirectResponse(f"https://www.eventbrite.com/oauth/authorize?response_type=code&client_id={settings.EVENTBRITE_API_KEY}&redirect_uri={redirect_uri}")

@router.get("/eventbrite/callback")
async def eventbrite_callback(code: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    token_url = "https://www.eventbrite.com/oauth/token"
    redirect_uri = f"{settings.FRONTEND_URL}/eventbrite/callback"
    data = {
        "grant_type": "authorization_code",
        "client_id": settings.EVENTBRITE_API_KEY,
        "client_secret": settings.EVENTBRITE_CLIENT_SECRET,
        "code": code,
        "redirect_uri": redirect_uri,
    }
    async with httpx.AsyncClient() as client:
        response = await client.post(token_url, data=data)
        if response.status_code != 200:
            raise HTTPException(status_code=400, detail="Could not exchange code for token")
        
        token_data = response.json()
        access_token = token_data["access_token"]
        
        # For simplicity, we're not handling refresh tokens in this example
        
        db_user = db.query(User).filter(User.id == current_user.id).first()
        logger.info(f"Found user '{db_user.email}' (ID: {db_user.id}). Attempting to save Eventbrite access token.")

        db_user.eventbrite_access_token = access_token
        db.commit()
        db.refresh(db_user) # Reload the user object from the DB

        logger.info(f"Successfully committed Eventbrite token for user {db_user.id}.")
        
        return {"message": "Eventbrite account connected successfully"}
