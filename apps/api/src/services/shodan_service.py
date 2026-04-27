import os
import httpx
from datetime import datetime
from typing import Any
from ..cache import cache

SHODAN_API_KEY = os.getenv("SHODAN_API_KEY")
SHODAN_BASE = "https://api.shodan.io"

DEMO_RESULTS = [
    {"ip": "192.168.1.1", "port": 80, "org": "Example ISP", "country": "US", "city": "New York", "os": "Linux 3.2", "product": "Apache", "version": "2.4.41", "tags": ["web", "http"], "vulns": ["CVE-2021-41773"], "lastUpdate": datetime.utcnow().isoformat()},
    {"ip": "10.0.0.5", "port": 22, "org": "Cloud Provider", "country": "DE", "city": "Frankfurt", "os": "Ubuntu 20.04", "product": "OpenSSH", "version": "8.2", "tags": ["ssh"], "vulns": [], "lastUpdate": datetime.utcnow().isoformat()},
    {"ip": "172.16.0.1", "port": 443, "org": "CorpNet", "country": "JP", "city": "Tokyo", "os": "Windows Server 2019", "product": "IIS", "version": "10.0", "tags": ["web", "ssl", "https"], "vulns": ["CVE-2022-21907"], "lastUpdate": datetime.utcnow().isoformat()},
    {"ip": "203.0.113.7", "port": 554, "org": "Telecom", "country": "BR", "city": "São Paulo", "product": "DVR", "version": "V4.02", "tags": ["rtsp", "iot", "camera"], "vulns": ["CVE-2018-9995"], "lastUpdate": datetime.utcnow().isoformat()},
    {"ip": "198.51.100.22", "port": 502, "org": "Industrial", "country": "CN", "city": "Shenzhen", "product": "Modbus Gateway", "version": "1.2", "tags": ["scada", "ics", "modbus"], "vulns": [], "lastUpdate": datetime.utcnow().isoformat()},
    {"ip": "192.0.2.100", "port": 9100, "org": "OfficeNet", "country": "GB", "city": "London", "product": "HP Printer", "version": "FW 2023.1", "tags": ["printer", "jetdirect"], "vulns": ["CVE-2023-27500"], "lastUpdate": datetime.utcnow().isoformat()},
]

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
                output = {"query": query, "results": results, "total": data.get("total", 0), "cached": False, "demo": False}
                cache.set(cache_key, output, 86400)  # Cache 24h for free tier
                return output
        except Exception:
            pass

    # Demo fallback
    output = {"query": query or "", "results": DEMO_RESULTS, "total": len(DEMO_RESULTS), "cached": False, "demo": True}
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

    return {"ip": ip, "error": "Not found or demo mode", "demo": True}
