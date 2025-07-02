import httpx
from typing import List, Dict
from datetime import datetime

from app.core.config import settings
from app.db.session import SessionLocal
from app.models.event import Event as EventModel

MM_BASE = "https://api.meetup.com"

def fetch_meetup_events(group_urlname: str = "hiking", days_ahead: int = 7) -> List[Dict]:
    # Meetup’s events endpoint returns events for a specific group
    url = f"{MM_BASE}/{group_urlname}/events"
    params = {
        "page": 50,
        "no_later_than": (datetime.utcnow()).isoformat() + "Z",
        "no_earlier_than": (datetime.utcnow()).isoformat() + "Z",
    }
    headers = {"Authorization": f"Bearer {settings.meetup_api_key}"}

    resp = httpx.get(url, params=params, headers=headers, timeout=10)
    resp.raise_for_status()
    return resp.json()

def normalize_and_save_meetup(raws: List[Dict], niche: str):
    db = SessionLocal()
    for e in raws:
        start = datetime.fromisoformat(e["local_date"] + "T" + e["local_time"])
        end = None
        evt = EventModel(
            title=e["name"][:256],
            description=e.get("description"),
            start_time=start,
            end_time=end,
            url=e.get("link"),
            source="meetup",
            niche=niche,
        )
        db.add(evt)
    db.commit()
    db.close()

