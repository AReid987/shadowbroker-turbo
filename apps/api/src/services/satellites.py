import httpx
from datetime import datetime
from typing import Any
from ..cache import cache

CELESTRAK_URL = "https://celestrak.org/NORAD/elements/gp.php"

DEMO_SATELLITES = [
    {"id": "s1", "type": "satellite", "label": "ISS (ZARYA)", "position": {"lat": 0, "lng": -100}, "heading": 0, "altitude": 408000, "speed": 27600, "metadata": {"type": "ISS", "norad": "25544"}, "timestamp": datetime.utcnow().isoformat()},
    {"id": "s2", "type": "satellite", "label": "Starlink-1234", "position": {"lat": 28.5, "lng": -80.6}, "heading": 0, "altitude": 550000, "speed": 27300, "metadata": {"type": "LEO", "norad": "45678"}, "timestamp": datetime.utcnow().isoformat()},
]

async def fetch_satellites() -> list[dict[str, Any]]:
    cached = cache.get("satellites")
    if cached:
        return cached

    # TLE fetching and SGP4 propagation would go here
    # For now, return demo data with timestamp updates
    results = []
    for s in DEMO_SATELLITES:
        s_copy = dict(s)
        s_copy["timestamp"] = datetime.utcnow().isoformat()
        results.append(s_copy)

    cache.set("satellites", results, 60)
    return results
