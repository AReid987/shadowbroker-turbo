import os
import httpx
from datetime import datetime
from typing import Any
from ..cache import cache

DEMO_VESSELS = [
    {"id": "v1", "type": "vessel", "label": "MV Atlas Trader", "position": {"lat": 1.26, "lng": 103.83}, "heading": 110, "speed": 18, "metadata": {"type": "Container", "mmsi": "123456789"}, "timestamp": datetime.utcnow().isoformat()},
    {"id": "v2", "type": "vessel", "label": "STI Sapphire", "position": {"lat": 35.0, "lng": -15.0}, "heading": 270, "speed": 14, "metadata": {"type": "Tanker", "mmsi": "987654321"}, "timestamp": datetime.utcnow().isoformat()},
    {"id": "v3", "type": "vessel", "label": "COSCO Shanghai", "position": {"lat": 31.2, "lng": 121.5}, "heading": 90, "speed": 22, "metadata": {"type": "Container", "mmsi": "111222333"}, "timestamp": datetime.utcnow().isoformat()},
]

async def fetch_vessels() -> list[dict[str, Any]]:
    cached = cache.get("vessels")
    if cached:
        return cached

    # Free AIS APIs are heavily rate-limited; use demo with slight drift
    # In production, integrate MarineTraffic or VesselFinder paid tiers
    results = []
    for v in DEMO_VESSELS:
        v = dict(v)
        v["timestamp"] = datetime.utcnow().isoformat()
        v["position"] = dict(v["position"])
        # Simulate minor drift
        v["position"]["lat"] += 0.001
        v["position"]["lng"] += 0.001
        results.append(v)

    cache.set("vessels", results, 60)
    return results
