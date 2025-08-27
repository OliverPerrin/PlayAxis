from pydantic import BaseModel
from ..models.user import User
from ..models.interest import Interest


class InterestBase(BaseModel):
    name: str

class InterestCreate(InterestBase):
    pass

class Interest(InterestBase):
    id: int

    class Config:
        from_attributes = True
