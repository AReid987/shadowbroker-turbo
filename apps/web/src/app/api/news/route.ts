import { NextResponse } from "next/server";

async function parseRss(url: string, sourceId: string, category: string) {
  try {
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    const xml = await res.text();
    const items: any[] = [];
    const itemRegex = /<item>[\s\S]*?<\/item>/g;
    let m;
    let count = 0;
    while ((m = itemRegex.exec(xml)) !== null && count < 10) {
      const item = m[0];
      const title = (item.match(/<title>\s*<!\[CDATA\[(.*?)\]\]>\s*<\/title>/) || item.match(/<title>(.*?)<\/title>/))?.[1] || "";
      const desc = (item.match(/<description>\s*<!\[CDATA\[(.*?)\]\]>\s*<\/description>/) || item.match(/<description>(.*?)<\/description>/))?.[1] || "";
      const link = (item.match(/<link>(.*?)<\/link>/))?.[1] || "";
      const pubDate = (item.match(/<pubDate>(.*?)<\/pubDate>/))?.[1] || new Date().toISOString();
      items.push({
        id: `${sourceId}_${Math.abs(title.split("").reduce((a, b) => a + b.charCodeAt(0), 0)).toString(16).slice(0, 6)}`,
        title: title.trim(),
        source: sourceId.toUpperCase(),
        sourceId,
        timestamp: pubDate,
        summary: desc.replace(/<[^>]+>/g, "").slice(0, 200),
        url: link,
        tags: [],
        category,
      });
      count++;
    }
    return items;
  } catch {
    return [];
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const source = searchParams.get("source");
  const q = searchParams.get("q");

  let items: any[] = [];

  // NewsAPI if key available
  const newsApiKey = process.env.NEWSAPI_API_KEY;
  if (newsApiKey) {
    try {
      const params = new URLSearchParams({ apiKey: newsApiKey, pageSize: "20", language: "en" });
      if (source) params.set("sources", source);
      if (q) params.set("q", q);
      const res = await fetch(`https://newsapi.org/v2/top-headlines?${params}`, { next: { revalidate: 300 } });
      if (res.ok) {
        const data = await res.json();
        items = (data.articles || []).map((a: any, i: number) => ({
          id: `n${i}`,
          title: a.title || "",
          source: a.source?.name || "Unknown",
          sourceId: a.source?.id || "unknown",
          timestamp: a.publishedAt || new Date().toISOString(),
          summary: a.description || "",
          url: a.url || "",
          tags: [],
          category: "general",
        }));
      }
    } catch {
      // ignore
    }
  }

  // RSS fallback
  if (items.length === 0) {
    const feeds = [
      { url: "https://feeds.bbci.co.uk/news/rss.xml", id: "bbc", cat: "general" },
      { url: "https://www.theguardian.com/world/rss", id: "guardian", cat: "geopolitics" },
      { url: "https://techcrunch.com/feed/", id: "techcrunch", cat: "tech" },
    ];
    for (const feed of feeds) {
      const parsed = await parseRss(feed.url, feed.id, feed.cat);
      items.push(...parsed);
    }
  }

  return NextResponse.json({ items, timestamp: new Date().toISOString() });
}
