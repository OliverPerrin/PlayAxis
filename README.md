# PlayAxis

A field guide to sport, gaming and good plans. Find events, follow teams and live creators, record activity and meet people who share your interests. React 18, Leaflet and FastAPI. MIT licensed.

## Four ways in

| Area | Features |
| --- | --- |
| **Play** | Local organiser listings, community sessions with RSVPs, places and events on the map, saved places and plans, calendar downloads, directions |
| **Follow** | Seven league feeds, fixtures and results, team following, standings and team records, Twitch sport/esports broadcasts, live chess |
| **Train** | Private activity journal, precise workout editing, activity timer, weekly/monthly goals, progress charts, session comparisons and sourced running/cycling/swimming benchmarks |
| **Connect** | Community posts, reactions and comments, clubs, membership, group sessions and profiles |

The overview gives athletics, gaming and event discovery equal entry points. Persistent section navigation, a searchable feature finder (`Ctrl/Command K`) and contextual links connect related pages. The interface keeps cream/light and charcoal/dark backgrounds, with coral, violet, amber and cobalt accents, original illustrated starting points and event/broadcast imagery. Short labels and grouped search controls reduce text density. There is no green theme, custom arrow graphics, em dashes or pill information boxes. See the [design notes](docs/design.md).

Public discovery works without an account. Recording activities, setting goals, joining sessions and contributing to the community require a PlayAxis account.

## Local development

Requirements: Node.js 22 LTS and Python 3.11+. This revision was also checked with Python 3.14.

```sh
# Repository root
python3 -m venv .venv-playaxis
source .venv-playaxis/bin/activate
pip install -r backend/requirements-dev.txt
cd backend
python dev.py
```

In another terminal:

```sh
cd frontend
npm ci
npm start
```

Open [localhost:3000](http://localhost:3000). API documentation is at [localhost:8000/docs](http://localhost:8000/docs).

`backend/dev.py` uses the durable local `backend/playaxis.db` SQLite database unless `DATABASE_URL` is explicitly exported in the shell. Provider keys are still read from `backend/.env`. This keeps old hosted-database settings in that file from breaking local development. It does not migrate or modify a hosted database.

Do not reuse the old checked-in Python environment. Create a new environment with an installed Python version.

## Provider configuration

Use [backend/.env.example](backend/.env.example) as a template. Keys belong in the ignored `backend/.env`, never in frontend code. Restart the backend after changing configuration. The local keys prepared during this work are not committed.

| Data | Provider | Working coverage and limits |
| --- | --- | --- |
| Premier League | [football-data.org](https://www.football-data.org/coverage) | Full season fixtures and 20-team table. Free scores are delayed; [10 requests/minute](https://docs.football-data.org/general/v4/policies.html). Requires `FOOTBALL_DATA_API_KEY`. |
| Bundesliga | [OpenLigaDB](https://github.com/OpenLigaDB/OpenLigaDB-Samples) | Season fixtures and full table, no key. |
| Formula 1 | [Jolpica F1](https://github.com/jolpica/jolpica-f1/blob/main/docs/README.md) | Calendar, circuit coordinates, driver standings, no key. |
| NFL | [nflverse / Lee Sharpe](https://github.com/nflverse/nfldata/blob/master/DATASETS.md) | Complete season schedule, final scores and division standings. Periodic updates, not live scoring. |
| NBA | [BALLDONTLIE](https://nba.balldontlie.io/) | Current fixtures and complete derived regular-season team records. Free limit 5 requests/minute. Requires `BALLDONTLIE_API_KEY`. |
| MLB and NHL | Official public data endpoints | Upcoming/recent fixtures, source standings and actual source season. These public endpoints have no project-specific availability guarantee. |
| Local organiser events | [Ticketmaster Discovery](https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/) | City/geographic event listings across sport, music and arts, date-window filtering, real venue coordinates, source dates and prices when supplied. Requires `TICKETMASTER_API_KEY`. Default free quota 5,000/day. |
| Broader local discovery | [SerpAPI Google Search](https://serpapi.com/search-api) | Organiser website fallback when Ticketmaster has no matches or is unavailable. These links are separate from dated events and are never plotted as venues. Explicit searches only, cached 24 hours; local monthly cap defaults to 100. The app checks that the configured account is on a free plan. |
| Live broadcasts | [Twitch Helix](https://dev.twitch.tv/docs/api/) | Sport, Counter-Strike, League of Legends and VALORANT, using server-side app credentials. |
| Live chess | [Lichess](https://lichess.org/developers) | Featured channels and embedded boards, no key. |
| Weather and cities | [Open-Meteo](https://open-meteo.com/en/docs), GeoNames | Free hosted use is subject to [non-commercial terms and quotas](https://open-meteo.com/en/pricing). |
| Maps and places | [OpenStreetMap / Overpass](https://wiki.openstreetmap.org/wiki/Overpass_API#Public_Overpass_API_instances) | Community-mapped sports places. Attribution and public-service policies apply. |

TheSportsDB remains the free team-directory source and limited fallback where a full feed is unavailable. Its public key has strict sample limits. The active site describes coverage rather than presenting samples as complete leagues.

### NBA records

The free NBA provider includes games but not official standings. PlayAxis computes wins, losses and percentages from fully paginated, completed regular-season games. It does not invent official tiebreak ranks. The verified 2025/26 dataset contains 1,230 games and 82 games for each of 30 teams.

Records are cached in the database. A cold or expired season can refresh in the background, respecting the five-per-minute quota. The page shows preparation or previously cached data while this runs. If the provider is unavailable, the app does not claim a partial download is complete.

API-Sports was also checked: the active free NBA plan rejected current seasons and allowed only older archives. It is not used to misrepresent current coverage.

### Local discovery and maps

- Ticketmaster searches use the selected city or a 30 km geographic search, with activity/category and date filters applied before the result limit. Dates use the selected city timezone when available.
- Today, weekend, next-seven-days and custom date filters also apply to community sessions. Generic organiser websites are clearly labelled as not filtered by date.
- Gaming and chess can be selected for logs, goals, groups and sessions. Group/session hosting currently requires a physical city and venue; online matchmaking and tournament standings are not provided.
- Community sessions are distinct from organiser listings. A session has a real host, future start, venue and optional user-selected map point.
- Search results preserve uncertain date text. Unknown times and coordinates are not invented.
- Map layers separate places and events. Nearby event coordinates are filtered to 30 km. Listings without precise coordinates remain available in the list.
- Place searches cover 300 to 5,000 metres and at most 100 mapped objects. Pan and press “Search this area” to make another request.
- Place results have a one-hour cache and a bounded last-good disk fallback, usable for up to 24 hours with a visible saved-data timestamp.
- The Britain/Ireland [Atownsend Overpass instance](https://overpass.atownsend.org.uk/) is a regional fallback. Its non-commercial policy and IPv6 requirement apply. Set `OVERPASS_API_URL` for another suitable service.
- [OpenStreetMap tile rules](https://operations.osmfoundation.org/policies/tiles/) require attribution and ordinary caching. The app does not bulk-download or prefetch maps.

### Strava

Strava linking is not enabled. Its Standard API requires the developer to maintain a paid Strava subscription. To honour the free-only requirement, PlayAxis retains independent activity logging and does not create an OAuth app or collect Strava data. See [Strava’s current getting-started requirements](https://developers.strava.com/docs/getting-started/).

## Persistence and account behavior

The backend stores accounts, password hashes, interests, workouts, goals, clubs, memberships, sessions, RSVPs and community contributions. Goals use actual recorded activity and the browser's supplied timezone. Workouts are stored as UTC instants; editing unrelated fields preserves original measurement precision and start seconds.

The browser stores its sign-in token, appearance, units, city, bookmarks, followed teams and unsaved activity timer. These device preferences are not automatically synced between devices. The timer preserves its original start and pauses, and saving still requires reviewing the activity form.

Settings exports account records together with device-local preferences. Club membership names are visible only to members. Community posts and session details are public. The Contact page prepares a draft for the visitor to send through their own email app.

## Hosting and migrations

For a fresh hosted database, configure a persistent `DATABASE_URL`, a stable `SECRET_KEY`, the frontend origin and the provider credentials, then run:

```sh
cd backend
python -m alembic upgrade head
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

The current migration head is `participation_20260922`. Historical duplicate table/index creation was repaired without changing applied revision IDs. Back up existing databases before migrating. Databases created through `create_all` may need their schema and Alembic revision reconciled; do not blindly stamp or delete them.

SQLite needs a persistent volume. PostgreSQL is also supported. Docker Compose includes a local named volume:

```sh
# Create backend/.env and set a generated SECRET_KEY first.
docker compose --env-file backend/.env up --build
```

The existing Netlify configuration places the API proxy before the SPA fallback. Update its backend target for a new deployment, or set `REACT_APP_API_URL`. The frontend accepts an origin or a complete `/api/v1` base. Provider secrets must stay on the backend.

The existing live site is [playaxis.netlify.app](https://playaxis.netlify.app), with the API proxied to Koyeb. Deploy the `main` branch through the linked hosting services. Preserve the production database URL and signing secret, configure provider credentials on Koyeb, and run the Alembic migration before serving the new backend. Netlify uses Node 22 and the committed npm lockfile. Verify database-backed routes as well as health and live provider responses after release.

## Checks and documentation

```sh
# Root: isolated, offline database/API regression checks
.venv-playaxis/bin/python -m pytest -q

# Frontend
cd frontend
CI=true npm test -- --watchAll=false --runInBand
npm run build

# Root: optional read-only check against the running backend
.venv-playaxis/bin/python test_apis.py
```

See [architecture and routes](docs/architecture.md), [standings contracts](docs/leaderboards-endpoint.md) and [verification scope](docs/verification.md). External availability can vary independently of passing local tests.

## Credits

[MIT License](LICENSE). Photography by [Hannah Coleman on Unsplash](https://unsplash.com/photos/man-running-on-outdoor-track-UFs5bKHgo4U). Map data © OpenStreetMap contributors. NFL schedules use [nflverse data under CC BY 4.0](https://github.com/nflverse/nflverse-data/blob/main/LICENSE.md), normalized by PlayAxis. Provider data and media retain their respective terms.
