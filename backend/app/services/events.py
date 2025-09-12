from __future__ import annotations
from typing import List, Optional
import math
import httpx
import hashlib
import json
from app.schemas.event import Event, EventsResponse
from app.services.google_events import fetch_google_events
from app.core.cache import cache

EVENTS_CACHE_TTL = 180  # seconds

def _cache_key(query: str, page: int, limit: int, htichips: str | None,
               min_lat: float | None, max_lat: float | None,
               min_lon: float | None, max_lon: float | None,
               user_lat: Optional[float], user_lon: Optional[float]) -> str:
    raw = json.dumps({
        "q": query,
        "page": page,
        "limit": limit,
        "htichips": htichips,
        "min_lat": min_lat,
        "max_lat": max_lat,
        "min_lon": min_lon,
        "max_lon": max_lon,
        "user_lat": round(user_lat, 3) if user_lat is not None else None,
        "user_lon": round(user_lon, 3) if user_lon is not None else None,
    }, sort_keys=True)
    return "events:" + hashlib.sha256(raw.encode()).hexdigest()

def _haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Distance in kilometers between two lat/lon points."""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

LOCAL_RADIUS_KM = 120.0  # radius considered "local" for first-pass filtering
MIN_LOCAL_RESULTS = 5    # if fewer than this, append broader results

async def _reverse_geocode(lat: float, lon: float) -> Optional[dict]:
    """Reverse geocode coordinates to a dict with city, state, country using Nominatim (cached)."""
    key = f"revgeo:{round(lat,3)}:{round(lon,3)}"

    async def producer():
        try:
            url = "https://nominatim.openstreetmap.org/reverse"
            params = {"lat": lat, "lon": lon, "format": "json", "zoom": 10, "addressdetails": 1}
            headers = {"User-Agent": "PlayAxisEvents/1.0 (reverse)"}
            async with httpx.AsyncClient(timeout=8.0) as client:
                r = await client.get(url, params=params, headers=headers)
                if r.status_code != 200:
                    return None
                data = r.json()
                addr = data.get('address', {})
                return {
                    'city': addr.get('city') or addr.get('town') or addr.get('village') or addr.get('hamlet'),
                    'state': addr.get('state') or addr.get('region'),
                    'country': addr.get('country'),
                }
        except Exception:
            return None
    cached = await cache.get(key)
    if cached is not None:
        return cached
    value = await producer()
    await cache.set(key, value, 86400)  # 24h
    return value

async def aggregate_events(query: str = "", page: int = 1, limit: int = 20,
                           htichips: str | None = None,
                           min_lat: float | None = None, max_lat: float | None = None,
                           min_lon: float | None = None, max_lon: float | None = None,
                           user_lat: Optional[float] = None, user_lon: Optional[float] = None) -> EventsResponse:
    key = _cache_key(query, page, limit, htichips, min_lat, max_lat, min_lon, max_lon, user_lat, user_lon)

    async def producer():
        safe_query = (query or '').strip()
        # We construct a Google query. If user query already contains a location hint, keep it; else default.
        google_query = safe_query
        augmented = False
        if not google_query:
            google_query = 'events'
        # If user location provided and query lacks a city token, augment.
        if user_lat is not None and user_lon is not None:
            rev = await _reverse_geocode(user_lat, user_lon)
            if rev and rev.get('city'):
                city_token = rev['city']
                state_token = rev.get('state')
                # Check if city already appears (case-insensitive)
                if city_token.lower() not in google_query.lower():
                    google_query = f"{google_query} in {city_token}{(' ' + state_token) if state_token else ''}".strip()
                    augmented = True
        events: List[Event] = await fetch_google_events(query=google_query, start=(page - 1) * 10, htichips=htichips)
        # Filter by bounding box if provided
        if None not in (min_lat, max_lat, min_lon, max_lon):
            events = [e for e in events if (
                e.latitude is not None and e.longitude is not None and
                min_lat <= e.latitude <= max_lat and min_lon <= e.longitude <= max_lon
            )]
        # Distance annotation & local prioritization
        if user_lat is not None and user_lon is not None:
            for ev in events:
                if ev.latitude is not None and ev.longitude is not None:
                    try:
                        dist = _haversine(user_lat, user_lon, ev.latitude, ev.longitude)
                    except Exception:
                        dist = None
                else:
                    dist = None
                setattr(ev, '_distance_km', dist)
            # Partition into local vs non-local
            local = [e for e in events if (e._distance_km is not None and e._distance_km <= LOCAL_RADIUS_KM)]
            non_local = [e for e in events if e not in local]
            local.sort(key=lambda e: (e._distance_km, e.start or "9999"))
            non_local.sort(key=lambda e: (e._distance_km is None, e._distance_km if e._distance_km is not None else 1e9, e.start or "9999"))
            if len(local) < MIN_LOCAL_RESULTS:
                events = local + non_local
            else:
                events = local + non_local
        else:
            events.sort(key=lambda e: (e.start or "9999"))
        if limit:
            trimmed = events[:limit]
        else:
            trimmed = events
        return EventsResponse(total=len(trimmed), data=trimmed)

    cached = await cache.get(key)
    if cached:
        return cached
    result = await producer()
    await cache.set(key, result, EVENTS_CACHE_TTL)
    return result