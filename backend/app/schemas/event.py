from datetime import datetime
from pydantic import BaseModel, HttpUrl
from typing import Optional

class EventBase(BaseModel):
    title: str
    description: Optional[str]
    start_time: datetime
    end_time: Optional[datetime]
    url: Optional[HttpUrl]
    source: str
    niche: str

class EventCreate(EventBase):
    pass

class EventRead(EventBase):
    id: int

    class Config:
        orm_mode = True

