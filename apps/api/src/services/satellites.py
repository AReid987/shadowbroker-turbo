import httpx
import math
from datetime import datetime
from typing import Any
from ..cache import cache

CELESTRAK_URL = "https://celestrak.org/NORAD/elements/gp.php"

# Satellite groups to fetch
SATELLITE_GROUPS = [
    ("starlink", "Starlink"),
    ("visual", "Brightest Satellites"),
    ("active", "Active Satellites"),
]


def _julian_day(dt: datetime) -> float:
    """Convert datetime to Julian Day."""
    a = math.floor((14 - dt.month) / 12)
    y = dt.year + 4800 - a
    m = dt.month + 12 * a - 3
    jdn = dt.day + math.floor((153 * m + 2) / 5) + 365 * y + math.floor(y / 4) - math.floor(y / 100) + math.floor(y / 400) - 32045
    return jdn + (dt.hour - 12) / 24 + dt.minute / 1440 + dt.second / 86400


def _sgp4_simple(tle: dict, dt: datetime) -> tuple[float, float, float]:
    """
    Simplified orbital propagation for demo purposes.
    Returns approximate lat, lon, altitude.
    This is NOT precise SGP4 — it's a rough approximation for visualization.
    """
    # Mean motion (rev/day) -> orbital period (minutes)
    n = tle.get("MEAN_MOTION", 15.0)
    period = 1440.0 / n  # minutes per orbit

    # Inclination in radians
    i = math.radians(tle.get("INCLINATION", 0))

    # RAAN in radians
    raan = math.radians(tle.get("RA_OF_ASC_NODE", 0))

    # Argument of perigee
    argp = math.radians(tle.get("ARG_OF_PERICENTER", 0))

    # Mean anomaly at epoch
    ma = math.radians(tle.get("MEAN_ANOMALY", 0))

    # Eccentricity
    e = tle.get("ECCENTRICITY", 0)

    # Julian day of epoch
    epoch_str = tle.get("EPOCH", "2024-01-01T00:00:00")
    try:
        epoch_dt = datetime.fromisoformat(epoch_str.replace("Z", "+00:00").replace("+00:00", ""))
    except Exception:
        epoch_dt = datetime.utcnow()

    jd_now = _julian_day(dt)
    jd_epoch = _julian_day(epoch_dt)

    # Minutes since epoch
    minutes_since_epoch = (jd_now - jd_epoch) * 1440.0

    # Current mean anomaly (wrap to 0-2pi)
    current_ma = (ma + 2 * math.pi * (minutes_since_epoch / period)) % (2 * math.pi)

    # Solve Kepler's equation roughly (M = E - e*sinE)
    # Use simple iteration
    E = current_ma
    for _ in range(5):
        E = current_ma + e * math.sin(E)

    # True anomaly
    nu = 2 * math.atan2(math.sqrt(1 + e) * math.sin(E / 2), math.sqrt(1 - e) * math.cos(E / 2))

    # Argument of latitude
    u = argp + nu

    # Position in orbital plane
    # Semi-major axis from mean motion (km)
    mu = 398600.4418  # km^3/s^2
    a = ((mu ** (1 / 3)) / ((n * 2 * math.pi / 86400) ** (2 / 3)))  # km

    r = a * (1 - e * math.cos(E))

    # 3D position in orbital frame
    x_orb = r * math.cos(u)
    y_orb = r * math.sin(u)
    z_orb = 0

    # Rotate by inclination
    x_inc = x_orb
    y_inc = y_orb * math.cos(i)
    z_inc = y_orb * math.sin(i)

    # Rotate by RAAN
    x_eq = x_inc * math.cos(raan) - y_inc * math.sin(raan)
    y_eq = x_inc * math.sin(raan) + y_inc * math.cos(raan)
    z_eq = z_inc

    # Convert to lat/lon/alt (simplified — assumes Earth-centered inertial)
    # For a rough visualization, this is sufficient
    lat = math.degrees(math.asin(max(-1, min(1, z_eq / r))))
    lon = math.degrees(math.atan2(y_eq, x_eq))

    # Adjust longitude for Earth's rotation since epoch
    # Earth rotates ~360.9856 degrees per day
    earth_rotation = 360.9856 * (jd_now - jd_epoch)
    lon = (lon - earth_rotation) % 360
    if lon > 180:
        lon -= 360

    alt = r - 6371.0  # Earth radius ~6371 km

    return lat, lon, alt


def _transform_satellite(tle: dict, group: str) -> dict[str, Any] | None:
    name = tle.get("OBJECT_NAME", "Unknown")
    sat_id = tle.get("OBJECT_ID", "unknown")
    norad = tle.get("NORAD_CAT_ID", 0)

    try:
        lat, lon, alt = _sgp4_simple(tle, datetime.utcnow())
    except Exception:
        return None

    return {
        "id": f"sat_{norad}",
        "type": "satellite",
        "label": name,
        "position": {"lat": lat, "lng": lon},
        "heading": 0,
        "altitude": max(0, alt),
        "speed": 0,
        "metadata": {
            "norad_id": norad,
            "object_id": sat_id,
            "group": group,
            "epoch": tle.get("EPOCH", ""),
        },
        "timestamp": datetime.utcnow().isoformat(),
    }


async def fetch_satellites() -> list[dict[str, Any]]:
    cached = cache.get("satellites")
    if cached is not None:
        return cached

    results = []

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            for group_slug, group_name in SATELLITE_GROUPS:
                try:
                    resp = await client.get(
                        CELESTRAK_URL,
                        params={"GROUP": group_slug, "FORMAT": "json"},
                    )
                    if resp.status_code == 200:
                        data = resp.json()
                        for tle in data[:20]:
                            sat = _transform_satellite(tle, group_name)
                            if sat:
                                results.append(sat)
                except Exception:
                    continue
    except Exception:
        pass

    cache.set("satellites", results, 60)
    return results
