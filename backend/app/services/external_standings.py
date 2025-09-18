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


# -------- Additional Sports Ranking Scrapers -------- #

async def _cached_table_rows(cache_key: str, url: str, parse_fn, ttl: int = WIKI_TTL) -> List[Dict[str, Any]]:
    cached = await cache.get(cache_key)
    if cached is not None:
        return cached
    html = await _fetch(url, ttl=ttl)
    if not html:
        return []
    try:
        rows = parse_fn(html)
    except Exception as e:  # noqa: BLE001
        logger.warning("Parse failure key=%s err=%s", cache_key, e)
        rows = []
    await cache.set(cache_key, rows, ttl)
    return rows


async def get_tennis_rankings(limit: int = 50) -> List[Dict[str, Any]]:
    """Scrape ATP singles rankings (top n) from Wikipedia."""
    url = "https://en.wikipedia.org/wiki/ATP_rankings"
    def parse(html: str):
        soup = BeautifulSoup(html, 'html.parser')
        tables = soup.find_all('table', {'class': 'wikitable'})
        rows_out = []
        for tbl in tables:
            # heuristic: find header containing 'Ranking' and 'Points'
            headers = [h.get_text(strip=True).lower() for h in tbl.find_all('th')[:6]]
            if not any('points' in h for h in headers):
                continue
            for tr in tbl.find_all('tr')[1:]:
                tds = tr.find_all('td')
                if len(tds) < 4:
                    continue
                rank_txt = tds[0].get_text(strip=True)
                try:
                    rank = int(rank_txt.split('=')[0])
                except ValueError:
                    continue
                name = tds[1].get_text(strip=True)
                country = tds[2].get_text(strip=True)
                points_raw = tds[3].get_text(strip=True)
                try:
                    pts = int(points_raw.replace(',', ''))
                except ValueError:
                    pts = None
                rows_out.append({'Rank': rank, 'Player': name, 'Country': country, 'Points': pts})
                if len(rows_out) >= limit:
                    return rows_out
        return rows_out
    return await _cached_table_rows(f"tennis_atp:{limit}", url, parse)


async def get_golf_rankings(limit: int = 50) -> List[Dict[str, Any]]:
    """Scrape OWGR top players from Wikipedia."""
    url = "https://en.wikipedia.org/wiki/Official_World_Golf_Ranking"
    def parse(html: str):
        soup = BeautifulSoup(html, 'html.parser')
        tables = soup.find_all('table', {'class': 'wikitable'})
        rows_out = []
        for tbl in tables:
            # Look for header with 'OWGR' or 'Ranking'
            headers = [h.get_text(strip=True).lower() for h in tbl.find_all('th')]
            if not any('ranking' in h or 'owgr' in h for h in headers):
                continue
            for tr in tbl.find_all('tr')[1:]:
                tds = tr.find_all('td')
                if len(tds) < 4:
                    continue
                rank_txt = tds[0].get_text(strip=True)
                try:
                    rank = int(rank_txt)
                except ValueError:
                    continue
                name = tds[1].get_text(strip=True)
                country = tds[2].get_text(strip=True)
                points_raw = tds[3].get_text(strip=True)
                try:
                    pts = float(points_raw.replace(',', ''))
                except ValueError:
                    pts = None
                rows_out.append({'Rank': rank, 'Player': name, 'Country': country, 'Points': pts})
                if len(rows_out) >= limit:
                    return rows_out
        return rows_out
    return await _cached_table_rows(f"golf_owgr:{limit}", url, parse)


async def get_cricket_rankings(limit: int = 30) -> List[Dict[str, Any]]:
    """Scrape ICC Men's ODI team rankings from Wikipedia."""
    url = "https://en.wikipedia.org/wiki/ICC_Men%27s_ODI_Team_Rankings"
    def parse(html: str):
        soup = BeautifulSoup(html, 'html.parser')
        table = soup.find('table', {'class': 'wikitable'})
        rows_out = []
        if table:
            for tr in table.find_all('tr')[1:]:
                tds = tr.find_all('td')
                if len(tds) < 5:
                    continue
                try:
                    rank = int(tds[0].get_text(strip=True))
                except ValueError:
                    continue
                team = tds[1].get_text(strip=True)
                matches = tds[2].get_text(strip=True)
                rating = tds[4].get_text(strip=True)
                rows_out.append({'Rank': rank, 'Team': team, 'Matches': matches, 'Rating': rating})
                if len(rows_out) >= limit:
                    break
        return rows_out
    return await _cached_table_rows(f"cricket_odi:{limit}", url, parse)


async def get_rugby_rankings(limit: int = 30) -> List[Dict[str, Any]]:
    """Scrape World Rugby Rankings from Wikipedia."""
    url = "https://en.wikipedia.org/wiki/World_Rugby_Rankings"
    def parse(html: str):
        soup = BeautifulSoup(html, 'html.parser')
        table = soup.find('table', {'class': 'wikitable'})
        rows_out = []
        if table:
            for tr in table.find_all('tr')[1:]:
                tds = tr.find_all('td')
                if len(tds) < 5:
                    continue
                try:
                    rank = int(tds[0].get_text(strip=True))
                except ValueError:
                    continue
                team = tds[1].get_text(strip=True)
                points = tds[4].get_text(strip=True)
                rows_out.append({'Rank': rank, 'Team': team, 'Points': points})
                if len(rows_out) >= limit:
                    break
        return rows_out
    return await _cached_table_rows(f"rugby_world:{limit}", url, parse)


async def get_cycling_rankings(limit: int = 50) -> List[Dict[str, Any]]:
    """Scrape UCI World Ranking riders from Wikipedia."""
    url = "https://en.wikipedia.org/wiki/UCI_World_Ranking"
    def parse(html: str):
        soup = BeautifulSoup(html, 'html.parser')
        tables = soup.find_all('table', {'class': 'wikitable'})
        rows_out = []
        for tbl in tables:
            headers = [h.get_text(strip=True).lower() for h in tbl.find_all('th')]
            if not any('rider' in h for h in headers):
                continue
            for tr in tbl.find_all('tr')[1:]:
                tds = tr.find_all('td')
                if len(tds) < 4:
                    continue
                try:
                    rank = int(tds[0].get_text(strip=True))
                except ValueError:
                    continue
                name = tds[1].get_text(strip=True)
                team = tds[2].get_text(strip=True)
                pts_raw = tds[3].get_text(strip=True)
                rows_out.append({'Rank': rank, 'Rider': name, 'Team': team, 'Points': pts_raw})
                if len(rows_out) >= limit:
                    return rows_out
        return rows_out
    return await _cached_table_rows(f"cycling_uci:{limit}", url, parse)


async def get_running_records(limit: int = 20) -> List[Dict[str, Any]]:
    """Scrape selected world records in athletics (men) from Wikipedia."""
    url = "https://en.wikipedia.org/wiki/List_of_world_records_in_athletics"
    def parse(html: str):
        soup = BeautifulSoup(html, 'html.parser')
        tables = soup.find_all('table', {'class': 'wikitable'})
        rows_out = []
        for tbl in tables[:3]:  # just early tables for brevity
            for tr in tbl.find_all('tr')[1:]:
                tds = tr.find_all('td')
                if len(tds) < 5:
                    continue
                event = tds[0].get_text(strip=True)
                perf = tds[1].get_text(strip=True)
                athlete = tds[2].get_text(strip=True)
                nation = tds[3].get_text(strip=True)
                rows_out.append({'Event': event, 'Performance': perf, 'Athlete': athlete, 'Nation': nation})
                if len(rows_out) >= limit:
                    return rows_out
        return rows_out
    return await _cached_table_rows(f"running_records:{limit}", url, parse)


async def get_esports_rankings(limit: int = 25) -> List[Dict[str, Any]]:
    """Scrape highest-earning esports players (cumulative) from Wikipedia."""
    url = "https://en.wikipedia.org/wiki/List_of_highest-paid_esports_players"
    def parse(html: str):
        soup = BeautifulSoup(html, 'html.parser')
        table = soup.find('table', {'class': 'wikitable'})
        rows_out = []
        if table:
            for tr in table.find_all('tr')[1:]:
                tds = tr.find_all('td')
                if len(tds) < 4:
                    continue
                try:
                    rank = int(tds[0].get_text(strip=True))
                except ValueError:
                    continue
                player = tds[1].get_text(strip=True)
                country = tds[2].get_text(strip=True)
                earnings = tds[3].get_text(strip=True)
                rows_out.append({'Rank': rank, 'Player': player, 'Country': country, 'Earnings': earnings})
                if len(rows_out) >= limit:
                    break
        return rows_out
    return await _cached_table_rows(f"esports_highest:{limit}", url, parse)

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
