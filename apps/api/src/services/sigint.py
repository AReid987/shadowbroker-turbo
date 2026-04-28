import os
from datetime import datetime
from typing import Any
from ..cache import cache

async def fetch_signals() -> list[dict[str, Any]]:
    cached = cache.get("sigint")
    if cached:
        return cached

    # Real data only — SIGINT requires SDR hardware or live radio monitoring APIs.
    # Return empty until a real signal source is configured.
    cache.set("sigint", [], 15)
    return []
