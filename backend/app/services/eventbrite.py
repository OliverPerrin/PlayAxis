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
        # Prefer user OAuth token, then PRIVATE token, then PUBLIC token (public often not valid for search API)
        token = (
            (getattr(current_user, "eventbrite_access_token", None) if current_user else None)
            or settings.EVENTBRITE_PRIVATE_TOKEN
            or settings.EVENTBRITE_PUBLIC_TOKEN
        )
        token_used = (
            "user" if (current_user and getattr(current_user, "eventbrite_access_token", None)) else
            ("private" if settings.EVENTBRITE_PRIVATE_TOKEN and token == settings.EVENTBRITE_PRIVATE_TOKEN else
             ("public" if settings.EVENTBRITE_PUBLIC_TOKEN and token == settings.EVENTBRITE_PUBLIC_TOKEN else "unknown"))
        )
        if not token:
            logger.warning("Eventbrite: missing token")
            return {"events": []}

        headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/json",
        }
        token_fp = (token[:4] + "..." + token[-4:]) if token and len(token) > 12 else "token"
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

        base = settings.EVENTBRITE_API_URL.rstrip("/")
        url = f"{base}/events/search/"
        logger.debug(f"Eventbrite debug: base={base} url={url} token_used={token_used} token_fp={token_fp} params_keys={list(params.keys())}")
        async with httpx.AsyncClient(timeout=30.0) as client:
            r = await client.get(url, headers=headers, params=params)
            # Fallback sequence: (1) alt path + token query param, (2) if initial token was public try private token
            if r.status_code != 200:
                # First retry with token as query param & alt path
                params_with_token = dict(params)
                params_with_token["token"] = token
                alt_url = f"{base}/events/search"  # without trailing slash
                r2 = await client.get(alt_url, params=params_with_token)
                if r2.status_code == 200:
                        data = r2.json()
                else:
                    # If both attempts 404, attempt organization events fallback
                    if r.status_code == 404 and r2.status_code == 404:
                        fallback = await _fallback_org_events(client, token, headers)
                        if fallback:
                            logger.info("Eventbrite: using organization events fallback (search unauthorized)")
                            return fallback
                        # If we used the public token and have a private token available, try again with private
                        if token_used == "public" and settings.EVENTBRITE_PRIVATE_TOKEN:
                            private_headers = {
                                "Authorization": f"Bearer {settings.EVENTBRITE_PRIVATE_TOKEN}",
                                "Accept": "application/json",
                            }
                            r3 = await client.get(url, headers=private_headers, params=params)
                            if r3.status_code == 200:
                                logger.info("Eventbrite: public token failed (status %s), private token succeeded", r.status_code)
                                data = r3.json()
                            else:
                                # Final attempt alt path with private token as query param
                                params_private = dict(params)
                                params_private["token"] = settings.EVENTBRITE_PRIVATE_TOKEN
                                r4 = await client.get(alt_url, params=params_private)
                                if r4.status_code == 200:
                                    logger.info("Eventbrite: private token alt-path succeeded after public failures")
                                    data = r4.json()
                                else:
                                    logger.error(
                                        f"Eventbrite failures initial={r.status_code} alt={r2.status_code} priv1={r3.status_code} privAlt={r4.status_code} token_used={token_used} params={params} body_init={r.text[:160]} body_priv={r3.text[:160]}"
                                    )
                                    return {"events": []}
                        else:
                            logger.error(
                                f"Eventbrite failure status={r.status_code} alt_status={r2.status_code} token_used={token_used} params={params} body={r.text[:200]}"
                            )
                            return {"events": []}
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


async def _fallback_org_events(client: httpx.AsyncClient, token: str, headers: dict) -> dict | None:
    """Attempt to list events via organization endpoint when /events/search is not accessible.
    Returns dict shaped similarly with an 'events' list if successful, else None."""
    try:
        # Fetch user to get organization id
        user_resp = await client.get(f"{settings.EVENTBRITE_API_URL}/users/me/", headers=headers)
        if user_resp.status_code != 200:
            return None
        user_json = user_resp.json()
        orgs = user_json.get("organizations", []) or []
        org_id = None
        if orgs:
            org_id = orgs[0].get("id")
        if not org_id:
            return None
        ev_resp = await client.get(f"{settings.EVENTBRITE_API_URL}/organizations/{org_id}/events/", headers=headers, params={"expand": "venue,ticket_availability"})
        if ev_resp.status_code != 200:
            return None
        data = ev_resp.json()
        # Normalize shape to match search result top-level 'events'
        if isinstance(data, dict) and "events" in data:
            return data
        return {"events": data.get("events", [])}
    except Exception:
        return None