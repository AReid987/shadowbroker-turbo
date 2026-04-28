import os
import httpx
from datetime import datetime, timedelta
from typing import Any
from ..cache import cache

OPENSKY_URL = "https://opensky-network.org/api/states/all"

def _transform_opensky(states: list) -> list[dict[str, Any]]:
    results = []
    for s in states[:50]:  # Limit to 50
        callsign = (s[1] or "UNKNOWN").strip()
        icao = s[0]
        lat = s[6]
        lon = s[5]
        if lat is None or lon is None:
            continue
        results.append({
            "id": f"flight_{icao}",
            "type": "flight",
            "label": f"{callsign}",
            "position": {"lat": lat, "lng": lon},
            "heading": s[10] or 0,
            "altitude": s[7] or 0,
            "speed": (s[9] or 0) * 1.852,  # m/s to km/h
            "metadata": {
                "icao": icao,
                "callsign": callsign,
                "origin": s[2],
                "on_ground": s[8],
            },
            "timestamp": datetime.utcnow().isoformat(),
        })
    return results

async def fetch_flights() -> list[dict[str, Any]]:
    cached = cache.get("flights")
    if cached:
        return cached

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(OPENSKY_URL)
            resp.raise_for_status()
            data = resp.json()
            states = data.get("states", [])
            results = _transform_opensky(states)
            cache.set("flights", results, 30)
            return results
    except Exception:
        # Real data only — return empty on failure, never fake data
        cache.set("flights", [], 30)
        return []
