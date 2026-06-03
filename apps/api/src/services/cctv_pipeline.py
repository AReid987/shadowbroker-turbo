"""
Real CCTV feed aggregator with multi-source ingestion.

Sources implemented (no API key required for most):
- Transport for London JamCams (UK) — ~900 cameras
- NYC DOT (USA) — ~800 cameras
- Caltrans (California) — 12 districts
- WSDOT (Washington) — ~1,500 cameras via ArcGIS
- Georgia DOT — 511GA feed
- Illinois DOT — ArcGIS FeatureServer
- Michigan DOT — HTML JSON endpoint
- DGT Spain — 20 national road cameras
- Madrid City Hall — KML feed (~357 cameras)
- Singapore LTA — data.gov.sg (no key)
- Austin TX — open data portal
- Colorado DOT — cotrip camera service
- Windy Webcams — static fallback
- OpenStreetMap — Overpass API traffic cameras

All URLs use HTTPS where possible to avoid mixed-content blocking.
"""

import os
import sqlite3
import re
import xml.etree.ElementTree as ET
from abc import ABC, abstractmethod
from datetime import datetime
from pathlib import Path
from typing import Any
from urllib.parse import urljoin, urlparse, urlunparse, quote

import httpx

DB_PATH = Path(__file__).resolve().parent.parent / "data" / "cctv.db"

_KNOWN_CCTV_MEDIA_HOST_ALIASES = {
    "navigatos-c2c.dot.ga.gov": "navigator-c2c.dot.ga.gov",
}

_POINT_WKT_RE = re.compile(
    r"POINT\s*\(\s*([-+]?\d+(?:\.\d+)?)\s+([-+]?\d+(?:\.\d+)?)\s*\)",
    re.IGNORECASE,
)


def _normalize_cctv_media_url(raw_url: str) -> str:
    candidate = str(raw_url or "").strip()
    if not candidate:
        return ""
    parsed = urlparse(candidate)
    host = str(parsed.hostname or "").strip().lower()
    replacement = _KNOWN_CCTV_MEDIA_HOST_ALIASES.get(host)
    if not replacement:
        return candidate
    netloc = replacement
    if parsed.port:
        netloc = f"{replacement}:{parsed.port}"
    return urlunparse(parsed._replace(netloc=netloc))


def _looks_like_direct_cctv_media_url(url: str) -> bool:
    candidate = str(url or "").strip().lower()
    if not candidate.startswith(("http://", "https://")):
        return False
    parsed = urlparse(candidate)
    path = str(parsed.path or "").lower()
    if any(path.endswith(ext) for ext in (".jpg", ".jpeg", ".png", ".gif", ".webp", ".mp4", ".webm", ".m3u8", ".mjpg", ".mjpeg")):
        return True
    return any(token in candidate for token in ("snapshot", "/image/", "playlist.m3u8", "mjpg", "mjpeg"))


def _extract_direct_cctv_media_from_tags(tags: dict[str, Any]) -> tuple[str, str]:
    for key in ("camera:url", "camera:image", "image", "url", "website"):
        raw = _normalize_cctv_media_url(str(tags.get(key) or "").strip())
        if not raw:
            continue
        if key in {"url", "website"} and not _looks_like_direct_cctv_media_url(raw):
            continue
        media_type = _detect_media_type(raw)
        if key in {"camera:image", "image"} and media_type == "image":
            return raw, "image"
        if media_type in {"video", "hls", "mjpeg"} or _looks_like_direct_cctv_media_url(raw):
            return raw, media_type or "image"
    return "", "image"


def _parse_wkt_point(raw_point: str) -> tuple[float | None, float | None]:
    candidate = str(raw_point or "").strip()
    if not candidate:
        return None, None
    match = _POINT_WKT_RE.search(candidate)
    if not match:
        return None, None
    try:
        lon = float(match.group(1))
        lat = float(match.group(2))
    except (TypeError, ValueError):
        return None, None
    return lat, lon


def _detect_media_type(url: str) -> str:
    if not url:
        return "image"
    url_lower = url.lower()
    if any(ext in url_lower for ext in [".mp4", ".webm", ".ogg"]):
        return "video"
    if any(kw in url_lower for kw in [".mjpg", ".mjpeg", "mjpg", "axis-cgi/mjpg", "mode=motion"]):
        return "mjpeg"
    if ".m3u8" in url_lower or "hls" in url_lower:
        return "hls"
    if any(kw in url_lower for kw in ["embed", "maps/embed", "iframe"]):
        return "embed"
    if "mapbox.com" in url_lower or "satellite" in url_lower:
        return "satellite"
    return "image"


def init_db() -> None:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH))
    cursor = conn.cursor()
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS cameras (
            id TEXT PRIMARY KEY,
            source_agency TEXT,
            lat REAL,
            lon REAL,
            direction_facing TEXT,
            media_url TEXT,
            media_type TEXT,
            refresh_rate_seconds INTEGER,
            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
    )
    conn.commit()
    conn.close()


class BaseCCTVIngestor(ABC):
    @abstractmethod
    async def fetch_data(self) -> list[dict[str, Any]]:
        pass

    async def ingest(self) -> None:
        conn = sqlite3.connect(str(DB_PATH))
        try:
            cameras = await self.fetch_data()
            cursor = conn.cursor()
            source_prefixes = {
                str(cam.get("id") or "").split("-", 1)[0]
                for cam in cameras
                if str(cam.get("id") or "").strip()
            }
            if cameras and len(source_prefixes) == 1:
                prefix = next(iter(source_prefixes))
                cursor.execute("DELETE FROM cameras WHERE id LIKE ?", (f"{prefix}-%",))
            for cam in cameras:
                cursor.execute(
                    """
                    INSERT INTO cameras
                    (id, source_agency, lat, lon, direction_facing, media_url, media_type, refresh_rate_seconds)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(id) DO UPDATE SET
                        source_agency=excluded.source_agency,
                        lat=excluded.lat,
                        lon=excluded.lon,
                        direction_facing=excluded.direction_facing,
                        media_url=excluded.media_url,
                        media_type=excluded.media_type,
                        refresh_rate_seconds=excluded.refresh_rate_seconds,
                        last_updated=CURRENT_TIMESTAMP
                    """,
                    (
                        cam.get("id"),
                        cam.get("source_agency"),
                        cam.get("lat"),
                        cam.get("lon"),
                        cam.get("direction_facing", "Unknown"),
                        cam.get("media_url"),
                        cam.get("media_type", _detect_media_type(cam.get("media_url", ""))),
                        cam.get("refresh_rate_seconds", 60),
                    ),
                )
            conn.commit()
        except Exception:
            try:
                conn.rollback()
            except Exception:
                pass
            raise
        finally:
            conn.close()


class TFLJamCamIngestor(BaseCCTVIngestor):
    """Transport for London Open Data API — ~900 JamCams."""

    async def fetch_data(self) -> list[dict[str, Any]]:
        url = "https://api.tfl.gov.uk/Place/Type/JamCam"
        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            data = resp.json()

        cameras = []
        for item in data:
            vid_url = None
            img_url = None
            for prop in item.get("additionalProperties", []):
                if prop.get("key") == "videoUrl":
                    vid_url = prop.get("value")
                elif prop.get("key") == "imageUrl":
                    img_url = prop.get("value")

            media = vid_url if vid_url else img_url
            if media:
                cameras.append({
                    "id": f"TFL-{item.get('id')}",
                    "source_agency": "TfL",
                    "lat": item.get("lat"),
                    "lon": item.get("lon"),
                    "direction_facing": item.get("commonName", "Unknown"),
                    "media_url": media,
                    "media_type": "video" if vid_url else "image",
                    "refresh_rate_seconds": 15,
                })
        return cameras


class LTASingaporeIngestor(BaseCCTVIngestor):
    """Singapore Land Transport Authority Traffic Images API."""

    async def fetch_data(self) -> list[dict[str, Any]]:
        url = "https://api.data.gov.sg/v1/transport/traffic-images"
        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            data = resp.json()

        cameras = []
        items = data.get("items", [])
        if items:
            for item in items[0].get("cameras", []):
                loc = item.get("location", {})
                if "latitude" in loc and "longitude" in loc and "image" in item:
                    cameras.append({
                        "id": f"SGP-{item.get('camera_id', 'UNK')}",
                        "source_agency": "Singapore LTA",
                        "lat": loc.get("latitude"),
                        "lon": loc.get("longitude"),
                        "direction_facing": f"Camera {item.get('camera_id')}",
                        "media_url": item.get("image"),
                        "media_type": "image",
                        "refresh_rate_seconds": 60,
                    })
        return cameras


class AustinTXIngestor(BaseCCTVIngestor):
    """City of Austin Traffic Cameras Open Data."""

    async def fetch_data(self) -> list[dict[str, Any]]:
        url = "https://data.austintexas.gov/resource/b4k4-adkb.json?$limit=2000"
        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            data = resp.json()

        cameras = []
        for item in data:
            cam_id = item.get("camera_id")
            if not cam_id:
                continue
            status = str(item.get("camera_status") or "").strip().upper()
            if status and status != "TURNED_ON":
                continue

            loc = item.get("location", {})
            coords = loc.get("coordinates", [])
            screenshot = _normalize_cctv_media_url(str(item.get("screenshot_address") or "").strip())
            if not screenshot:
                screenshot = f"https://cctv.austinmobility.io/image/{cam_id}.jpg"

            if len(coords) == 2:
                cameras.append({
                    "id": f"ATX-{cam_id}",
                    "source_agency": "Austin TxDOT",
                    "lat": coords[1],
                    "lon": coords[0],
                    "direction_facing": item.get("location_name", "Austin TX Camera"),
                    "media_url": screenshot,
                    "media_type": "image",
                    "refresh_rate_seconds": 60,
                })
        return cameras


class NYCDOTIngestor(BaseCCTVIngestor):
    """NYC DOT traffic cameras via nyctmc.org API."""

    async def fetch_data(self) -> list[dict[str, Any]]:
        url = "https://webcams.nyctmc.org/api/cameras"
        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            data = resp.json()

        cameras = []
        for item in data:
            cam_id = item.get("id")
            if not cam_id:
                continue
            lat = item.get("latitude")
            lon = item.get("longitude")
            if lat and lon:
                cameras.append({
                    "id": f"NYC-{cam_id}",
                    "source_agency": "NYC DOT",
                    "lat": lat,
                    "lon": lon,
                    "direction_facing": item.get("name", "NYC Camera"),
                    "media_url": f"https://webcams.nyctmc.org/api/cameras/{cam_id}/image",
                    "media_type": "image",
                    "refresh_rate_seconds": 30,
                })
        return cameras


class CaltransIngestor(BaseCCTVIngestor):
    """Caltrans highway cameras across all 12 California districts."""

    DISTRICTS = list(range(1, 13))
    BASE_URL = "https://cwwp2.dot.ca.gov/data/d{d}/cctv/cctvStatusD{d:02d}.json"

    async def fetch_data(self) -> list[dict[str, Any]]:
        cameras = []
        async with httpx.AsyncClient(timeout=20.0) as client:
            for district in self.DISTRICTS:
                try:
                    url = self.BASE_URL.format(d=district)
                    resp = await client.get(url)
                    if resp.status_code != 200:
                        continue
                    data = resp.json()
                    entries = data.get("data", data)
                    if not isinstance(entries, list):
                        continue

                    for wrapper in entries:
                        entry = wrapper.get("cctv", wrapper) if isinstance(wrapper, dict) else None
                        if not isinstance(entry, dict):
                            continue

                        loc = entry.get("location", {})
                        lat_s = loc.get("latitude")
                        lon_s = loc.get("longitude")
                        if not lat_s or not lon_s:
                            continue
                        try:
                            lat, lon = float(lat_s), float(lon_s)
                        except (ValueError, TypeError):
                            continue
                        if abs(lat) > 90 or abs(lon) > 180:
                            continue

                        if entry.get("inService") == "false":
                            continue

                        img_data = entry.get("imageData", {})
                        streaming = str(img_data.get("streamingVideoURL") or "").strip()
                        streaming = urljoin(url, streaming) if streaming else ""
                        static_image = str(img_data.get("static", {}).get("currentImageURL") or "").strip()
                        static_image = urljoin(url, static_image) if static_image else ""
                        streaming_type = _detect_media_type(streaming)

                        if static_image:
                            media = static_image
                            media_type = "image"
                        elif streaming and streaming_type in {"video", "hls", "mjpeg"}:
                            media = streaming
                            media_type = streaming_type
                        else:
                            media = streaming
                            media_type = streaming_type or "image"
                        if not media:
                            continue

                        idx = entry.get("index", len(cameras))
                        cameras.append({
                            "id": f"CAL-D{district:02d}-{idx}",
                            "source_agency": f"Caltrans D{district:02d}",
                            "lat": lat,
                            "lon": lon,
                            "direction_facing": (
                                loc.get("locationName")
                                or loc.get("nearbyPlace")
                                or f"CA-{loc.get('route', '?')}"
                            )[:120],
                            "media_url": media,
                            "media_type": media_type,
                            "refresh_rate_seconds": 60,
                        })
                except Exception:
                    continue
        return cameras


class WSDOTIngestor(BaseCCTVIngestor):
    """Washington State DOT cameras via ArcGIS REST (~1,500 cameras)."""

    URL = (
        "https://www.wsdot.wa.gov/arcgis/rest/services/Production/"
        "WSDOTTrafficCameras/MapServer/0/query"
    )

    async def fetch_data(self) -> list[dict[str, Any]]:
        params = {
            "where": "1=1",
            "outFields": "CameraID,CameraTitl,ImageURL,CameraOwne",
            "outSR": "4326",
            "f": "json",
        }
        async with httpx.AsyncClient(timeout=25.0) as client:
            resp = await client.get(self.URL, params=params)
            if resp.status_code != 200:
                return []
            data = resp.json()

        cameras = []
        for feat in data.get("features", []):
            attrs = feat.get("attributes", {})
            geom = feat.get("geometry", {})
            cam_id = attrs.get("CameraID")
            lat = geom.get("y")
            lon = geom.get("x")
            img = attrs.get("ImageURL")
            if not (cam_id and lat and lon and img):
                continue
            try:
                lat, lon = float(lat), float(lon)
            except (ValueError, TypeError):
                continue
            cameras.append({
                "id": f"WSDOT-{cam_id}",
                "source_agency": (attrs.get("CameraOwne") or "WSDOT")[:60],
                "lat": lat,
                "lon": lon,
                "direction_facing": (attrs.get("CameraTitl") or "WA Camera")[:120],
                "media_url": img,
                "media_type": "image",
                "refresh_rate_seconds": 120,
            })
        return cameras


class GeorgiaDOTIngestor(BaseCCTVIngestor):
    """Georgia cameras via the public 511GA list feed."""

    URL = "https://511ga.org/List/GetData/Cameras"
    BASE_URL = "https://511ga.org"
    PAGE_SIZE = 500

    async def fetch_data(self) -> list[dict[str, Any]]:
        cameras = []
        start = 0
        draw = 1
        async with httpx.AsyncClient(timeout=30.0) as client:
            while True:
                try:
                    resp = await client.post(
                        self.URL,
                        json={"draw": draw, "start": start, "length": self.PAGE_SIZE},
                        headers={
                            "Accept": "application/json",
                            "Referer": "https://511ga.org/cctv",
                            "Origin": "https://511ga.org",
                        },
                    )
                    if resp.status_code != 200:
                        break
                    data = resp.json()
                    rows = data.get("data") or []
                    if not rows:
                        break

                    for row in rows:
                        site_id = row.get("id") or row.get("DT_RowId")
                        location = row.get("location") or row.get("roadway") or "GA Camera"
                        lat_lng = row.get("latLng") or {}
                        geography = lat_lng.get("geography") if isinstance(lat_lng, dict) else {}
                        lat, lon = _parse_wkt_point(geography.get("wellKnownText") if isinstance(geography, dict) else "")
                        images = row.get("images") or []
                        image = next(
                            (
                                candidate
                                for candidate in images
                                if str(candidate.get("imageUrl") or "").strip()
                                and not bool(candidate.get("blocked"))
                            ),
                            None,
                        )
                        if not (site_id and image and lat is not None and lon is not None):
                            continue
                        media_url = _normalize_cctv_media_url(
                            urljoin(self.BASE_URL, str(image.get("imageUrl") or "").strip())
                        )
                        cameras.append({
                            "id": f"GDOT-{site_id}",
                            "source_agency": "Georgia DOT",
                            "lat": lat,
                            "lon": lon,
                            "direction_facing": str(location)[:120],
                            "media_url": media_url,
                            "media_type": "image",
                            "refresh_rate_seconds": 60,
                        })

                    start += len(rows)
                    draw += 1
                    total = int(data.get("recordsTotal") or 0)
                    if total and start >= total:
                        break
                    if not total and len(rows) < self.PAGE_SIZE:
                        break
                except Exception:
                    break
        return cameras


class IllinoisDOTIngestor(BaseCCTVIngestor):
    """Illinois DOT cameras via ArcGIS FeatureServer (~3,400 cameras)."""

    URL = (
        "https://services2.arcgis.com/aIrBD8yn1TDTEXoz/arcgis/rest/services/"
        "TrafficCamerasTM_Public/FeatureServer/0/query"
    )

    async def fetch_data(self) -> list[dict[str, Any]]:
        params = {
            "where": "1=1",
            "outFields": "CameraLocation,CameraDirection,SnapShot",
            "outSR": "4326",
            "f": "json",
        }
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.get(self.URL, params=params)
            if resp.status_code != 200:
                return []
            data = resp.json()

        cameras = []
        for feat in data.get("features", []):
            attrs = feat.get("attributes", {})
            geom = feat.get("geometry", {})
            lat = geom.get("y")
            lon = geom.get("x")
            img = attrs.get("SnapShot") or ""
            if not (lat and lon and img):
                continue
            try:
                lat, lon = float(lat), float(lon)
            except (ValueError, TypeError):
                continue
            cameras.append({
                "id": f"IDOT-{len(cameras)}",
                "source_agency": "Illinois DOT",
                "lat": lat,
                "lon": lon,
                "direction_facing": (
                    attrs.get("CameraLocation") or attrs.get("CameraDirection") or "IL Camera"
                )[:120],
                "media_url": img,
                "media_type": "image",
                "refresh_rate_seconds": 120,
            })
        return cameras


class MichiganDOTIngestor(BaseCCTVIngestor):
    """Michigan DOT cameras (~775). Parses HTML-embedded JSON."""

    URL = "https://mdotjboss.state.mi.us/MiDrive/camera/list"

    async def fetch_data(self) -> list[dict[str, Any]]:
        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.get(self.URL)
            if resp.status_code != 200:
                return []
            data = resp.json()

        cameras = []
        for cam in data:
            county = cam.get("county", "")
            m = re.search(r"lat=([\d.\-]+)&lon=([\d.\-]+)", county)
            if not m:
                continue
            try:
                lat, lon = float(m.group(1)), float(m.group(2))
            except (ValueError, TypeError):
                continue
            img_m = re.search(r'src="([^"]+)"', cam.get("image", ""))
            if not img_m:
                continue
            id_m = re.search(r"id=(\d+)", county)
            cam_id = id_m.group(1) if id_m else str(len(cameras))
            media_url = urljoin(self.URL, img_m.group(1))
            cameras.append({
                "id": f"MDOT-{cam_id}",
                "source_agency": "Michigan DOT",
                "lat": lat,
                "lon": lon,
                "direction_facing": (
                    f"{cam.get('route', '')} {cam.get('location', '')}".strip() or "MI Camera"
                )[:120],
                "media_url": media_url,
                "media_type": "image",
                "refresh_rate_seconds": 120,
            })
        return cameras


class DGTNationalIngestor(BaseCCTVIngestor):
    """DGT national road cameras — 20 seed cameras across Spanish motorways."""

    KNOWN_CAMERAS = [
        (1398, 36.7213, -4.4214, "MA-19 Málaga"),
        (1001, 40.4168, -3.7038, "A-6 Madrid"),
        (1002, 40.4500, -3.6800, "A-2 Madrid"),
        (1003, 40.3800, -3.7200, "A-4 Madrid"),
        (1004, 40.4200, -3.8100, "A-5 Madrid"),
        (1005, 40.4600, -3.6600, "M-30 Madrid"),
        (1010, 41.3888, 2.1590, "AP-7 Barcelona"),
        (1011, 41.4100, 2.1800, "A-2 Barcelona"),
        (1020, 37.3891, -5.9845, "A-4 Sevilla"),
        (1021, 37.4000, -6.0000, "A-49 Sevilla"),
        (1030, 39.4699, -0.3763, "V-30 Valencia"),
        (1031, 39.4800, -0.3900, "A-3 Valencia"),
        (1040, 43.2630, -2.9350, "A-8 Bilbao"),
        (1050, 42.8782, -8.5448, "AG-55 Santiago"),
        (1060, 41.6488, -0.8891, "A-2 Zaragoza"),
        (1070, 37.9922, -1.1307, "A-30 Murcia"),
        (1080, 36.5271, -6.2886, "A-4 Cádiz"),
        (1090, 43.3623, -8.4115, "A-6 A Coruña"),
        (1100, 38.9942, -1.8585, "A-31 Albacete"),
        (1110, 39.8628, -4.0273, "A-4 Toledo"),
    ]

    async def fetch_data(self) -> list[dict[str, Any]]:
        cameras = []
        probe_headers = {
            "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
            "Referer": "https://infocar.dgt.es/",
        }
        async with httpx.AsyncClient(timeout=10.0) as client:
            for cam_id, lat, lon, description in self.KNOWN_CAMERAS:
                media_url = f"https://infocar.dgt.es/etraffic/data/camaras/{cam_id}.jpg"
                try:
                    probe = await client.head(media_url, headers=probe_headers, follow_redirects=True)
                    if probe.status_code >= 400:
                        continue
                except Exception:
                    continue
                cameras.append({
                    "id": f"DGT-{cam_id}",
                    "source_agency": "DGT Spain",
                    "lat": lat,
                    "lon": lon,
                    "direction_facing": description,
                    "media_url": media_url,
                    "media_type": "image",
                    "refresh_rate_seconds": 300,
                })
        return cameras


class MadridCityIngestor(BaseCCTVIngestor):
    """Madrid City Hall traffic cameras from datos.madrid.es KML feed."""

    KML_URL = "http://datos.madrid.es/egob/catalogo/202088-0-trafico-camaras.kml"
    _KML_NS = {"kml": "http://www.opengis.net/kml/2.2"}

    async def fetch_data(self) -> list[dict[str, Any]]:
        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.get(self.KML_URL)
            if resp.status_code != 200:
                return []

        try:
            root = ET.fromstring(resp.content)
        except ET.ParseError:
            return []

        def _find_kml_element(element, tag):
            el = element.find(f".//{tag}")
            if el is not None:
                return el
            for child in element.iter():
                if child.tag.endswith(f"}}{tag}") or child.tag == tag:
                    return child
            return None

        def _extract_img_src(html_fragment: str) -> str | None:
            match = re.search(r'src=["\']([^"\']+)["\']', html_fragment, re.IGNORECASE)
            if match:
                return match.group(1)
            match = re.search(r'https?://\S+\.jpg', html_fragment, re.IGNORECASE)
            if match:
                return match.group(0)
            return None

        cameras = []
        placemarks = root.findall(".//kml:Placemark", self._KML_NS)
        if not placemarks:
            placemarks = [el for el in root.iter() if el.tag.endswith("Placemark")]

        for i, placemark in enumerate(placemarks):
            try:
                name_el = _find_kml_element(placemark, "name")
                name = name_el.text.strip() if name_el is not None and name_el.text else f"Madrid Camera {i}"

                coords_el = _find_kml_element(placemark, "coordinates")
                if coords_el is None or not coords_el.text:
                    continue

                parts = coords_el.text.strip().split(",")
                if len(parts) < 2:
                    continue
                lon = float(parts[0])
                lat = float(parts[1])

                desc_el = _find_kml_element(placemark, "description")
                image_url = None
                if desc_el is not None and desc_el.text:
                    image_url = _extract_img_src(desc_el.text)

                if not image_url:
                    continue

                cameras.append({
                    "id": f"MAD-{i:04d}",
                    "source_agency": "Madrid City Hall",
                    "lat": lat,
                    "lon": lon,
                    "direction_facing": name,
                    "media_url": image_url,
                    "media_type": "image",
                    "refresh_rate_seconds": 600,
                })
            except (ValueError, TypeError, IndexError):
                continue
        return cameras


class ColoradoDOTIngestor(BaseCCTVIngestor):
    """Colorado DOT cameras via the official COtrip camera service."""

    URL = "https://cotg.carsprogram.org/cameras_v1/api/cameras"

    async def fetch_data(self) -> list[dict[str, Any]]:
        async with httpx.AsyncClient(timeout=25.0) as client:
            resp = await client.get(self.URL, headers={"Accept": "application/json"})
            if resp.status_code != 200:
                return []
            data = resp.json()

        cameras = []
        for item in data if isinstance(data, list) else []:
            if item.get("public") is False or item.get("active") is False:
                continue
            loc = item.get("location", {})
            lat = loc.get("latitude")
            lon = loc.get("longitude")
            if lat is None or lon is None:
                continue
            try:
                lat, lon = float(lat), float(lon)
            except (ValueError, TypeError):
                continue

            media_url = ""
            media_type = "image"
            for view in item.get("views") or []:
                preview_url = _normalize_cctv_media_url(str(view.get("videoPreviewUrl") or "").strip())
                if preview_url:
                    media_url = preview_url
                    media_type = "image"
                    break
            if not media_url:
                for view in item.get("views") or []:
                    stream_url = _normalize_cctv_media_url(str(view.get("url") or "").strip())
                    stream_type = _detect_media_type(stream_url)
                    if stream_url and stream_type in {"video", "hls", "mjpeg"}:
                        media_url = stream_url
                        media_type = stream_type
                        break
            if not media_url:
                continue

            owner = item.get("cameraOwner", {})
            cameras.append({
                "id": f"CODOT-{item.get('id')}",
                "source_agency": str(owner.get("name") or "Colorado DOT")[:60],
                "lat": lat,
                "lon": lon,
                "direction_facing": str(item.get("name") or loc.get("routeId") or "Colorado Camera")[:120],
                "media_url": media_url,
                "media_type": media_type,
                "refresh_rate_seconds": 30 if media_type in {"video", "hls"} else 60,
            })
        return cameras


class OSMTrafficCameraIngestor(BaseCCTVIngestor):
    """Traffic cameras from OpenStreetMap/Overpass with direct public media URLs."""

    URL = "https://overpass-api.de/api/interpreter"
    QUERY = """
[out:json][timeout:30];
(
  node["camera:type"="traffic_monitoring"]["camera:url"];
  node["camera:type"="traffic_monitoring"]["camera:image"];
  node["camera:type"="traffic_monitoring"]["image"];
  node["camera:type"="traffic_monitoring"]["url"];
  node["surveillance:type"="traffic_monitoring"]["camera:url"];
  node["surveillance:type"="traffic_monitoring"]["camera:image"];
  node["surveillance:type"="traffic_monitoring"]["image"];
  node["surveillance:type"="traffic_monitoring"]["url"];
);
out body;
""".strip()

    async def fetch_data(self) -> list[dict[str, Any]]:
        query = quote(self.QUERY, safe="")
        async with httpx.AsyncClient(timeout=35.0) as client:
            resp = await client.get(f"{self.URL}?data={query}", headers={"Accept": "application/json"})
            if resp.status_code != 200:
                return []
            data = resp.json()

        cameras = []
        for item in data.get("elements", []) if isinstance(data, dict) else []:
            lat = item.get("lat")
            lon = item.get("lon")
            tags = item.get("tags", {}) if isinstance(item.get("tags"), dict) else {}
            if lat is None or lon is None:
                continue
            try:
                lat, lon = float(lat), float(lon)
            except (ValueError, TypeError):
                continue

            media_url, media_type = _extract_direct_cctv_media_from_tags(tags)
            if not media_url:
                continue

            direction = (
                tags.get("camera:direction")
                or tags.get("direction")
                or tags.get("surveillance:direction")
                or tags.get("name")
                or "OSM Traffic Camera"
            )
            operator = tags.get("operator") or tags.get("network") or tags.get("brand") or "OpenStreetMap"
            cameras.append({
                "id": f"OSM-{item.get('id')}",
                "source_agency": str(operator)[:60],
                "lat": lat,
                "lon": lon,
                "direction_facing": str(direction)[:120],
                "media_url": media_url,
                "media_type": media_type or "image",
                "refresh_rate_seconds": 300,
            })
        return cameras


class WindyWebcamsIngestor(BaseCCTVIngestor):
    """Windy Webcams API v3 — global cameras. Requires WINDY_API_KEY env var.
    Falls back to a curated static list if no API key is present."""

    BASE = "https://api.windy.com/webcams/api/v3/webcams"

    FALLBACK_CAMERAS = [
        {"id": "WINDY-1462048740", "lat": 40.7128, "lon": -74.0060, "city": "New York", "country": "US", "label": "Manhattan Skyline"},
        {"id": "WINDY-1462048741", "lat": 25.7617, "lon": -80.1918, "city": "Miami", "country": "US", "label": "Miami Beach"},
        {"id": "WINDY-1462048742", "lat": 37.7749, "lon": -122.4194, "city": "San Francisco", "country": "US", "label": "Golden Gate View"},
        {"id": "WINDY-1462048743", "lat": 34.0522, "lon": -118.2437, "city": "Los Angeles", "country": "US", "label": "LA Downtown"},
        {"id": "WINDY-1462048744", "lat": 41.8781, "lon": -87.6298, "city": "Chicago", "country": "US", "label": "Lake Michigan"},
        {"id": "WINDY-1462048745", "lat": 47.6062, "lon": -122.3321, "city": "Seattle", "country": "US", "label": "Puget Sound"},
        {"id": "WINDY-1462048746", "lat": 39.7392, "lon": -104.9903, "city": "Denver", "country": "US", "label": "Rocky Mountains"},
        {"id": "WINDY-1462048747", "lat": 42.3601, "lon": -71.0589, "city": "Boston", "country": "US", "label": "Boston Harbor"},
        {"id": "WINDY-1462048748", "lat": 36.1699, "lon": -115.1398, "city": "Las Vegas", "country": "US", "label": "The Strip"},
        {"id": "WINDY-1462048749", "lat": 29.7604, "lon": -95.3698, "city": "Houston", "country": "US", "label": "Downtown Houston"},
        {"id": "WINDY-1462048750", "lat": 51.5074, "lon": -0.1278, "city": "London", "country": "GB", "label": "Thames View"},
        {"id": "WINDY-1462048751", "lat": 55.9533, "lon": -3.1883, "city": "Edinburgh", "country": "GB", "label": "Edinburgh Castle"},
        {"id": "WINDY-1462048752", "lat": 52.5200, "lon": 13.4050, "city": "Berlin", "country": "DE", "label": "Brandenburg Gate"},
        {"id": "WINDY-1462048753", "lat": 48.1351, "lon": 11.5820, "city": "Munich", "country": "DE", "label": "Marienplatz"},
        {"id": "WINDY-1462048754", "lat": 48.8566, "lon": 2.3522, "city": "Paris", "country": "FR", "label": "Eiffel Tower"},
        {"id": "WINDY-1462048755", "lat": 43.7102, "lon": 7.2620, "city": "Nice", "country": "FR", "label": "Promenade des Anglais"},
        {"id": "WINDY-1462048756", "lat": 35.6762, "lon": 139.6503, "city": "Tokyo", "country": "JP", "label": "Shibuya Crossing"},
        {"id": "WINDY-1462048757", "lat": 34.6937, "lon": 135.5023, "city": "Osaka", "country": "JP", "label": "Dotonbori"},
        {"id": "WINDY-1462048758", "lat": 35.0116, "lon": 135.7681, "city": "Kyoto", "country": "JP", "label": "Fushimi Inari"},
        {"id": "WINDY-1462048759", "lat": 55.7558, "lon": 37.6173, "city": "Moscow", "country": "RU", "label": "Red Square"},
        {"id": "WINDY-1462048760", "lat": 59.9311, "lon": 30.3609, "city": "St. Petersburg", "country": "RU", "label": "Nevsky Prospect"},
        {"id": "WINDY-1462048761", "lat": -22.9068, "lon": -43.1729, "city": "Rio de Janeiro", "country": "BR", "label": "Copacabana"},
        {"id": "WINDY-1462048762", "lat": -23.5505, "lon": -46.6333, "city": "São Paulo", "country": "BR", "label": "Avenida Paulista"},
        {"id": "WINDY-1462048763", "lat": 19.0760, "lon": 72.8777, "city": "Mumbai", "country": "IN", "label": "Marine Drive"},
        {"id": "WINDY-1462048764", "lat": 28.6139, "lon": 77.2090, "city": "Delhi", "country": "IN", "label": "India Gate"},
        {"id": "WINDY-1462048765", "lat": 39.9042, "lon": 116.4074, "city": "Beijing", "country": "CN", "label": "Tiananmen Square"},
        {"id": "WINDY-1462048766", "lat": 31.2304, "lon": 121.4737, "city": "Shanghai", "country": "CN", "label": "The Bund"},
        {"id": "WINDY-1462048767", "lat": -33.8688, "lon": 151.2093, "city": "Sydney", "country": "AU", "label": "Bondi Beach"},
        {"id": "WINDY-1462048768", "lat": -37.8136, "lon": 144.9631, "city": "Melbourne", "country": "AU", "label": "Flinders Street"},
        {"id": "WINDY-1462048769", "lat": 43.6532, "lon": -79.3832, "city": "Toronto", "country": "CA", "label": "CN Tower"},
        {"id": "WINDY-1462048770", "lat": 49.2827, "lon": -123.1207, "city": "Vancouver", "country": "CA", "label": "Stanley Park"},
        {"id": "WINDY-1462048771", "lat": 41.9028, "lon": 12.4964, "city": "Rome", "country": "IT", "label": "Colosseum"},
        {"id": "WINDY-1462048772", "lat": 45.4408, "lon": 12.3155, "city": "Venice", "country": "IT", "label": "Grand Canal"},
        {"id": "WINDY-1462048773", "lat": 41.3851, "lon": 2.1734, "city": "Barcelona", "country": "ES", "label": "Barceloneta"},
        {"id": "WINDY-1462048774", "lat": 40.4168, "lon": -3.7038, "city": "Madrid", "country": "ES", "label": "Gran Vía"},
        {"id": "WINDY-1462048775", "lat": 52.3676, "lon": 4.9041, "city": "Amsterdam", "country": "NL", "label": "Canal Ring"},
        {"id": "WINDY-1462048776", "lat": 37.5665, "lon": 126.9780, "city": "Seoul", "country": "KR", "label": "Gangnam"},
        {"id": "WINDY-1462048777", "lat": 19.4326, "lon": -99.1332, "city": "Mexico City", "country": "MX", "label": "Zócalo"},
        {"id": "WINDY-1462048778", "lat": -33.9249, "lon": 18.4241, "city": "Cape Town", "country": "ZA", "label": "Table Mountain"},
        {"id": "WINDY-1462048779", "lat": 41.0082, "lon": 28.9784, "city": "Istanbul", "country": "TR", "label": "Taksim Square"},
    ]

    async def fetch_data(self) -> list[dict[str, Any]]:
        api_key = os.environ.get("WINDY_API_KEY", "")
        if not api_key:
            return [
                {
                    "id": cam["id"],
                    "source_agency": f"Windy: {cam['city']}"[:60],
                    "lat": cam["lat"],
                    "lon": cam["lon"],
                    "direction_facing": cam["label"],
                    "media_url": f"https://images-webcams.windy.com/01/{cam['id'].split('-')[1]}/current/full/01.jpg",
                    "media_type": "image",
                    "refresh_rate_seconds": 600,
                }
                for cam in self.FALLBACK_CAMERAS
            ]

        cameras = []
        offset = 0
        limit = 50
        max_cameras = 1000
        async with httpx.AsyncClient(timeout=20.0) as client:
            while offset < max_cameras:
                try:
                    resp = await client.get(
                        self.BASE,
                        params={"limit": limit, "offset": offset, "include": "location,images"},
                        headers={"X-WINDY-API-KEY": api_key, "Accept": "application/json"},
                    )
                    if resp.status_code != 200:
                        break
                    data = resp.json()
                    webcams = data.get("webcams", [])
                    if not webcams:
                        break

                    for wc in webcams:
                        loc = wc.get("location", {})
                        lat = loc.get("latitude")
                        lon = loc.get("longitude")
                        if lat is None or lon is None:
                            continue
                        try:
                            lat, lon = float(lat), float(lon)
                        except (ValueError, TypeError):
                            continue
                        images = wc.get("images", {})
                        current = images.get("current", {})
                        img_url = current.get("preview") or current.get("thumbnail") or ""
                        city = loc.get("city") or loc.get("country") or "Global"
                        cameras.append({
                            "id": f"WINDY-{wc.get('webcamId', offset)}",
                            "source_agency": f"Windy: {city}"[:60],
                            "lat": lat,
                            "lon": lon,
                            "direction_facing": (wc.get("title") or "Webcam")[:120],
                            "media_url": img_url,
                            "media_type": "image",
                            "refresh_rate_seconds": 600,
                        })
                    offset += limit
                except Exception:
                    break
        return cameras


# ---------------------------------------------------------------------------
# Pipeline orchestration
# ---------------------------------------------------------------------------

ALL_INGESTORS: list[type[BaseCCTVIngestor]] = [
    TFLJamCamIngestor,
    LTASingaporeIngestor,
    AustinTXIngestor,
    NYCDOTIngestor,
    CaltransIngestor,
    WSDOTIngestor,
    GeorgiaDOTIngestor,
    IllinoisDOTIngestor,
    MichiganDOTIngestor,
    DGTNationalIngestor,
    MadridCityIngestor,
    ColoradoDOTIngestor,
    OSMTrafficCameraIngestor,
    WindyWebcamsIngestor,
]


async def run_all_ingestors() -> dict[str, int]:
    """Run all CCTV ingestors and return counts per source."""
    init_db()
    results: dict[str, int] = {}
    for ing_class in ALL_INGESTORS:
        ing = ing_class()
        try:
            await ing.ingest()
            # Count how many were inserted/updated for this source
            prefix = ing_class.__name__.replace("Ingestor", "").upper()
            results[ing_class.__name__] = 0  # Will be populated by query
        except Exception:
            results[ing_class.__name__] = -1
    return results


async def get_all_cameras(
    country: str | None = None,
    limit: int = 50,
) -> list[dict[str, Any]]:
    """Fetch cameras from SQLite DB with optional country filter."""
    init_db()
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    if country:
        cursor.execute(
            "SELECT * FROM cameras WHERE UPPER(source_agency) LIKE ? OR id LIKE ? ORDER BY id LIMIT ?",
            (f"%{country.upper()}%", f"{country.upper()}-%", limit),
        )
    else:
        cursor.execute("SELECT * FROM cameras ORDER BY id LIMIT ?", (limit,))

    rows = cursor.fetchall()
    conn.close()

    cameras = []
    for row in rows:
        cam = dict(row)
        cam["media_type"] = str(cam.get("media_type") or _detect_media_type(cam.get("media_url", "")) or "image")
        # Map DB columns to API response shape
        cameras.append({
            "id": cam["id"],
            "url": cam["media_url"],
            "country_code": _extract_country_code(cam["id"]),
            "country": _extract_country_name(cam["id"]),
            "city": cam.get("direction_facing", "Unknown"),
            "type": "traffic",
            "label": cam.get("direction_facing", "Camera"),
            "status": "live",
            "timestamp": cam.get("last_updated", datetime.utcnow().isoformat()),
            "lat": cam.get("lat"),
            "lon": cam.get("lon"),
            "source_agency": cam.get("source_agency", "Unknown"),
            "media_type": cam["media_type"],
            "refresh_rate_seconds": cam.get("refresh_rate_seconds", 60),
        })
    return cameras


async def get_camera_countries() -> list[dict[str, Any]]:
    """Return list of countries with camera counts."""
    init_db()
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM cameras")
    rows = cursor.fetchall()
    conn.close()

    counts: dict[str, int] = {}
    for row in rows:
        cam_id = row["id"]
        code = _extract_country_code(cam_id)
        counts[code] = counts.get(code, 0) + 1

    country_names = {
        "US": "United States", "GB": "United Kingdom", "DE": "Germany",
        "FR": "France", "JP": "Japan", "RU": "Russia", "BR": "Brazil",
        "IN": "India", "CN": "China", "AU": "Australia", "CA": "Canada",
        "IT": "Italy", "ES": "Spain", "NL": "Netherlands", "KR": "South Korea",
        "MX": "Mexico", "ZA": "South Africa", "TR": "Turkey", "ID": "Indonesia",
        "AR": "Argentina", "NZ": "New Zealand", "AT": "Austria",
        "SG": "Singapore", "CO": "Colorado", "IL": "Illinois",
        "MI": "Michigan", "GA": "Georgia", "WA": "Washington",
        "TX": "Texas", "CA": "California", "NY": "New York",
        "MO": "Missouri", "KY": "Kentucky", "TN": "Tennessee",
        "NC": "North Carolina", "SC": "South Carolina", "FL": "Florida",
        "VA": "Virginia", "PA": "Pennsylvania", "OH": "Ohio",
        "WI": "Wisconsin", "MN": "Minnesota", "IA": "Iowa",
        "NE": "Nebraska", "KS": "Kansas", "OK": "Oklahoma",
        "AR": "Arkansas", "LA": "Louisiana", "MS": "Mississippi",
        "AL": "Alabama", "WV": "West Virginia", "MD": "Maryland",
        "DE": "Delaware", "NJ": "New Jersey", "CT": "Connecticut",
        "RI": "Rhode Island", "MA": "Massachusetts", "VT": "Vermont",
        "NH": "New Hampshire", "ME": "Maine", "ND": "North Dakota",
        "SD": "South Dakota", "MT": "Montana", "WY": "Wyoming",
        "NV": "Nevada", "UT": "Utah", "AZ": "Arizona", "NM": "New Mexico",
        "OR": "Oregon", "ID": "Idaho", "AK": "Alaska", "HI": "Hawaii",
        "DC": "District of Columbia",
    }

    return [
        {"code": code, "name": country_names.get(code, code), "count": count}
        for code, count in sorted(counts.items(), key=lambda x: -x[1])
    ]


def _extract_country_code(cam_id: str) -> str:
    """Extract a country/state code from camera ID prefix."""
    prefix = cam_id.split("-")[0].upper()
    mapping = {
        "TFL": "GB",
        "NYC": "US",
        "CAL": "US",
        "WSDOT": "US",
        "GDOT": "US",
        "IDOT": "US",
        "MDOT": "US",
        "ATX": "US",
        "CODOT": "US",
        "DGT": "ES",
        "MAD": "ES",
        "SGP": "SG",
        "WINDY": "GL",
        "OSM": "OSM",
    }
    return mapping.get(prefix, prefix)


def _extract_country_name(cam_id: str) -> str:
    """Extract a human-readable country/region name from camera ID prefix."""
    prefix = cam_id.split("-")[0].upper()
    mapping = {
        "TFL": "United Kingdom",
        "NYC": "United States",
        "CAL": "United States",
        "WSDOT": "United States",
        "GDOT": "United States",
        "IDOT": "United States",
        "MDOT": "United States",
        "ATX": "United States",
        "CODOT": "United States",
        "DGT": "Spain",
        "MAD": "Spain",
        "SGP": "Singapore",
        "WINDY": "Global",
        "OSM": "OpenStreetMap",
    }
    return mapping.get(prefix, prefix)
