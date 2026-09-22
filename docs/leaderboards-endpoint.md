# Standings and team records

Use `GET /api/v1/sports/{key}/standings`. The legacy `/api/v1/leaderboards?category={key}` delegates to it; `overall` selects Bundesliga.

| Key | Source | Semantics |
| --- | --- | --- |
| `epl` | football-data.org | Full Premier League table; scores delayed on free plan |
| `bundesliga` | OpenLigaDB | Full league table |
| `f1` | Jolpica F1 | Driver championship points and wins |
| `nfl` | nflverse / Lee Sharpe | Division standings, including source division ranks |
| `nba` | BALLDONTLIE | Team W/L records derived from fully paginated final regular-season games; no official tiebreak rank |
| `mlb` | MLB | Division standings; ranks are meaningful within division |
| `nhl` | NHL | Source standings with the actual returned season |

The response includes `sport`, `source`, `season`, `coverage`, `tables` and usually `updated_at`. Each table has `name`, `columns` and `rows`; column labels match row keys. Zero scores and records remain zero, while unknown values stay null.

`updated_at` is a retrieval/normalization time, not a promise of instant upstream scoring. Cached and archived seasons remain labelled. NHL may return the previous completed season during preseason.

NBA can return `pending: true` with no table while a cold season is being downloaded within the free quota. The frontend checks again automatically. A prior complete table can remain visible with `stale: true` while refreshing. Incomplete downloads are never presented as complete records.

Without a configured football-data.org key, EPL falls back to a clearly limited SportsDB sample. Without a BALLDONTLIE key, current NBA records are unavailable. The active local configuration uses verified keys for both.
