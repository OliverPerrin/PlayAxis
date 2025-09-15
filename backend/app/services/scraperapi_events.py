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

    google_q = urllib.parse.quote_plus(query)
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
    for c in cards[:40]:  # soft cap
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

    logger.info("scraperapi.events parsed=%s geocoded=%s query='%s'", len(events), sum(1 for e in events if e.latitude is not None), query)
    # Cache only non-empty results for a short TTL (5 minutes)
    if events:
        await cache.set(cache_key, events, 300)
        await cache.set(last_good_key, events, 900)  # 15 min stale window
    return events
