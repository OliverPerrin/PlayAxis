from fastapi import APIRouter, Query
from app.services.public_data import get_json, stamp
from app.services.twitch import fetch_streams
from app.core.config import settings

router = APIRouter()


@router.get("")
@router.get("/")
async def streams(
    game_id: str | None = None,
    first: int = Query(12, ge=1, le=20),
    category: str = "chess",
):
    if game_id or category != "chess":
        return await fetch_streams(game_id=game_id, first=first, category=category)
    channels = await get_json("https://lichess.org/api/tv/channels", ttl=60)
    allowed = ["blitz", "rapid", "bullet", "classical", "chess960", "ultraBullet"]
    return {
        "source": "Lichess",
        "updated_at": stamp(),
        "data": [
            {
                "id": row["gameId"],
                "title": f"{name.capitalize()} chess",
                "user_name": (row.get("user") or {}).get("name", "Anonymous"),
                "rating": row.get("rating"),
                "url": f'https://lichess.org/{row["gameId"]}',
                "embed_url": f"https://lichess.org/tv/{name}/frame",
                "channel": name,
            }
            for name, row in channels.items()
            if name in allowed
        ][:first],
    }
