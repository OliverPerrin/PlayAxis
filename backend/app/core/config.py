from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    database_url: str
    jwt_secret: str

    ticketmaster_api_key: str
    meetup_api_key: str
    sportsdata_api_key: str
    rapidapi_key: str

    model_config = SettingsConfigDict(env_file=".env")

settings = Settings()

