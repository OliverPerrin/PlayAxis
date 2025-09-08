from pydantic import BaseModel, Field
from typing import List, Optional

class Stream(BaseModel):
    id: str
    user_name: str
    title: str
    viewer_count: int
    started_at: str
    thumbnail_url: Optional[str] = None
    language: Optional[str] = None
    game_id: Optional[str] = None

class StreamsResponse(BaseModel):
    data: List[Stream]
    total: int