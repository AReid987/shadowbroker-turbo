import httpx
from datetime import datetime
from typing import Any
from ..cache import cache

MANIFOLD_URL = "https://api.manifold.markets/v0/markets"

DEMO_MARKETS = [
    {"id": "m1", "title": "Will a major shipping lane close due to conflict in Q2 2025?", "category": "Geopolitics", "outcomes": [{"id": "o1", "label": "Yes", "probability": 0.34, "stake": 14200}, {"id": "o2", "label": "No", "probability": 0.66, "stake": 27800}], "volume": 42000, "closingDate": "2025-06-30", "status": "open"},
    {"id": "m2", "title": "Will a critical zero-day in open-source infrastructure be exploited at scale?", "category": "Cybersecurity", "outcomes": [{"id": "o1", "label": "Yes, within 30 days", "probability": 0.52, "stake": 8900}, {"id": "o2", "label": "Yes, within 90 days", "probability": 0.31, "stake": 5300}, {"id": "o3", "label": "No", "probability": 0.17, "stake": 2900}], "volume": 17100, "closingDate": "2025-04-15", "status": "open"},
    {"id": "m3", "title": "Will satellite imagery resolution commercially available exceed 25cm by EOY?", "category": "Technology", "outcomes": [{"id": "o1", "label": "Yes", "probability": 0.71, "stake": 34500}, {"id": "o2", "label": "No", "probability": 0.29, "stake": 14100}], "volume": 48600, "closingDate": "2025-12-31", "status": "open"},
]

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
        cache.set("markets", DEMO_MARKETS, 300)
        return DEMO_MARKETS
