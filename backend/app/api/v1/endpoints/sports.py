
from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from app.services.sportsdb import unified_events, list_all_sports, search_team, get_team_next
from app.schemas.sports import (
    SportsListResponse, UnifiedEventsResponse, PlayersResponse, ComparePlayerRequest,
    ComparePlayerResponse, CompareMetric
)

router = APIRouter()

@router.get("/", response_model=SportsListResponse)
async def get_sports():
    try:
        sports = await list_all_sports()
        return {"sports": sports}
    except Exception as e:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{sport}", response_model=UnifiedEventsResponse)
async def read_sports_events(sport: str):
    """Return upcoming and recent events for a given sport key (NFL, NBA, EPL, etc)."""
    try:
        data = await unified_events(sport)
        return data
    except Exception as e:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/teams/search", response_model=PlayersResponse)
async def search_teams(q: str = Query(..., min_length=2, description="Team name search fragment")):
    try:
        teams = await search_team(q)
        # Reuse PlayersResponse schema structure for simplicity (teams vs players)
        return {"players": teams}
    except Exception as e:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/teams/{team_id}/events")
async def team_events(team_id: str):
    try:
        upcoming = await get_team_next(team_id)
        return {"team_id": team_id, "upcoming": upcoming}
    except Exception as e:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/compare", response_model=ComparePlayerResponse)
async def compare_player(req: ComparePlayerRequest):
    # Placeholder: in absence of player stats endpoint from TheSportsDB for generic metrics,
    # synthesize comparison using provided user metrics vs dummy zero baseline.
    metrics = []
    for k, v in req.user_metrics.items():
        try:
            user_val = float(v)
        except Exception:  # noqa: BLE001
            user_val = 0.0
        metrics.append(CompareMetric(metric=k, player_value=0.0, user_value=user_val, percentile=None))
    return ComparePlayerResponse(
        player_id=req.player_id,
        player_name=None,
        sport=req.sport,
        metrics=metrics
    )
