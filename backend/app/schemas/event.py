from pydantic import BaseModel
from typing import Optional, List

class Event(BaseModel):
    id: str
    source: str
    name: str
    description: Optional[str] = None
    url: Optional[str] = None
    start: Optional[str] = None
    end: Optional[str] = None
    timezone: Optional[str] = None
    venue: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    category: Optional[str] = None
    image: Optional[str] = None
    price: Optional[str] = None

class EventsResponse(BaseModel):
    total: int
    data: List[Event]