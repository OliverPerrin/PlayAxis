
from fastapi import APIRouter, HTTPException
from app.services.twitch import get_twitch_streams

router = APIRouter()

@router.get("/")
async def read_streams(game_id: str):
    try:
        streams = await get_twitch_streams(game_id)
        return streams
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
