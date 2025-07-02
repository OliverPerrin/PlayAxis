from fastapi import APIRouter, HTTPException, Query
import logging
from traceback import format_exc

from app.services.ticketmaster    import fetch_ticketmaster_events, normalize_and_save_ticketmaster
from app.services.meetup          import fetch_meetup_events, normalize_and_save_meetup
from app.services.sportsradar import (
    fetch_sportsradar_events,
    normalize_and_save_sportsradar,
)

logger = logging.getLogger("importer")
router = APIRouter(prefix="/import", tags=["import"])

@router.post("/ticketmaster")
def import_ticketmaster(query: str = Query("sports"), days: int = Query(7), niche: str = Query("General")):
    try:
        raws = fetch_ticketmaster_events(keyword=query, days_ahead=days)
        normalize_and_save_ticketmaster(raws, niche=niche)
        return {"imported": len(raws)}
    except Exception as exc:
        tb = format_exc()
        logger.error(tb)
        raise HTTPException(status_code=500, detail=tb)

@router.post("/meetup")
def import_meetup(group: str = Query("hiking"), days: int = Query(7), niche: str = Query("Hiking")):
    try:
        raws = fetch_meetup_events(group_urlname=group, days_ahead=days)
        normalize_and_save_meetup(raws, niche=niche)
        return {"imported": len(raws)}
    except Exception as exc:
        tb = format_exc()
        logger.error(tb)
        raise HTTPException(status_code=500, detail=tb)


@router.post("/sportsradar")
def import_sportsradar(
    sport: str = Query("soccer", description="Sport slug (e.g. soccer, nba)"),
    days:  int  = Query(7,       description="Days ahead to fetch"),
    niche: str = Query("Soccer", description="Niche tag for saved events"),
):
    try:
        raw_events = fetch_sportsradar_events(sport=sport, days_ahead=days)
        normalize_and_save_sportsradar(raw_events, niche=niche)
        return {"imported": len(raw_events)}
    except Exception as exc:
        logger.error("Sportsradar import failed: %s", exc)
        detail = format_exc()
        raise HTTPException(status_code=500, detail=detail)
    
