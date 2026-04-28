import httpx
from datetime import datetime
from typing import Any
from ..cache import cache

CELESTRAK_URL = "https://celestrak.org/NORAD/elements/gp.php"

async def fetch_satellites() -> list[dict[str, Any]]:
    cached = cache.get("satellites")
    if cached:
        return cached

    # Real data only — satellite TLE fetching and SGP4 propagation
    # requires integration with CelesTrak or Space-Track.
    # Return empty until real orbital mechanics are implemented.
    cache.set("satellites", [], 60)
    return []
