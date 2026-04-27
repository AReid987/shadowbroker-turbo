import os
import httpx
from datetime import datetime, timedelta
from typing import Any
from ..cache import cache

OPENSKY_URL = "https://opensky-network.org/api/states/all"

# Demo fallback data
DEMO_FLIGHTS = [
    {"id": "f1", "type": "flight", "label": "BA117 LHR→JFK", "position": {"lat": 51.47, "lng": -0.46}, "heading": 285, "altitude": 36000, "speed": 540, "metadata": {"type": "B777", "callsign": "BAW117"}, "timestamp": datetime.utcnow().isoformat()},
    {"id": "f2", "type": "flight", "label": "DL4 JFK→CDG", "position": {"lat": 40.64, "lng": -73.78}, "heading": 65, "altitude": 32000, "speed": 510, "metadata": {"type": "A350", "callsign": "DAL4"}, "timestamp": datetime.utcnow().isoformat()},
    {"id": "f3", "type": "flight", "label": "NH1 HND→LAX", "position": {"lat": 35.55, "lng": 139.78}, "heading": 45, "altitude": 41000, "speed": 560, "metadata": {"type": "A380", "callsign": "ANA1"}, "timestamp": datetime.utcnow().isoformat()},
]

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
        # Fallback to demo data
        cache.set("flights", DEMO_FLIGHTS, 30)
        return DEMO_FLIGHTS
