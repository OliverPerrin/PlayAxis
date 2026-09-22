"""Offline regression checks. All writes are isolated in a disposable SQLite DB."""

import os
import tempfile
from datetime import datetime, timezone

_directory = tempfile.TemporaryDirectory(prefix="playaxis-tests-")
os.environ["DATABASE_URL"] = f"sqlite:///{_directory.name}/test.db"
os.environ["SECRET_KEY"] = "test-only-playaxis-secret-not-used-in-production"
os.environ["RUN_MIGRATIONS"] = "0"
for provider in [
    "FOOTBALL_DATA_API_KEY",
    "BALLDONTLIE_API_KEY",
    "TICKETMASTER_API_KEY",
    "TWITCH_CLIENT_ID",
    "TWITCH_CLIENT_SECRET",
    "SERPAPI_API_KEY",
    "API_SPORTS_KEY",
]:
    os.environ[provider] = ""
os.environ["PLACE_CACHE_DIR"] = f"{_directory.name}/places"

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient
from app.main import app
from app.core.cache import cache
from app.services import public_data


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as client:
        yield client
    _directory.cleanup()


def account(client, name):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "username": name,
            "email": f"{name}@example.com",
            "password": "A-valid-password-123",
        },
    )
    assert response.status_code == 200, response.text
    token = client.post(
        "/api/v1/auth/login",
        json={"username": name, "password": "A-valid-password-123"},
    ).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_account_workout_ownership_and_timezone(client):
    first = account(client, "runner-one")
    second = account(client, "runner-two")
    response = client.post(
        "/api/v1/workouts",
        headers=first,
        json={
            "sport": "running",
            "started_at": "2026-01-15T07:30:00+02:00",
            "duration_sec": 1800,
            "distance_m": 5000,
        },
    )
    assert response.status_code == 200, response.text
    item = response.json()
    assert datetime.fromisoformat(
        item["started_at"].replace("Z", "+00:00")
    ) == datetime(2026, 1, 15, 5, 30, tzinfo=timezone.utc)
    assert (
        client.get("/api/v1/workouts", headers=first).json()["workouts"][0]["id"]
        == item["id"]
    )
    assert client.get("/api/v1/workouts", headers=second).json()["workouts"] == []
    assert (
        client.get(f'/api/v1/workouts/{item["id"]}', headers=second).status_code == 404
    )
    assert (
        client.delete(f'/api/v1/workouts/{item["id"]}', headers=second).status_code
        == 404
    )
    assert (
        client.post(
            "/api/v1/workouts",
            headers=first,
            json={"sport": "running", "duration_sec": 0},
        ).status_code
        == 422
    )
    assert (
        client.put(
            "/api/v1/users/me", headers=first, json={"full_name": "runner-two"}
        ).status_code
        == 409
    )
    assert (
        client.put(
            "/api/v1/users/me", headers=first, json={"full_name": "  "}
        ).status_code
        == 422
    )
    assert (
        client.delete(f'/api/v1/workouts/{item["id"]}', headers=first).status_code
        == 200
    )
    assert client.get("/api/v1/workouts", headers=first).json()["workouts"] == []


def test_community_persistence_and_owner_delete(client):
    first = account(client, "community-one")
    second = account(client, "community-two")
    post = client.post(
        "/api/v1/community",
        headers=first,
        json={"content": "A good morning run.", "sport": "running"},
    )
    assert post.status_code == 201
    id = post.json()["id"]
    assert (
        client.post(f"/api/v1/community/{id}/like", headers=second).json()["liked"]
        is True
    )
    assert (
        client.post(
            f"/api/v1/community/{id}/comments",
            headers=second,
            json={"content": "Nice work!"},
        ).status_code
        == 201
    )
    feed = client.get("/api/v1/community", headers=second).json()["posts"][0]
    assert feed["likes"] == 1 and feed["liked"] and len(feed["comments"]) == 1
    assert feed["created_at"].endswith(("Z", "+00:00"))
    assert client.delete(f"/api/v1/community/{id}", headers=second).status_code == 404
    assert client.delete(f"/api/v1/community/{id}", headers=first).status_code == 200
    assert client.get("/api/v1/community").json()["posts"] == []


def test_auth_and_validation_fail_closed(client):
    assert client.get("/api/v1/workouts").status_code == 401
    assert (
        client.post(
            "/api/v1/auth/register",
            json={"username": "x", "email": "bad", "password": "short"},
        ).status_code
        == 422
    )
    assert client.get("/api/v1/places?lat=nan&lon=0").status_code == 422
    assert client.get("/api/v1/places?lat=91&lon=0").status_code == 422
    assert client.get(
        "/api/v1/workouts?limit=-1", headers={"Authorization": "Bearer invalid"}
    ).status_code in [401, 422]


def test_live_chess_uses_actual_lowercase_channel_keys(client, monkeypatch):
    async def fake(*args, **kwargs):
        return {
            "blitz": {
                "gameId": "abcdefgh",
                "user": {"name": "Player"},
                "rating": 2000,
                "color": "white",
            }
        }

    import app.api.v1.endpoints.streams as streams

    monkeypatch.setattr(streams, "get_json", fake)
    data = client.get("/api/v1/streams").json()
    assert len(data["data"]) == 1
    assert data["data"][0]["channel"] == "blitz"
    assert data["data"][0]["embed_url"] == "https://lichess.org/tv/blitz/frame"


def test_events_keep_partial_failure_visible(client, monkeypatch):
    import app.api.v1.endpoints.events as endpoint

    async def fake(key):
        if key == "nhl":
            raise HTTPException(503, "Unavailable")
        return {
            "upcoming": [{"id": key, "name": key, "start": "2027-01-01T00:00:00Z"}],
            "source": key,
            "coverage": "Fixture sample",
            "limited": True,
        }

    monkeypatch.setattr(endpoint, "sports_events", fake)
    response = client.get("/api/v1/events?limit=2")
    assert response.status_code == 200
    assert response.json()["unavailable"] == ["nhl"]
    assert response.json()["total"] == 6 and len(response.json()["events"]) == 2
    assert client.get("/api/v1/events?sport=nhl").status_code == 503


def test_scores_coordinates_and_timezone_are_preserved():
    row = {
        "idEvent": "1",
        "strEvent": "A vs B",
        "strTimestamp": "2026-09-22T16:00:00",
        "strStatus": "In Progress",
        "intHomeScore": 0,
        "intAwayScore": 0,
    }
    result = public_data.sportsdb_event(row)
    assert result["start"].endswith("+00:00") and result["completed"] is False
    assert result["home_score"] == 0
    mlb = public_data.mlb_event(
        {
            "gamePk": 1,
            "gameDate": "2026-09-22T16:00:00Z",
            "status": {"abstractGameState": "Final", "detailedState": "Final"},
            "teams": {
                "home": {"team": {"name": "Home"}, "score": 0},
                "away": {"team": {"name": "Away"}, "score": 1},
            },
            "venue": {
                "name": "Stadium",
                "location": {
                    "city": "City",
                    "defaultCoordinates": {"latitude": 40, "longitude": -73},
                },
            },
        }
    )
    assert mlb["latitude"] == 40 and mlb["home_score"] == 0 and mlb["completed"]


def test_standings_preserve_zero_and_provider_season(client, monkeypatch):
    async def fake(*args, **kwargs):
        return {
            "records": [
                {
                    "division": {"season": "2026", "name": "East"},
                    "teamRecords": [
                        {
                            "team": {"name": "Team"},
                            "divisionRank": "1",
                            "wins": 0,
                            "losses": 0,
                            "winningPercentage": ".000",
                            "gamesBack": "0",
                        }
                    ],
                }
            ]
        }

    monkeypatch.setattr(public_data, "get_json", fake)
    result = client.get("/api/v1/sports/mlb/standings").json()
    assert result["season"] == "2026"
    assert result["tables"][0]["rows"][0]["Win"] == 0


def test_weather_returns_remote_location_offset(client, monkeypatch):
    async def fake(*args, **kwargs):
        return {
            "utc_offset_seconds": -14400,
            "current": {
                "temperature_2m": 20,
                "wind_speed_10m": 0,
                "weather_code": 0,
                "time": "2026-09-22T04:30",
            },
            "hourly": {
                "time": ["2026-09-22T05:00"],
                "temperature_2m": [21],
                "weather_code": [0],
            },
        }

    import app.services.weather as weather

    monkeypatch.setattr(weather, "get_json", fake)
    result = client.get("/api/v1/weather?lat=40&lon=-73&hourly=true&hours=1").json()
    assert result["current"]["observation_time"].endswith("-04:00")
    assert result["hourly"][0]["time"].endswith("-04:00")


def test_rescheduled_mlb_detail_uses_latest_fixture(client, monkeypatch):
    def game(date, state):
        return {
            "gamePk": 823543,
            "gameDate": date,
            "status": {"detailedState": state, "abstractGameState": "Preview"},
            "teams": {
                "home": {"team": {"name": "Home"}},
                "away": {"team": {"name": "Away"}},
            },
            "venue": {"name": "Stadium"},
        }

    async def fake(*args, **kwargs):
        return {
            "dates": [
                {"games": [game("2026-05-23T16:00:00Z", "Postponed")]},
                {"games": [game("2026-09-22T16:00:00Z", "Scheduled")]},
            ]
        }

    monkeypatch.setattr(public_data, "get_json", fake)
    response = client.get("/api/v1/events/mlb-823543")
    assert response.status_code == 200
    assert response.json()["start"] == "2026-09-22T16:00:00Z"
    assert response.json()["status"] == "Scheduled"


def test_community_pagination_keeps_older_posts_reachable(client):
    headers = account(client, "pagination-member")
    ids = []
    for index in range(4):
        ids.append(
            client.post(
                "/api/v1/community",
                headers=headers,
                json={"content": f"Activity {index}"},
            ).json()["id"]
        )
    first = client.get("/api/v1/community?limit=2&skip=0").json()
    second = client.get("/api/v1/community?limit=2&skip=2").json()
    assert first["has_more"] is True
    assert second["has_more"] is False
    assert [p["id"] for p in first["posts"] + second["posts"]] == list(reversed(ids))
    for id in ids:
        assert (
            client.delete(f"/api/v1/community/{id}", headers=headers).status_code == 200
        )


def test_places_use_labelled_last_good_data_during_provider_outage(client, monkeypatch):
    import json
    import time
    from pathlib import Path
    from app.core import place_cache
    from app.core.config import settings

    key = "places:51.507:-0.128:700"
    saved = {
        "places": [
            {
                "id": "osm-node-1",
                "name": "Mapped court",
                "latitude": 51.507,
                "longitude": -0.128,
            }
        ],
        "source": "OpenStreetMap",
        "updated_at": "2026-09-22T08:00:00+00:00",
        "radius": 700,
        "limited": False,
    }
    place_cache.write(key, saved)
    file = next(Path(settings.PLACE_CACHE_DIR).glob("*.json"))
    record = json.loads(file.read_text())
    record["saved_at"] = time.time() - 7200
    file.write_text(json.dumps(record))

    async def unavailable(*args, **kwargs):
        raise HTTPException(503, "Busy")

    monkeypatch.setattr(public_data, "get_json", unavailable)
    response = client.get("/api/v1/places?lat=51.507&lon=-0.128&radius=700")
    assert response.status_code == 200
    assert response.json()["stale"] is True
    assert response.json()["updated_at"] == saved["updated_at"]
    assert response.json()["places"][0]["name"] == "Mapped court"


def test_goals_are_private_and_measure_real_workouts(client):
    owner = account(client, "goals-owner")
    other = account(client, "goals-other")
    start = datetime.now(timezone.utc).isoformat()
    workout = client.post(
        "/api/v1/workouts",
        headers=owner,
        json={
            "sport": "running",
            "started_at": start,
            "duration_sec": 1801,
            "distance_m": 5000,
        },
    )
    assert workout.status_code == 200
    goal = client.post(
        "/api/v1/goals",
        headers=owner,
        json={
            "title": "Run 10 km",
            "sport": "running",
            "metric": "distance_m",
            "target": 10000,
            "period": "monthly",
        },
    )
    assert goal.status_code == 201
    id = goal.json()["id"]
    rows = client.get("/api/v1/goals?tz=UTC", headers=owner).json()["goals"]
    assert rows[0]["progress"] == 5000 and rows[0]["percent"] == 50
    assert client.get("/api/v1/goals", headers=other).json()["goals"] == []
    assert client.delete(f"/api/v1/goals/{id}", headers=other).status_code == 404
    assert client.get("/api/v1/goals?tz=../UTC", headers=owner).status_code == 422
    assert client.get("/api/v1/goals?tz=", headers=owner).status_code == 422
    assert client.delete(f"/api/v1/goals/{id}", headers=owner).status_code == 200


def test_groups_sessions_rsvp_and_owner_boundaries(client):
    from datetime import timedelta

    owner = account(client, "club-owner")
    member = account(client, "club-member")
    outsider = account(client, "club-outsider")
    club = client.post(
        "/api/v1/clubs",
        headers=owner,
        json={
            "name": "Morning Runners",
            "sport": "running",
            "city": "London",
            "description": "Friendly morning running sessions.",
        },
    ).json()
    assert club["members"] == 1 and club["joined"]
    id = club["id"]
    assert "member_names" not in client.get(f"/api/v1/clubs/{id}").json()
    payload = {
        "title": "A morning run",
        "sport": "running",
        "description": "An easy 5 km run for the group.",
        "city": "London",
        "venue": "Park entrance",
        "starts_at": (datetime.now(timezone.utc) + timedelta(days=2)).isoformat(),
        "club_id": id,
        "latitude": 51.5,
        "longitude": -0.1,
    }
    assert (
        client.post("/api/v1/sessions", headers=outsider, json=payload).status_code
        == 403
    )
    assert (
        client.post(
            "/api/v1/sessions", headers=owner, json={**payload, "club_id": 0}
        ).status_code
        == 422
    )
    assert (
        client.post(
            "/api/v1/sessions", headers=owner, json={**payload, "title": "   "}
        ).status_code
        == 422
    )
    joined = client.post(f"/api/v1/clubs/{id}/membership", headers=member).json()
    assert joined["joined"] and joined["members"] == 2
    event = client.post("/api/v1/sessions", headers=owner, json=payload)
    assert event.status_code == 201
    session_id = event.json()["session_id"]
    assert client.get(f"/api/v1/events/local-{session_id}").status_code == 200
    assert (
        client.post(f"/api/v1/sessions/{session_id}/rsvp", headers=member).json()[
            "attendees"
        ]
        == 2
    )
    assert (
        client.post(f"/api/v1/sessions/{session_id}/rsvp", headers=member).json()[
            "attendees"
        ]
        == 1
    )
    assert (
        client.delete(f"/api/v1/sessions/{session_id}", headers=outsider).status_code
        == 404
    )
    assert client.delete(f"/api/v1/clubs/{id}", headers=outsider).status_code == 404
    assert client.delete(f"/api/v1/clubs/{id}", headers=owner).status_code == 200
    assert client.get(f"/api/v1/sessions/{session_id}").json()["club_id"] is None
    assert (
        client.delete(f"/api/v1/sessions/{session_id}", headers=owner).status_code
        == 200
    )


def test_workout_edit_and_export_do_not_expose_other_accounts(client):
    owner = account(client, "editor-owner")
    other = account(client, "editor-other")
    created = client.post(
        "/api/v1/workouts",
        headers=owner,
        json={
            "sport": "cycling",
            "started_at": "2026-01-15T12:15:43Z",
            "duration_sec": 1801,
            "distance_m": 5000.125,
            "notes": "Original",
        },
    ).json()
    path = f'/api/v1/workouts/{created["id"]}'
    payload = {
        "sport": "cycling",
        "duration_sec": 1801,
        "distance_m": 5000.125,
        "started_at": created["started_at"],
        "notes": "Updated note",
    }
    assert client.put(path, headers=other, json=payload).status_code == 404
    result = client.put(path, headers=owner, json=payload)
    assert result.status_code == 200 and result.json()["distance_m"] == 5000.125
    assert ":43" in result.json()["started_at"]
    export = client.get("/api/v1/users/me/export", headers=owner).json()
    assert (
        len(export["workouts"]) == 1
        and export["workouts"][0]["notes"] == "Updated note"
    )
    assert "hashed_password" not in str(export) and "password" not in export["profile"]
    assert client.get("/api/v1/users/me/export", headers=other).json()["workouts"] == []


def test_multisport_benchmarks_are_sourced_and_not_percentiles(client):
    cycling = client.get("/api/v1/athletes/cycling").json()["athletes"][0]
    assert cycling["distance_m"] == 56792 and cycling["date"] == "2022-10-08"
    result = client.post(
        "/api/v1/athletes/compare",
        json={
            "sport": "cycling",
            "athlete_id": cycling["id"],
            "user_metrics": {"distance_m": 30000},
        },
    )
    assert result.status_code == 200
    metric = result.json()["metrics"][0]
    assert metric["delta"] == 30000 - 56792 and metric["percentile"] is None
    swimming = client.get("/api/v1/athletes/swimming").json()["athletes"][0]
    assert swimming["time_sec"] == 220.07 and swimming["distance_m"] == 400


def test_nba_records_use_only_final_regular_season_games():
    from app.services.nba import derive_records, normalize

    home = {"id": 1, "full_name": "Home", "conference": "East", "division": "Atlantic"}
    away = {"id": 2, "full_name": "Away", "conference": "West", "division": "Pacific"}
    final = {
        "id": 1,
        "season": 2025,
        "home_team": home,
        "visitor_team": away,
        "home_team_score": 100,
        "visitor_team_score": 99,
        "status_state": "final",
        "postseason": False,
    }
    future = {
        **final,
        "id": 2,
        "status_state": "scheduled",
        "home_team_score": 0,
        "visitor_team_score": 0,
    }
    rows = derive_records([final, future, {**final, "id": 3, "postseason": True}])
    assert sum(r["played"] for r in rows) == 2 and sum(r["wins"] for r in rows) == 1
    normalized = normalize(future)
    assert normalized["home_score"] is None and normalized["away_score"] is None


def test_fixture_pagination_reuses_one_catalogue(client, monkeypatch):
    import app.api.v1.endpoints.events as endpoint

    cache._store.clear()
    calls = []

    async def fake(key):
        calls.append(key)
        return {
            "upcoming": [
                {
                    "id": str(i),
                    "name": f"Race {i}",
                    "start": f"2027-01-{i+1:02d}T12:00:00Z",
                }
                for i in range(5)
            ],
            "source": "Test source",
            "coverage": "Full fixtures",
            "limited": False,
        }

    monkeypatch.setattr(endpoint, "sports_events", fake)
    first = client.get("/api/v1/events?sport=f1&limit=2&page=1").json()
    second = client.get("/api/v1/events?sport=f1&limit=2&page=2").json()
    assert first["total"] == second["total"] == 5
    assert first["updated_at"] == second["updated_at"]
    assert calls == ["f1"]
    assert set(e["id"] for e in first["events"]).isdisjoint(
        e["id"] for e in second["events"]
    )


def test_large_schedules_do_not_evict_provider_cache_entries(client, monkeypatch):
    import time

    cache._store.clear()
    cache._store["provider-sentinel"] = (time.time() + 3600, {"ok": True})
    calls = []

    async def fake(url, *args, **kwargs):
        calls.append(url)
        if url.endswith("/bl1"):
            return [{"leagueSeason": 2026}]
        return [
            {
                "matchID": i,
                "team1": {"teamName": "Home"},
                "team2": {"teamName": "Away"},
                "matchDateTimeUTC": "2027-01-01T12:00:00Z",
                "matchIsFinished": False,
            }
            for i in range(1100)
        ]

    monkeypatch.setattr(public_data, "get_json", fake)
    assert len(client.get("/api/v1/sports/bundesliga").json()["upcoming"]) == 1100
    assert len(client.get("/api/v1/sports/bundesliga").json()["upcoming"]) == 1100
    assert len(calls) == 2
    assert "provider-sentinel" in cache._store


def test_documented_oauth_form_works(client):
    account(client, "swagger-member")
    token = client.post(
        "/api/v1/auth/token",
        data={"username": "swagger-member", "password": "A-valid-password-123"},
    )
    assert token.status_code == 200
    assert (
        client.get(
            "/api/v1/users/me",
            headers={"Authorization": "Bearer " + token.json()["access_token"]},
        ).status_code
        == 200
    )
    schema = client.get("/openapi.json").json()
    assert (
        schema["components"]["securitySchemes"]["OAuth2PasswordBearer"]["flows"][
            "password"
        ]["tokenUrl"]
        == "/api/v1/auth/token"
    )


def test_organiser_fallback_keeps_websites_separate_from_events(client, monkeypatch):
    import httpx
    from app.services import local_discovery as discovery

    cache._store.clear()
    monkeypatch.setattr(discovery.settings, "SERPAPI_API_KEY", "test-key")
    monkeypatch.setattr(discovery.settings, "TICKETMASTER_API_KEY", "")
    seen = []

    async def response(self, url, **kwargs):
        seen.append((url, kwargs.get("params", {})))
        payload = (
            {"plan_monthly_price": 0, "total_searches_left": 20}
            if url.endswith("/account")
            else {
                "organic_results": [
                    {
                        "title": "Local cycling club",
                        "link": "https://example.org/rides",
                        "snippet": "Weekly rides",
                    },
                    {"title": "Duplicate", "link": "https://example.org/rides"},
                    {"title": "Unsafe", "link": "javascript:alert(1)"},
                ]
            }
        )
        return httpx.Response(200, json=payload, request=httpx.Request("GET", url))

    monkeypatch.setattr(httpx.AsyncClient, "get", response)
    route = "/api/v1/discovery/events?city=Testville&sport=cycling"
    result = client.get(route)
    assert result.status_code == 200, result.text
    data = result.json()
    assert data["events"] == [] and len(data["organisers"]) == 1
    assert (
        "start" not in data["organisers"][0] and "latitude" not in data["organisers"][0]
    )
    assert seen[-1][1]["engine"] == "google"
    assert client.get(route).json()["cached"] is True
    assert len(seen) == 2


def test_ticketmaster_date_filter_precedes_result_limit_and_supports_music(
    client, monkeypatch
):
    import httpx
    from app.services import local_discovery as discovery

    monkeypatch.setattr(discovery.settings, "TICKETMASTER_API_KEY", "test-key")
    seen = []

    async def response(self, url, **kwargs):
        seen.append(kwargs["params"])
        return httpx.Response(
            200,
            json={
                "_embedded": {
                    "events": [
                        {
                            "id": "music-test",
                            "name": "Evening music",
                            "url": "https://example.org/music",
                            "dates": {"start": {"dateTime": "2027-07-03T18:00:00Z"}},
                            "classifications": [{"genre": {"name": "Music"}}],
                        }
                    ]
                }
            },
            request=httpx.Request("GET", url),
        )

    monkeypatch.setattr(httpx.AsyncClient, "get", response)
    route = "/api/v1/discovery/events?city=Musicville&sport=music&tz=Europe/London&date_from=2027-07-03&date_to=2027-07-04"
    result = client.get(route)
    assert result.status_code == 200, result.text
    assert result.json()["events"][0]["name"] == "Evening music"
    assert seen[0]["classificationName"] == "music"
    assert seen[0]["startDateTime"] == "2027-07-02T23:00:00Z"
    assert seen[0]["endDateTime"] == "2027-07-04T22:59:59Z"
    assert (
        client.get(
            route.replace("date_to=2027-07-04", "date_to=2027-07-01")
        ).status_code
        == 422
    )


def test_gaming_and_chess_practice_can_be_logged_without_distance(client):
    headers = account(client, "gaming-member")
    for sport in ["gaming", "chess"]:
        result = client.post(
            "/api/v1/workouts",
            headers=headers,
            json={"sport": sport, "duration_sec": 1800},
        )
        assert result.status_code == 200, result.text
        assert result.json()["sport"] == sport and not result.json().get("distance_m")


def test_session_dates_and_all_sport_filter_before_result_limit(client):
    from app.db.session import SessionLocal
    from app.models.user import User
    from app.models.participation import SessionEvent
    from datetime import timedelta

    account(client, "date-host")
    with SessionLocal() as db:
        owner = db.query(User).filter_by(email="date-host@example.com").one()
        first = datetime(2029, 7, 1, 12, tzinfo=timezone.utc)
        for i in range(201):
            db.add(
                SessionEvent(
                    host_id=owner.id,
                    title=f"Early session {i}",
                    sport="running",
                    description="",
                    city="Dateville",
                    venue="Park",
                    starts_at=first + timedelta(minutes=i),
                )
            )
        for sport in ["running", "gaming"]:
            db.add(
                SessionEvent(
                    host_id=owner.id,
                    title=f"Later {sport}",
                    sport=sport,
                    description="",
                    city="Dateville",
                    venue="Club",
                    starts_at=datetime(2029, 7, 3, 12, tzinfo=timezone.utc),
                )
            )
        db.commit()
    result = client.get(
        "/api/v1/sessions?city=Dateville&sport=sports&date_from=2029-07-03&date_to=2029-07-03&tz=Europe/London"
    )
    assert result.status_code == 200, result.text
    assert [e["name"] for e in result.json()["events"]] == ["Later running"]
