import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # API Keys
    TWITCH_CLIENT_ID: str
    TWITCH_ACCESS_TOKEN: str
    X_RapidAPI_KEY: str
    TWITCH_CLIENT_SECRET: str
    EVENTBRITE_API_KEY: str
    EVENTBRITE_CLIENT_SECRET: str | None = None
    EVENTBRITE_PRIVATE_TOKEN: str
    EVENTBRITE_PUBLIC_TOKEN: str

    # API URLs
    EVENTBRITE_API_URL: str = "https://www.eventbriteapi.com/v3/"
    WEATHER_API_URL: str = "https://api.open-meteo.com/v1"
    TWITCH_API_URL: str = "https://localhost:8000/"
    SPORTSDATAIO_API_URL: str = "https://rapidapi.com/"

    # Database
    DATABASE_URL: str

    # Frontend
    FRONTEND_URL: str | None = None

    class Config:
        env_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")

settings = Settings()

# Normalize old-style URLs (postgres:// → postgresql://)
if settings.DATABASE_URL.startswith("postgres://"):
    settings.DATABASE_URL = settings.DATABASE_URL.replace("postgres://", "postgresql://", 1)
