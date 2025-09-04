from fastapi import APIRouter, Query
from typing import List, Literal, Optional, Union
from pydantic import BaseModel

router = APIRouter()

class LeaderboardItem(BaseModel):
  rank: int
  name: str
  score: int
  streak: int
  change: int = 0
  country: str = "🌍"
  avatar: Optional[str] = "🏅"

MOCK = [
  LeaderboardItem(rank=1, name="Alex Runner", score=2450, streak=45, change=0, country="🇺🇸", avatar="🏃‍♂️"),
  LeaderboardItem(rank=2, name="Sarah Cyclist", score=2380, streak=32, change=1, country="🇨🇦", avatar="🚴‍♀️"),
  LeaderboardItem(rank=3, name="Mike Swimmer", score=2210, streak=28, change=-1, country="🇦🇺", avatar="🏊‍♂️"),
  LeaderboardItem(rank=4, name="Emma Tennis", score=2150, streak=21, change=2, country="🇬🇧", avatar="🎾"),
]

@router.get("/leaderboards")
def get_leaderboards(
  category: str = Query("overall"),
  timeframe: str = Query("monthly"),
  shape: Optional[Literal["array", "data", "leaderboard"]] = Query(None, description="Optional response shape for flexibility/testing")
) -> Union[List[LeaderboardItem], dict]:
  # TODO: Replace MOCK with real data lookup based on category and timeframe
  if shape == "array":
    return MOCK
  if shape == "data":
    return {"data": MOCK}
  if shape == "leaderboard":
    return {"leaderboard": MOCK}
  # Default to a direct array
  return MOCK