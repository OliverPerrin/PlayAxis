import time
import httpx
import logging
from typing import Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

_TOKEN: Optional[str] = None
_EXP: float = 0.0

async def _get_app_token() -> str:
    global _TOKEN, _EXP
    now = time.time()
    if _TOKEN and now < _EXP - 60:
        return _TOKEN
    if not settings.TWITCH_CLIENT_ID or not settings.TWITCH_CLIENT_SECRET:
        raise RuntimeError("Twitch credentials not configured")
    data = {
        "client_id": settings.TWITCH_CLIENT_ID,
        "client_secret": settings.TWITCH_CLIENT_SECRET,
        "grant_type": "client_credentials"
    }
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.post("https://id.twitch.tv/oauth2/token", data=data)
        if r.status_code != 200:
            logger.error(f"Twitch token error {r.status_code} body={r.text[:200]}")
            raise RuntimeError("Twitch token fetch failed")
        payload = r.json()
        _TOKEN = payload["access_token"]
        _EXP = now + int(payload.get("expires_in", 3600))
        return _TOKEN

async def get_twitch_streams(game_id: Optional[str] = None, game_name: Optional[str] = None, first: int = 12):
    token = await _get_app_token()
    headers = {
        "Client-Id": settings.TWITCH_CLIENT_ID,
        "Authorization": f"Bearer {token}",
    }
    params = {"first": min(max(first, 1), 20)}
    async with httpx.AsyncClient(timeout=15.0) as client:
        # Resolve game_name to id if provided
        if game_name and not game_id:
            gr = await client.get("https://api.twitch.tv/helix/games",
                                  headers=headers, params={"name": game_name})
            if gr.status_code == 200:
                gd = gr.json().get("data") or []
                if gd:
                    game_id = gd[0].get("id")
            else:
                logger.warning(f"Twitch game lookup {gr.status_code} body={gr.text[:150]}")
        if game_id:
            params["game_id"] = game_id
        r = await client.get("https://api.twitch.tv/helix/streams",
                             headers=headers, params=params)
        if r.status_code != 200:
            logger.error(f"Twitch streams {r.status_code} body={r.text[:200]}")
            return {"streams": []}
        return {"streams": r.json().get("data", [])}