from __future__ import annotations
import httpx
from typing import Optional, List
from app.core.config import settings
from app.schemas.weather import WeatherResponse, WeatherCurrent, WeatherHourlyPoint

WEATHER_BASE = settings.WEATHER_API_URL.rstrip("/")

# Simple mapping for description (extend as needed)
WEATHER_CODE_MAP = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    71: "Slight snow fall",
    73: "Moderate snow fall",
    75: "Heavy snow fall",
    95: "Thunderstorm"
}

def _c_to_f(c: float) -> float:
    return (c * 9/5) + 32

def _kmh_to_mph(kmh: float) -> float:
    return kmh * 0.621371

async def fetch_weather(
    lat: float,
    lon: float,
    include_hourly: bool = False,
    hours: int = 0
) -> WeatherResponse:
    params = {
        "latitude": lat,
        "longitude": lon,
        "current_weather": "true",
    }
    if include_hourly:
        params["hourly"] = "temperature_2m,weathercode"
        # API returns a lot; we will slice later if hours > 0

    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.get(f"{WEATHER_BASE}/forecast", params=params)
        r.raise_for_status()
        raw = r.json()

    cw = raw.get("current_weather") or {}
    code = cw.get("weathercode")
    temp_c = cw.get("temperature")
    wind_kmh = cw.get("windspeed")
    current = WeatherCurrent(
        temperature_c=temp_c,
        temperature_f=_c_to_f(temp_c) if temp_c is not None else None,
        windspeed_kmh=wind_kmh,
        windspeed_mph=_kmh_to_mph(wind_kmh) if wind_kmh is not None else None,
        weather_code=code,
        description=WEATHER_CODE_MAP.get(code, "Unknown"),
        observation_time=cw.get("time"),
    )

    hourly: Optional[List[WeatherHourlyPoint]] = None
    if include_hourly:
        times = raw.get("hourly", {}).get("time", [])
        temps = raw.get("hourly", {}).get("temperature_2m", [])
        codes = raw.get("hourly", {}).get("weathercode", [])
        points = []
        for i, t in enumerate(times):
            if i < len(temps):
                points.append(WeatherHourlyPoint(
                    time=t,
                    temperature_c=temps[i],
                    weather_code=codes[i] if i < len(codes) else None
                ))
        if hours > 0:
            points = points[:hours]
        hourly = points

    return WeatherResponse(
        latitude=lat,
        longitude=lon,
        current=current,
        hourly=hourly
    )