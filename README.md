# PlayAxis: Multi-Sports and Events Web App

An event & live content aggregation platform spanning traditional sports, endurance activities, and esports. The backend normalizes external sources (live streams, events, weather, odds context) into a unified API consumed by a React frontend. OAuth (Eventbrite) lets users enrich personal discovery with their own authorized event data.

> Status: Core aggregation (Eventbrite, Twitch, Sportsbook via RapidAPI, Weather via Open‑Meteo) implemented. Eventbrite OAuth flow scaffolded (authorize, callback, exchange, refresh). Recommendation & advanced personalization layers are being iteratively expanded.

## Table of Contents
- [Highlights](#highlights)
- [Architecture](#architecture)
- [Key Modules (Backend)](#key-modules-backend)
- [API Quick Reference](#api-quick-reference)
- [Local Development](#local-development)
- [Environment Variables](#environment-variables)
- [Caching & Rate Limits](#caching--rate-limits)
- [Security & CORS](#security--cors)
- [Project Structure](#project-structure)
- [Testing External APIs](#testing-external-apis)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

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
- Python 3.11+
- Node.js 18+
- (Optional) Docker & Docker Compose
- (Optional) PostgreSQL (only needed for auth/workouts/DB features)

### Run with Docker Compose
```sh
docker-compose up --build
# Frontend: http://localhost:3000
# Backend:  http://localhost:8000/api/v1
```

### Run Manually
Backend
```sh
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Frontend (in a second terminal)
```sh
cd frontend
npm install
npm start
# CRA proxy forwards /api/* to http://localhost:8000 (see frontend/package.json "proxy")
```

- CRA proxy: [frontend/package.json](frontend/package.json)
- Netlify proxy (production): [netlify.toml](netlify.toml)

---

## Environment Variables

Backend (create `backend/.env`)
```
# Core
DATABASE_URL=postgresql://user:password@host:5432/multisport
SECRET_KEY=change_me

# SerpAPI / ScraperAPI (Google Events)
SERPAPI_API_KEY=your_serpapi_key
SCRAPERAPI_API_KEY=your_scraperapi_key

# TheSportsDB (optional, free key defaults to "123" if omitted)
THESPORTSDB_API_KEY=your_thesportsdb_key

# Twitch
TWITCH_CLIENT_ID=your_twitch_client_id
TWITCH_CLIENT_SECRET=your_twitch_client_secret

# Optional: tighten CORS for your deployed frontend
FRONTEND_URL=https://<your-netlify-app>.netlify.app
```

Frontend (optional overrides) — `frontend/.env`
```
REACT_APP_API_URL=https://<your-backend-host>.koyeb.app/
```

Settings are loaded via [`app.core.config.Settings`](backend/app/core/config.py).

---

## Caching & Rate Limits
- In‑memory async cache: [backend/app/core/cache.py](backend/app/core/cache.py)
  - Events (Google): short TTL (~180s) to keep UI fresh
  - TheSportsDB: short/long TTLs depending on endpoint
- SerpAPI exhaustion:
  - On hard 429, we set a cooldown and prefer ScraperAPI fallback.
- ScraperAPI fallback:
  - HTML parse with JSON‑LD extraction where possible; limited output to control latency.
- See orchestration in [`app.services.events.aggregate_events`](backend/app/services/events.py).

---

## Security & CORS
- CORS allows localhost dev and select hosted origins (Netlify/Koyeb). See [backend/app/main.py](backend/app/main.py).
- Do not commit real secrets. Example `.env` values above are placeholders.

---

## Project Structure
```
MultiSportApp/
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/         # FastAPI routers
│   │   ├── services/                 # Integrations: SerpAPI, ScraperAPI, TheSportsDB, Twitch, Open‑Meteo
│   │   ├── schemas/                  # Pydantic models
│   │   ├── core/                     # Config, cache, security
│   │   ├── models/, db/, alembic/    # SQLAlchemy + migrations (optional features)
│   │   └── main.py                   # FastAPI app
├── frontend/
│   ├── src/                          # React components, pages, contexts, api client
│   └── public/                       # Static assets (CRA)
└── netlify.toml                      # Build + proxy rules
```

Some useful entry points:
- Backend API composition: [backend/app/api/v1/api.py](backend/app/api/v1/api.py)
- Events endpoints: [backend/app/api/v1/endpoints/events.py](backend/app/api/v1/endpoints/events.py)
- Sports endpoints: [backend/app/api/v1/endpoints/sports.py](backend/app/api/v1/endpoints/sports.py)
- Streams endpoints: [backend/app/api/v1/endpoints/streams.py](backend/app/api/v1/endpoints/streams.py)
- Weather endpoints: [backend/app/api/v1/endpoints/weather.py](backend/app/api/v1/endpoints/weather.py)
- Frontend API client: [frontend/src/api.js](frontend/src/api.js)

---

## Testing External APIs
A simple script validates keys and external connectivity:
- [test_apis.py](test_apis.py)

Run:
```sh
python3 test_apis.py
```

---

## Roadmap
- Improve geocoding enrichment for events and viewport clustering
- Expand sports coverage and per‑league standings tables
- Enhance recommendations blending weather, proximity, and interests
- Optional: switch in‑memory cache to Redis and add background refresh jobs

---

## Contributing
PRs are welcome.
```
git checkout -b feature/your-feature
# make changes
git commit -m "feat: your feature"
git push origin feature/your-feature
```

---

## License
Distributed under the GNU License (see [LICENSE](LICENSE)).