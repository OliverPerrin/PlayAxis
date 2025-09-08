from __future__ import annotations
import httpx
from typing import List
from app.core.config import settings
from app.core.cache import cache
from app.schemas.streams import Stream, StreamsResponse

TWITCH_ID = settings.TWITCH_CLIENT_ID
TWITCH_SECRET = settings.TWITCH_CLIENT_SECRET
TWITCH_BASE = "https://api.twitch.tv/helix"

TOKEN_CACHE_KEY = "twitch:app_token"

async def _fetch_app_token():
    if not TWITCH_ID or not TWITCH_SECRET:
        raise RuntimeError("Twitch credentials not configured")
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.post(
            "https://id.twitch.tv/oauth2/token",
            params={
                "client_id": TWITCH_ID,
                "client_secret": TWITCH_SECRET,
                "grant_type": "client_credentials"
            }
        )
        r.raise_for_status()
        data = r.json()
        return data["access_token"], int(data.get("expires_in", 3600))

async def get_app_token() -> str:
    async def producer():
        token, ttl = await _fetch_app_token()
        # subtract small safety margin
        await cache.set(TOKEN_CACHE_KEY, token, max(ttl - 60, 300))
        return token
    existing = await cache.get(TOKEN_CACHE_KEY)
    if existing:
        return existing
    return await producer()

async def fetch_streams(game_id: str | None = None, first: int = 10) -> StreamsResponse:
    token = await get_app_token()
    headers = {
        "Client-ID": TWITCH_ID,
        "Authorization": f"Bearer {token}"
    }
    params = {"first": min(first, 20)}
    if game_id:
        params["game_id"] = game_id

    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.get(f"{TWITCH_BASE}/streams", headers=headers, params=params)
        r.raise_for_status()
        payload = r.json()

    streams: List[Stream] = []
    for item in payload.get("data", []):
        streams.append(Stream(
            id=item.get("id"),
            user_name=item.get("user_name"),
            title=item.get("title"),
            viewer_count=item.get("viewer_count", 0),
            started_at=item.get("started_at"),
            thumbnail_url=item.get("thumbnail_url"),
            language=item.get("language"),
            game_id=item.get("game_id"),
        ))

    return StreamsResponse(data=streams, total=len(streams))