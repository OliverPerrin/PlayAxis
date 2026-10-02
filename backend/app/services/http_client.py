"""Reuse outbound connections for the application lifespan, never credentials.

Service defaults are applied to individual requests. Calls made outside an app
lifespan (CLI jobs and isolated tests) own and close a temporary client instead.
"""

import asyncio
from contextlib import asynccontextmanager

import httpx

_clients = {}


class _RequestDefaults:
    def __init__(self, client, defaults):
        self.client = client
        self.defaults = defaults

    def _options(self, options):
        merged = {**self.defaults, **options}
        if "headers" in self.defaults:
            merged["headers"] = {
                **self.defaults["headers"],
                **options.get("headers", {}),
            }
        return merged

    async def get(self, url, **options):
        return await self.client.get(url, **self._options(options))

    async def post(self, url, **options):
        return await self.client.post(url, **self._options(options))

    async def request(self, method, url, **options):
        return await self.client.request(method, url, **self._options(options))


@asynccontextmanager
async def provider_http_lifespan():
    loop = asyncio.get_running_loop()
    async with httpx.AsyncClient(
        limits=httpx.Limits(max_connections=50, max_keepalive_connections=20),
    ) as client:
        previous = _clients.get(loop)
        _clients[loop] = client
        try:
            yield
        finally:
            if previous is None:
                _clients.pop(loop, None)
            else:
                _clients[loop] = previous


@asynccontextmanager
async def provider_client(**defaults):
    client = _clients.get(asyncio.get_running_loop())
    if client is not None:
        yield _RequestDefaults(client, defaults)
    else:
        async with httpx.AsyncClient(**defaults) as client:
            yield client
