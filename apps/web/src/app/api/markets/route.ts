import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch("https://api.manifold.markets/v0/markets?limit=20", {
      next: { revalidate: 60 },
    });
    if (!res.ok) throw new Error(`${res.status}`);
    const data = await res.json();
    const markets = (Array.isArray(data) ? data : []).map((m: any) => ({
      id: m.id,
      title: m.question || m.title || "Unknown",
      category: m.groupSlugs?.[0] || "general",
      outcomes: (m.answers || [{ text: "Yes" }, { text: "No" }]).map((a: any, i: number) => ({
        id: `${m.id}_o${i}`,
        label: a.text || a,
        probability: a.probability || 0.5,
        stake: 0,
      })),
      volume: m.volume || 0,
      closingDate: m.closeTime || new Date().toISOString(),
      status: m.isResolved ? "resolved" : m.closeTime && new Date(m.closeTime) < new Date() ? "closed" : "open",
    }));
    return NextResponse.json({ markets, timestamp: new Date().toISOString() });
  } catch {
    return NextResponse.json({ markets: [], timestamp: new Date().toISOString() });
  }
}
