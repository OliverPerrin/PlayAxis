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
    TWITCH_CLIENT_SECRET: str | None = None
    THESPORTSDB_API_KEY: str | None = None
    
    # SerpApi / Google Events
    SERPAPI_API_KEY: str | None = None
    GOOGLE_EVENTS_HL: str = "en"  # language
    GOOGLE_EVENTS_GL: str = "us"  # country

    # ScraperAPI (HTML scraping fallback for Google events)
    SCRAPERAPI_API_KEY: str | None = None
    SCRAPERAPI_BASE_URL: str = "https://api.scraperapi.com/"

    # API URLs
    WEATHER_API_URL: str = "https://api.open-meteo.com/v1"
    TWITCH_API_URL: str = "https://api.twitch.tv/helix/"
    THESPORTSDB_API_URL: str = "https://www.thesportsdb.com/api/v1/json"

    # Contact / Email (optional)
    CONTACT_RECIPIENT_EMAIL: str | None = None
    CONTACT_SENDER_EMAIL: str | None = None
    CONTACT_SENDER_PASSWORD: str | None = None
    SMTP_HOST: str | None = None
    SMTP_PORT: int | None = None

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

    # (Eventbrite settings removed)
