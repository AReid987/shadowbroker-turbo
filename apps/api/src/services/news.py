import os
import httpx
from datetime import datetime
from typing import Any
from ..cache import cache

NEWSAPI_KEY = os.getenv("NEWSAPI_API_KEY")
NEWSAPI_URL = "https://newsapi.org/v2/top-headlines"

SOURCE_CATEGORIES = {
    "osint": "general",
    "defcon": "defense",
    "bloomberg": "finance",
    "techcrunch": "tech",
    "reuters": "geopolitics",
}

async def fetch_news(source: str | None = None, q: str | None = None) -> list[dict[str, Any]]:
    cache_key = f"news:{source or 'all'}:{q or ''}"
    cached = cache.get(cache_key)
    if cached:
        return cached

    if NEWSAPI_KEY:
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                params = {"apiKey": NEWSAPI_KEY, "pageSize": 20, "language": "en"}
                if source:
                    params["sources"] = source
                if q:
                    params["q"] = q
                resp = await client.get(NEWSAPI_URL, params=params)
                resp.raise_for_status()
                data = resp.json()
                articles = data.get("articles", [])
                results = []
                for i, a in enumerate(articles):
                    src_id = a.get("source", {}).get("id", "unknown")
                    results.append({
                        "id": f"n{i}",
                        "title": a.get("title", ""),
                        "source": a.get("source", {}).get("name", "Unknown"),
                        "sourceId": src_id,
                        "timestamp": a.get("publishedAt", datetime.utcnow().isoformat()),
                        "summary": a.get("description", ""),
                        "url": a.get("url", ""),
                        "tags": [],
                        "category": SOURCE_CATEGORIES.get(src_id, "general"),
                    })
                cache.set(cache_key, results, 300)
                return results
        except Exception:
            pass

    # Real data only — return empty on failure, never fake data
    cache.set(cache_key, [], 300)
    return []
