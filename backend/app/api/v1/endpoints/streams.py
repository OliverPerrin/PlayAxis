from fastapi import APIRouter, HTTPException, Query
from app.services.twitch import get_twitch_streams

router = APIRouter()

@router.get("/")
async def read_streams(
    game_id: str | None = Query(default=None),
    game_name: str | None = Query(default=None),
    first: int = Query(default=12, ge=1, le=20),
):
    try:
        return await get_twitch_streams(game_id=game_id, game_name=game_name, first=first)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))