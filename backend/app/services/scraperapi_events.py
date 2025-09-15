import logging
import httpx
from typing import List, Optional
from bs4 import BeautifulSoup
from app.core.config import settings
from app.schemas.event import Event
from app.core.cache import cache
import urllib.parse
import re

logger = logging.getLogger(__name__)

USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"

DATE_RE = re.compile(r"(Mon|Tue|Wed|Thu|Fri|Sat|Sun),? ?[A-Z][a-z]{2} \d{1,2}.*")

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

    cached = await cache.get(cache_key)
    if cached is not None:
        return cached

    google_q = urllib.parse.quote_plus(query)
    target = f"https://www.google.com/search?q={google_q}&hl={hl}&gl={gl}"
    params = {"api_key": api_key, "url": target}

    html: Optional[str] = None
    try:
        async with httpx.AsyncClient(timeout=20.0, headers={"User-Agent": USER_AGENT}) as client:
            r = await client.get(base, params=params)
            if r.status_code != 200:
                logger.warning("ScraperAPI fetch failed status=%s body=%s", r.status_code, r.text[:160])
                return []
            html = r.text
    except Exception as exc:  # noqa: BLE001
        logger.exception("ScraperAPI request exception: %s", exc)
        return []

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
                # Keep raw; optional naive conversion if recognizable (skipped for simplicity)
                start_iso = date_text
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

    logger.info("scraperapi.events parsed=%s query='%s'", len(events), query)
    # Cache only non-empty results for a short TTL (5 minutes)
    if events:
        await cache.set(cache_key, events, 300)
    return events
