from pydantic import BaseModel, Field, field_validator
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
class UserUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=60)

    @field_validator("full_name")
    @classmethod
    def valid_name(cls, value):
        if value is not None:
            value = value.strip()
            if len(value) < 2:
                raise ValueError("Use at least 2 characters")
        return value


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
