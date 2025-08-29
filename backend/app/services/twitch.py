import httpx
from app.core.config import settings
import logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

# Global token storage (in production, use Redis/database)
_twitch_token_cache = {
    "token": None,
    "expires_at": None
}

async def get_twitch_access_token():
    """Get a valid Twitch access token using client credentials flow"""
    current_time = datetime.now()
    
    # Check if we have a valid cached token
    if (_twitch_token_cache["token"] and 
        _twitch_token_cache["expires_at"] and 
        current_time < _twitch_token_cache["expires_at"]):
        return _twitch_token_cache["token"]
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://id.twitch.tv/oauth2/token",
                data={
                    "client_id": settings.TWITCH_CLIENT_ID,
                    "client_secret": settings.TWITCH_CLIENT_SECRET,
                    "grant_type": "client_credentials"
                }
            )
            response.raise_for_status()
            data = response.json()
            
            # Cache the token
            _twitch_token_cache["token"] = data["access_token"]
            _twitch_token_cache["expires_at"] = current_time + timedelta(seconds=data["expires_in"] - 300)  # 5 min buffer
            
            return data["access_token"]
    except Exception as e:
        logger.error(f"Failed to get Twitch access token: {str(e)}")
        return None

async def get_twitch_streams(game_id: str):
    """
    Fetches live streams from the Twitch API for a specific game.
    """
    try:
        token = await get_twitch_access_token()
        if not token:
            return {"data": []}
        
        headers = {
            "Client-ID": settings.TWITCH_CLIENT_ID,
            "Authorization": f"Bearer {token}",
        }
        
        params = {
            "game_id": game_id,
            "first": 20,  # Limit results
        }
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                "https://api.twitch.tv/helix/streams",
                headers=headers,
                params=params,
            )
            
            if response.status_code == 401:
                # Token expired, clear cache and retry once
                _twitch_token_cache["token"] = None
                _twitch_token_cache["expires_at"] = None
                token = await get_twitch_access_token()
                if token:
                    headers["Authorization"] = f"Bearer {token}"
                    response = await client.get(
                        "https://api.twitch.tv/helix/streams",
                        headers=headers,
                        params=params,
                    )
            
            response.raise_for_status()
            return response.json()
            
    except Exception as e:
        logger.error(f"Twitch API error: {str(e)}")
        return {"data": []}
