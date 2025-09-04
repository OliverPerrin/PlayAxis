import httpx

async def get_weather(lat: float, lon: float):
    params = {
        "latitude": lat,
        "longitude": lon,
        "current_weather": "true",
    }
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.get("https://api.open-meteo.com/v1/forecast", params=params)
        r.raise_for_status()
        data = r.json()
        cw = data.get("current_weather") or {}
        return {
            "latitude": data.get("latitude"),
            "longitude": data.get("longitude"),
            "current": {
                "temperature_c": cw.get("temperature"),
                "windspeed_kph": cw.get("windspeed"),
                "winddirection_deg": cw.get("winddirection"),
                "weathercode": cw.get("weathercode"),
                "time": cw.get("time"),
            },
            "raw": data,
        }