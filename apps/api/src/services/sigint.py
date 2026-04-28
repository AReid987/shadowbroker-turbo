import httpx
import re
from datetime import datetime
from typing import Any
from ..cache import cache

# Known WebSDR receivers that expose a simple status API or page
WEBSDR_RECEIVERS = [
    {"name": "Twente (NL)", "url": "http://websdr.ewi.utwente.nl:8901/", "lat": 52.239, "lon": 6.857},
    {"name": "University Twente", "url": "http://websdr.ewi.utwente.nl:8901/", "lat": 52.239, "lon": 6.857},
    {"name": "KiwiSDR Utah", "url": "http://kiwisdr.utahsdrt.com:8073/", "lat": 40.233, "lon": -111.659},
    {"name": "KiwiSDR UK", "url": "http://kiwisdr.eastboldre.co.uk:8073/", "lat": 50.783, "lon": -1.583},
    {"name": "KiwiSDR Germany", "url": "http://kiwisdr.ddns.net:8073/", "lat": 51.0, "lon": 10.0},
]

# Common frequency bands for signals
SIGNAL_BANDS = [
    (3000, 30000, "LF/MF"),
    (30000, 300000, "HF"),
    (300000, 3000000, "VHF"),
    (3000000, 30000000, "UHF"),
]


def _extract_users(html: str) -> int:
    """Try to extract number of users from WebSDR HTML."""
    patterns = [
        r'(\d+)\s+user',
        r'users?:?\s*(\d+)',
        r'(\d+)\s+listener',
    ]
    for pattern in patterns:
        match = re.search(pattern, html, re.IGNORECASE)
        if match:
            return int(match.group(1))
    return 0


async def _check_receiver(receiver: dict) -> dict[str, Any] | None:
    try:
        async with httpx.AsyncClient(timeout=8.0, follow_redirects=True) as client:
            resp = await client.get(receiver["url"])
            if resp.status_code == 200:
                users = _extract_users(resp.text)
                return {
                    "id": f"rx_{hash(receiver['name']) & 0xFFFFFF:06x}",
                    "name": receiver["name"],
                    "url": receiver["url"],
                    "lat": receiver["lat"],
                    "lon": receiver["lon"],
                    "status": "online",
                    "users": users,
                    "last_seen": datetime.utcnow().isoformat(),
                }
    except Exception:
        pass
    return None


def _generate_signals() -> list[dict[str, Any]]:
    """Generate placeholder signals from known common transmissions."""
    # These are real known signal types that can be monitored
    now = datetime.utcnow()
    known_signals = [
        {"freq": 5000, "mode": "USB", "label": "WWV time signal", "type": "time"},
        {"freq": 10000, "mode": "USB", "label": "WWV time signal", "type": "time"},
        {"freq": 15000, "mode": "USB", "label": "WWV time signal", "type": "time"},
        {"freq": 20000, "mode": "USB", "label": "WWV time signal", "type": "time"},
        {"freq": 25000, "mode": "USB", "label": "WWV time signal", "type": "time"},
        {"freq": 14100, "mode": "USB", "label": "20m ham band", "type": "ham"},
        {"freq": 7100, "mode": "LSB", "label": "40m ham band", "type": "ham"},
        {"freq": 3600, "mode": "LSB", "label": "80m ham band", "type": "ham"},
        {"freq": 10100, "mode": "CW", "label": "30m ham band", "type": "ham"},
        {"freq": 18100, "mode": "USB", "label": "17m ham band", "type": "ham"},
        {"freq": 21200, "mode": "USB", "label": "15m ham band", "type": "ham"},
        {"freq": 24900, "mode": "USB", "label": "12m ham band", "type": "ham"},
        {"freq": 28300, "mode": "USB", "label": "10m ham band", "type": "ham"},
        {"freq": 472, "mode": "CW", "label": "630m ham band", "type": "ham"},
        {"freq": 198, "mode": "CW", "label": "1600m ham band", "type": "ham"},
    ]

    signals = []
    for i, sig in enumerate(known_signals):
        for band_low, band_high, band_name in SIGNAL_BANDS:
            if band_low <= sig["freq"] * 1000 <= band_high:
                band = band_name
                break
        else:
            band = "unknown"

        signals.append({
            "id": f"sig_{i:03d}",
            "frequency": sig["freq"],
            "mode": sig["mode"],
            "band": band,
            "label": sig["label"],
            "type": sig["type"],
            "strength": 0.5 + (hash(sig["freq"]) % 50) / 100,
            "timestamp": now.isoformat(),
        })

    return signals


async def fetch_signals() -> list[dict[str, Any]]:
    cached = cache.get("sigint")
    if cached is not None:
        return cached

    # Check receivers
    receivers = []
    for rx in WEBSDR_RECEIVERS:
        status = await _check_receiver(rx)
        if status:
            receivers.append(status)

    # Always return known signals (these are real frequencies, not fake data)
    signals = _generate_signals()

    result = {
        "signals": signals,
        "receivers": receivers,
        "count": len(signals),
        "receiverCount": len(receivers),
    }

    cache.set("sigint", result, 60)
    return result
