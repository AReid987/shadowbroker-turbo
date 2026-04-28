import httpx
from datetime import datetime
from typing import Any
from ..cache import cache

MANIFOLD_URL = "https://api.manifold.markets/v0/markets"

async def fetch_markets() -> list[dict[str, Any]]:
    cached = cache.get("markets")
    if cached:
        return cached

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(MANIFOLD_URL, params={"limit": 20})
            resp.raise_for_status()
            data = resp.json()
            results = []
            for m in data:
                prob = m.get("probability", 0.5)
                outcomes = []
                if m.get("outcomeType") == "BINARY":
                    outcomes = [
                        {"id": "yes", "label": "Yes", "probability": prob, "stake": m.get("volume", 0) * prob},
                        {"id": "no", "label": "No", "probability": 1 - prob, "stake": m.get("volume", 0) * (1 - prob)},
                    ]
                else:
                    outcomes = [{"id": "o1", "label": "Yes", "probability": prob, "stake": m.get("volume", 0)}]
                results.append({
                    "id": m.get("id", ""),
                    "title": m.get("question", ""),
                    "category": m.get("groupSlugs", ["General"])[0] if m.get("groupSlugs") else "General",
                    "outcomes": outcomes,
                    "volume": int(m.get("volume", 0)),
                    "closingDate": m.get("closeTime", datetime.utcnow().isoformat()),
                    "status": "open" if not m.get("isResolved") else "resolved",
                })
            cache.set("markets", results, 300)
            return results
    except Exception:
        # Real data only — return empty on failure, never fake data
        cache.set("markets", [], 300)
        return []
