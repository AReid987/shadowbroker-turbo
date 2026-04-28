import os
import httpx
import xml.etree.ElementTree as ET
from datetime import datetime
from typing import Any
from ..cache import cache

NEWSAPI_KEY = os.getenv("NEWSAPI_API_KEY")
NEWSAPI_URL = "https://newsapi.org/v2/top-headlines"

RSS_FEEDS = {
    "bbc": "https://feeds.bbci.co.uk/news/rss.xml",
    "reuters": "https://www.reutersagency.com/feed/?taxonomy=markets&post_type=reuters-best",
    "techcrunch": "https://techcrunch.com/feed/",
    "guardian": "https://www.theguardian.com/world/rss",
}

SOURCE_CATEGORIES = {
    "bbc": "general",
    "reuters": "finance",
    "techcrunch": "tech",
    "guardian": "geopolitics",
}


def _parse_rss(xml_text: str, source_id: str) -> list[dict[str, Any]]:
    try:
        root = ET.fromstring(xml_text)
        items = []
        # RSS 2.0 format
        for item in root.findall(".//item"):
            title = item.find("title")
            desc = item.find("description")
            pub_date = item.find("pubDate")
            link = item.find("link")
            title_text = title.text if title is not None else ""
            desc_text = desc.text if desc is not None else ""
            link_text = link.text if link is not None else ""
            pub_text = pub_date.text if pub_date is not None else datetime.utcnow().isoformat()
            items.append({
                "id": f"{source_id}_{hash(title_text) & 0xFFFFFF:06x}",
                "title": title_text,
                "source": source_id.upper(),
                "sourceId": source_id,
                "timestamp": pub_text,
                "summary": desc_text[:200],
                "url": link_text,
                "tags": [],
                "category": SOURCE_CATEGORIES.get(source_id, "general"),
            })
        return items
    except Exception:
        return []


async def _fetch_newsapi(source: str | None = None, q: str | None = None) -> list[dict[str, Any]]:
    if not NEWSAPI_KEY:
        return []
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
        return results


async def _fetch_rss() -> list[dict[str, Any]]:
    results = []
    async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
        for source_id, url in RSS_FEEDS.items():
            try:
                resp = await client.get(url)
                if resp.status_code == 200:
                    items = _parse_rss(resp.text, source_id)
                    results.extend(items[:10])
            except Exception:
                continue
    return results


async def fetch_news(source: str | None = None, q: str | None = None) -> list[dict[str, Any]]:
    cache_key = f"news:{source or 'all'}:{q or ''}"
    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    results = []

    # Try NewsAPI first if key is available
    if NEWSAPI_KEY:
        try:
            results = await _fetch_newsapi(source, q)
        except Exception:
            pass

    # Fall back to RSS feeds
    if not results:
        try:
            results = await _fetch_rss()
        except Exception:
            pass

    cache.set(cache_key, results, 300)
    return results
