import logging
import re
from typing import List, Dict, Any, Optional
import httpx
from bs4 import BeautifulSoup  # already in requirements
from app.core.cache import cache

logger = logging.getLogger(__name__)

WIKI_TTL = 3600 * 6  # 6 hours


async def _fetch(url: str, ttl: int = 300) -> Optional[str]:
    key = f"rawfetch:{url}".lower()
    cached = await cache.get(key)
    if cached is not None:
        return cached
    try:
        async with httpx.AsyncClient(timeout=20.0, headers={"User-Agent": "MultiSportBot/1.0"}) as client:
            r = await client.get(url)
            if r.status_code != 200:
                await cache.set(key, None, 120)
                return None
            text = r.text
            await cache.set(key, text, ttl)
            return text
    except Exception as e:  # noqa: BLE001
        logger.warning("Fetch failed url=%s err=%s", url, e)
        await cache.set(key, None, 120)
        return None


async def get_fifa_world_rankings(limit: int = 50) -> List[Dict[str, Any]]:
    """Scrape FIFA men's world rankings from Wikipedia (simple parse)."""
    url = "https://en.wikipedia.org/wiki/FIFA_Men%27s_World_Ranking"
    key = f"fifa_rankings:{limit}".lower()
    cached = await cache.get(key)
    if cached is not None:
        return cached
    html = await _fetch(url, ttl=WIKI_TTL)
    if not html:
        return []
    soup = BeautifulSoup(html, 'html.parser')
    # Find first wikitable sortable containing ranking data
    table = soup.find('table', {'class': re.compile(r'wikitable')})
    rows_out = []
    if table:
        for row in table.find_all('tr')[1:]:
            cols = [c.get_text(strip=True) for c in row.find_all(['td', 'th'])]
            if len(cols) < 3:
                continue
            # Typical format: Rank, Team, Points, ...
            try:
                rank = int(re.sub(r'[^0-9]', '', cols[0]) or '0')
            except ValueError:
                continue
            team = cols[1]
            points_raw = cols[2]
            points = None
            try:
                points = float(points_raw.replace(',', ''))
            except Exception:  # noqa: BLE001
                pass
            rows_out.append({
                'Rank': rank,
                'Team': team,
                'Points': points,
            })
            if len(rows_out) >= limit:
                break
    await cache.set(key, rows_out, WIKI_TTL)
    return rows_out


async def get_skiing_standings(limit: int = 30) -> List[Dict[str, Any]]:
    """Scrape FIS Alpine World Cup (overall) standings (men) from Wikipedia."""
    url = "https://en.wikipedia.org/wiki/2024%E2%80%9325_FIS_Alpine_Ski_World_Cup"
    key = f"skiing_wc_overall:{limit}".lower()
    cached = await cache.get(key)
    if cached is not None:
        return cached
    html = await _fetch(url, ttl=WIKI_TTL)
    if not html:
        return []
    soup = BeautifulSoup(html, 'html.parser')
    # Heuristic: first table with 'Overall' in caption/head or first wikitable sortable
    candidate_tables = soup.find_all('table', {'class': re.compile(r'wikitable')})
    rows_out = []
    for tbl in candidate_tables:
        caption = (tbl.find('caption').get_text(strip=True).lower() if tbl.find('caption') else '')
        if 'overall' not in caption and len(candidate_tables) > 1:
            continue
        for row in tbl.find_all('tr')[1:]:
            cols = [c.get_text(strip=True) for c in row.find_all('td')]
            # Expecting at least: Rank, Name, Nation, Points (varies)
            if len(cols) < 4:
                continue
            try:
                rank = int(re.sub(r'[^0-9]', '', cols[0]) or '0')
            except ValueError:
                continue
            name = cols[1]
            nation = cols[2]
            points = None
            try:
                points = int(re.sub(r'[^0-9]', '', cols[-1]) or '0')
            except ValueError:
                points = None
            rows_out.append({
                'Rank': rank,
                'Athlete': name,
                'Nation': nation,
                'Points': points,
            })
            if len(rows_out) >= limit:
                break
        if rows_out:
            break
    await cache.set(key, rows_out, WIKI_TTL)
    return rows_out


async def get_soccer_top_scorers(league_id: str, season: Optional[str] = None, limit: int = 25) -> List[Dict[str, Any]]:
    """Try TheSportsDB top scorers endpoint; return simplified rows.

    Endpoint pattern: topscorers.php?l=LEAGUE_ID&s=SEASON
    If season not provided, omit it and let API decide.
    """
    if not league_id:
        return []
    params = {"l": league_id}
    if season:
        params["s"] = season
    # Use existing SportsDB _get_json would need import; replicate minimal fetch inline to avoid cycle.
    cache_key = f"topsoc:{league_id}:{season}".lower()
    cached = await cache.get(cache_key)
    if cached is not None:
        return cached
    base = "https://www.thesportsdb.com/api/v1/json/3/topscorers.php"
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            r = await client.get(base, params=params)
            if r.status_code != 200:
                await cache.set(cache_key, [], 300)
                return []
            data = r.json()
            scorers = data.get('topscorers') or []
            rows = []
            for idx, s in enumerate(scorers[:limit]):
                rows.append({
                    'Rank': idx + 1,
                    'Player': s.get('strPlayer'),
                    'Team': s.get('strTeam'),
                    'Goals': s.get('intGoals') or s.get('intGoalsOverall') or s.get('intGoal') or None,
                })
            await cache.set(cache_key, rows, 1800)  # 30 min
            return rows
    except Exception as e:  # noqa: BLE001
        logger.warning("Top scorers fetch fail league=%s err=%s", league_id, e)
        await cache.set(cache_key, [], 600)
        return []
