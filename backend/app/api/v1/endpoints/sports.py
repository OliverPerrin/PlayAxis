from fastapi import APIRouter, Query, HTTPException
from app.services.public_data import SPORTS, sports_events, standings, get_json
from app.core.config import settings

router = APIRouter()


@router.get("")
@router.get("/")
async def catalogue():
    return {"sports": SPORTS}


@router.get("/teams/search")
async def teams(q: str = Query(..., min_length=2, max_length=100)):
    raw = await get_json(
        f"https://www.thesportsdb.com/api/v1/json/{settings.THESPORTSDB_API_KEY or '123'}/searchteams.php",
        {"t": q},
        ttl=3600,
    )
    return {"teams": raw.get("teams") or [], "players": raw.get("teams") or []}


async def lookup_team(team_id):
    raw = await get_json(
        f"https://www.thesportsdb.com/api/v1/json/{settings.THESPORTSDB_API_KEY or '123'}/lookupteam.php",
        {"id": team_id},
        ttl=86400,
    )
    rows = raw.get("teams") or []
    if not rows:
        raise HTTPException(404, "Team not found")
    return rows[0]


@router.get("/teams/{team_id}")
async def team_profile(team_id: int):
    return {"team": await lookup_team(team_id)}


@router.get("/teams/{team_id}/events")
async def team_events(team_id: int):
    import re, unicodedata
    from app.services.public_data import sportsdb_event

    team = await lookup_team(team_id)

    def name(value):
        value = (
            unicodedata.normalize("NFKD", value)
            .encode("ascii", "ignore")
            .decode()
            .casefold()
        )
        return re.sub(r"\W+", "", re.sub(r"\b(fc|afc|cf|the)\b", "", value))

    names = {name(team.get("strTeam", ""))} | {
        name(t) for t in (team.get("strAlternate") or "").split(",") if t
    }
    league = {
        "4328": "epl",
        "4387": "nba",
        "4391": "nfl",
        "4380": "nhl",
        "4424": "mlb",
        "4331": "bundesliga",
    }.get(team.get("idLeague"))
    if league:
        try:
            snapshot = await sports_events(league)
            rows = [
                e
                for e in snapshot["upcoming"]
                if name(e.get("home_team") or "") in names
                or name(e.get("away_team") or "") in names
            ]
            if rows:
                return {
                    "team_id": team_id,
                    "team": team,
                    "upcoming": rows,
                    "source": snapshot["source"],
                    "coverage": snapshot["coverage"],
                    "limited": snapshot["limited"],
                }
        except HTTPException:
            pass
    raw = await get_json(
        f"https://www.thesportsdb.com/api/v1/json/{settings.THESPORTSDB_API_KEY or '123'}/eventsnext.php",
        {"id": team_id},
        ttl=900,
    )
    return {
        "team_id": team_id,
        "team": team,
        "upcoming": [sportsdb_event(e) for e in raw.get("events") or []],
        "source": "TheSportsDB",
        "coverage": "Limited next-fixture sample.",
        "limited": True,
    }


@router.get("/{sport}/standings")
async def league_standings(sport: str):
    return await standings(sport)


@router.get("/{sport}")
async def league_events(sport: str):
    return await sports_events(sport)


@router.post("/compare")
async def legacy_comparison():
    raise HTTPException(
        410,
        "Unsupported player estimates have been removed. Compare recorded workouts on the Compare page.",
    )
