# PlayAxis: Full-Stack Multi-sport & Multi-event Web App

Discover real‑world events, follow sports schedules, check weather context, and browse live esports streams — all in one place. PlayAxis is a React + FastAPI application that aggregates multiple public APIs and presents them through a clean, responsive UI.

- Frontend (Netlify): https://playaxis.netlify.app
- Backend (Koyeb): https://raw-minne-multisportsandevents-7f82c207.koyeb.app/api/v1

> APIs used
> - Google Events via SerpAPI (primary) and ScraperAPI (HTML fallback) in parallel
> - TheSportsDB for sports leagues, teams, snapshots, and standings
> - Open‑Meteo for current and hourly weather
> - Twitch Helix for live streams (game/interest discovery)

---

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
- Unified event discovery:
  - Parallel Google Events fetch using [`app.services.google_events.fetch_google_events`](backend/app/services/google_events.py) (SerpAPI) and [`app.services.scraperapi_events.fetch_events_via_scraperapi`](backend/app/services/scraperapi_events.py) (ScraperAPI HTML fallback) with graceful degradation inside [`app.services.events.aggregate_events`](backend/app/services/events.py).
- Sports data:
  - League snapshots, upcoming/recent fixtures, and lightweight standings via TheSportsDB in [`app.services.sportsdb`](backend/app/services/sportsdb.py).
- Live streams:
  - Twitch Helix integration via [`app.services.twitch.fetch_streams`](backend/app/services/twitch.py).
- Weather context:
  - Current and optional hourly forecast via Open‑Meteo using [`app.services.weather.fetch_weather`](backend/app/services/weather.py).
- Map + calendar views:
  - Leaflet map (markers with bounding‑box filtering), and a simple calendar view.
- Rate‑limit aware:
  - In‑memory async cache smooths third‑party pressure; backoff/cooldown for SerpAPI/ScraperAPI fallbacks.

---

## Architecture
```
React SPA ----(HTTPS/JSON)----> FastAPI (Koyeb) ----> SerpAPI (Google Events)
            (Netlify)                         ----> ScraperAPI (HTML fallback)
                                              ----> TheSportsDB
                                              ----> Open‑Meteo
                                              ----> Twitch Helix

FastAPI layers:
    /api/v1/* routers -> services/* (integration + normalization) -> core/cache (TTL)
    schemas/* (Pydantic) -> models/* (SQLAlchemy, optional DB) -> alembic (migrations)
```

- API router composition: [backend/app/api/v1/api.py](backend/app/api/v1/api.py)
- CORS + app bootstrap: [backend/app/main.py](backend/app/main.py)
- Frontend API client (proxy-aware): [frontend/src/api.js](frontend/src/api.js)
- Netlify proxy to backend: [netlify.toml](netlify.toml)

---

## Key Modules (Backend)
- Events aggregation (Google Events):
  - [`app.services.events.aggregate_events`](backend/app/services/events.py)
  - [`app.services.google_events.fetch_google_events`](backend/app/services/google_events.py)
  - [`app.services.scraperapi_events.fetch_events_via_scraperapi`](backend/app/services/scraperapi_events.py)
- Sports (TheSportsDB):
  - [`app.services.sportsdb.unified_events`](backend/app/services/sportsdb.py)
  - League/team search and next/previous helpers in the same module.
- Streams (Twitch):
  - [`app.services.twitch.fetch_streams`](backend/app/services/twitch.py)
- Weather:
  - [`app.services.weather.fetch_weather`](backend/app/services/weather.py)
- Schemas:
  - Events response + viewport helper: [`app.schemas.event.EventsResponse`](backend/app/schemas/event.py) and [`app.schemas.event.compute_viewport`](backend/app/schemas/event.py)
  - Sports entities and standings: [backend/app/schemas/sports.py](backend/app/schemas/sports.py)
  - Streams: [backend/app/schemas/streams.py](backend/app/schemas/streams.py)
  - Weather: [backend/app/schemas/weather.py](backend/app/schemas/weather.py)

---

## API Quick Reference
Base URL: `/api/v1`

- Events (Google Events aggregate)
  - GET [`/events`](backend/app/api/v1/endpoints/events.py) → [`app.api.v1.endpoints.events.list_events_slash`](backend/app/api/v1/endpoints/events.py)
    - Query: `q`, `page`, `limit`, optional bounding box `min_lat/max_lat/min_lon/max_lon`, and optional `user_lat/user_lon`
    - Returns [`EventsResponse`](backend/app/schemas/event.py) with flags: `serpapi_exhausted`, `scraper_fallback`, `scraper_limited`

- Sports (TheSportsDB)
  - GET [`/sports`](backend/app/api/v1/endpoints/sports.py) → list all sports
  - GET [`/sports/{sport}`](backend/app/api/v1/endpoints/sports.py) → unified upcoming/recent via [`app.services.sportsdb.unified_events`](backend/app/services/sportsdb.py)
  - GET [`/sports/{sport}/standings`](backend/app/api/v1/endpoints/sports.py) → multi‑table standings snapshot
  - GET [`/sports/teams/search?q=...`](backend/app/api/v1/endpoints/sports.py) → quick team search
  - GET [`/sports/teams/{team_id}/events`](backend/app/api/v1/endpoints/sports.py) → next events for a team

- Streams (Twitch)
  - GET [`/streams?game_id=...`](backend/app/api/v1/endpoints/streams.py) → [`app.api.v1.endpoints.streams.get_streams`](backend/app/api/v1/endpoints/streams.py)

- Weather (Open‑Meteo)
  - GET [`/weather?lat=..&lon=..`](backend/app/api/v1/endpoints/weather.py)

- Aggregate (sample blended feed)
  - GET [`/aggregate/events`](backend/app/api/v1/endpoints/aggregate.py)

- Health
  - GET `/healthz`

For a lightweight debug of SerpAPI parsing, see: [backend/app/api/v1/endpoints/google_events_debug.py](backend/app/api/v1/endpoints/google_events_debug.py).

---

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