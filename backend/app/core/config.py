from pydantic_settings import BaseSettings
import os

# This points to the root directory of your project (MultiSportApp)
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

class Settings(BaseSettings):
    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # API Keys
    TWITCH_CLIENT_ID: str
    TWITCH_ACCESS_TOKEN: str
    SPORTSDATAIO_API_KEY: str
    TWITCH_CLIENT_SECRET: str
    EVENTBRITE_API_KEY: str
    EVENTBRITE_CLIENT_SECRET: str
    EVENTBRITE_PRIVATE_TOKEN: str
    EVENTBRITE_PUBLIC_TOKEN: str

    # API URLs
    EVENTBRITE_API_URL: str = "https://www.eventbriteapi.com/v3"
    TWITCH_API_URL: str = "https://api.twitch.tv/helix"
    SPORTSDATAIO_API_URL: str = "https://api.sportsdata.io/v3"
    WEATHER_API_URL: str = "https://api.open-meteo.com/v1"

    # Database
    DATABASE_URL: str

    class Config:
        env_file = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")

settings = Settings()