
from fastapi import APIRouter, HTTPException
from app.services.weather import get_weather

router = APIRouter()

@router.get("/")
async def read_weather(lat: float, lon: float):
    try:
        weather = await get_weather(lat, lon)
        return weather
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
