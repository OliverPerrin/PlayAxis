from fastapi import APIRouter, HTTPException, Query
from app.services.weather import fetch_weather
from app.schemas.weather import WeatherResponse

router = APIRouter()

@router.get("/", response_model=WeatherResponse)
async def read_weather(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
    hourly: bool = Query(False, description="Include hourly forecast"),
    hours: int = Query(0, ge=0, le=72, description="Limit number of hourly points if hourly=true")
):
    try:
        return await fetch_weather(lat, lon, include_hourly=hourly, hours=hours)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Weather upstream error: {e}")