from __future__ import annotations
import time
import asyncio
from typing import Any, Callable


class TTLCache:
    """Simple async-safe in-process TTL cache."""

    def __init__(self):
        self._store: dict[str, tuple[float, Any]] = {}
        self._lock = asyncio.Lock()

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
        value = await producer()
        await self.set(key, value, ttl_seconds)
        return value


cache = TTLCache()
