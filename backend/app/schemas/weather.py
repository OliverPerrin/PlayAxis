from pydantic import BaseModel
from typing import Optional, List

class WeatherCurrent(BaseModel):
    temperature_c: float
    temperature_f: float
    windspeed_kmh: float
    windspeed_mph: float
    weather_code: int
    description: str
    observation_time: str

class WeatherHourlyPoint(BaseModel):
    time: str
    temperature_c: float
    weather_code: Optional[int] = None

class WeatherResponse(BaseModel):
    latitude: float
    longitude: float
    current: WeatherCurrent
    hourly: Optional[List[WeatherHourlyPoint]] = None