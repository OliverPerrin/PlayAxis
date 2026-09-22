"""Server-side Twitch app authentication and live category browsing."""

import asyncio
from datetime import datetime, timezone
import httpx
from fastapi import HTTPException
from app.core.config import settings
from app.core.cache import cache

_lock = asyncio.Lock()


async def get_app_token():
    token = await cache.get("twitch:app_token")
    if token:
        return token
    async with _lock:
        token = await cache.get("twitch:app_token")
        if token:
            return token
        if not settings.TWITCH_CLIENT_ID or not settings.TWITCH_CLIENT_SECRET:
            raise HTTPException(
                503, "Twitch is not connected. Live chess remains available."
            )
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                response = await client.post(
                    "https://id.twitch.tv/oauth2/token",
                    data={
                        "client_id": settings.TWITCH_CLIENT_ID,
                        "client_secret": settings.TWITCH_CLIENT_SECRET,
                        "grant_type": "client_credentials",
                    },
                )
            response.raise_for_status()
            payload = response.json()
            token = payload["access_token"]
            await cache.set(
                "twitch:app_token",
                token,
                max(60, int(payload.get("expires_in", 3600)) - 60),
            )
            return token
        except (httpx.HTTPError, KeyError, ValueError) as exc:
            raise HTTPException(
                503, "Twitch could not connect. Try again shortly or watch live chess."
            ) from exc


async def _get(path, params, ttl=120):
    key = f"twitch:{path}:{params}"
    data = await cache.get(key)
    if data is not None:
        return data
    token = await get_app_token()
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.get(
                "https://api.twitch.tv/helix/" + path,
                params=params,
                headers={
                    "Client-ID": settings.TWITCH_CLIENT_ID,
                    "Authorization": "Bearer " + token,
                },
            )
        response.raise_for_status()
        data = response.json()
        await cache.set(key, data, ttl)
        return data
    except (httpx.HTTPError, ValueError) as exc:
        raise HTTPException(
            503, "Live broadcasts are temporarily unavailable. Please retry."
        ) from exc


CATEGORIES = {
    "sports": ["Sports"],
    "esports": ["Counter-Strike", "League of Legends", "VALORANT"],
    "counter-strike": ["Counter-Strike"],
    "league-of-legends": ["League of Legends"],
    "valorant": ["VALORANT"],
}


async def fetch_streams(game_id=None, first=12, category="sports"):
    ids = [game_id] if game_id else []
    if not ids:
        if category not in CATEGORIES:
            raise HTTPException(422, "Choose a supported broadcast category")
        games = await _get(
            "games", [("name", name) for name in CATEGORIES[category]], 86400
        )
        ids = [r["id"] for r in games.get("data", [])]
    if not ids:
        return {"source": "Twitch", "data": [], "total": 0}
    raw = await _get(
        "streams", [("first", min(first, 20))] + [("game_id", id) for id in ids]
    )
    items = [
        {
            "id": r["id"],
            "user_name": r["user_name"],
            "user_login": r["user_login"],
            "title": r["title"],
            "viewer_count": r["viewer_count"],
            "started_at": r["started_at"],
            "thumbnail_url": r.get("thumbnail_url", "")
            .replace("{width}", "640")
            .replace("{height}", "360"),
            "language": r.get("language"),
            "game_id": r["game_id"],
            "game_name": r.get("game_name"),
            "url": "https://www.twitch.tv/" + r["user_login"],
        }
        for r in raw.get("data", [])
    ]
    return {
        "source": "Twitch",
        "category": category,
        "data": items,
        "total": len(items),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
