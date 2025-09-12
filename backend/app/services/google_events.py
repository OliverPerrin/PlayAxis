import httpx
import logging
from typing import List, Optional, Tuple
from datetime import datetime, timedelta
import re
from app.core.config import settings
from app.schemas.event import Event

logger = logging.getLogger(__name__)

SERP_BASE = "https://serpapi.com/search.json"

DATE_PATTERNS = [
    # Examples: 'Fri, Oct 7, 7 – 8 AM', 'Fri, Oct 7, 7 AM – 3 PM', 'Oct 1 – 10'
    re.compile(r"^(?:(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun), )?(?P<month>[A-Z][a-z]{2}) (?P<day>\d{1,2})(?:, )?(?:(?P<start_time>\d{1,2}(?::\d{2})? ?[AP]M)(?: ?[–-] ?(?P<end_time>\d{1,2}(?::\d{2})? ?[AP]M))?)?"),
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
        month = m.group('month')
        day = m.group('day')
        if not month or not day:
            continue
        try:
            month_num = MONTHS.get(month)
            if not month_num:
                continue
            year = now.year
            # Handle year rollover (e.g., Dec searched in Jan might still be future, keep simple)
            start_time_str = m.group('start_time')
            end_time_str = m.group('end_time')

            def parse_time(t: Optional[str]):
                if not t:
                    return None
                t = t.strip().upper()
                # Normalize spacing
                return datetime.strptime(f"{year}-{month_num:02d}-{int(day):02d} {t}", "%Y-%m-%d %I %p" if ':' not in t else "%Y-%m-%d %I:%M %p")

            start_dt = parse_time(start_time_str) or datetime(year, month_num, int(day), 0, 0, 0)
            end_dt = parse_time(end_time_str)
            if end_dt and end_dt < start_dt:
                end_dt += timedelta(hours=12)  # crude rollover if AM/PM inference odd
            return start_dt.isoformat(), end_dt.isoformat() if end_dt else None
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
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.get(link)
            if r.status_code != 200:
                return None, None
            js = r.json()
            # Attempt to extract from 'place_results' or first result geometry
            place = js.get('place_results') or js.get('place_result') or {}
            lat = place.get('gps_coordinates', {}).get('latitude')
            lon = place.get('gps_coordinates', {}).get('longitude')
            if lat is not None and lon is not None:
                return float(lat), float(lon)
    except Exception:
        return None, None
    return None, None

async def fetch_google_events(query: str, start: int = 0, hl: Optional[str] = None, gl: Optional[str] = None, htichips: Optional[str] = None) -> List[Event]:
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

    try:
        async with httpx.AsyncClient(timeout=25.0) as client:
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
    for ev in raw_events:
        try:
            # Address lines: usually [line, cityState]
            address_lines = ev.get("address") or []
            city = None
            country = None
            if address_lines:
                # Naive split of last line for city/country if possible
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
            # Dates: attempt parsing 'when'; fallback to original text.
            date_obj = ev.get("date") or {}
            when_text = date_obj.get("when") or date_obj.get("start_date")
            start_iso, end_iso = _parse_when_to_iso(when_text or "")

            # Optional coordinate enrichment
            lat = None
            lon = None
            if ev.get('event_location_map'):
                lat, lon = await _enrich_lat_lon(ev.get('event_location_map'))

            out.append(Event(
                id=ev.get("link") or ev.get("title"),
                source="google_events",
                name=ev.get("title") or "Untitled",
                description=ev.get("description"),
                url=ev.get("link"),
                start=start_iso or when_text,
                end=end_iso,
                timezone=None,
                venue=venue_obj.get("name"),
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
        except Exception:
            continue
    return out
