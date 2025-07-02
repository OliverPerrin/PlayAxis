import httpx
import logging
from datetime import datetime, timezone, timedelta
from typing import List, Dict

from app.core.config import settings
from app.db.session import SessionLocal
from app.models.event import Event as EventModel

logger = logging.getLogger("sportsradar")

# RapidAPI host and base URL
RAPIDAPI_HOST = "sportsradar-sportsbook-api.p.rapidapi.com"
BASE_URL = "https://sportsradar-sportsbook-api.p.rapidapi.com/api/v1/sportsradar/allsports"

def fetch_sportsradar_events(
    sport: str = "soccer",
    start_date: datetime | None = None,
    days_ahead: int = 7,
) -> List[Dict]:
    """
    Fetches scheduled events from Sportsradar Sportsbook API on RapidAPI.
    Returns the raw JSON list of events.
    """
    if start_date is None:
        start_date = datetime.now(timezone.utc)
    end_date = start_date + timedelta(days=days_ahead)

    url = BASE_URL
    params = {
        "fromDate": start_date.strftime("%Y-%m-%d"),
        "toDate":   end_date.strftime("%Y-%m-%d"),
    }
    headers = {
        "X-RapidAPI-Key": settings.rapidapi_key,
        "X-RapidAPI-Host": RAPIDAPI_HOST,
    }

    resp = httpx.get(url, headers=headers, params=params, timeout=10)
    try:
        resp.raise_for_status()
    except httpx.HTTPStatusError as e:
        logger.error("Sportsradar API error %s: %s", e.response.status_code, e.response.text)
        raise

    data = resp.json()
    logger.debug("Sportsradar raw response: %s", data)
    # adjust this if the payload nests events under another key
    events = data.get("data", data.get("events", []))
    return events

def normalize_and_save_sportsradar(raw_events: List[Dict], niche: str):
    """
    Converts the raw Sportsradar event dicts into our EventModel and saves to Postgres.
    """
    db = SessionLocal()
    saved = 0

    for e in raw_events:
        # Example field mappings — update these to match the actual JSON keys:
        #   e["startDateTime"], e["homeTeam"], e["awayTeam"], e["eventUrl"], etc.
        try:
            start_str = e.get("startDateTime") or e.get("scheduleDateTime")
            if not start_str:
                logger.warning("Skipping event with no start time: %r", e)
                continue

            start = datetime.fromisoformat(start_str)
            # build a title from teams or a generic field
            home = e.get("homeTeam", "")
            away = e.get("awayTeam", "")
            if home and away:
                title = f"{away} at {home}"
            else:
                title = e.get("eventName") or e.get("name") or "Untitled Event"

            url = e.get("eventUrl") or e.get("url")

            evt = EventModel(
                title=title[:256],
                description=e.get("description"),
                start_time=start,
                end_time=None,           # fill if the API provides an end time
                url=url,
                source="sportsradar",
                niche=niche,
            )
            db.add(evt)
            saved += 1
        except Exception:
            logger.exception("Failed to normalize event: %r", e)
            continue

    db.commit()
    db.close()
    logger.info("Saved %d Sportsradar events (niche=%s)", saved, niche)

