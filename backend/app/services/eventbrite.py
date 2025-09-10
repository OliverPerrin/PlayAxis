import httpx
import logging
from typing import Optional, List
from app.core.config import settings
from app.models.user import User

logger = logging.getLogger(__name__)

async def get_eventbrite_events(query: str,
                                lat: float | None = None,
                                lon: float | None = None,
                                current_user: User | None = None) -> dict:
    """
    Returns raw Eventbrite search response (original behavior).
    """
    try:
        # Prefer user-specific OAuth token, then public, then private token
        token = (
            (getattr(current_user, "eventbrite_access_token", None) if current_user else None)
            or settings.EVENTBRITE_PUBLIC_TOKEN
            or settings.EVENTBRITE_PRIVATE_TOKEN
        )
        if not token:
            logger.warning("Eventbrite: missing token")
            return {"events": []}

        headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/json",
        }
        params: dict = {
            # If query is empty or None, omit 'q' to get all events
            "expand": "venue,ticket_availability",
            "sort_by": "date",
        }
        if query:
            params["q"] = query
        if lat is not None and lon is not None:
            params.update({
                "location.latitude": lat,
                "location.longitude": lon,
                "location.within": "50km",
            })
        else:
            # Avoid over-restrictive "online only"; use a broad default region to return results
            params["location.address"] = "United States"

        base = settings.EVENTBRITE_API_URL
        url = f"{base}/events/search/"
        async with httpx.AsyncClient(timeout=30.0) as client:
            r = await client.get(url, headers=headers, params=params)
            if r.status_code != 200:
                # Retry with token as query parameter (some setups require this)
                params_with_token = dict(params)
                params_with_token["token"] = token
                # Also try path without trailing slash as a fallback
                alt_url = f"{base}/events/search"
                r2 = await client.get(alt_url, params=params_with_token)
                if r2.status_code != 200:
                    logger.error(f"Eventbrite {r.status_code} params={params} body={r.text[:300]}")
                    logger.error(f"Eventbrite retry {r2.status_code} params={params_with_token} body={r2.text[:300]}")
                    return {"events": []}
                data = r2.json()
            else:
                data = r.json()
            for ev in data.get("events", []):
                venue = ev.get("venue") or {}
                for key in ("latitude", "longitude"):
                    if key in venue and venue[key] not in (None, ""):
                        try:
                            venue[key] = float(venue[key])
                        except Exception:
                            venue[key] = None
            return data
    except Exception as exc:
        logger.exception(f"Eventbrite API exception: {exc}")
        return {"events": []}


# ---- New code below: normalization + wrapper ----
from app.schemas.event import Event  # imported here to avoid circulars

def _normalize_eventbrite_event(raw: dict) -> Event | None:
    try:
        venue = raw.get("venue") or {}
        address = venue.get("address") or {}
        return Event(
            id=str(raw.get("id")),
            source="eventbrite",
            name=(raw.get("name") or {}).get("text") or "Untitled",
            description=raw.get("summary") or (raw.get("description") or {}).get("text"),
            url=raw.get("url"),
            start=(raw.get("start") or {}).get("utc"),
            end=(raw.get("end") or {}).get("utc"),
            timezone=(raw.get("start") or {}).get("timezone"),
            venue=venue.get("name"),
            city=address.get("city"),
            country=address.get("country"),
            latitude=venue.get("latitude"),
            longitude=venue.get("longitude"),
            category=(raw.get("category") or {}).get("short_name"),
            image=(raw.get("logo") or {}).get("url"),
            price=None,  # Could augment later
        )
    except Exception as e:
        logger.debug(f"Failed to normalize eventbrite event id={raw.get('id')} err={e}")
        return None

async def fetch_eventbrite_events(query: str = "sports",
                                  page: int = 1,
                                  size: int = 20,
                                  lat: float | None = None,
                                  lon: float | None = None,
                                  current_user: User | None = None) -> List[Event]:
    """
    Wrapper expected by services/events.py (aggregator).
    Produces a list of normalized Event objects.
    """
    raw = await get_eventbrite_events(query=query, lat=lat, lon=lon, current_user=current_user)
    out: List[Event] = []
    for ev in raw.get("events", []):
        norm = _normalize_eventbrite_event(ev)
        if norm:
            out.append(norm)
    if size:
        out = out[:size]
    return out

# ---- OAuth helpers ----
async def exchange_eventbrite_code(code: str, redirect_uri: str | None = None) -> dict:
    """Exchange authorization code for access & refresh tokens."""
    client_id = settings.EVENTBRITE_CLIENT_ID or settings.EVENTBRITE_API_KEY
    client_secret = settings.EVENTBRITE_CLIENT_SECRET
    if not client_id or not client_secret:
        raise RuntimeError("Eventbrite OAuth not configured (client id/secret missing)")
    redirect_uri = redirect_uri or settings.EVENTBRITE_REDIRECT_URI
    if not redirect_uri:
        raise RuntimeError("Eventbrite redirect URI not configured")
    form = {
        "grant_type": "authorization_code",
        "client_id": client_id,
        "client_secret": client_secret,
        "code": code,
        "redirect_uri": redirect_uri,
    }
    async with httpx.AsyncClient(timeout=20.0) as client:
        r = await client.post(settings.EVENTBRITE_OAUTH_TOKEN_URL, data=form, headers={"Content-Type": "application/x-www-form-urlencoded"})
        if r.status_code != 200:
            logger.error(f"Eventbrite token exchange failed {r.status_code} body={r.text[:400]}")
            raise RuntimeError("Eventbrite token exchange failed")
        return r.json()

async def refresh_eventbrite_token(refresh_token: str) -> dict:
    client_id = settings.EVENTBRITE_CLIENT_ID or settings.EVENTBRITE_API_KEY
    client_secret = settings.EVENTBRITE_CLIENT_SECRET
    form = {
        "grant_type": "refresh_token",
        "client_id": client_id,
        "client_secret": client_secret,
        "refresh_token": refresh_token,
    }
    async with httpx.AsyncClient(timeout=20.0) as client:
        r = await client.post(settings.EVENTBRITE_OAUTH_TOKEN_URL, data=form, headers={"Content-Type": "application/x-www-form-urlencoded"})
        if r.status_code != 200:
            logger.error(f"Eventbrite refresh failed {r.status_code} body={r.text[:400]}")
            raise RuntimeError("Eventbrite token refresh failed")
        return r.json()