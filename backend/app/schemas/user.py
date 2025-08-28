
from pydantic import BaseModel
from typing import List, Optional
from .interest import Interest

# Shared properties
class UserBase(BaseModel):
    email: str
    full_name: str | None = None

# Properties to receive via API on creation
class UserCreate(UserBase):
    password: str

# Properties to receive via API on update
class UserUpdate(UserBase):
    password: str | None = None

# Properties shared by models stored in DB
class UserInDBBase(UserBase):
    id: int
    is_active: bool
    interests: List[Interest] = []

    class Config:
        from_attributes = True

# Properties to return to client
class User(UserInDBBase):
    pass
