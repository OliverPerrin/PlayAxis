from pydantic import BaseModel, Field
from typing import Union, Literal

# Define placeholder models for Twitch and Sportsbook for now
class TwitchStream(BaseModel):
    title: str
    user_name: str
    viewer_count: int

class SportsbookEvent(BaseModel):
    home_team: str
    away_team: str
    commence_time: str

class TwitchRecommendation(BaseModel):
    type: Literal['twitch']
    data: TwitchStream

class SportsbookRecommendation(BaseModel):
    type: Literal['sportsbook']
    data: SportsbookEvent

Recommendation = Union[TwitchRecommendation, SportsbookRecommendation]
