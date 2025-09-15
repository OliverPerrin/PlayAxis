import logging
import httpx
from typing import List, Optional, Tuple
from bs4 import BeautifulSoup
from app.core.config import settings
from app.schemas.event import Event
from app.core.cache import cache
import asyncio
import urllib.parse
import re
from datetime import datetime
import json

logger = logging.getLogger(__name__)

USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"

DATE_RE = re.compile(r"^(Mon|Tue|Wed|Thu|Fri|Sat|Sun),? ?([A-Z][a-z]{2}) (\d{1,2})(.*)$")

MONTH_MAP = {m: i for i, m in enumerate(["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"], start=1)}

def _normalize_date(raw: str) -> Optional[str]:
    """Attempt to convert scraped date text into ISO-8601 local-date placeholder (no TZ)."""
    m = DATE_RE.match(raw)
    if not m:
        return None
    mon_abbr = m.group(2)
    day = m.group(3)
    try:
        month = MONTH_MAP.get(mon_abbr)
        if not month:
            return None
        year = datetime.utcnow().year
        # If date already passed this year by more than ~30 days assume next year (rough heuristic)
        try:
            parsed = datetime(year, month, int(day))
            if (datetime.utcnow() - parsed).days > 30:
                parsed = datetime(year + 1, month, int(day))
        except ValueError:
            return None
        return parsed.isoformat()
    except Exception:
        return None

async def _geocode_query_fragment(fragment: str) -> Optional[tuple[float, float]]:
    """Best-effort forward geocode using Nominatim (cached)."""
    key = f"fwdgeo:{fragment.lower()}"
    cached = await cache.get(key)
    if cached is not None:
        return cached
    try:
        async with httpx.AsyncClient(timeout=8.0, headers={"User-Agent": "PlayAxisEvents/1.0 (contact: support@playaxis.local)"}) as client:
            r = await client.get("https://nominatim.openstreetmap.org/search", params={"q": fragment, "format": "json", "limit": 1})
            if r.status_code == 200:
                data = r.json()
                if data:
                    lat = float(data[0]["lat"])
                    lon = float(data[0]["lon"])
                    await cache.set(key, (lat, lon), 86400)
                    return lat, lon
    except Exception:
        pass
    await cache.set(key, None, 3600)
    return None

MAX_EVENTS = 30

def _looks_like_real_event(item: dict) -> bool:
    if not isinstance(item, dict):
        return False
    title = (item.get('title') or item.get('name') or '').lower()
    if not title:
        return False
    # Require some temporal signal
    date_fields = [item.get('start_date'), item.get('date'), item.get('start_time'), item.get('when'), item.get('date_time')]
    has_date = any(isinstance(v, str) and len(v) >= 4 for v in date_fields)
    # Avoid broad portal pages (words like calendar, ticketmaster, eventbrite category, guide)
    banned_keywords = ['calendar', 'tickets -', 'things to do', 'guide', 'best events', 'ticketmaster', 'eventbrite']
    if any(k in title for k in banned_keywords):
        return False
    return has_date

def _jsonld_events_from_soup(soup: BeautifulSoup) -> List[dict]:
    results = []
    for script in soup.find_all('script', type='application/ld+json'):
        try:
            data = json.loads(script.string or '')
        except Exception:
            continue
        # Data can be dict or list
        candidates = []
        if isinstance(data, list):
            candidates.extend(data)
        elif isinstance(data, dict):
            # Some pages nest graph
            if '@graph' in data and isinstance(data['@graph'], list):
                candidates.extend(data['@graph'])
            else:
                candidates.append(data)
        for obj in candidates:
            if not isinstance(obj, dict):
                continue
            t = obj.get('@type')
            if isinstance(t, list):
                is_event = any(tt.lower() == 'event' for tt in t if isinstance(tt, str))
            else:
                is_event = isinstance(t, str) and t.lower() == 'event'
            if not is_event:
                continue
            results.append(obj)
    return results

async def fetch_events_via_scraperapi(query: str, gl: str = "us", hl: str = "en") -> List[Event]:
    """Fallback events fetch using ScraperAPI + Google HTML parsing.

    This is a best-effort, heuristic parser. It intentionally limits the number
    of events returned (first ~20) to control latency and ScraperAPI usage.
    """
    api_key = settings.SCRAPERAPI_API_KEY
    if not api_key:
        logger.warning("SCRAPERAPI_API_KEY missing; returning empty list (fallback disabled)")
        return []

    base = settings.SCRAPERAPI_BASE_URL.rstrip('/') or "https://api.scraperapi.com/"
    cache_key = f"scrape_ev:{hl}:{gl}:{query.strip().lower()}"
    last_good_key = f"scrape_last_good:{hl}:{gl}:{query.strip().lower()}"
    cooldown_key = "scraperapi:429_cooldown"

    # If in cooldown due to prior 429, return cached/stale immediately
    if await cache.get(cooldown_key):
        cached_good = await cache.get(last_good_key)
        if cached_good:
            return cached_good
        cached = await cache.get(cache_key)
        if cached:
            return cached
        return []

    cached = await cache.get(cache_key)
    if cached is not None:
        return cached

    # Ensure query encourages event vertical
    normalized_query = query.strip()
    if 'event' not in normalized_query.lower():
        normalized_query = f"events {normalized_query}".strip()

    # Attempt 1: Structured Google Search endpoint (JSON) -> faster & lighter if it includes events.
    structured_endpoint = f"{base}/structured/google/search"
    struct_params = {"api_key": api_key, "query": normalized_query, "hl": hl, "gl": gl}
    structured_events: List[Event] = []
    if not await cache.get(cooldown_key):  # skip if cooling down due to previous rate limit
        try:
            async with httpx.AsyncClient(timeout=8.0, headers={"User-Agent": USER_AGENT}) as client:
                sr = await client.get(structured_endpoint, params=struct_params)
                if sr.status_code == 429:
                    await cache.set(cooldown_key, True, 90)
                elif sr.status_code == 200:
                    try:
                        payload = sr.json()
                        # Common possible locations for events data
                        candidates: List[dict] = []
                        if isinstance(payload, dict):
                            if isinstance(payload.get('events_results'), list):
                                candidates.extend(payload['events_results'])
                            # Some variants nest inside knowledge_graph
                            kg = payload.get('knowledge_graph') or {}
                            if isinstance(kg, dict) and isinstance(kg.get('events'), list):
                                candidates.extend(kg['events'])
                            # Fallback: try organic results if very event-like
                            if not candidates and isinstance(payload.get('organic_results'), list):
                                for o in payload['organic_results']:
                                    if not isinstance(o, dict):
                                        continue
                                    title = o.get('title') or ''
                                    if 'event' in title.lower():
                                        candidates.append(o)
                        filtered = [c for c in candidates if _looks_like_real_event(c)] or candidates
                        for idx, item in enumerate(filtered[:MAX_EVENTS]):
                            try:
                                title = item.get('title') or item.get('name')
                                if not title:
                                    continue
                                link = item.get('link') or item.get('url')
                                start_raw = item.get('start_date') or item.get('date') or item.get('start_time')
                                end_raw = item.get('end_date') or item.get('end_time')
                                start_iso = None
                                if isinstance(start_raw, str):
                                    start_iso = _normalize_date(start_raw) or start_raw
                                structured_events.append(Event(
                                    id=link or f"scraperapi_struct:{idx}:{title[:30]}",
                                    source="scraperapi_structured",
                                    name=title,
                                    description=(item.get('description') or None),
                                    url=link,
                                    start=start_iso,
                                    end=end_raw if isinstance(end_raw, str) else None,
                                    timezone=None,
                                    venue=item.get('venue') or item.get('location') or None,
                                    city=None,
                                    country=None,
                                    latitude=None,
                                    longitude=None,
                                    category=None,
                                    subcategory=None,
                                    image=(item.get('image') if isinstance(item.get('image'), str) else None),
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
                    except Exception as ex:
                        logger.debug("Structured scrape JSON parse error: %s", ex)
        except Exception as ex:
            logger.debug("Structured endpoint exception: %s", ex)
    if structured_events:
        logger.info("scraperapi.structured events=%s query='%s'", len(structured_events), normalized_query)
        await cache.set(cache_key, structured_events, 300)
        await cache.set(last_good_key, structured_events, 900)
    return structured_events[:MAX_EVENTS]

    # Fallback to raw HTML approach (previous implementation)
    google_q = urllib.parse.quote_plus(normalized_query)
    target = f"https://www.google.com/search?q={google_q}&hl={hl}&gl={gl}"
    params = {"api_key": api_key, "url": target}

    html: Optional[str] = None
    timeouts = [8.0, 16.0]  # two attempts: fast then longer
    for attempt, t in enumerate(timeouts, start=1):
        try:
            async with httpx.AsyncClient(timeout=t, headers={"User-Agent": USER_AGENT}) as client:
                r = await client.get(base, params=params)
                if r.status_code == 429:
                    logger.warning("ScraperAPI fetch failed status=429 (rate limited) query='%s' attempt=%s", query, attempt)
                    # Set short cooldown
                    await cache.set(cooldown_key, True, 90)
                    # Return stale if available
                    stale = await cache.get(last_good_key)
                    if stale:
                        return stale
                    return []
                if r.status_code != 200:
                    logger.warning("ScraperAPI fetch failed status=%s body=%s", r.status_code, r.text[:160])
                    # Non-200: retry if attempt 1 else bail with stale
                    if attempt == len(timeouts):
                        stale = await cache.get(last_good_key)
                        if stale:
                            return stale
                        return []
                    continue
                html = r.text
                break
        except Exception as exc:  # noqa: BLE001
            logger.warning("ScraperAPI attempt=%s exception: %s", attempt, exc)
            if attempt == len(timeouts):
                stale = await cache.get(last_good_key)
                if stale:
                    return stale
                return []
            continue

    if not html:
        return []
    try:
        soup = BeautifulSoup(html, "html.parser")
    except Exception as exc:
        logger.error("BeautifulSoup parse error: %s", exc)
        return []

    # Google Events pack often uses role=listitem on cards; this can change.
    cards = soup.find_all("div", attrs={"role": "listitem"})
    if not cards:
        # Heuristic alternative: look for knowledge panel style container
        alt_cards = soup.select("div[aria-level] div.BNeawe")
        if alt_cards:
            cards = [c.parent for c in alt_cards if c.parent]
    events: List[Event] = []
    for c in cards[:60]:  # collect more; we'll cap later
        try:
            title_el = c.find("div", class_=lambda v: v and "BNeawe" in v and "AP7Wnd" in v)
            date_el = None
            # Find the first sibling div that looks like a date (heuristic)
            for div in c.find_all("div"):
                txt = (div.get_text(strip=True) or "")
                if DATE_RE.match(txt):
                    date_el = div
                    break
            link_el = c.find("a")
            title = title_el.get_text(strip=True) if title_el else None
            date_text = date_el.get_text(strip=True) if date_el else None
            link = link_el.get("href") if link_el else None
            if not title:
                continue
            # Basic normalization: id chooses link or title+index
            start_iso = None
            if date_text:
                start_iso = _normalize_date(date_text) or date_text
            events.append(Event(
                id=link or f"scraperapi:{len(events)}:{title[:30]}",
                source="scraperapi_google",
                name=title,
                description=None,
                url=link,
                start=start_iso,
                end=None,
                timezone=None,
                venue=None,
                city=None,
                country=None,
                latitude=None,
                longitude=None,
                category=None,
                subcategory=None,
                image=None,
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

    # Attempt minimal geocoding of first few events (heuristic: append "city" tokens from title)
    to_geocode: List[tuple[int, str]] = []
    for idx, ev in enumerate(events[:5]):
        # very naive extraction: look for ' in City' pattern or split last comma segment
        title_lower = ev.name.lower()
        candidate = None
        if ' in ' in title_lower:
            candidate = ev.name.split(' in ', 1)[-1].strip()
        elif ',' in ev.name:
            segs = [s.strip() for s in ev.name.split(',') if len(s.strip()) > 2]
            if segs:
                candidate = segs[-1]
        if candidate and 3 <= len(candidate) <= 60:
            to_geocode.append((idx, candidate))
    if to_geocode:
        tasks = [ _geocode_query_fragment(frag) for _, frag in to_geocode ]
        results = await asyncio.gather(*tasks)
        for (idx, _frag), loc in zip(to_geocode, results):
            if loc and events[idx].latitude is None:
                lat, lon = loc
                events[idx].latitude = lat
                events[idx].longitude = lon

    # Augment with JSON-LD events on the page (higher fidelity if present)
    jsonld = _jsonld_events_from_soup(soup)
    for obj in jsonld:
        try:
            title = obj.get('name') or obj.get('title')
            if not title:
                continue
            start_raw = obj.get('startDate') or obj.get('start_date') or obj.get('start_time') or obj.get('start')
            start_iso = None
            if isinstance(start_raw, str):
                # Try direct ISO parse or fallback to normalization
                start_iso = _normalize_date(start_raw) or start_raw
            link = obj.get('url') or obj.get('@id')
            ev = Event(
                id=link or f"scraperapi_jsonld:{len(events)}:{title[:30]}",
                source="scraperapi_jsonld",
                name=title,
                description=obj.get('description'),
                url=link,
                start=start_iso,
                end=obj.get('endDate') if isinstance(obj.get('endDate'), str) else None,
                timezone=None,
                venue=(obj.get('location', {}) or {}).get('name') if isinstance(obj.get('location'), dict) else None,
                city=None,
                country=None,
                latitude=None,
                longitude=None,
                category=None,
                subcategory=None,
                image=(obj.get('image') if isinstance(obj.get('image'), str) else None),
                price=None,
                capacity=None,
                organizer=None,
                is_tiered=None,
                min_price=None,
                max_price=None,
                currency=None,
                ticket_classes=None,
            )
            events.append(ev)
        except Exception:
            continue

    # Deduplicate by (name + start) heuristic keeping earliest
    dedup = {}
    for ev in events:
        key = (ev.name.lower(), ev.start or '')
        if key not in dedup:
            dedup[key] = ev
    events = list(dedup.values())
    # Filter again to those that look like real events if we have enough
    if len(events) > 5:
        filtered_objs = []
        for ev in events:
            has_date = bool(ev.start and len(ev.start) >= 4)
            banned = any(k in ev.name.lower() for k in ['calendar','ticketmaster','eventbrite','things to do','guide'])
            if has_date and not banned:
                filtered_objs.append(ev)
        if len(filtered_objs) >= 3:
            events = filtered_objs

    # Cap to MAX_EVENTS
    events = events[:MAX_EVENTS]

    logger.info("scraperapi.events parsed=%s geocoded=%s jsonld=%s query='%s'", len(events), sum(1 for e in events if e.latitude is not None), len(jsonld), query)
    # Cache only non-empty results for a short TTL (5 minutes)
    if events:
        await cache.set(cache_key, events, 300)
        await cache.set(last_good_key, events, 900)  # 15 min stale window
    return events
