# Architecture and contracts

## Application structure

React Router owns the public site and its four intent groups. `components/layout/navigation.js` is the navigation directory used by the masthead, feature finder and footer. Main routes include `/local`, `/map`, `/saved`, `/sessions/new`, `/matches`, `/leaderboards`, `/watch`, `/discover`, `/events`, `/mystats`, `/log-workout`, `/goals`, `/compare`, `/community` and `/clubs`.

The client has one API base, preserves route query/state through authentication, ignores responses for obsolete queries, deduplicates requests and invalidates in-flight cache generations after mutations. Refreshing an existing resource keeps its visible content and drafts. Mutation controls remain disabled while their refreshed state is pending.

One backend settings object, database engine and JWT configuration serve all account routes. `backend/dev.py` defaults to local SQLite without overwriting hosted configuration. The production entrypoint is `app.main:app`. Personal records and provider caches have separate tables and ownership rules.

## Public API

All paths below are relative to `/api/v1`, except the additional root `/healthz` alias.

| Route | Behavior |
| --- | --- |
| `GET /healthz` | Process version and database kind |
| `GET /sports` | Supported leagues, source and coverage |
| `GET /sports/{key}` | Normalized upcoming/recent fixtures |
| `GET /sports/{key}/standings` | Source tables or explicitly derived NBA records |
| `GET /sports/teams/search?q=` | Team directory search |
| `GET /sports/teams/{id}` | Team metadata |
| `GET /sports/teams/{id}/events` | Exact normalized team-name matches from a full league feed when available; limited fallback otherwise |
| `GET /events` | Filterable, paginated professional fixture catalogue |
| `GET /events/{id}` | Durable event detail dispatch by provider prefix |
| `GET /events/viewport` | Legacy complete-bound filtering |
| `GET /discovery/events` | Submitted local organiser search by city/sport/country/timezone, optionally coordinates and `date_from`/`date_to` |
| `GET /places` | Named mapped sports spaces, bounded radius and result count |
| `GET /locations?q=` | City lookup |
| `GET /weather` | Current and hourly forecast with explicit source timezone offsets |
| `GET /streams?category=` | `sports`, `esports`, individual supported esports categories, or `chess` |
| `GET /athletes/{sport}` | Dated running/cycling/swimming performance references |
| `POST /athletes/compare` | Mathematical time/distance comparison for a known reference |
| `GET /community` | Paginated public posts and comments |
| `GET /clubs`, `GET /clubs/{id}` | Public group details; member names only for members |
| `GET /sessions`, `GET /sessions/{id}` | Upcoming community sessions and detail, with date/activity filtering before the result cap |

`/leaderboards` and `/aggregate/events` remain compatibility aliases. The old synthetic player comparison returns HTTP 410. Paid-provider debug endpoints are not registered.

## Authenticated API

| Route | Behavior |
| --- | --- |
| `POST /auth/register`, `POST /auth/login`, `GET /auth/me` | Account lifecycle |
| `GET /users/me`, `PUT /users/me` | Profile read/update, unique sign-in name |
| `POST /users/me/interests` | Persist interests |
| `GET /users/me/export` | Owner-scoped account export, with no passwords or tokens |
| `GET /workouts`, `POST /workouts` | Owner's activity log |
| `GET`, `PUT`, `DELETE /workouts/{id}` | Owner-only read/edit/delete |
| `GET /goals?tz=`, `POST /goals`, `DELETE /goals/{id}` | Private recurring targets and computed period progress |
| `GET /recommendations` | Explainable links based on interests and recorded activity |
| `POST /clubs`, `DELETE /clubs/{id}` | Group creation and owner deletion |
| `POST /clubs/{id}/membership` | Join/leave; organiser remains a member |
| `POST /sessions`, `DELETE /sessions/{id}` | Organise or cancel an owned session |
| `POST /sessions/{id}/rsvp` | Join/leave; organiser remains an attendee |
| `POST /community`, `DELETE /community/{id}` | Publish or remove own post |
| `POST /community/{id}/like`, `POST /community/{id}/comments` | Reactions and comments |

Session cancellation removes its listing and RSVPs. Club deletion preserves its sessions as independent plans. The app does not send automatic email notifications. Hosts should communicate changes to participants.

Workout start times are normalized to UTC. Editing untouched fields preserves original seconds, distances and unit metadata. Timed activities carry their original start into the form. Goals use a validated IANA timezone and actual workout records within the local calendar period.

## Provider adapters and quotas

- `services/public_data.py`: no-key league adapters, shared normalization and places.
- `services/league_feeds.py`: football-data.org and nflverse.
- `services/nba.py`: BALLDONTLIE fixtures, complete pagination and computed records.
- `services/ticketmaster.py`: local listings and refreshed event detail.
- `services/local_discovery.py`: persistent search snapshots and the free-plan SerpAPI fallback.
- `services/twitch.py`: app-token lifecycle, category resolution and stream normalization.

Normalized sports snapshots are cached per league, rather than inserting every fixture into the shared request cache. This prevents large schedules from evicting provider responses or OAuth tokens. A catalogue snapshot serves consecutive calendar pages without repeating provider calls. Partial source availability remains explicit.

football-data.org is paced to its free allowance and checks rate-limit response headers. BALLDONTLIE calls are serialized with at least 12.6 seconds between requests and persist cached responses. NBA team records are published only after complete pagination. Background refresh preserves a previous complete result when possible.

Local organiser searches are cached for 24 hours with category, coordinates, timezone and dates in the cache key. Ticketmaster is preferred and applies its date window before the 100-result cap. If no events match, the supported Google Search engine provides `organisers`, a separate website directory with no start time or map coordinates. Its generic website results are not filtered by date. The former `google_events` request returned an unsupported-engine error in live verification. SerpAPI checks free-plan status, reserves from a persistent monthly counter and never performs extra paid geocoding/enrichment. These in-process queues suit one backend process; multiple instances need a shared distributed limiter for the same credentials.

## Maps and persistence

Leaflet loads its stylesheet explicitly, invalidates size after layout changes, clusters projected coordinates and preserves the viewport while panning. Place and event layers are separate. Community event coordinates are filtered to the searched region. Missing coordinates are not replaced with a city-centre guess. Only the tile pane is filtered into the cream/black theme, keeping markers, popups and controls readable.

Browser storage contains preferences, sign-in token, saved snapshots, followed teams and the unsaved timer. Backend storage contains accounts and participation records. `discovery_cache` stores public provider snapshots; `provider_usage` tracks the bounded external-search allowance. A separate bounded disk cache keeps recent public place results for outage fallback, without account association.

Current migration head: `participation_20260922`. New tables: `goals`, `clubs`, `club_members`, `session_events`, `session_attendees`, `discovery_cache`, `provider_usage`.
