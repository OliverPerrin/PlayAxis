
import httpx
from app.core.config import settings

async def get_twitch_streams(game_id: str):
    """
    Fetches live streams from the Twitch API for a specific game.
    """
    headers = {
        "Client-ID": settings.TWITCH_CLIENT_ID,
        "Authorization": f"Bearer {settings.TWITCH_ACCESS_TOKEN}",
    }
    params = {
        "game_id": game_id,
    }
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{settings.TWITCH_API_URL}/streams",
            headers=headers,
            params=params,
        )
        response.raise_for_status()
        return response.json()
