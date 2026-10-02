from __future__ import annotations
import time
import asyncio
from typing import Any, Callable


class TTLCache:
    """Simple async-safe in-process TTL cache."""

    def __init__(self):
        self._store: dict[str, tuple[float, Any]] = {}
        self._lock = asyncio.Lock()
        self._inflight = {}

    async def get(self, key: str):
        async with self._lock:
            item = self._store.get(key)
            if not item:
                return None
            expires_at, value = item
            if expires_at < time.time():
                self._store.pop(key, None)
                return None
            return value

    async def set(self, key: str, value: Any, ttl_seconds: int):
        async with self._lock:
            if len(self._store) >= 1024 and key not in self._store:
                expired = [
                    k for k, (until, _) in self._store.items() if until < time.time()
                ]
                for k in expired:
                    self._store.pop(k, None)
                if len(self._store) >= 1024:
                    self._store.pop(next(iter(self._store)))
            self._store[key] = (time.time() + ttl_seconds, value)

    async def get_or_set(self, key: str, ttl_seconds: int, producer: Callable[[], Any]):
        existing = await self.get(key)
        if existing is not None:
            return existing
        # One producer per key and event loop. Shielding means a disconnected
        # caller does not cancel a refresh still needed by other requests.
        flight_key = (asyncio.get_running_loop(), key)
        task = self._inflight.get(flight_key)
        if task is None:

            async def produce():
                value = await producer()
                await self.set(key, value, ttl_seconds)
                return value

            task = asyncio.create_task(produce())
            self._inflight[flight_key] = task

            def finished(done):
                if self._inflight.get(flight_key) is done:
                    self._inflight.pop(flight_key, None)
                # Retrieve failures even if every waiting request disconnected.
                if not done.cancelled():
                    done.exception()

            task.add_done_callback(finished)
        return await asyncio.shield(task)


cache = TTLCache()
