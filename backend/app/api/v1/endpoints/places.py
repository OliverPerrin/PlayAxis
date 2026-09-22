from fastapi import APIRouter, Query
from app.services.public_data import places, get_json

router = APIRouter()


@router.get("/places")
async def nearby(
    lat: float = Query(..., ge=-85, le=85),
    lon: float = Query(..., ge=-180, le=180),
    radius: int = Query(1500, ge=300, le=5000),
):
    return await places(lat, lon, radius)


@router.get("/locations")
async def locations(q: str = Query(..., min_length=2, max_length=100)):
    data = await get_json(
        "https://geocoding-api.open-meteo.com/v1/search",
        {"name": q, "count": 6, "language": "en", "format": "json"},
        ttl=86400,
    )
    return {"locations": data.get("results") or [], "source": "Open-Meteo / GeoNames"}
