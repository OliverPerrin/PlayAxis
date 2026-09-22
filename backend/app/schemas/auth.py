from pydantic import BaseModel, EmailStr, Field, field_validator


class UserOut(BaseModel):
    id: int
    username: str
    email: EmailStr

    class Config:
        from_attributes = True


class RegisterIn(BaseModel):
    username: str = Field(min_length=2, max_length=60)
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)

    @field_validator("password")
    @classmethod
    def password_bytes(cls, value):
        if len(value.encode("utf-8")) > 72:
            raise ValueError("Password must be at most 72 UTF-8 bytes")
        return value

    @field_validator("username")
    @classmethod
    def clean_username(cls, value):
        value = value.strip()
        if len(value) < 2:
            raise ValueError("Choose a name with at least 2 characters")
        return value


class LoginIn(BaseModel):
    username: str | None = None
    email: EmailStr | None = None
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
