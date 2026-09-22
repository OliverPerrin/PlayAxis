#!/usr/bin/env python3
"""Read-only smoke check of a running PlayAxis API. Never creates accounts or sends mail."""

import argparse
import asyncio
import sys
import httpx

CHECKS = [
    (
        "EPL full table",
        "/sports/epl/standings",
        lambda d: len(d.get("tables", [{}])[0].get("rows", [])) == 20,
    ),
    (
        "NFL full table",
        "/sports/nfl/standings",
        lambda d: len(d.get("tables", [{}])[0].get("rows", [])) == 32,
    ),
    (
        "NBA team records",
        "/sports/nba/standings",
        lambda d: len(d.get("tables", [{}])[0].get("rows", [])) == 30,
    ),
    ("Twitch sports", "/streams?category=sports", lambda d: bool(d.get("data"))),
    ("Twitch esports", "/streams?category=esports", lambda d: bool(d.get("data"))),
    (
        "London organiser listings",
        "/discovery/events?city=London&country=United%20Kingdom&lat=51.51&lon=-0.13&sport=sports&tz=Europe%2FLondon",
        lambda d: bool(d.get("events")),
    ),
    (
        "London cycling discovery",
        "/discovery/events?city=London&country=United%20Kingdom&lat=51.51&lon=-0.13&sport=cycling&tz=Europe%2FLondon",
        lambda d: bool(d.get("events") or d.get("organisers")),
    ),
    ("health", "/healthz", lambda d: d.get("ok") is True),
    ("supported leagues", "/sports", lambda d: len(d.get("sports", [])) >= 4),
    (
        "Bundesliga fixtures",
        "/sports/bundesliga",
        lambda d: bool(d.get("upcoming") or d.get("recent")),
    ),
    (
        "Formula 1 standings",
        "/sports/f1/standings",
        lambda d: bool(d.get("tables", [{}])[0].get("rows")),
    ),
    (
        "MLB fixtures",
        "/sports/mlb",
        lambda d: bool(d.get("upcoming") or d.get("recent")),
    ),
    (
        "NHL standings",
        "/sports/nhl/standings",
        lambda d: bool(d.get("tables", [{}])[0].get("rows")),
    ),
    ("London city search", "/locations?q=London", lambda d: bool(d.get("locations"))),
    (
        "London weather",
        "/weather?lat=51.5072&lon=-0.1276&hourly=true&hours=3",
        lambda d: len(d.get("hourly") or []) == 3,
    ),
    ("live chess channels", "/streams", lambda d: bool(d.get("data"))),
    (
        "London nearby places",
        "/places?lat=51.5072&lon=-0.1276&radius=700",
        lambda d: bool(d.get("places")),
    ),
]


async def main(base):
    async with httpx.AsyncClient(timeout=40, follow_redirects=True) as client:

        async def check(name, path, validate):
            try:
                response = await client.get(base.rstrip("/") + path)
                response.raise_for_status()
                data = response.json()
                if not validate(data):
                    print(f"UNAVAILABLE {name}: response contains no expected data")
                    return False
                print(f"PASS {name}: HTTP {response.status_code}")
                return True
            except (httpx.HTTPError, ValueError, KeyError, IndexError) as error:
                print(f"FAIL {name}: {error.__class__.__name__}")
                return False

        results = await asyncio.gather(*(check(*item) for item in CHECKS))
    print(
        f"{sum(results)}/{len(results)} live read-only checks passed. External service availability can change."
    )
    return 0 if all(results) else 1


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base-url", default="http://localhost:8000/api/v1")
    args = parser.parse_args()
    sys.exit(asyncio.run(main(args.base_url)))
