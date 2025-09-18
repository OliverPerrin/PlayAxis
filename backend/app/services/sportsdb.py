import httpx
import logging
from typing import List, Optional, Dict, Any
from app.core.config import settings
from app.core.cache import cache
import asyncio

logger = logging.getLogger(__name__)

BASE_URL_V1 = "https://www.thesportsdb.com/api/v1/json"
API_KEY_FALLBACK = "123"  # free key

TTL_SHORT = 120  # 2 min for volatile endpoints (next events)
TTL_LONG = 3600  # 1 hour for static lists

SPORT_ALIAS = {
    "nfl": ("American Football", "NFL"),
    "nba": ("Basketball", "NBA"),
    "mlb": ("Baseball", "MLB"),
    "nhl": ("Ice Hockey", "NHL"),
    "epl": ("Soccer", "English Premier League"),
    "soccer": ("Soccer", None),
}

def _api_key() -> str:
    # Optionally add a new setting later (THESPORTSDB_API_KEY); fallback to rapid key if reused
    key = getattr(settings, 'THESPORTSDB_API_KEY', None) or settings.X_RapidAPI_KEY or API_KEY_FALLBACK
    return key or API_KEY_FALLBACK

async def _get_json(path: str, params: Optional[Dict[str, Any]] = None, ttl: int = TTL_SHORT) -> Any:
    key = f"sportsdb:{path}:{params}".lower()
    cached = await cache.get(key)
    if cached is not None:
        return cached
    url = f"{BASE_URL_V1}/{_api_key()}/{path}"
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            r = await client.get(url, params=params)
            if r.status_code == 429:
                logger.warning("TheSportsDB rate limit 429 path=%s", path)
                # store empty short to dampen repeat hits
                await cache.set(key, None, 30)
                return None
            if r.status_code != 200:
                logger.error("TheSportsDB error status=%s body=%s", r.status_code, r.text[:200])
                await cache.set(key, None, 30)
                return None
            data = r.json()
            await cache.set(key, data, ttl)
            return data
    except Exception as e:
        logger.error("TheSportsDB exception path=%s err=%s", path, e)
        await cache.set(key, None, 30)
        return None

def _norm_event(ev: Dict[str, Any]) -> Dict[str, Any]:
    if not isinstance(ev, dict):
        return {}
    return {
        "id": ev.get('idEvent') or ev.get('id'),
        "sport": ev.get('strSport'),
        "league": ev.get('strLeague'),
        "season": ev.get('strSeason'),
        "round": ev.get('intRound'),
        "date": ev.get('dateEvent') or ev.get('dateEventLocal'),
        "time": ev.get('strTime') or ev.get('strTimeLocal'),
        "timestamp": ev.get('strTimestamp'),
        "home_team": ev.get('strHomeTeam'),
        "away_team": ev.get('strAwayTeam'),
        "home_score": ev.get('intHomeScore'),
        "away_score": ev.get('intAwayScore'),
        "venue": ev.get('strVenue'),
        "city": ev.get('strCity'),
        "country": ev.get('strCountry'),
        "tv": ev.get('strTVStation'),
        "thumbnail": ev.get('strThumb') or ev.get('strPoster'),
        "video": ev.get('strVideo'),
        "status": ev.get('strStatus'),
    }

async def list_all_sports() -> List[Dict[str, Any]]:
    data = await _get_json('all_sports.php', ttl=TTL_LONG)
    sports = data.get('sports') if isinstance(data, dict) else None
    return sports or []

async def get_next_events_for_league(league_id: str) -> List[Dict[str, Any]]:
    # eventsnextleague.php?id=4328
    data = await _get_json('eventsnextleague.php', params={"id": league_id}, ttl=TTL_SHORT)
    events = data.get('events') if isinstance(data, dict) else None
    return [_norm_event(e) for e in events or []]

async def get_previous_events_for_league(league_id: str) -> List[Dict[str, Any]]:
    data = await _get_json('eventspastleague.php', params={"id": league_id}, ttl=TTL_SHORT)
    events = data.get('events') if isinstance(data, dict) else None
    return [_norm_event(e) for e in events or []]

async def get_team_next(team_id: str) -> List[Dict[str, Any]]:
    data = await _get_json('eventsnext.php', params={"id": team_id}, ttl=TTL_SHORT)
    events = data.get('events') if isinstance(data, dict) else None
    return [_norm_event(e) for e in events or []]

async def search_team(name: str) -> List[Dict[str, Any]]:
    data = await _get_json('searchteams.php', params={"t": name}, ttl=TTL_LONG)
    teams = data.get('teams') if isinstance(data, dict) else None
    return teams or []

LEAGUE_IDS = {
    # Common leagues (can expand)
    'EPL': '4328',
    'NBA': '4387',  # NBA Basketball
    'NFL': '4391',
    'NHL': '4380',
    'MLB': '4424',
}

async def unified_events(sport_key: str) -> Dict[str, Any]:
    """Return combined snapshot: upcoming + recent for a mapped league if available."""
    alias = SPORT_ALIAS.get(sport_key.lower())
    league_name = None
    league_id = None
    if alias:
        _, league_name = alias
    if league_name and league_name.upper() in LEAGUE_IDS:
        league_id = LEAGUE_IDS[league_name.upper()]
    if not league_id:
        # fallback: list sports or empty
        return {"sport": sport_key, "upcoming": [], "recent": []}
    upcoming, recent = await asyncio.gather(
        get_next_events_for_league(league_id),
        get_previous_events_for_league(league_id),
    )
    return {
        "sport": sport_key,
        "league_id": league_id,
        "upcoming": upcoming,
        "recent": recent,
    }

__all__ = [
    'list_all_sports', 'get_next_events_for_league', 'get_previous_events_for_league',
    'get_team_next', 'search_team', 'unified_events'
]
