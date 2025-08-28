from pydantic import BaseModel, Field
from typing import Union, Literal
from .eventbrite import EventbriteEvent

# Define placeholder models for Twitch and SportsDataIO for now
class TwitchStream(BaseModel):
    title: str
    user_name: str
    viewer_count: int

class SportsDataIOEvent(BaseModel):
    HomeTeam: str
    AwayTeam: str
    Date: str

class EventbriteRecommendation(BaseModel):
    type: Literal['eventbrite']
    data: EventbriteEvent

class TwitchRecommendation(BaseModel):
    type: Literal['twitch']
    data: TwitchStream

class SportsDataIORecommendation(BaseModel):
    type: Literal['sportsdataio']
    data: SportsDataIOEvent

Recommendation = Union[EventbriteRecommendation, TwitchRecommendation, SportsDataIORecommendation]
