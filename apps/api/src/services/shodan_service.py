import os
import httpx
from datetime import datetime
from typing import Any
from ..cache import cache

SHODAN_API_KEY = os.getenv("SHODAN_API_KEY")
SHODAN_BASE = "https://api.shodan.io"

async def search_shodan(query: str) -> dict[str, Any]:
    cache_key = f"shodan:search:{query}"
    cached = cache.get(cache_key)
    if cached:
        return cached

    if SHODAN_API_KEY and query:
        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                resp = await client.get(
                    f"{SHODAN_BASE}/shodan/host/search",
                    params={"key": SHODAN_API_KEY, "query": query, "page": 1},
                )
                resp.raise_for_status()
                data = resp.json()
                results = []
                for m in data.get("matches", [])[:20]:
                    results.append({
                        "ip": m.get("ip_str", ""),
                        "port": m.get("port", 0),
                        "org": m.get("org", ""),
                        "isp": m.get("isp", ""),
                        "country": m.get("location", {}).get("country_name", ""),
                        "city": m.get("location", {}).get("city", ""),
                        "os": m.get("os", ""),
                        "product": m.get("product", ""),
                        "version": m.get("version", ""),
                        "tags": m.get("tags", []),
                        "vulns": list(m.get("vulns", {}).keys()) if isinstance(m.get("vulns"), dict) else m.get("vulns", []),
                        "lastUpdate": m.get("timestamp", datetime.utcnow().isoformat()),
                    })
                output = {"query": query, "results": results, "total": data.get("total", 0), "cached": False}
                cache.set(cache_key, output, 86400)  # Cache 24h for free tier
                return output
        except Exception:
            pass

    # Real data only — return empty on failure, never fake data
    output = {"query": query or "", "results": [], "total": 0, "cached": False}
    cache.set(cache_key, output, 86400)
    return output

async def get_shodan_host(ip: str) -> dict[str, Any]:
    cache_key = f"shodan:host:{ip}"
    cached = cache.get(cache_key)
    if cached:
        return cached

    if SHODAN_API_KEY:
        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                resp = await client.get(
                    f"{SHODAN_BASE}/shodan/host/{ip}",
                    params={"key": SHODAN_API_KEY},
                )
                resp.raise_for_status()
                data = resp.json()
                cache.set(cache_key, data, 86400)
                return data
        except Exception:
            pass

    return {"ip": ip, "error": "Not found"}
