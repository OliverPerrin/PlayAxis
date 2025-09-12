from fastapi import APIRouter, HTTPException, Query
from app.services.events import aggregate_events
from app.schemas.event import EventsResponse, compute_viewport

router = APIRouter()

@router.get("/", response_model=EventsResponse)
async def list_events_slash(
    q: str = Query(""),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=50),
    htichips: str | None = Query(None, description="Google Events filter chips, e.g. 'date:today' or 'event_type:Virtual-Event,date:today'"),
    min_lat: float | None = None,
    max_lat: float | None = None,
    min_lon: float | None = None,
    max_lon: float | None = None,
    user_lat: float | None = Query(None, description="User latitude to bias ordering"),
    user_lon: float | None = Query(None, description="User longitude to bias ordering"),
):
    try:
        return await aggregate_events(
            query=q,
            page=page,
            limit=limit,
            htichips=htichips,
            min_lat=min_lat,
            max_lat=max_lat,
            min_lon=min_lon,
            max_lon=max_lon,
            user_lat=user_lat,
            user_lon=user_lon,
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Events fetch failed: {exc}")

@router.get("", response_model=EventsResponse)
async def list_events_no_slash(
    q: str = Query(""),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=50),
    htichips: str | None = None,
    min_lat: float | None = None,
    max_lat: float | None = None,
    min_lon: float | None = None,
    max_lon: float | None = None,
    user_lat: float | None = Query(None),
    user_lon: float | None = Query(None),
):
    return await list_events_slash(q=q, page=page, limit=limit,
                                   htichips=htichips,
                                   min_lat=min_lat, max_lat=max_lat,
                                   min_lon=min_lon, max_lon=max_lon,
                                   user_lat=user_lat, user_lon=user_lon)


@router.get("/viewport")
async def list_events_with_viewport(
    q: str = Query(""),
    page: int = Query(1, ge=1),
    limit: int = Query(100, ge=1, le=200),
    htichips: str | None = Query(None),
    min_lat: float | None = None,
    max_lat: float | None = None,
    min_lon: float | None = None,
    max_lon: float | None = None,
    user_lat: float | None = Query(None),
    user_lon: float | None = Query(None),
):
    """Return events plus a computed viewport bounding box for mapping.
    Not using a response_model to allow dynamic viewport dict.
    """
    resp = await aggregate_events(query=q, page=page, limit=limit,
                                  htichips=htichips,
                                  min_lat=min_lat, max_lat=max_lat,
                                  min_lon=min_lon, max_lon=max_lon,
                                  user_lat=user_lat, user_lon=user_lon)
    vp = compute_viewport(resp.data)
    return {"total": resp.total, "viewport": vp, "events": [e.model_dump() for e in resp.data]}