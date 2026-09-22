from datetime import datetime, timezone, timedelta
from app.services.public_data import get_json
from app.core.config import settings
from app.schemas.weather import WeatherResponse, WeatherCurrent, WeatherHourlyPoint

WEATHER_CODE_MAP = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Freezing fog",
    51: "Light drizzle",
    53: "Drizzle",
    55: "Heavy drizzle",
    56: "Freezing drizzle",
    57: "Freezing drizzle",
    61: "Light rain",
    63: "Rain",
    65: "Heavy rain",
    66: "Freezing rain",
    67: "Freezing rain",
    71: "Light snow",
    73: "Snow",
    75: "Heavy snow",
    77: "Snow grains",
    80: "Rain showers",
    81: "Rain showers",
    82: "Heavy showers",
    85: "Snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorms",
    96: "Thunderstorms with hail",
    99: "Thunderstorms with hail",
}


async def fetch_weather(lat, lon, include_hourly=False, hours=0):
    params = {
        "latitude": lat,
        "longitude": lon,
        "current": "temperature_2m,weather_code,wind_speed_10m",
        "timezone": "auto",
    }
    if include_hourly:
        params.update(hourly="temperature_2m,weather_code", forecast_hours=hours or 24)
    data = await get_json(
        f'{settings.WEATHER_API_URL.rstrip("/")}/forecast', params, ttl=600
    )
    c = data["current"]
    temp = c["temperature_2m"]
    wind = c["wind_speed_10m"]
    code = c["weather_code"]
    hourly = data.get("hourly", {})
    offset = timezone(timedelta(seconds=data.get("utc_offset_seconds", 0)))

    def aware(value):
        return datetime.fromisoformat(value).replace(tzinfo=offset).isoformat()

    return WeatherResponse(
        latitude=lat,
        longitude=lon,
        current=WeatherCurrent(
            temperature_c=temp,
            temperature_f=temp * 9 / 5 + 32,
            windspeed_kmh=wind,
            windspeed_mph=wind * 0.621371,
            weather_code=code,
            description=WEATHER_CODE_MAP.get(code, "Weather observation"),
            observation_time=aware(c["time"]),
        ),
        hourly=(
            [
                WeatherHourlyPoint(time=aware(t), temperature_c=v, weather_code=w)
                for t, v, w in zip(
                    hourly.get("time", []),
                    hourly.get("temperature_2m", []),
                    hourly.get("weather_code", []),
                )
            ]
            if include_hourly
            else None
        ),
    )
