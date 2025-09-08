import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Security
    SECRET_KEY: str | None = None
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # API Keys
    TWITCH_CLIENT_ID: str | None = None
    TWITCH_ACCESS_TOKEN: str | None = None
    X_RapidAPI_KEY: str | None = None
    TWITCH_CLIENT_SECRET: str | None = None
    EVENTBRITE_API_KEY: str | None = None
    EVENTBRITE_CLIENT_SECRET: str | None = None

    # API URLs
    EVENTBRITE_API_URL: str = "https://www.eventbriteapi.com/v3"
    WEATHER_API_URL: str = "https://api.open-meteo.com/v1"
    TWITCH_API_URL: str = "https://localhost:8000/"
    SPORTSBOOK_API_URL: str = "https://sportsbook-api.p.rapidapi.com/v1"

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

# Sanitize Eventbrite base URL if an accidental full path with query was provided
if settings.EVENTBRITE_API_URL:
    if "eventbriteapi.com" in settings.EVENTBRITE_API_URL:
        # Force canonical base
        settings.EVENTBRITE_API_URL = "https://www.eventbriteapi.com/v3"
