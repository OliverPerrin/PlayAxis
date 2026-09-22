# Verification record

Verified locally on 22 September 2026 against the revised PlayAxis 3 application.

## Application and regression checks

- **39 frontend tests passed.** They cover the main routes, feature-finder navigation, authentication return URLs, calendar/date safety, map-coordinate validation, training totals, workout submission/edit precision, timer start preservation, city search inside the session form, game-category navigation, organiser results and timezone-aware event date filters.
- **23 backend tests passed.** They cover signup and both login contracts, owner isolation, workout UTC round trips and editing, private goals, club membership, session hosting/RSVPs, community persistence, exports, performance benchmarks, provider normalization, NBA calculations, source outages, caching, gaming/chess logs, safe organiser normalization, Ticketmaster date/category parameters and community date filters applied before the result cap.
- A large-schedule test verifies that 1,100 fixtures do not evict shared provider cache entries. A pagination test confirms that consecutive calendar pages reuse a catalogue snapshot.
- Fresh and repeated Alembic upgrades passed at `participation_20260922` using disposable databases.
- The strict `CI=true` production build passed. Gzipped output is approximately **140 kB JavaScript and 23 kB CSS**.
- `git diff --check` passed. The active imported frontend modules contained no authored em dashes, arrow graphics or pill-info styling.
- Configured secret values were checked against changed source files; no matches were found.

Existing dependency deprecation notices remain in the test/development tooling. Application route tests run in jsdom with Leaflet mocked. Provider setup was performed in the signed-in browser; application pixel/layout testing and real-device testing are not claimed. The working local preview was opened for review.

## Real provider responses

The expanded live read-only smoke script passed **17 of 17 checks**. Separate focused checks observed:

| Feed | Verified result |
| --- | --- |
| Premier League | 380 fixtures and 20 table rows |
| NFL | 272 fixtures and 32 division-table rows |
| NBA fixtures | 92 upcoming games in the tested window |
| NBA records | 1,230 unique final regular-season games, 30 teams, 82 games per team, season 2025/26 |
| Twitch sport | 12 real broadcasts |
| Twitch esports | 11 real broadcasts |
| Local organiser listings | 100 Ticketmaster events displayed from 120 matches near London |
| Ticketmaster detail | HTTP 200, venue and real coordinates, refreshed rather than stale |
| Organiser website fallback | HTTP 200, 9 cycling websites, no fabricated dated events or coordinates |
| London music | HTTP 200, 100 events within the selected seven-day window |
| VALORANT | HTTP 200, 12 live streams |
| Arsenal following | 33 upcoming fixtures from the full football-data.org feed |

Bundesliga, F1, MLB, NHL, weather, city lookup, Lichess and London place search also returned successful data. Provider availability can vary later.

## End-to-end local API wiring

An old frontend environment override pointed at the previous hosted backend. It was corrected to use the same-origin proxy. The local backend launcher uses durable local SQLite rather than stale hosted-database configuration.

Requests through the frontend at port 3000 verified:

- `/api/v1/healthz`: HTTP 200, SQLite backend.
- Calendar page 1: HTTP 200, **1,076 upcoming fixtures**, no unavailable feeds, approximately 2.45 seconds on the measured request.
- Calendar page 2: HTTP 200, same total, approximately **0.01 seconds** using the catalogue cache.

## Credentials and limits

Provider credentials were recovered from the signed-in dashboards and saved in ignored backend configuration. The project’s invalid Twitch secret was replaced and its OAuth/token and live-stream calls were verified. The football-data token was verified and activated. No paid subscription or trial was activated.

API-Sports’ actual free NBA responses rejected current seasons, despite broader wording in a marketing guide. It is not used for current NBA coverage. BALLDONTLIE supplies current games and the complete data used for derived records. These records do not claim official tiebreak rankings.

The configured SerpAPI key is on a zero-price plan. Its `google_events` request returned HTTP 400 with an unsupported-engine error. Standard Google Search returned real results, so the app now offers organiser websites separately from dated events. This observation is specific to the verified request, not a claim that every provider account has the same engine availability.

The public Overpass services were intermittent during earlier checks. Place searches now have a bounded last-good fallback with a visible timestamp. Local searches remain quota-limited, and source failures remain distinct from empty results.

## Boundaries

Lifecycle test writes were confined to temporary databases. No contact email was sent. Public NBA data was cached in the local development database. Existing `.DS_Store` deletions were preserved.

At the local-verification stage recorded above, no Git push, hosting deployment or production database migration had been performed. Production release status is tracked by the linked GitHub, Netlify and Koyeb deployments. A successful health response alone does not prove database migration success; verify community, clubs and sessions as well.

## Repeat

```sh
# Root
.venv-playaxis/bin/python -m pytest -q
.venv-playaxis/bin/python test_apis.py

# Frontend
CI=true npm test -- --watchAll=false --runInBand
npm run build
```

Live checks require the configured backend on port 8000. Offline regression tests do not use the stored provider keys.

## Colour and density refinement

The cream and dark page backgrounds remain. Original SVG illustrations, coral/violet/amber/cobalt accents, event images and stream thumbnails make the main journeys visual. Repeated header descriptions and introductory paragraphs were removed. Local-event filters and search now precede results; league coverage can be expanded when needed. No backend data contracts changed in this refinement. All 39 frontend tests and the strict production build passed again. Palette text/background pairs were checked numerically for contrast; browser layout verification remains unclaimed.

The user explicitly chose to skip Strava to keep the app free. Its subscription prerequisite was checked against current official documentation; no paid service or Strava integration was activated.
