import httpx
from datetime import datetime
from typing import Any
from ..cache import cache

AIS_URL = "https://meri.digitraffic.fi/api/ais/v1/locations"


def _transform_vessel(feature: dict) -> dict[str, Any] | None:
    props = feature.get("properties", {})
    geom = feature.get("geometry", {})
    coords = geom.get("coordinates", [])
    if len(coords) < 2:
        return None

    mmsi = props.get("mmsi", "unknown")
    sog = props.get("sog", 0)  # speed over ground in knots
    cog = props.get("cog", 0)  # course over ground
    nav_stat = props.get("navStat", 0)
    heading = props.get("heading", 0)

    nav_labels = {
        0: "Under way", 1: "At anchor", 2: "Not under command",
        3: "Restricted manoeuvrability", 4: "Constrained by draught",
        5: "Moored", 6: "Aground", 7: "Fishing", 8: "Under way sailing",
    }

    return {
        "id": f"vessel_{mmsi}",
        "type": "vessel",
        "label": f"Vessel {mmsi}",
        "position": {"lat": coords[1], "lng": coords[0]},
        "heading": heading if heading != 511 else cog,
        "speed": sog * 1.852,  # knots to km/h
        "metadata": {
            "mmsi": mmsi,
            "status": nav_labels.get(nav_stat, "Unknown"),
            "course": cog,
        },
        "timestamp": datetime.utcnow().isoformat(),
    }


async def fetch_vessels() -> list[dict[str, Any]]:
    cached = cache.get("vessels")
    if cached is not None:
        return cached

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.get(AIS_URL)
            resp.raise_for_status()
            data = resp.json()
            features = data.get("features", [])
            results = []
            for f in features[:50]:
                v = _transform_vessel(f)
                if v:
                    results.append(v)
            cache.set("vessels", results, 30)
            return results
    except Exception:
        return []
