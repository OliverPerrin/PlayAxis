# Performance improvements, 2 October 2026

Implemented locally; not deployed. No database migration or new dependency is required. Deploy the backend before the frontend so the homepage's `highlights=true` query is supported.

## Measured results

| Check | Before | After |
| --- | --- | --- |
| Initial production JS, gzip | 140.55 kB | 72.17 kB (48.7% smaller) |
| Initial production CSS, gzip | 23.41 kB | 16.94 kB (27.6% smaller) |
| Homepage fixture response, local live-provider sample | 712,111 JSON bytes over 3 requests | 9,329 JSON bytes in 1 request (98.7% smaller) |
| Compressed highlights response | Previously no backend gzip middleware | 1,721 bytes with gzip in the same sample |
| Community feed database reads | Queries per post for author, likes and comments | 3 queries for a populated page |
| Clubs database reads | Membership query per club | 2 queries for a populated list |
| Sessions database reads | Host and attendance queries per session | 3 queries for a populated list |
| Goals database reads | Workouts loaded separately for each goal | At most 3 queries, SQL aggregation by period and sport |
| Local discovery persistence, 100 events | 101 transactions for details and search | 1 transaction |

Database query budgets exclude authentication dependency queries. Regression tests use 30 clubs/sessions, 35 community posts, and 18 goals on isolated SQLite databases. These are structural query-count improvements, not production latency benchmarks.

The live local sample used free public feeds and disabled credential-based providers. All seven fixture feeds returned data. Cold fixture catalogue loading was still approximately 6.4 seconds before and after the compact response change. Payload reduction does not remove provider refresh latency. The local static proxy did not forward gzip negotiation; compressed bytes were measured directly against the backend with `Accept-Encoding: gzip`.

## Changes

- Routes and Leaflet load on demand. Shared goal helpers/session cards live outside page modules to preserve splitting. The browser loaded only the main JS on the homepage, then map chunks on opening the map.
- The homepage requests the earliest fixture per league with `/api/v1/events?highlights=true`. Interest ranking and league diversity remain in the UI; the full calendar API retains all events and pagination.
- Full calendars fetch subsequent pages in batches of three. Saved-event filtering does not request the provider catalogue. Calendar day cells use an event index.
- Map community sessions and external events render independently as they arrive. A slow or failed source does not hide another source's ready results.
- Short, account-scoped browser caches deduplicate concurrent requests. Mutations invalidate related resources, including local-session event aliases, while preserving unrelated provider caches. Invalidated in-flight responses cannot repopulate the cache. The cache is capped at 200 entries.
- Caller cancellation is supported, and a delayed 401 from an old token cannot log out a newer account. Discarded React StrictMode effects do not start redundant loads.
- Outbound provider clients share lifespan-owned HTTP connections. Headers and timeouts remain request-specific; the pool closes at shutdown. CLI calls outside the application lifespan still close their own clients.
- Cache refreshes share one in-flight producer per key and event loop. Twenty concurrent public/CSV requests produced one upstream call in deterministic tests. Cancelling one caller leaves other waiters intact; failed requests remain retryable.
- Local discovery batches snapshot writes and moves detail reads off the event loop. Community/clubs/sessions use batched membership reads, and goals aggregate in SQL.
- Backend gzip compresses responses of at least 1,000 bytes when requested, at compression level 5. Legacy response fields remain intact.

## Verification

- Backend: 33 tests passed with `.venv-playaxis/bin/python -m pytest -q`.
- Frontend: 55 tests passed with `CI=true npm test -- --watchAll=false --runInBand` in `frontend`.
- Production build: `CI=true npm run build` passed in `frontend`.
- `git diff --check` passed.
- Browser: local production homepage rendered real fixture/weather data; one compact fixture request; Leaflet absent from initial load and mounted successfully on map navigation. Twitch correctly reported unavailable with credentials disabled. The browser automation host disconnected during the final clubs/navigation-cache check, so that browser check was not completed. Route smoke tests and API cache tests passed.

Existing framework deprecation and outdated Browserslist-data warnings remain. Provider TTLs, fallback behavior and free-tier rate limits are unchanged. Cold provider refreshes can remain slow, especially on rate-limited feeds. Caches are per browser session or backend process, not shared across server replicas. No production load test or deployment was performed.
