from datetime import date
from fastapi import APIRouter, Query, HTTPException
from app.services.local_discovery import local_events

router = APIRouter()


@router.get("/discovery/events")
async def search(
    city: str = Query(..., min_length=2, max_length=100),
    sport: str = Query("sports", max_length=40),
    country: str = Query("", max_length=80),
    tz: str = Query("Europe/London", max_length=80),
    lat: float | None = Query(None, ge=-85, le=85),
    lon: float | None = Query(None, ge=-180, le=180),
    date_from: date | None = None,
    date_to: date | None = None,
):
    if date_from and date_to and date_to < date_from:
        raise HTTPException(422, "The end date must be on or after the start date")
    return await local_events(city, sport, country, tz, lat, lon, date_from, date_to)
