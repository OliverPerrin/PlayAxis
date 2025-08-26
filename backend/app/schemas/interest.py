
from pydantic import BaseModel

class InterestBase(BaseModel):
    name: str

class InterestCreate(InterestBase):
    pass

class Interest(InterestBase):
    id: int

    class Config:
        orm_mode = True
