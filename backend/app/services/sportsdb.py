import httpx
import logging
from typing import List, Optional, Dict, Any, Tuple
from app.core.config import settings
from app.core.cache import cache
import asyncio
from app.services.external_standings import (
    get_fifa_world_rankings,
    get_skiing_standings,
    get_soccer_top_scorers,
    get_tennis_rankings,
    get_golf_rankings,
    get_cricket_rankings,
    get_rugby_rankings,
    get_cycling_rankings,
    get_running_records,
    get_esports_rankings,
)

logger = logging.getLogger(__name__)

BASE_URL_V1 = "https://www.thesportsdb.com/api/v1/json"
API_KEY_FALLBACK = "123"  # free key

TTL_SHORT = 120  # 2 min for volatile endpoints (next events)
TTL_LONG = 3600  # 1 hour for static lists

# Base static aliases. We will augment this at runtime with any sports returned
# by list_all_sports() so unknown sports still resolve to a display name.
SPORT_ALIAS: Dict[str, Tuple[str, Optional[str]]] = {
    "nfl": ("American Football", "NFL"),
    "nba": ("Basketball", "NBA"),
    "mlb": ("Baseball", "MLB"),
    "nhl": ("Ice Hockey", "NHL"),
    "epl": ("Soccer", "English Premier League"),
    # Map generic 'soccer' to EPL so users selecting 'soccer' get a league table
    "soccer": ("Soccer", "EPL"),
    # Generic sport keys (as returned by API) mapped to major leagues
    "american_football": ("American Football", "NFL"),
    "basketball": ("Basketball", "NBA"),
    "baseball": ("Baseball", "MLB"),
    "ice_hockey": ("Ice Hockey", "NHL"),
    # Additional common aliases
    "f1": ("Motorsport", None),
    "formula1": ("Motorsport", None),
    "formula-1": ("Motorsport", None),
    "skiing": ("Skiing", None),
}

_dynamic_alias_populated = False

async def _ensure_dynamic_aliases():
    """Populate SPORT_ALIAS with every sport from TheSportsDB once per process.

    Each sport key will be the lowercase of strSport with spaces replaced by underscores.
    League mapping remains None unless explicitly handled in static map.
    """
    global _dynamic_alias_populated
    if _dynamic_alias_populated:
        return
    try:
        sports = await list_all_sports()
        for s in sports:
            name = (s.get('strSport') or '').strip()
            if not name:
                continue
            key = name.lower().replace(' ', '_')
            if key not in SPORT_ALIAS:
                SPORT_ALIAS[key] = (name, None)
    except Exception as e:  # noqa: BLE001
        logger.warning("Failed populating dynamic sport aliases: %s", e)
    _dynamic_alias_populated = True

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

async def get_league_table(league_id: str, season: Optional[str] = None) -> List[Dict[str, Any]]:
    # TheSportsDB: lookuptable.php?l=4328&s=2023-2024 (season optional, some sports just latest)
    params = {"l": league_id}
    if season:
        params["s"] = season
    data = await _get_json('lookuptable.php', params=params, ttl=TTL_SHORT)
    table = data.get('table') if isinstance(data, dict) else None
    return table or []

def _sport_to_league_id(sport_key: str) -> Optional[str]:
    alias = SPORT_ALIAS.get(sport_key.lower())
    if not alias:
        return None
    _, league_name = alias
    if not league_name:
        return None
    return LEAGUE_IDS.get(league_name.upper())

import os
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.crud.workout import get_standings_cache, upsert_standings_cache

STANDINGS_CACHE_TTL_MIN = int(os.getenv('STANDINGS_CACHE_TTL_MIN', '30'))
FORCE_REFRESH_STANDINGS = os.getenv('FORCE_REFRESH_STANDINGS') == '1'

async def get_standings_for_sport(sport_key: str) -> Dict[str, Any]:
    """Return a multi-table standings structure differing by sport.

    Shape:
    {
      "sport": <input>,
      "league_id": <id or None>,
      "tables": [
         {"kind": "league", "name": "League Standings", "columns": [...], "rows": [...]},
         {"kind": "drivers", ...}, ...
      ]
    }
    """
    await _ensure_dynamic_aliases()
    # DB cache check
    db: Session | None = None
    cached_obj = None
    try:
        db = SessionLocal()
        cached_obj = get_standings_cache(db, sport_key)
    except Exception:  # noqa: BLE001
        db = None
    now = datetime.now(timezone.utc)
    if cached_obj and not FORCE_REFRESH_STANDINGS:
        refreshed = cached_obj.refreshed_at if cached_obj.refreshed_at else now
        if (now - refreshed) < timedelta(minutes=STANDINGS_CACHE_TTL_MIN):
            data = cached_obj.data
            if isinstance(data, dict) and data.get('tables') is not None:
                return data
    skey = sport_key.lower()

    # Special handling for motorsport (F1) placeholder sample (real integration would call dedicated endpoints)
    if skey in {"f1", "formula1", "formula-1"}:
        # Use Ergast free API (no key required): http://ergast.com/api/f1/current/standings.json
        async def _ergast(path: str) -> Optional[Dict[str, Any]]:
            url = f"http://ergast.com/api/f1/{path}"
            cache_key = f"ergast:{path}"
            cached = await cache.get(cache_key)
            if cached is not None:
                return cached
            try:
                async with httpx.AsyncClient(timeout=15.0) as client:
                    r = await client.get(url)
                    if r.status_code != 200:
                        await cache.set(cache_key, None, 60)
                        return None
                    data = r.json()
                    await cache.set(cache_key, data, 300)  # 5 min cache
                    return data
            except Exception as e:  # noqa: BLE001
                logger.warning("Ergast fetch fail path=%s err=%s", path, e)
                await cache.set(cache_key, None, 60)
                return None

        drivers_data, constructors_data, last_race_data, qual_data = await asyncio.gather(
            _ergast('current/driverStandings.json'),
            _ergast('current/constructorStandings.json'),
            _ergast('current/last/results.json'),
            _ergast('current/last/qualifying.json'),
        )

        def _drivers_rows():
            try:
                lists = drivers_data['MRData']['StandingsTable']['StandingsLists']
                if not lists:
                    return []
                standings = lists[0]['DriverStandings']
                rows = []
                for d in standings:
                    drv = d.get('Driver', {})
                    cons = d.get('Constructors', [{}])[0]
                    rows.append({
                        'Position': d.get('position'),
                        'Driver': f"{drv.get('givenName','')} {drv.get('familyName','')}".strip(),
                        'Team': cons.get('name'),
                        'Points': d.get('points'),
                        'Wins': d.get('wins'),
                        'Podiums': None,  # Ergast does not directly supply podium count
                    })
                return rows
            except Exception:  # noqa: BLE001
                return []

        def _constructors_rows():
            try:
                lists = constructors_data['MRData']['StandingsTable']['StandingsLists']
                if not lists:
                    return []
                standings = lists[0]['ConstructorStandings']
                rows = []
                for c in standings:
                    cons = c.get('Constructor', {})
                    rows.append({
                        'Position': c.get('position'),
                        'Constructor': cons.get('name'),
                        'Points': c.get('points'),
                        'Wins': c.get('wins'),
                        'Podiums': None,
                    })
                return rows
            except Exception:  # noqa: BLE001
                return []

        def _qualifying_rows():
            try:
                # Qualifying last race
                races = qual_data['MRData']['RaceTable']['Races']
                if not races:
                    return []
                qual_results = races[0].get('QualifyingResults', [])
                rows = []
                for q in qual_results:
                    drv = q.get('Driver', {})
                    rows.append({
                        'Position': q.get('position'),
                        'Driver': f"{drv.get('givenName','')} {drv.get('familyName','')}".strip(),
                        'Q3 Time': q.get('Q3') or q.get('Q2') or q.get('Q1'),
                    })
                return rows
            except Exception:  # noqa: BLE001
                return []

        def _race_rows():
            try:
                races = last_race_data['MRData']['RaceTable']['Races']
                if not races:
                    return []
                results = races[0].get('Results', [])
                rows = []
                for r in results:
                    drv = r.get('Driver', {})
                    status = r.get('status')
                    time_obj = r.get('Time', {})
                    rows.append({
                        'Position': r.get('position'),
                        'Driver': f"{drv.get('givenName','')} {drv.get('familyName','')}".strip(),
                        'Race Time': time_obj.get('time'),
                        'Status': status,
                    })
                return rows
            except Exception:  # noqa: BLE001
                return []

        tables = [
            {
                'kind': 'drivers',
                'name': 'Drivers Championship',
                'columns': ['Position', 'Driver', 'Team', 'Points', 'Wins', 'Podiums'],
                'rows': _drivers_rows(),
            },
            {
                'kind': 'constructors',
                'name': 'Constructors Championship',
                'columns': ['Position', 'Constructor', 'Points', 'Wins', 'Podiums'],
                'rows': _constructors_rows(),
            },
            {
                'kind': 'qualifying',
                'name': 'Latest Qualifying',
                'columns': ['Position', 'Driver', 'Q3 Time'],
                'rows': _qualifying_rows(),
            },
            {
                'kind': 'race',
                'name': 'Latest Grand Prix Result',
                'columns': ['Position', 'Driver', 'Race Time', 'Status'],
                'rows': _race_rows(),
            },
        ]
        result = {'sport': sport_key, 'league_id': None, 'tables': tables}
        if db:
            try:
                upsert_standings_cache(db, sport_key, result)
            except Exception:  # noqa: BLE001
                pass
        return result

    # Skiing placeholder – disciplines & times (no direct TheSportsDB aggregate; synthetic structure)
    if skey in {"ski", "skiing"}:
        ski_rows = await get_skiing_standings()
        result = {
            "sport": sport_key,
            "league_id": None,
            "tables": [
                {
                    "kind": "skiing_overall",
                    "name": "Alpine World Cup Overall (Men)",
                    "columns": ["Rank", "Athlete", "Nation", "Points"],
                    "rows": ski_rows,
                }
            ],
        }
        if db:
            try:
                upsert_standings_cache(db, sport_key, result)
            except Exception:
                pass
        return result

    if skey in {"tennis"}:
        atp = await get_tennis_rankings(limit=50)
        result = {"sport": sport_key, "league_id": None, "tables": [
            {"kind": "tennis_atp", "name": "ATP Singles Rankings (Top 50)", "columns": ["Rank", "Player", "Country", "Points"], "rows": atp}
        ]}
        if db:
            try: upsert_standings_cache(db, sport_key, result)
            except Exception: pass
        return result

    if skey in {"golf"}:
        owgr = await get_golf_rankings(limit=50)
        result = {"sport": sport_key, "league_id": None, "tables": [
            {"kind": "golf_owgr", "name": "Official World Golf Ranking (Top 50)", "columns": ["Rank", "Player", "Country", "Points"], "rows": owgr}
        ]}
        if db:
            try: upsert_standings_cache(db, sport_key, result)
            except Exception: pass
        return result

    if skey in {"cricket"}:
        odi = await get_cricket_rankings(limit=30)
        result = {"sport": sport_key, "league_id": None, "tables": [
            {"kind": "cricket_odi", "name": "ICC Men's ODI Team Rankings", "columns": ["Rank", "Team", "Matches", "Rating"], "rows": odi}
        ]}
        if db:
            try: upsert_standings_cache(db, sport_key, result)
            except Exception: pass
        return result

    if skey in {"rugby"}:
        rw = await get_rugby_rankings(limit=30)
        result = {"sport": sport_key, "league_id": None, "tables": [
            {"kind": "rugby_world", "name": "World Rugby Rankings", "columns": ["Rank", "Team", "Points"], "rows": rw}
        ]}
        if db:
            try: upsert_standings_cache(db, sport_key, result)
            except Exception: pass
        return result

    if skey in {"cycling"}:
        uci = await get_cycling_rankings(limit=50)
        result = {"sport": sport_key, "league_id": None, "tables": [
            {"kind": "cycling_uci", "name": "UCI World Ranking Riders", "columns": ["Rank", "Rider", "Team", "Points"], "rows": uci}
        ]}
        if db:
            try: upsert_standings_cache(db, sport_key, result)
            except Exception: pass
        return result

    if skey in {"running", "athletics"}:
        recs = await get_running_records(limit=20)
        result = {"sport": sport_key, "league_id": None, "tables": [
            {"kind": "running_records", "name": "Selected Track World Records (Men)", "columns": ["Event", "Performance", "Athlete", "Nation"], "rows": recs}
        ]}
        if db:
            try: upsert_standings_cache(db, sport_key, result)
            except Exception: pass
        return result

    if skey in {"esports", "e-sports"}:
        ers = await get_esports_rankings(limit=25)
        result = {"sport": sport_key, "league_id": None, "tables": [
            {"kind": "esports_earnings", "name": "Highest Earning Esports Players", "columns": ["Rank", "Player", "Country", "Earnings"], "rows": ers}
        ]}
        if db:
            try: upsert_standings_cache(db, sport_key, result)
            except Exception: pass
        return result

    # Soccer (league style) – attempt league table
    league_id = _sport_to_league_id(sport_key)
    if league_id:
        standings_rows = []
        try:
            raw = await get_league_table(league_id)
            for row in raw:
                standings_rows.append({
                    "Rank": row.get('intRank'),
                    "Team": row.get('strTeam'),
                    "Played": row.get('intPlayed') or row.get('intPlayedOverall'),
                    "Win": row.get('intWin') or row.get('intWins'),
                    "Draw": row.get('intDraw') or row.get('intTies'),
                    "Loss": row.get('intLoss') or row.get('intLosses'),
                    "GF": row.get('intGoalsFor') or row.get('intPointsFor'),
                    "GA": row.get('intGoalsAgainst') or row.get('intPointsAgainst'),
                    "GD": (
                        (row.get('intGoalsFor') or 0) - (row.get('intGoalsAgainst') or 0)
                        if (row.get('intGoalsFor') is not None and row.get('intGoalsAgainst') is not None) else None
                    ),
                    "Pts": row.get('intPoints') or row.get('points') or row.get('intWin'),
                })
        except Exception as e:  # noqa: BLE001
            logger.warning("League standings fetch fail league=%s err=%s", league_id, e)
        league_table = {
            "kind": "league",
            "name": "League Standings",
            "columns": ["Rank", "Team", "Played", "Win", "Draw", "Loss", "GF", "GA", "GD", "Pts"],
            "rows": standings_rows,
        }
        try:
            scorers_rows = await get_soccer_top_scorers(league_id)
        except Exception as e:  # noqa: BLE001
            logger.warning("Top scorers fetch fail league=%s err=%s", league_id, e)
            scorers_rows = []
        players_table = {
            "kind": "players_top_scorers",
            "name": "Top Scorers",
            "columns": ["Rank", "Player", "Team", "Goals"],
            "rows": scorers_rows,
        }
        try:
            fifa_rows = await get_fifa_world_rankings(limit=50)
        except Exception as e:  # noqa: BLE001
            logger.warning("FIFA rankings fetch fail err=%s", e)
            fifa_rows = []
        world_rankings_table = {
            "kind": "world_rankings",
            "name": "FIFA World Rankings (Top 50)",
            "columns": ["Rank", "Team", "Points"],
            "rows": fifa_rows,
        }
        result = {"sport": sport_key, "league_id": league_id, "tables": [league_table, players_table, world_rankings_table]}
        if db:
            try: upsert_standings_cache(db, sport_key, result)
            except Exception: pass
        return result

    # Fallback empty response for unsupported mapping
    result = {"sport": sport_key, "league_id": None, "tables": []}
    if db:
        try: upsert_standings_cache(db, sport_key, result)
        except Exception: pass
    return result

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
    'get_team_next', 'search_team', 'unified_events', 'get_standings_for_sport'
]
