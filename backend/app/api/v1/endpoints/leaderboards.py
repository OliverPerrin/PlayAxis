from fastapi import APIRouter, Query
from pydantic import BaseModel
from typing import List

router = APIRouter()

class LeaderEntry(BaseModel):
    username: str
    score: int
    rank: int

class LeaderboardResponse(BaseModel):
    category: str
    timeframe: str
    total: int
    data: List[LeaderEntry]

@router.get("/", response_model=LeaderboardResponse)
async def get_leaderboard(
    category: str = Query("overall"),
    timeframe: str = Query("monthly")
):
    sample = [
        LeaderEntry(username="demo1", score=1200, rank=1),
        LeaderEntry(username="demo2", score=1150, rank=2),
        LeaderEntry(username="demo3", score=900, rank=3),
    ]
    return LeaderboardResponse(
        category=category,
        timeframe=timeframe,
        total=len(sample),
        data=sample
    )