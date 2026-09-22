import asyncio
import time
from datetime import datetime, timezone, timedelta, time as day_time
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError
import httpx
from fastapi import HTTPException
from app.core.config import settings
from app.core.cache import cache

_lock = asyncio.Lock()
_next = 0.0


async def search(
    city,
    sport="sports",
    country="",
    lat=None,
    lon=None,
    date_from=None,
    date_to=None,
    tz="UTC",
):
    if not settings.TICKETMASTER_API_KEY:
        raise HTTPException(503, "Local event listings are not configured")
    params = {
        "apikey": settings.TICKETMASTER_API_KEY,
        "city": city,
        "size": 100,
        "sort": "date,asc",
        "startDateTime": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    }
    if lat is not None and lon is not None:
        params.pop("city", None)
        params.update(latlong=f"{lat},{lon}", radius=30, unit="km")
    if sport == "music":
        params["classificationName"] = "music"
    elif sport == "arts":
        params["classificationName"] = "arts & theatre"
    elif sport not in ["all", "gaming", "chess"]:
        params["classificationName"] = "sports"
    if sport not in ["sports", "all", "music", "arts"]:
        params["keyword"] = sport
    try:
        zone = ZoneInfo(tz)
    except (ZoneInfoNotFoundError, ValueError):
        zone = timezone.utc
    if date_from:
        start = datetime.combine(date_from, day_time.min, zone).astimezone(timezone.utc)
        params["startDateTime"] = max(start, datetime.now(timezone.utc)).strftime(
            "%Y-%m-%dT%H:%M:%SZ"
        )
    if date_to:
        end = datetime.combine(
            date_to + timedelta(days=1), day_time.min, zone
        ).astimezone(timezone.utc) - timedelta(seconds=1)
        params["endDateTime"] = end.strftime("%Y-%m-%dT%H:%M:%SZ")
    countries = {
        "United Kingdom": "GB",
        "United States": "US",
        "United States of America": "US",
        "Canada": "CA",
        "Ireland": "IE",
        "Australia": "AU",
        "France": "FR",
        "Germany": "DE",
        "Spain": "ES",
    }
    if country in countries:
        params["countryCode"] = countries[country]
    global _next
    async with _lock:
        await asyncio.sleep(max(0, _next - time.monotonic()))
        try:
            async with httpx.AsyncClient(timeout=18) as client:
                response = await client.get(
                    "https://app.ticketmaster.com/discovery/v2/events.json",
                    params=params,
                )
            _next = time.monotonic() + 0.6
            response.raise_for_status()
            raw = response.json()
        except (httpx.HTTPError, ValueError) as exc:
            raise HTTPException(
                503, "Ticketed event listings are temporarily unavailable."
            ) from exc
    items = [
        normalize(row, city, country, sport)
        for row in (raw.get("_embedded") or {}).get("events", [])
    ]
    return {
        "events": items,
        "total": raw.get("page", {}).get("totalElements", len(items)),
        "source": "Ticketmaster",
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "cached": False,
        "coverage": "Ticketed events near the selected city. Availability and entry details are confirmed by the organiser.",
    }


def normalize(row, city="", country="", sport="sports"):
    dates = row.get("dates", {})
    start = dates.get("start", {})
    venues = row.get("_embedded", {}).get("venues") or [{}]
    venue = venues[0]
    coords = venue.get("location") or {}
    images = sorted(row.get("images") or [], key=lambda i: abs(i.get("width", 0) - 900))
    prices = row.get("priceRanges") or []
    try:
        lat = float(coords["latitude"])
        lon = float(coords["longitude"])
    except (KeyError, ValueError, TypeError):
        lat = lon = None
    categories = row.get("classifications") or [{}]
    item = {
        "id": "tm-" + row["id"],
        "name": row["name"],
        "title": row["name"],
        "description": row.get("info") or row.get("pleaseNote"),
        "url": row.get("url"),
        "start": (
            start.get("dateTime")
            if not any(start.get(flag) for flag in ["timeTBA", "dateTBA", "dateTBD"])
            else None
        ),
        "date_text": (
            (
                "Date to be confirmed"
                if start.get("dateTBD") or start.get("dateTBA")
                else start.get("localDate")
            )
            if not start.get("dateTime")
            or start.get("timeTBA")
            or start.get("dateTBD")
            or start.get("dateTBA")
            else None
        ),
        "venue": venue.get("name"),
        "city": venue.get("city", {}).get("name") or city,
        "country": venue.get("country", {}).get("name") or country,
        "latitude": lat,
        "longitude": lon,
        "source": "Ticketmaster",
        "sport": categories[0].get("genre", {}).get("name") or sport,
        "category": categories[0].get("segment", {}).get("name"),
        "image": images[0]["url"] if images else None,
        "status": dates.get("status", {}).get("code"),
        "price": (
            f"{prices[0].get('currency','')} {prices[0].get('min')} to {prices[0].get('max')}"
            if prices
            else None
        ),
        "event_type": "external",
    }
    return item


async def detail(id):
    from urllib.parse import quote

    key = "ticketmaster-detail:" + id
    existing = await cache.get(key)
    if existing:
        return existing
    global _next
    async with _lock:
        await asyncio.sleep(max(0, _next - time.monotonic()))
        try:
            async with httpx.AsyncClient(timeout=18) as client:
                response = await client.get(
                    "https://app.ticketmaster.com/discovery/v2/events/"
                    + quote(id, safe="")
                    + ".json",
                    params={"apikey": settings.TICKETMASTER_API_KEY},
                )
            _next = time.monotonic() + 0.6
            if response.status_code == 404:
                raise HTTPException(404, "The organiser listing is no longer available")
            response.raise_for_status()
            result = normalize(response.json())
            await cache.set(key, result, 900)
            return result
        except (httpx.HTTPError, ValueError, KeyError) as exc:
            raise HTTPException(
                503, "The organiser listing could not be refreshed just now."
            ) from exc
