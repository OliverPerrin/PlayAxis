# PlayAxis: Multi-Sports and Events Web App

An event & live content aggregation platform spanning traditional sports, endurance activities, and esports. The backend normalizes external sources (live streams, events, weather, odds context) into a unified API consumed by a React frontend. OAuth (Eventbrite) lets users enrich personal discovery with their own authorized event data.

> Status: Core aggregation (Eventbrite, Twitch, Sportsbook via RapidAPI, Weather via Open‑Meteo) implemented. Eventbrite OAuth flow scaffolded (authorize, callback, exchange, refresh). Recommendation & advanced personalization layers are being iteratively expanded.

## Table of Contents
- [Highlights](#highlights)
- [Hosted Architecture](#hosted-architecture)
- [Data Sources / APIs](#data-sources--apis)
- [Architecture Overview](#architecture-overview)
- [Backend Endpoints (Summary)](#backend-endpoints-summary)
- [Eventbrite OAuth Flow](#eventbrite-oauth-flow)
- [Local Development](#local-development)
    - [Prerequisites](#prerequisites)
    - [Clone & Bootstrap](#clone--bootstrap)
    - [Running with Docker Compose](#running-with-docker-compose)
    - [Running Manually (Backend / Frontend)](#running-manually-backend--frontend)
- [Environment Variables](#environment-variables)
- [Caching & Performance](#caching--performance)
- [Security Notes](#security-notes)
- [Project Structure](#project-structure)
- [Extending (Add a New Source)](#extending-add-a-new-source)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

## Highlights
* Unified events list from Eventbrite (with graceful fallbacks when search restricted).
* Live Twitch streams (Helix API) with lightweight token caching.
* Sports schedule / odds context via RapidAPI Sportsbook endpoint (rate‑limit aware).
* Weather enrichment (Open‑Meteo) for location‑aware discovery scenarios.
* In‑memory async TTL cache layer to reduce third‑party API pressure.
* Eventbrite OAuth (Authorization Code) endpoints included: `/authorize`, `/callback`, `/exchange`, `/refresh`, plus a `/debug` diagnostic.
* React + Tailwind UI with calendar, stream, and event views (Netlify build w/ API proxy to backend).

## Hosted Architecture
| Layer | Service | Hosting | Notes |
|-------|---------|---------|-------|
| Frontend (SPA) | React (Create React App + Tailwind) | Netlify | `netlify.toml` config handles build + SPA routing. `/api/*` proxied to backend. |
| Backend API | FastAPI | Koyeb (container) | Exposed under `/api/v1`. CORS allows Netlify / local dev origins. |
| Database | PostgreSQL | (Koyeb add‑on / external managed Postgres) | SQLAlchemy ORM + Alembic migrations. |
| OAuth Provider | Eventbrite | SaaS | App settings must include backend callback URL. |

Netlify redirect example (from `netlify.toml`):
```
[[redirects]]
from = "/api/*"
to = "https://<koyeb-app-host>.koyeb.app/api/:splat"
status = 200
```
Replace `<koyeb-app-host>` with your deployed backend hostname.

## Data Sources / APIs
| Source | Purpose | Access Pattern |
|--------|---------|---------------|
| Eventbrite API v3 | Event search & organization events | OAuth user token preferred; falls back to private/public tokens if present. |
| Twitch Helix | Live streams (game/interest discovery) | App access token (client credentials) cached until near expiry. |
| RapidAPI Sportsbook (`sportsbook-api.p.rapidapi.com`) | Sports scores / events snapshot | Keyed requests per sport; cached to mitigate 429 / 403. |
| Open‑Meteo | Weather (current + hourly) | Simple GET, no key required. |

## Architecture Overview
```
React SPA ----(HTTPS/JSON)----> FastAPI      ----> Eventbrite (OAuth / Bearer)
                     (Netlify)            (Koyeb)       ----> Twitch Helix (Bearer)
                                                                                        ----> RapidAPI Sportsbook (API Key)
                                                                                        ----> Open-Meteo (No Auth)

FastAPI Layers:
    /api/v1/* routers  ->  services/ (integration logic) -> cache (in‑memory TTL)
    models/ + schemas/ -> SQLAlchemy + Pydantic
    Alembic migrations -> db/versions
```

Key design points:
* Service modules isolate third‑party quirks (retry, fallback, normalization).
* Normalized `Event` schema consolidates external fields.
* In‑memory cache (simple async) is pluggable—can later swap for Redis.
* Eventbrite search gracefully downgrades: user token → private token → public token → organization fallback → empty.

## Backend Endpoints (Summary)
Prefix: `/api/v1`

| Category | Sample Routes | Notes |
|----------|---------------|-------|
| Auth | `/auth/login`, `/auth/register` | JWT (HS256) based. |
| Events | `/events` | Aggregated (currently Eventbrite + normalization). |
| Streams | `/streams` | Twitch streams (optionally filter by game). |
| Sports | `/sports/{sport}` | RapidAPI Sportsbook events; sport mapping in code. |
| Weather | `/weather?lat=..&lon=..` | Current + optional hourly. |
| Aggregate | `/aggregate` | Multi-source combination (future expansion). |
| Leaderboards | `/leaderboards` | Placeholder / evolving feature. |
| Eventbrite OAuth | `/eventbrite/authorize`, `/eventbrite/callback`, `/eventbrite/exchange`, `/eventbrite/refresh` | OAuth handling. |
| Eventbrite Debug | `/eventbrite/debug` | Inspect token chain & search status. |
| Health | `/healthz` | Basic readiness. |

## Eventbrite OAuth Flow
1. User clicks a frontend "Connect Eventbrite" button that hits backend: `GET /api/v1/eventbrite/authorize`.
2. Redirect to Eventbrite consent page with `response_type=code` & configured `redirect_uri`.
3. Eventbrite redirects back to backend `/api/v1/eventbrite/callback?code=...`.
4. Backend exchanges code for access & refresh tokens (`exchange_eventbrite_code`).
5. Tokens stored on the user model (fields: `eventbrite_access_token`, `eventbrite_refresh_token`).
6. Subsequent Eventbrite requests prefer user access token (improved scopes) before falling back.
7. Refresh: `POST /api/v1/eventbrite/refresh` rotates access (and possibly refresh) token.

Important configuration:
* The `EVENTBRITE_REDIRECT_URI` must EXACTLY match the value in your Eventbrite app (including scheme + path). Typically: `https://<koyeb-app-host>.koyeb.app/api/v1/eventbrite/callback`.
* Ensure `EVENTBRITE_CLIENT_ID` and `EVENTBRITE_CLIENT_SECRET` set. Legacy `EVENTBRITE_API_KEY` is accepted as a client id if explicit id missing.

## Local Development
### Prerequisites
* Python 3.11+ (project tested with 3.11 / 3.12)
* Node.js 18+ (Create React App)
* Docker & Docker Compose (optional but recommended)
* Postgres (local container or cloud instance)

### Clone & Bootstrap
```bash
git clone https://github.com/OliverPerrin/MultiSportApp.git
cd MultiSportApp
```

### Running with Docker Compose
Compose starts backend & frontend (expects Postgres configured via `DATABASE_URL`). Add a `.env` file in `backend/` first.
```bash
docker-compose up --build
```
Visit: http://localhost:3000

### Running Manually (Backend / Frontend)
Backend:
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
Frontend (in a second terminal):
```bash
cd frontend
npm install
npm start
```
Visit: http://localhost:3000 (proxy forwards `/api` to `localhost:8000`).

## Environment Variables
Create `backend/.env` (never commit real secrets):
```
DATABASE_URL=postgresql://user:password@host:5432/multisport
SECRET_KEY=change_me

# Eventbrite OAuth
EVENTBRITE_CLIENT_ID=your_eventbrite_client_id
EVENTBRITE_CLIENT_SECRET=your_eventbrite_client_secret
EVENTBRITE_REDIRECT_URI=https://<koyeb-app-host>.koyeb.app/api/v1/eventbrite/callback
EVENTBRITE_PRIVATE_TOKEN=optional_private_token
EVENTBRITE_PUBLIC_TOKEN=optional_public_token

# Twitch
TWITCH_CLIENT_ID=your_twitch_client_id
TWITCH_CLIENT_SECRET=your_twitch_client_secret

# RapidAPI Sportsbook
X_RAPIDAPI_KEY=your_rapidapi_key

# Frontend origin (optional for CORS tightening)
FRONTEND_URL=https://<your-netlify-app>.netlify.app
```

Frontend `.env` (optional overrides):
```
REACT_APP_API_BASE=/api/v1
```

Notes:
* `SECRET_KEY` signs JWTs (HS256). Rotate if compromised.
* If using a local Postgres container, update `DATABASE_URL` accordingly.
* Eventbrite private/public tokens are legacy; OAuth user token provides best access to `/events/search`.

## Caching & Performance
* In-memory async cache (`app/core/cache.py`) with per-key TTL (e.g., events + streams ~180s).
* Prevents redundant external calls and softens third‑party rate limits (especially RapidAPI & Twitch token).
* Replaceable with Redis by implementing the same `get/set` interface.

## Security Notes
* JWT auth: short-lived access (default 30 min). Add refresh pattern later if needed.
* CORS restricted to localhost dev + `*.netlify.app` / `*.koyeb.app` via regex.
* Do not expose private or public Eventbrite tokens in client-side code.
* Consider moving secrets to managed store (e.g., Netlify env vars + Koyeb secrets) for production.

## Project Structure
```
MultiSportApp/
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/    # FastAPI routers
│   │   ├── core/                # Config, cache, security
│   │   ├── services/            # External API integrations
│   │   ├── models/ & db/        # SQLAlchemy models & session
│   │   ├── schemas/             # Pydantic models
│   │   └── main.py              # FastAPI entrypoint
│   ├── alembic/                 # Migrations
│   └── requirements.txt
├── frontend/
│   ├── src/                     # React components / pages / contexts
│   ├── public/                  # Static assets
│   └── package.json
├── netlify.toml                 # Build + proxy rules
├── docker-compose.yml
└── README.md
```

## Extending (Add a New Source)
1. Create a service module in `backend/app/services/<source>.py` handling auth + fetch + normalization.
2. Define a Pydantic schema (extend or map into existing `Event` if appropriate).
3. Add an endpoint router or integrate into an existing aggregator.
4. Apply caching if the upstream resource is rate‑limited.
5. Add env vars to `config.py` & document them here.

## Roadmap
| Phase | Focus |
|-------|-------|
| Short Term | Stabilize Eventbrite OAuth success path & enrich venue geo filtering. |
| Short Term | Improve Sportsbook rate‑limit backoff (exponential + jitter). |
| Medium | Recommendation engine (interest weighting + weather synergy). |
| Medium | Additional providers (e.g., Ticketmaster, Meetup) behind feature flags. |
| Long | Replace in‑memory cache with Redis & add background refresh jobs. |
| Long | Graph-based user interest modeling & collaborative filtering. |

## Contributing
PRs welcome. Typical flow:
```
git checkout -b feature/your-feature
# make changes
git commit -m "feat: add your feature"
git push origin feature/your-feature
```
Open a Pull Request and describe motivation + testing notes.

## License
Distributed under the GNU License (see `LICENSE`).

## Contact
Maintainer: Oliver Perrin (@OliverPerrin)

File an issue for bugs / enhancement requests.
