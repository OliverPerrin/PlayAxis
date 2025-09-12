import httpx
import asyncio
import logging
from typing import List, Optional, Tuple
import urllib.parse
from datetime import datetime, timedelta
import re
from app.core.config import settings
from app.schemas.event import Event
from app.core.cache import cache

logger = logging.getLogger(__name__)

SERP_BASE = "https://serpapi.com/search.json"

DATE_PATTERNS = [
    # Examples: 'Fri, Oct 7, 7 – 8 AM', 'Fri, Oct 7, 7 AM – 3 PM', 'Oct 1 – 10'
    re.compile(r"^(?:(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun), )?(?P<month>[A-Z][a-z]{2}) (?P<day>\d{1,2})(?:, )?(?:(?P<start_time>\d{1,2}(?::\d{2})? ?[AP]M)(?: ?[–-] ?(?P<end_time>\d{1,2}(?::\d{2})? ?[AP]M))?)?"),
    # Multi-day span like 'Oct 1 – 10'
    re.compile(r"^(?P<month2>[A-Z][a-z]{2}) (?P<day_start>\d{1,2}) ?[–-] ?(?P<day_end>\d{1,2})$")
]

MONTHS = {m: i for i, m in enumerate(["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"], start=1)}

def _parse_when_to_iso(when_text: str) -> Tuple[Optional[str], Optional[str]]:
    """Best-effort parse of Google Events 'when' textual field into ISO start/end datetimes (UTC naive)."""
    if not when_text:
        return None, None
    now = datetime.utcnow()
    for pat in DATE_PATTERNS:
        m = pat.match(when_text)
        if not m:
            continue
        # Pattern 1 (single day + optional times)
        if m.groupdict().get('month'):
            month = m.group('month')
            day = m.group('day')
            if not month or not day:
                continue
            try:
                month_num = MONTHS.get(month)
                if not month_num:
                    continue
                year = now.year
                start_time_str = m.group('start_time')
                end_time_str = m.group('end_time')

                def parse_time(t: Optional[str]):
                    if not t:
                        return None
                    t2 = t.strip().upper()
                    fmt = "%Y-%m-%d %I %p" if ':' not in t2 else "%Y-%m-%d %I:%M %p"
                    return datetime.strptime(f"{year}-{month_num:02d}-{int(day):02d} {t2}", fmt)

                start_dt = parse_time(start_time_str) or datetime(year, month_num, int(day), 0, 0, 0)
                end_dt = parse_time(end_time_str)
                if end_dt and end_dt < start_dt:
                    end_dt += timedelta(hours=12)
                return start_dt.isoformat(), end_dt.isoformat() if end_dt else None
            except Exception:
                continue
        # Pattern 2 (multi-day span)
        if m.groupdict().get('month2'):
            month = m.group('month2')
            day_start = m.group('day_start')
            day_end = m.group('day_end')
            try:
                month_num = MONTHS.get(month)
                if not month_num:
                    continue
                year = now.year
                start_dt = datetime(year, month_num, int(day_start), 0, 0, 0)
                end_dt = datetime(year, month_num, int(day_end), 23, 59, 59)
                return start_dt.isoformat(), end_dt.isoformat()
            except Exception:
                continue
    return None, None

async def _enrich_lat_lon(event_location_map: dict) -> Tuple[Optional[float], Optional[float]]:
    """Fetch lat/lon via the serpapi link inside event_location_map if present.
    This calls a Google Maps SerpApi request (counts toward quota)."""
    if not event_location_map:
        return None, None
    link = event_location_map.get('serpapi_link')
    if not link:
        return None, None
    cache_key = f"latlon:{link}"
    async def producer():
        try:
            async with httpx.AsyncClient(timeout=6.0) as client:
                r = await client.get(link)
                if r.status_code != 200:
                    return (None, None)
                js = r.json()
                place = js.get('place_results') or js.get('place_result') or {}
                lat = place.get('gps_coordinates', {}).get('latitude')
                lon = place.get('gps_coordinates', {}).get('longitude')
                if lat is not None and lon is not None:
                    return (float(lat), float(lon))
        except Exception:
            return (None, None)
        return (None, None)
    latlon = await cache.get_or_set(cache_key, 3600, producer)  # cache 1 hour
    return latlon

async def _geocode_address(address_text: str) -> Tuple[Optional[float], Optional[float]]:
    """Fallback geocoding using OpenStreetMap Nominatim for events without event_location_map.
    Cached aggressively to avoid repeated external calls. Returns (lat, lon) or (None, None).
    """
    if not address_text:
        return None, None
    cache_key = f"geocode:{address_text.lower()}"

    async def producer():
        try:
            params = {
                "q": address_text,
                "format": "json",
                "limit": 1,
            }
            url = "https://nominatim.openstreetmap.org/search?" + urllib.parse.urlencode(params)
            headers = {"User-Agent": "PlayAxisEvents/1.0 (contact: support@playaxis.local)"}
            async with httpx.AsyncClient(timeout=4.0) as client:
                r = await client.get(url, headers=headers)
                if r.status_code != 200:
                    return (None, None)
                js = r.json()
                if isinstance(js, list) and js:
                    try:
                        lat = float(js[0].get("lat"))
                        lon = float(js[0].get("lon"))
                        return (lat, lon)
                    except Exception:
                        return (None, None)
        except Exception:
            return (None, None)
        return (None, None)

    return await cache.get_or_set(cache_key, 86400, producer)  # cache 24h

async def fetch_google_events(query: str, start: int = 0, hl: Optional[str] = None, gl: Optional[str] = None, htichips: Optional[str] = None, location: Optional[str] = None, no_cache: Optional[bool] = None) -> List[Event]:
    """Fetch events using SerpApi Google Events engine and normalize into Event models.

    Parameters
    ----------
    query: str - user query (e.g. "Events in Austin" or "concerts in Chicago")
    start: pagination offset (multiples of 10)
    hl: language code (defaults to settings.GOOGLE_EVENTS_HL)
    gl: country code (defaults to settings.GOOGLE_EVENTS_GL)
    htichips: optional filter string like "date:today" or "event_type:Virtual-Event,date:today"
    """
    api_key = settings.SERPAPI_API_KEY
    if not api_key:
        logger.warning("SERPAPI_API_KEY missing; returning empty list")
        return []

    params = {
        "engine": "google_events",
        "q": query,
        "api_key": api_key,
        "start": start,
        "hl": hl or settings.GOOGLE_EVENTS_HL,
        "gl": gl or settings.GOOGLE_EVENTS_GL,
    }
    if htichips:
        params["htichips"] = htichips
    if location:
        params["location"] = location
    if no_cache is True:
        params["no_cache"] = "true"

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            r = await client.get(SERP_BASE, params=params)
            if r.status_code != 200:
                logger.error("SerpApi google_events error status=%s body=%s", r.status_code, r.text[:200])
                return []
            data = r.json()
    except Exception as exc:
        logger.exception("SerpApi request failed: %s", exc)
        return []

    raw_events = data.get("events_results") or []
    out: List[Event] = []
    # First pass: build models without slow enrichment
    candidates_for_enrich: List[tuple[int, dict, Optional[list[str]]]] = []  # (index, event_location_map, address_lines)
    for ev in raw_events:
        try:
            address_lines = ev.get("address") or []
            city = None
            country = None
            if address_lines:
                last = address_lines[-1]
                if "," in last:
                    parts = [p.strip() for p in last.split(",")]
                    if parts:
                        city = parts[0]
                        if len(parts) > 1:
                            country = parts[-1]
                else:
                    city = last

            venue_obj = ev.get("venue") or {}
            venue_name = venue_obj.get("name") or (address_lines[0] if address_lines else None)

            date_obj = ev.get("date") or {}
            when_text = date_obj.get("when") or date_obj.get("start_date")
            start_iso, end_iso = _parse_when_to_iso(when_text or "")

            lat = None
            lon = None
            out.append(Event(
                id=ev.get("link") or ev.get("title"),
                source="google_events",
                name=ev.get("title") or "Untitled",
                description=ev.get("description"),
                url=ev.get("link"),
                start=start_iso or when_text,
                end=end_iso,
                timezone=None,
                venue=venue_name,
                city=city,
                country=country,
                latitude=lat,
                longitude=lon,
                category=None,
                subcategory=None,
                image=ev.get("thumbnail"),
                price=None,
                capacity=None,
                organizer=None,
                is_tiered=None,
                min_price=None,
                max_price=None,
                currency=None,
                ticket_classes=None,
            ))
            # Track enrichment candidates
            elmap = ev.get('event_location_map')
            if elmap or address_lines:
                candidates_for_enrich.append((len(out)-1, elmap or {}, address_lines if address_lines else None))
        except Exception:
            continue

    # Second pass: capped, parallel enrichment for missing coordinates
    MAX_ENRICH = 6
    tasks = []
    indices = []
    for idx, elmap, addr_lines in candidates_for_enrich:
        if MAX_ENRICH <= 0:
            break
        if elmap:
            tasks.append(_enrich_lat_lon(elmap))
            indices.append(idx)
            MAX_ENRICH -= 1
        elif addr_lines:
            joined_addr = ", ".join(addr_lines)
            tasks.append(_geocode_address(joined_addr))
            indices.append(idx)
            MAX_ENRICH -= 1
    if tasks:
        results = await asyncio.gather(*tasks, return_exceptions=True)
        for i, res in enumerate(results):
            try:
                lat, lon = res if isinstance(res, tuple) and len(res) == 2 else (None, None)
            except Exception:
                lat, lon = (None, None)
            if lat is not None and lon is not None:
                j = indices[i]
                # Update the Event instance
                out[j].latitude = float(lat)
                out[j].longitude = float(lon)

    return out
