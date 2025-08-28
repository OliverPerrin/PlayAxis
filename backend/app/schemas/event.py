from datetime import datetime
from pydantic import BaseModel, HttpUrl
from typing import Optional

class EventBase(BaseModel):
    title: str
    description: Optional[str] = None
    start_time: datetime
    end_time: Optional[datetime] = None
    url: Optional[HttpUrl]
    source: str
    niche: str

class EventCreate(EventBase):
    pass

class EventRead(EventBase):
    id: int

    class Config:
        from_attributes = True

