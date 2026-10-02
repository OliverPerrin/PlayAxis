"""Deterministic provider concurrency and connection-lifecycle regressions."""

import asyncio

import httpx
import pytest

from app.core.cache import TTLCache
from app.services import http_client


def test_singleflight_shares_request_and_survives_one_cancelled_waiter():
    async def scenario():
        cache = TTLCache()
        entered, release = asyncio.Event(), asyncio.Event()
        calls = 0

        async def producer():
            nonlocal calls
            calls += 1
            entered.set()
            await release.wait()
            return {"fresh": True}

        first = asyncio.create_task(cache.get_or_set("fixture", 60, producer))
        await entered.wait()
        others = [
            asyncio.create_task(cache.get_or_set("fixture", 60, producer))
            for _ in range(19)
        ]
        first.cancel()
        with pytest.raises(asyncio.CancelledError):
            await first
        release.set()
        assert await asyncio.gather(*others) == [{"fresh": True}] * 19
        assert calls == 1
        assert await cache.get_or_set("fixture", 60, producer) == {"fresh": True}
        assert calls == 1
        assert not cache._inflight

    asyncio.run(scenario())


def test_failed_flight_is_shared_but_retry_is_not_cached():
    async def scenario():
        cache = TTLCache()
        release = asyncio.Event()
        calls = 0

        async def producer():
            nonlocal calls
            calls += 1
            await release.wait()
            raise ValueError("provider unavailable")

        pending = [
            asyncio.create_task(cache.get_or_set("failure", 60, producer))
            for _ in range(10)
        ]
        await asyncio.sleep(0)
        release.set()
        results = await asyncio.gather(*pending, return_exceptions=True)
        assert all(isinstance(result, ValueError) for result in results)
        assert calls == 1
        assert await cache.get("failure") is None
        with pytest.raises(ValueError):
            await cache.get_or_set("failure", 60, producer)
        assert calls == 2
        assert not cache._inflight

    asyncio.run(scenario())


def test_independent_cache_keys_start_without_waiting_for_each_other():
    async def scenario():
        cache = TTLCache()
        started = set()
        both_started = asyncio.Event()

        async def producer(key):
            started.add(key)
            if len(started) == 2:
                both_started.set()
            await asyncio.wait_for(both_started.wait(), 1)
            return key

        assert await asyncio.gather(
            cache.get_or_set("a", 60, lambda: producer("a")),
            cache.get_or_set("b", 60, lambda: producer("b")),
        ) == ["a", "b"]

    asyncio.run(scenario())


def test_http_pool_reuse_request_options_and_shutdown(monkeypatch):
    instances, seen = [], []
    actual_client = httpx.AsyncClient

    def respond(request):
        seen.append(request)
        return httpx.Response(200, json={"ok": True})

    def factory(**kwargs):
        client = actual_client(transport=httpx.MockTransport(respond), **kwargs)
        instances.append(client)
        return client

    monkeypatch.setattr(http_client.httpx, "AsyncClient", factory)

    async def scenario():
        async with http_client.provider_http_lifespan():
            async with http_client.provider_client(
                timeout=18, headers={"X-Auth-Token": "football-only"}
            ) as client:
                await client.get("https://football.example/feed")
            async with http_client.provider_client(timeout=15) as client:
                await client.get("https://weather.example/feed")
            assert len(instances) == 1
            assert not instances[0].is_closed
        assert instances[0].is_closed
        assert not http_client._clients
        assert seen[0].headers["X-Auth-Token"] == "football-only"
        assert "X-Auth-Token" not in seen[1].headers
        assert seen[0].extensions["timeout"]["read"] == 18
        assert seen[1].extensions["timeout"]["read"] == 15
        async with http_client.provider_client(timeout=10) as client:
            await client.get("https://weather.example/standalone")
        assert len(instances) == 2
        assert instances[1].is_closed

    asyncio.run(scenario())


def test_public_and_csv_provider_bursts_make_one_request(monkeypatch):
    from app.services import league_feeds, public_data

    async def scenario():
        calls = []
        cache = TTLCache()
        monkeypatch.setattr(public_data, "cache", cache)
        monkeypatch.setattr(league_feeds, "cache", cache)

        async def respond(self, method, url, **kwargs):
            calls.append(url)
            await asyncio.sleep(0)
            request = httpx.Request(method, url)
            if url.endswith(".csv"):
                return httpx.Response(
                    200, text="team,wins\nExample,3\n", request=request
                )
            return httpx.Response(200, json={"fixtures": []}, request=request)

        monkeypatch.setattr(httpx.AsyncClient, "request", respond)
        async with http_client.provider_http_lifespan():
            results = await asyncio.gather(
                *[
                    public_data.get_json("https://provider.example/schedule")
                    for _ in range(20)
                ]
            )
            assert results == [{"fixtures": []}] * 20
            records = await asyncio.gather(
                *[
                    league_feeds.csv_feed("https://provider.example/standings.csv")
                    for _ in range(20)
                ]
            )
            assert records == [[{"team": "Example", "wins": "3"}]] * 20
        assert calls == [
            "https://provider.example/schedule",
            "https://provider.example/standings.csv",
        ]

    asyncio.run(scenario())


def test_event_snapshot_batch_uses_one_transaction_and_preserves_updates(monkeypatch):
    from sqlalchemy import create_engine, event
    from sqlalchemy.orm import sessionmaker
    from app.models.participation import DiscoveryCache
    from app.services import local_discovery

    engine = create_engine("sqlite:///:memory:")
    DiscoveryCache.__table__.create(engine)
    sessions = sessionmaker(bind=engine)
    monkeypatch.setattr(local_discovery, "SessionLocal", sessions)
    commits = []
    event.listen(engine, "commit", lambda connection: commits.append(True))
    items = {f"event:{i}": {"name": f"Event {i}"} for i in range(100)}
    items["search:city"] = {"events": list(items.values())}
    try:
        local_discovery._store_many(items)
        assert len(commits) == 1
        with sessions() as db:
            assert db.query(DiscoveryCache).count() == 101
        local_discovery._store_many({"event:0": {"name": "Updated"}})
        assert len(commits) == 2
        with sessions() as db:
            assert db.get(DiscoveryCache, "event:0").data == {"name": "Updated"}
            assert db.query(DiscoveryCache).count() == 101
    finally:
        engine.dispose()
