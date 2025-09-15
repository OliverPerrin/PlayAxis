from __future__ import annotations
from typing import List, Optional
import math
import httpx
import hashlib
import json
from app.schemas.event import Event, EventsResponse
import logging
from app.services.google_events import fetch_google_events, SerpApiRateLimitError
from app.services.scraperapi_events import fetch_events_via_scraperapi
from app.core.cache import cache

EVENTS_CACHE_TTL = 180  # seconds
logger = logging.getLogger(__name__)

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
            # Include a contact per Nominatim usage policy to reduce risk of throttling
            headers = {"User-Agent": "PlayAxisEvents/1.0 (contact: support@playaxis.local)"}
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
        # Ensure we always include the keyword 'events' to guide the engine correctly
        base_query = safe_query if safe_query else 'events'
        if 'event' not in base_query.lower():
            base_query = f"events {base_query}".strip()

        # Build a sequence of increasingly broad localized queries if user coords provided.
        queries: List[str] = []
        used_city_state: Optional[tuple[str, Optional[str]]] = None
        location_param: Optional[str] = None

        if user_lat is not None and user_lon is not None:
            rev = await _reverse_geocode(user_lat, user_lon)
            if rev and (rev.get('city') or rev.get('state')):
                city = rev.get('city')
                state = rev.get('state')
                used_city_state = (city, state)
                # Build SerpApi location parameter when possible.
                if city:
                    location_param = f"{city}, {state}" if state else city
                elif state:
                    location_param = state
                # Generate variants to coax local SerpApi results.
                # Order matters: shortest first to let Google supply implicit locality, then explicit phrasings.
                locality_tokens: List[str] = []
                if city:
                    locality_tokens.extend([
                        f"{base_query} {city}",
                        f"{base_query} in {city}",
                    ])
                    if state:
                        locality_tokens.extend([
                            f"{base_query} {city} {state}",
                            f"{base_query} in {city} {state}",
                        ])
                elif state:
                    locality_tokens.append(f"{base_query} {state}")
                # Add a near me style variant (Google often interprets this relative to IP / location hints inside engine)
                locality_tokens.append(f"{base_query} near me")
                # Finally the most general with state only (captures statewide events) if state exists.
                if state:
                    locality_tokens.append(f"{base_query} {state}")
                # De-duplicate while preserving order
                seenq = set()
                for qv in locality_tokens:
                    qv_norm = qv.lower()
                    if qv_norm not in seenq:
                        seenq.add(qv_norm)
                        queries.append(qv)

        # Always append the base query last as a fallback (broad region / national)
        if base_query.lower() not in [q.lower() for q in queries]:
            queries.append(base_query)

        # Fetch & aggregate with pagination and early exit once enough local results.
        aggregated: List[Event] = []
        seen_ids = set()
        target_local = max(MIN_LOCAL_RESULTS * 2, limit)  # prefer at least enough locals to fill current page

        # Determine enrichment and request budgets based on whether a viewport filter is present.
        enrich_limit_global = 40 if None not in (min_lat, max_lat, min_lon, max_lon) else 6
        requests_used = 0
        # When a viewport is provided, use a slightly higher request budget to improve chances of getting
        # events with coordinates that fall inside the bbox for map markers.
        MAX_REQUESTS = 10 if None not in (min_lat, max_lat, min_lon, max_lon) else 6
        start_offsets = [max(0, (page - 1) * 10), max(0, (page - 1) * 10) + 10]
        serp_rate_limited = bool(await cache.get("serpapi:rate_limited"))
        if serp_rate_limited:
            logger.info("SerpApi on cooldown (rate limited previously); skipping SerpApi queries this request.")
        for idx, qstr in enumerate(queries):
            if requests_used >= MAX_REQUESTS:
                break
            for off in start_offsets:
                if requests_used >= MAX_REQUESTS:
                    break
                if serp_rate_limited:
                    break
                try:
                    # Use higher enrichment when viewport is present so more items gain coordinates for markers.
                    batch = await fetch_google_events(query=qstr, start=off, htichips=htichips, location=location_param, no_cache=True, enrich_limit=enrich_limit_global)
                except SerpApiRateLimitError:
                    serp_rate_limited = True
                    # set a short cooldown (e.g., 12 hours) to skip SerpApi until quota refresh; can adjust
                    await cache.set("serpapi:rate_limited", True, 60*60*12)
                    logger.warning("SerpApi quota exhausted; switching to fallback.")
                    break
                requests_used += 1
                logger.info("events.fetch q='%s' loc='%s' start=%s -> %s", qstr, location_param, off, len(batch))
                for ev in batch:
                    if ev.id in seen_ids:
                        continue
                    seen_ids.add(ev.id)
                    aggregated.append(ev)
                # Annotate distance for locality evaluation progressively if coords given.
                if user_lat is not None and user_lon is not None:
                    local_count = 0
                    for ev in aggregated:
                        if getattr(ev, '_distance_km', None) is None and ev.latitude is not None and ev.longitude is not None:
                            try:
                                setattr(ev, '_distance_km', _haversine(user_lat, user_lon, ev.latitude, ev.longitude))
                            except Exception:
                                setattr(ev, '_distance_km', None)
                        if getattr(ev, '_distance_km', None) is not None and ev._distance_km <= LOCAL_RADIUS_KM:
                            local_count += 1
                    if local_count >= target_local:
                        break
            # if we met target locals after inner loop
            if user_lat is not None and user_lon is not None:
                local_count = len([e for e in aggregated if getattr(e, '_distance_km', None) is not None and e._distance_km <= LOCAL_RADIUS_KM])
                if local_count >= target_local:
                    break
        events = aggregated
        # If localized aggregation yielded no results and we used a location, retry queries without location (with pagination)
        if not events and location_param and not serp_rate_limited:
            for idx, qstr in enumerate(queries):
                for off in start_offsets:
                    if serp_rate_limited:
                        break
                    try:
                        batch = await fetch_google_events(query=qstr, start=off, htichips=htichips, location=None, enrich_limit=enrich_limit_global)
                    except SerpApiRateLimitError:
                        serp_rate_limited = True
                        await cache.set("serpapi:rate_limited", True, 60*60*12)
                        logger.warning("SerpApi quota exhausted (retry phase); switching to fallback.")
                        break
                    logger.info("events.retry-no-loc q='%s' start=%s -> %s", qstr, off, len(batch))
                    for ev in batch:
                        if ev.id in seen_ids:
                            continue
                        seen_ids.add(ev.id)
                        events.append(ev)
                    if events:
                        break
                if events:
                    break
        # Final safety fallback hierarchy:
        if not events and not serp_rate_limited:
            # 1. Attempt another broad SerpApi call without location (unless already rate limited).
            try:
                fallback_batch = await fetch_google_events(query=base_query, start=max(0, (page - 1) * 10), htichips=htichips, location=None, enrich_limit=enrich_limit_global)
                events.extend(fallback_batch)
            except SerpApiRateLimitError:
                serp_rate_limited = True
                await cache.set("serpapi:rate_limited", True, 60*60*12)
                logger.warning("SerpApi quota exhausted (final broad attempt); switching to fallback.")
        scraper_used = False
        scraper_limited = False
        if not events:
            # 2. ScraperAPI HTML fallback (best-effort) using a localized or base query.
            fallback_query = base_query
            if user_lat is not None and user_lon is not None and used_city_state and used_city_state[0]:
                city, state = used_city_state
                if city and state:
                    fallback_query = f"events in {city} {state}"
                elif city:
                    fallback_query = f"events in {city}"
            scraped = await fetch_events_via_scraperapi(fallback_query)
            if scraped:
                events.extend(scraped)
                scraper_used = True
                # Heuristic: if we got fewer than 3, mark limited to display a UI hint
                if len(scraped) < 3:
                    scraper_limited = True
        # Filter by bounding box if provided
        if None not in (min_lat, max_lat, min_lon, max_lon):
            events_all = events[:]
            events = [e for e in events if (
                e.latitude is not None and e.longitude is not None and
                min_lat <= e.latitude <= max_lat and min_lon <= e.longitude <= max_lon
            )]
            # Fallback: if filtering produced zero events, broaden by taking nearest to center
            if not events and events_all:
                center_lat = (min_lat + max_lat) / 2.0
                center_lon = (min_lon + max_lon) / 2.0
                with_coords = [e for e in events_all if e.latitude is not None and e.longitude is not None]
                with_coords.sort(key=lambda e: _haversine(center_lat, center_lon, e.latitude, e.longitude))
                events = with_coords[:min(limit or 20, 40)]
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
                setattr(ev, '_distance_km', dist if dist is not None else getattr(ev, '_distance_km', None))
            # Partition into local vs non-local; widen radius adaptively to ensure we have some locals
            radius_seq = [50.0, 100.0, LOCAL_RADIUS_KM, 250.0, 500.0]
            local = []
            for r in radius_seq:
                local = [e for e in events if (e._distance_km is not None and e._distance_km <= r)]
                if len(local) >= MIN_LOCAL_RESULTS or r == radius_seq[-1]:
                    break
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
        # Expose distance_km outward (non schema field) by embedding into id-stable copy if desired; simplest is to attach attribute.
        for ev in trimmed:
            if hasattr(ev, '_distance_km') and ev._distance_km is not None:
                # monkey-patch attribute for consumer (FastAPI will include since pydantic by default excludes unknown, so we may later extend schema)
                setattr(ev, 'distance_km', round(ev._distance_km, 2))
        return EventsResponse(
            total=len(trimmed),
            data=trimmed,
            serpapi_exhausted=serp_rate_limited or None,
            scraper_fallback=scraper_used or None,
            scraper_limited=scraper_limited or None,
        )

    cached = await cache.get(key)
    if cached:
        return cached
    result = await producer()
    await cache.set(key, result, EVENTS_CACHE_TTL)
    return result