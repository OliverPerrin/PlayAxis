import httpx
from typing import List, Dict
from datetime import datetime, timedelta

from app.core.config import settings
from app.db.session import SessionLocal
from app.models.event import Event as EventModel

TM_BASE = "https://app.ticketmaster.com/discovery/v2"

def fetch_ticketmaster_events(
    keyword: str = "sports",
    start: datetime = None,
    days_ahead: int = 7,
) -> List[Dict]:
    if start is None:
        start = datetime.utcnow()
    end = start + timedelta(days=days_ahead)

    params = {
        "apikey": settings.ticketmaster_api_key,
        "keyword": keyword,
        "startDateTime": start.isoformat() + "Z",
        "endDateTime": end.isoformat() + "Z",
        "size": 100,
        "sort": "date,asc",
    }

    with httpx.Client(timeout=10) as client:
        resp = client.get(f"{TM_BASE}/events.json", params=params)
        resp.raise_for_status()
        data = resp.json()
    return data.get("_embedded", {}).get("events", [])

def normalize_and_save_ticketmaster(raws: List[Dict], niche: str):
    db = SessionLocal()
    for e in raws:
        start = datetime.fromisoformat(e["dates"]["start"]["dateTime"])
        end = None
        if e["dates"]["start"].get("dateTime"):
            end = start + timedelta(hours=2)  # TM doesn’t always give end time
        evt = EventModel(
            title=e["name"][:256],
            description=e.get("info") or e.get("pleaseNote"),
            start_time=start,
            end_time=end,
            url=e["url"],
            source="ticketmaster",
            niche=niche,
        )
        db.add(evt)
    db.commit()
    db.close()

