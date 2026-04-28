import os
import httpx
from datetime import datetime
from typing import Any
from ..cache import cache

async def fetch_vessels() -> list[dict[str, Any]]:
    cached = cache.get("vessels")
    if cached:
        return cached

    # Real data only — vessels require MarineTraffic or VesselFinder paid API
    # Return empty until a real AIS data source is configured
    cache.set("vessels", [], 60)
    return []
