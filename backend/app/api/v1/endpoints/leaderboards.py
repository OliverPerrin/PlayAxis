"""Compatibility route for the real public sports standings."""

from fastapi import APIRouter, Query
from app.services.public_data import standings

router = APIRouter()


@router.get("")
@router.get("/")
async def leaderboard(
    category: str = Query("bundesliga"), timeframe: str | None = None
):
    return await standings("bundesliga" if category == "overall" else category)
