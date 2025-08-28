from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class EventbriteEventName(BaseModel):
    text: str

class EventbriteEventStart(BaseModel):
    local: datetime

class EventbriteEvent(BaseModel):
    name: EventbriteEventName
    start: EventbriteEventStart
    description: Optional[dict] = None
    venue: Optional[dict] = None
