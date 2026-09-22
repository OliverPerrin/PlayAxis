"""Explicit, quota-bounded local event search. No paid enrichment requests."""

import asyncio
import hashlib
from datetime import datetime, timezone, timedelta
from urllib.parse import urlparse
import httpx
from fastapi import HTTPException
from sqlalchemy import update
from sqlalchemy.exc import IntegrityError
from app.core.config import settings
from app.core.cache import cache
from app.db.session import SessionLocal
from app.models.participation import DiscoveryCache, ProviderUsage
from app.services.ticketmaster import (
    search as ticketmaster_search,
    detail as ticketmaster_detail,
)

_lock = asyncio.Lock()


def _aware(dt):
    return dt.replace(tzinfo=timezone.utc) if dt.tzinfo is None else dt


def organiser_links(raw, city, sport):
    """Search results are websites, never invented dated or mappable events."""
    items, seen = [], set()
    for row in raw.get("organic_results") or []:
        link = row.get("link") or ""
        parsed = urlparse(link)
        if (
            parsed.scheme not in {"http", "https"}
            or not parsed.hostname
            or link in seen
        ):
            continue
        seen.add(link)
        items.append(
            {
                "id": "organiser-" + hashlib.sha256(link.encode()).hexdigest()[:24],
                "name": row.get("title") or parsed.hostname,
                "url": link,
                "domain": parsed.hostname.removeprefix("www."),
                "description": row.get("snippet") or "",
                "search_area": city,
                "sport": sport,
            }
        )
    return items[:10]


def _cached(key):
    with SessionLocal() as db:
        row = db.get(DiscoveryCache, key)
        if row and datetime.now(timezone.utc) - _aware(row.stored_at) < timedelta(
            hours=24
        ):
            return row.data
    return None


def _store(key, data):
    with SessionLocal() as db:
        try:
            row = db.get(DiscoveryCache, key)
            if row:
                row.data = data
                row.stored_at = datetime.now(timezone.utc)
            else:
                db.add(
                    DiscoveryCache(
                        key=key, data=data, stored_at=datetime.now(timezone.utc)
                    )
                )
            db.query(DiscoveryCache).filter(
                DiscoveryCache.stored_at
                < datetime.now(timezone.utc) - timedelta(days=30)
            ).delete()
            db.commit()
        except IntegrityError:
            db.rollback()
            # A concurrent search may have inserted the same public snapshot.
            row = db.get(DiscoveryCache, key)
            if row is None:
                raise
            row.data = data
            row.stored_at = datetime.now(timezone.utc)
            db.commit()


def _reserve():
    key = "serpapi:" + datetime.now(timezone.utc).strftime("%Y-%m")
    with SessionLocal() as db:
        if not db.get(ProviderUsage, key):
            db.add(ProviderUsage(key=key, calls=0))
            try:
                db.commit()
            except IntegrityError:
                db.rollback()
        result = db.execute(
            update(ProviderUsage)
            .where(
                ProviderUsage.key == key,
                ProviderUsage.calls < settings.LOCAL_SEARCH_MONTHLY_LIMIT,
            )
            .values(calls=ProviderUsage.calls + 1)
        )
        db.commit()
        if result.rowcount != 1:
            raise HTTPException(
                503,
                "The free event-search allowance has been used for this month. Community sessions and saved plans are still available.",
            )


async def local_events(
    city,
    sport="sports",
    country="",
    tz="Europe/London",
    lat=None,
    lon=None,
    date_from=None,
    date_to=None,
):
    key = (
        "search:v2:"
        + hashlib.sha256(
            f"{city.strip().casefold()}:{country.casefold()}:{sport}:{tz}:{lat}:{lon}:{date_from}:{date_to}".encode()
        ).hexdigest()
    )
    found = await asyncio.to_thread(_cached, key)
    if found:
        return {**found, "cached": True}
    if settings.TICKETMASTER_API_KEY:
        try:
            result = await ticketmaster_search(
                city, sport, country, lat, lon, date_from, date_to, tz
            )
            if result["events"]:
                for item in result["events"]:
                    await asyncio.to_thread(_store, "event:" + item["id"], item)
                await asyncio.to_thread(_store, key, result)
                return result
        except HTTPException:
            pass
    if city in ["Your location", "this area"]:
        return {
            "events": [],
            "source": "Ticketmaster",
            "coverage": "No matching ticketed events in this area. Try searching by city to include other organisers.",
        }
    if not settings.SERPAPI_API_KEY:
        raise HTTPException(
            503,
            "External local-event search is not configured. You can still organise and join community sessions.",
        )
    async with _lock:
        found = await asyncio.to_thread(_cached, key)
        if found:
            return {**found, "cached": True}
        try:
            async with httpx.AsyncClient(timeout=22) as client:
                account = await cache.get("serp:free-status")
                if account is None:
                    response = await client.get(
                        "https://serpapi.com/account",
                        params={"api_key": settings.SERPAPI_API_KEY},
                    )
                    response.raise_for_status()
                    account = response.json()
                    await cache.set("serp:free-status", account, 3600)
                if float(account.get("plan_monthly_price", 0) or 0) > 0:
                    raise HTTPException(
                        503,
                        "This event-search key is not on a free plan. Community sessions remain available.",
                    )
                if (
                    int(
                        account.get(
                            "total_searches_left", account.get("plan_searches_left", 0)
                        )
                        or 0
                    )
                    <= 0
                ):
                    raise HTTPException(
                        503,
                        "The event provider’s free allowance is temporarily exhausted.",
                    )
                await asyncio.to_thread(_reserve)
                response = await client.get(
                    "https://serpapi.com/search.json",
                    params={
                        "api_key": settings.SERPAPI_API_KEY,
                        "engine": "google",
                        "q": f"{sport if sport != 'all' else 'local'} clubs organised events {city} {country}".strip(
                            ", "
                        ),
                        "hl": "en",
                        "gl": (
                            "uk"
                            if country in ["United Kingdom", "Ireland", ""]
                            else "us"
                        ),
                    },
                )
                response.raise_for_status()
                raw = response.json()
                if raw.get("error"):
                    raise HTTPException(
                        503,
                        "Local event search is temporarily unavailable. Please try later.",
                    )
        except (httpx.HTTPError, ValueError) as exc:
            raise HTTPException(
                503,
                "Local event search could not be reached. Please try again shortly.",
            ) from exc
        result = {
            "events": [],
            "organisers": organiser_links(raw, city, sport),
            "source": "Google Search via SerpAPI",
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "cached": False,
            "coverage": "Related organiser websites for your search. Check their calendars for dates, venues and entry details.",
        }
        await asyncio.to_thread(_store, key, result)
        return result


async def local_detail(id):
    with SessionLocal() as db:
        row = db.get(DiscoveryCache, "event:" + id)
        existing = row.data if row else None
        age = (
            (datetime.now(timezone.utc) - _aware(row.stored_at)).total_seconds()
            if row
            else None
        )
    if (
        id.startswith("tm-")
        and settings.TICKETMASTER_API_KEY
        and (age is None or age > 900)
    ):
        try:
            item = await ticketmaster_detail(id[3:])
            await asyncio.to_thread(_store, "event:" + id, item)
            return item
        except HTTPException as exc:
            if exc.status_code == 404:
                raise
            if existing:
                return {**existing, "stale": True}
            raise
    if existing:
        return existing
    raise HTTPException(
        404,
        "This listing is no longer cached. Search local events again to refresh it.",
    )
