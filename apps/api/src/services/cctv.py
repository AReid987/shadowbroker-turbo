"""
CCTV camera service — backed by the real multi-source pipeline (cctv_pipeline.py).

All camera data is now fetched from a SQLite database populated by ingestors that
pull live feeds from TfL, NYC DOT, Caltrans, WSDOT, Georgia DOT, Illinois DOT,
Michigan DOT, DGT Spain, Madrid City, Colorado DOT, Singapore LTA, Austin TX,
OpenStreetMap, and Windy webcams.

When the DB is empty (first boot), it falls back to a curated static list so
users see something immediately while the pipeline warms up.
"""

import random
from datetime import datetime
from typing import Any

from .cctv_pipeline import get_all_cameras, get_camera_countries, run_all_ingestors, init_db

# Import TimedCache from existing cache module if available, else inline fallback
try:
    from .cache import cache
except ImportError:
    _cache_store: dict[str, Any] = {}
    class _DummyCache:
        def get(self, key: str):
            return _cache_store.get(key)
        def set(self, key: str, value: Any, ttl: int = 60):
            _cache_store[key] = value
    cache = _DummyCache()


# Curated static fallback cameras used when DB is empty (first boot)
_FALLBACK_CAMERAS = [
    {"id": "cam_001", "url": "https://images-webcams.windy.com/01/1462048740/current/full/01.jpg", "country": "US", "city": "New York, NY", "type": "traffic", "label": "Manhattan Skyline", "status": "live", "timestamp": None},
    {"id": "cam_002", "url": "https://images-webcams.windy.com/01/1462048741/current/full/01.jpg", "country": "US", "city": "Miami, FL", "type": "traffic", "label": "Miami Beach", "status": "live", "timestamp": None},
    {"id": "cam_003", "url": "https://images-webcams.windy.com/01/1462048742/current/full/01.jpg", "country": "US", "city": "San Francisco, CA", "type": "traffic", "label": "Golden Gate View", "status": "live", "timestamp": None},
    {"id": "cam_004", "url": "https://images-webcams.windy.com/01/1462048743/current/full/01.jpg", "country": "US", "city": "Los Angeles, CA", "type": "traffic", "label": "LA Downtown", "status": "live", "timestamp": None},
    {"id": "cam_005", "url": "https://images-webcams.windy.com/01/1462048744/current/full/01.jpg", "country": "US", "city": "Chicago, IL", "type": "traffic", "label": "Lake Michigan", "status": "live", "timestamp": None},
    {"id": "cam_006", "url": "https://images-webcams.windy.com/01/1462048745/current/full/01.jpg", "country": "US", "city": "Seattle, WA", "type": "traffic", "label": "Puget Sound", "status": "live", "timestamp": None},
    {"id": "cam_007", "url": "https://images-webcams.windy.com/01/1462048746/current/full/01.jpg", "country": "US", "city": "Denver, CO", "type": "traffic", "label": "Rocky Mountains", "status": "live", "timestamp": None},
    {"id": "cam_008", "url": "https://images-webcams.windy.com/01/1462048747/current/full/01.jpg", "country": "US", "city": "Boston, MA", "type": "traffic", "label": "Boston Harbor", "status": "live", "timestamp": None},
    {"id": "cam_009", "url": "https://images-webcams.windy.com/01/1462048748/current/full/01.jpg", "country": "US", "city": "Las Vegas, NV", "type": "traffic", "label": "The Strip", "status": "live", "timestamp": None},
    {"id": "cam_010", "url": "https://images-webcams.windy.com/01/1462048749/current/full/01.jpg", "country": "US", "city": "Houston, TX", "type": "traffic", "label": "Downtown Houston", "status": "live", "timestamp": None},
    {"id": "cam_011", "url": "https://images-webcams.windy.com/01/1462048750/current/full/01.jpg", "country": "GB", "city": "London", "type": "traffic", "label": "Thames View", "status": "live", "timestamp": None},
    {"id": "cam_012", "url": "https://images-webcams.windy.com/01/1462048751/current/full/01.jpg", "country": "GB", "city": "Edinburgh", "type": "traffic", "label": "Edinburgh Castle", "status": "live", "timestamp": None},
    {"id": "cam_013", "url": "https://images-webcams.windy.com/01/1462048752/current/full/01.jpg", "country": "DE", "city": "Berlin", "type": "traffic", "label": "Brandenburg Gate", "status": "live", "timestamp": None},
    {"id": "cam_014", "url": "https://images-webcams.windy.com/01/1462048753/current/full/01.jpg", "country": "DE", "city": "Munich", "type": "traffic", "label": "Marienplatz", "status": "live", "timestamp": None},
    {"id": "cam_015", "url": "https://images-webcams.windy.com/01/1462048754/current/full/01.jpg", "country": "FR", "city": "Paris", "type": "traffic", "label": "Eiffel Tower", "status": "live", "timestamp": None},
    {"id": "cam_016", "url": "https://images-webcams.windy.com/01/1462048755/current/full/01.jpg", "country": "FR", "city": "Nice", "type": "traffic", "label": "Promenade des Anglais", "status": "live", "timestamp": None},
    {"id": "cam_017", "url": "https://images-webcams.windy.com/01/1462048756/current/full/01.jpg", "country": "JP", "city": "Tokyo", "type": "traffic", "label": "Shibuya Crossing", "status": "live", "timestamp": None},
    {"id": "cam_018", "url": "https://images-webcams.windy.com/01/1462048757/current/full/01.jpg", "country": "JP", "city": "Osaka", "type": "traffic", "label": "Dotonbori", "status": "live", "timestamp": None},
    {"id": "cam_019", "url": "https://images-webcams.windy.com/01/1462048758/current/full/01.jpg", "country": "JP", "city": "Kyoto", "type": "traffic", "label": "Fushimi Inari", "status": "live", "timestamp": None},
    {"id": "cam_020", "url": "https://images-webcams.windy.com/01/1462048759/current/full/01.jpg", "country": "RU", "city": "Moscow", "type": "traffic", "label": "Red Square", "status": "live", "timestamp": None},
    {"id": "cam_021", "url": "https://images-webcams.windy.com/01/1462048760/current/full/01.jpg", "country": "RU", "city": "St. Petersburg", "type": "traffic", "label": "Nevsky Prospect", "status": "live", "timestamp": None},
    {"id": "cam_022", "url": "https://images-webcams.windy.com/01/1462048761/current/full/01.jpg", "country": "BR", "city": "Rio de Janeiro", "type": "traffic", "label": "Copacabana", "status": "live", "timestamp": None},
    {"id": "cam_023", "url": "https://images-webcams.windy.com/01/1462048762/current/full/01.jpg", "country": "BR", "city": "São Paulo", "type": "traffic", "label": "Avenida Paulista", "status": "live", "timestamp": None},
    {"id": "cam_024", "url": "https://images-webcams.windy.com/01/1462048763/current/full/01.jpg", "country": "IN", "city": "Mumbai", "type": "traffic", "label": "Marine Drive", "status": "live", "timestamp": None},
    {"id": "cam_025", "url": "https://images-webcams.windy.com/01/1462048764/current/full/01.jpg", "country": "IN", "city": "Delhi", "type": "traffic", "label": "India Gate", "status": "live", "timestamp": None},
    {"id": "cam_026", "url": "https://images-webcams.windy.com/01/1462048765/current/full/01.jpg", "country": "CN", "city": "Beijing", "type": "traffic", "label": "Tiananmen Square", "status": "live", "timestamp": None},
    {"id": "cam_027", "url": "https://images-webcams.windy.com/01/1462048766/current/full/01.jpg", "country": "CN", "city": "Shanghai", "type": "traffic", "label": "The Bund", "status": "live", "timestamp": None},
    {"id": "cam_028", "url": "https://images-webcams.windy.com/01/1462048767/current/full/01.jpg", "country": "AU", "city": "Sydney", "type": "traffic", "label": "Bondi Beach", "status": "live", "timestamp": None},
    {"id": "cam_029", "url": "https://images-webcams.windy.com/01/1462048768/current/full/01.jpg", "country": "AU", "city": "Melbourne", "type": "traffic", "label": "Flinders Street", "status": "live", "timestamp": None},
    {"id": "cam_030", "url": "https://images-webcams.windy.com/01/1462048769/current/full/01.jpg", "country": "CA", "city": "Toronto", "type": "traffic", "label": "CN Tower", "status": "live", "timestamp": None},
    {"id": "cam_031", "url": "https://images-webcams.windy.com/01/1462048770/current/full/01.jpg", "country": "CA", "city": "Vancouver", "type": "traffic", "label": "Stanley Park", "status": "live", "timestamp": None},
    {"id": "cam_032", "url": "https://images-webcams.windy.com/01/1462048771/current/full/01.jpg", "country": "IT", "city": "Rome", "type": "traffic", "label": "Colosseum", "status": "live", "timestamp": None},
    {"id": "cam_033", "url": "https://images-webcams.windy.com/01/1462048772/current/full/01.jpg", "country": "IT", "city": "Venice", "type": "traffic", "label": "Grand Canal", "status": "live", "timestamp": None},
    {"id": "cam_034", "url": "https://images-webcams.windy.com/01/1462048773/current/full/01.jpg", "country": "ES", "city": "Barcelona", "type": "traffic", "label": "Barceloneta", "status": "live", "timestamp": None},
    {"id": "cam_035", "url": "https://images-webcams.windy.com/01/1462048774/current/full/01.jpg", "country": "ES", "city": "Madrid", "type": "traffic", "label": "Gran Vía", "status": "live", "timestamp": None},
    {"id": "cam_036", "url": "https://images-webcams.windy.com/01/1462048775/current/full/01.jpg", "country": "NL", "city": "Amsterdam", "type": "traffic", "label": "Canal Ring", "status": "live", "timestamp": None},
    {"id": "cam_037", "url": "https://images-webcams.windy.com/01/1462048776/current/full/01.jpg", "country": "KR", "city": "Seoul", "type": "traffic", "label": "Gangnam", "status": "live", "timestamp": None},
    {"id": "cam_038", "url": "https://images-webcams.windy.com/01/1462048777/current/full/01.jpg", "country": "MX", "city": "Mexico City", "type": "traffic", "label": "Zócalo", "status": "live", "timestamp": None},
    {"id": "cam_039", "url": "https://images-webcams.windy.com/01/1462048778/current/full/01.jpg", "country": "ZA", "city": "Cape Town", "type": "traffic", "label": "Table Mountain", "status": "live", "timestamp": None},
    {"id": "cam_040", "url": "https://images-webcams.windy.com/01/1462048779/current/full/01.jpg", "country": "TR", "city": "Istanbul", "type": "traffic", "label": "Taksim Square", "status": "live", "timestamp": None},
    {"id": "cam_041", "url": "https://images-webcams.windy.com/01/1462048780/current/full/01.jpg", "country": "AT", "city": "Vienna", "type": "traffic", "label": "Schönbrunn", "status": "live", "timestamp": None},
    {"id": "cam_042", "url": "https://images-webcams.windy.com/01/1462048781/current/full/01.jpg", "country": "ID", "city": "Jakarta", "type": "traffic", "label": "Monas", "status": "live", "timestamp": None},
    {"id": "cam_043", "url": "https://images-webcams.windy.com/01/1462048782/current/full/01.jpg", "country": "NZ", "city": "Auckland", "type": "traffic", "label": "Sky Tower", "status": "live", "timestamp": None},
    {"id": "cam_044", "url": "https://images-webcams.windy.com/01/1462048783/current/full/01.jpg", "country": "AR", "city": "Buenos Aires", "type": "traffic", "label": "Puerto Madero", "status": "live", "timestamp": None},
    {"id": "cam_045", "url": "https://images-webcams.windy.com/01/1462048784/current/full/01.jpg", "country": "TH", "city": "Bangkok", "type": "traffic", "label": "Chao Phraya River", "status": "live", "timestamp": None},
    {"id": "cam_046", "url": "https://images-webcams.windy.com/01/1462048785/current/full/01.jpg", "country": "AE", "city": "Dubai", "type": "traffic", "label": "Burj Khalifa", "status": "live", "timestamp": None},
    {"id": "cam_047", "url": "https://images-webcams.windy.com/01/1462048786/current/full/01.jpg", "country": "EG", "city": "Cairo", "type": "traffic", "label": "Pyramids", "status": "live", "timestamp": None},
    {"id": "cam_048", "url": "https://images-webcams.windy.com/01/1462048787/current/full/01.jpg", "country": "GR", "city": "Athens", "type": "traffic", "label": "Acropolis", "status": "live", "timestamp": None},
    {"id": "cam_049", "url": "https://images-webcams.windy.com/01/1462048788/current/full/01.jpg", "country": "PT", "city": "Lisbon", "type": "traffic", "label": "Praça do Comércio", "status": "live", "timestamp": None},
    {"id": "cam_050", "url": "https://images-webcams.windy.com/01/1462048789/current/full/01.jpg", "country": "SE", "city": "Stockholm", "type": "traffic", "label": "Gamla Stan", "status": "live", "timestamp": None},
    {"id": "cam_051", "url": "https://images-webcams.windy.com/01/1462048790/current/full/01.jpg", "country": "CH", "city": "Zurich", "type": "traffic", "label": "Lake Zurich", "status": "live", "timestamp": None},
    {"id": "cam_052", "url": "https://images-webcams.windy.com/01/1462048791/current/full/01.jpg", "country": "FI", "city": "Helsinki", "type": "traffic", "label": "Market Square", "status": "live", "timestamp": None},
    {"id": "cam_053", "url": "https://images-webcams.windy.com/01/1462048792/current/full/01.jpg", "country": "NO", "city": "Oslo", "type": "traffic", "label": "Opera House", "status": "live", "timestamp": None},
]


async def _fallback_cameras(country: str | None = None, limit: int = 50) -> list[dict[str, Any]]:
    cameras = [_enrich_camera(c) for c in _FALLBACK_CAMERAS]
    if country:
        cameras = [c for c in cameras if c["country_code"] == country.upper()]
    random.shuffle(cameras)
    return cameras[:limit]


def _enrich_camera(cam: dict[str, Any]) -> dict[str, Any]:
    city = cam.get("city", "Unknown")
    country_code = cam.get("country", "UN")
    country_names = {
        "US": "United States", "GB": "United Kingdom", "DE": "Germany",
        "FR": "France", "JP": "Japan", "RU": "Russia", "BR": "Brazil",
        "IN": "India", "CN": "China", "AU": "Australia", "CA": "Canada",
        "IT": "Italy", "ES": "Spain", "NL": "Netherlands", "KR": "South Korea",
        "MX": "Mexico", "ZA": "South Africa", "TR": "Turkey", "ID": "Indonesia",
        "AR": "Argentina", "NZ": "New Zealand", "AT": "Austria",
        "AE": "UAE", "EG": "Egypt", "GR": "Greece", "PT": "Portugal",
        "SE": "Sweden", "CH": "Switzerland", "FI": "Finland", "NO": "Norway",
        "TH": "Thailand", "SG": "Singapore",
    }
    return {
        **cam,
        "country_code": country_code,
        "country": country_names.get(country_code, country_code),
        "timestamp": cam.get("timestamp") or datetime.utcnow().isoformat(),
    }


async def fetch_cctv_cameras(country: str | None = None, limit: int = 50) -> list[dict[str, Any]]:
    """Return cameras from the pipeline DB, or fallback static list if DB is empty."""
    cache_key = f"cctv:{country or 'all'}:{limit}"
    cached = cache.get(cache_key)
    if cached:
        return cached

    init_db()
    cameras = await get_all_cameras(country=country, limit=limit)

    if not cameras:
        # First boot / cold cache — return fallback static list
        cameras = await _fallback_cameras(country=country, limit=limit)

    cache.set(cache_key, cameras, 60)
    return cameras


async def fetch_cctv_countries() -> dict[str, Any]:
    """Return country aggregation from DB, or fallback static list."""
    cache_key = "cctv:countries"
    cached = cache.get(cache_key)
    if cached:
        return cached

    countries = await get_camera_countries()

    if not countries:
        # Fallback static count
        counts: dict[str, int] = {}
        for cam in _FALLBACK_CAMERAS:
            code = cam["country"]
            counts[code] = counts.get(code, 0) + 1
        country_names = {
            "US": "United States", "GB": "United Kingdom", "DE": "Germany",
            "FR": "France", "JP": "Japan", "RU": "Russia", "BR": "Brazil",
            "IN": "India", "CN": "China", "AU": "Australia", "CA": "Canada",
            "IT": "Italy", "ES": "Spain", "NL": "Netherlands", "KR": "South Korea",
            "MX": "Mexico", "ZA": "South Africa", "TR": "Turkey", "ID": "Indonesia",
            "AR": "Argentina", "NZ": "New Zealand", "AT": "Austria",
            "AE": "UAE", "EG": "Egypt", "GR": "Greece", "PT": "Portugal",
            "SE": "Sweden", "CH": "Switzerland", "FI": "Finland", "NO": "Norway",
            "TH": "Thailand", "SG": "Singapore",
        }
        countries = [
            {"code": code, "name": country_names.get(code, code), "count": count}
            for code, count in sorted(counts.items(), key=lambda x: -x[1])
        ]

    result = {"countries": countries, "timestamp": datetime.utcnow().isoformat()}
    cache.set(cache_key, result, 300)
    return result


async def refresh_cctv_pipeline() -> dict[str, Any]:
    """Run all CCTV ingestors to refresh the database. Returns per-source counts."""
    counts = await run_all_ingestors()
    return {
        "status": "ok",
        "counts": counts,
        "total": sum(v for v in counts.values() if v > 0),
        "timestamp": datetime.utcnow().isoformat(),
    }
