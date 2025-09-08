from fastapi import APIRouter, HTTPException, Query
from app.services.twitch import fetch_streams
from app.schemas.streams import StreamsResponse

router = APIRouter()

@router.get("/", response_model=StreamsResponse)
async def get_streams(
    game_id: str | None = Query(None),
    first: int = Query(10, ge=1, le=20)
):
    try:
        return await fetch_streams(game_id=game_id, first=first)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Twitch fetch failed: {e}")

@router.get("", response_model=StreamsResponse)
async def get_streams_no_slash(
    game_id: str | None = Query(None),
    first: int = Query(10, ge=1, le=20)
):
    return await get_streams(game_id=game_id, first=first)