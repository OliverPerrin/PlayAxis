import time
import httpx
from typing import Optional, List, Dict
from app.core.config import settings

_TWITCH_TOKEN: Optional[str] = None
_TWITCH_TOKEN_EXPIRES_AT: float = 0.0

async def _get_app_token() -> str:
    global _TWITCH_TOKEN, _TWITCH_TOKEN_EXPIRES_AT
    if _TWITCH_TOKEN and time.time() < _TWITCH_TOKEN_EXPIRES_AT - 60:
        return _TWITCH_TOKEN

    data = {
        "client_id": settings.TWITCH_CLIENT_ID,
        "client_secret": settings.TWITCH_CLIENT_SECRET,
        "grant_type": "client_credentials",
    }
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.post("https://id.twitch.tv/oauth2/token", data=data)
        r.raise_for_status()
        payload = r.json()
        _TWITCH_TOKEN = payload["access_token"]
        _TWITCH_TOKEN_EXPIRES_AT = time.time() + int(payload.get("expires_in", 3600))
        return _TWITCH_TOKEN

async def _get_game_id(game_name: str) -> Optional[str]:
    token = await _get_app_token()
    headers = {
        "Client-Id": settings.TWITCH_CLIENT_ID,
        "Authorization": f"Bearer {token}",
    }
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.get("https://api.twitch.tv/helix/games", headers=headers, params={"name": game_name})
        r.raise_for_status()
        data = r.json()
        games = data.get("data") or []
        if not games:
            return None
        return games[0].get("id")

async def get_twitch_streams(game_id: Optional[str] = None, game_name: Optional[str] = None, first: int = 12) -> Dict:
    token = await _get_app_token()
    headers = {
        "Client-Id": settings.TWITCH_CLIENT_ID,
        "Authorization": f"Bearer {token}",
    }
    if not game_id and game_name:
        game_id = await _get_game_id(game_name)
    params = {"first": min(max(first, 1), 20)}
    if game_id:
        params["game_id"] = game_id

    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.get("https://api.twitch.tv/helix/streams", headers=headers, params=params)
        r.raise_for_status()
        data = r.json()
        return {"streams": data.get("data", [])}