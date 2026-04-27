import os
import random
from datetime import datetime
from typing import Any
from ..cache import cache

SIGNALS_POOL = [
    {"id": "r1", "frequency": 142.350, "mode": "FM", "strength": 73, "label": "Maritime Ch 16", "latitude": 51.5, "longitude": -0.1},
    {"id": "r2", "frequency": 446.006, "mode": "FM", "strength": 45, "label": "PMR Ch 1", "latitude": 40.7, "longitude": -74.0},
    {"id": "r3", "frequency": 3.500, "mode": "CW", "strength": 28, "label": "80m Amateur", "latitude": 35.7, "longitude": 139.7},
    {"id": "r4", "frequency": 145.800, "mode": "FM", "strength": 91, "label": "ISS Downlink", "latitude": 0, "longitude": -100},
    {"id": "r5", "frequency": 118.100, "mode": "AM", "strength": 62, "label": "ATC Tower", "latitude": 51.47, "longitude": -0.46},
    {"id": "r6", "frequency": 437.500, "mode": "DIGITAL", "strength": 55, "label": "CubeSat Beacon", "latitude": 28.5, "longitude": -80.6},
    {"id": "r7", "frequency": 156.800, "mode": "FM", "strength": 67, "label": "Maritime Distress", "latitude": 1.2, "longitude": 103.8},
    {"id": "r8", "frequency": 243.000, "mode": "AM", "strength": 41, "label": "Military Guard", "latitude": 38.9, "longitude": -77.0},
]

async def fetch_signals() -> list[dict[str, Any]]:
    cached = cache.get("sigint")
    if cached:
        return cached

    # Simulate live signal fluctuations
    results = []
    for sig in SIGNALS_POOL:
        s = dict(sig)
        s["strength"] = max(5, min(100, s["strength"] + random.randint(-8, 8)))
        s["timestamp"] = datetime.utcnow().isoformat()
        results.append(s)

    cache.set("sigint", results, 15)
    return results
