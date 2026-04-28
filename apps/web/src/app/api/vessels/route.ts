import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch("https://meri.digitraffic.fi/api/ais/v1/locations", {
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`${res.status}`);
    const data = await res.json();
    const features = data.features || [];
    const navLabels: Record<number, string> = {
      0: "Under way", 1: "At anchor", 2: "Not under command",
      3: "Restricted manoeuvrability", 4: "Constrained by draught",
      5: "Moored", 6: "Aground", 7: "Fishing", 8: "Under way sailing",
    };
    const vessels = features.slice(0, 50).map((f: any) => {
      const p = f.properties || {};
      const g = f.geometry || {};
      const coords = g.coordinates || [];
      if (coords.length < 2) return null;
      const heading = p.heading || 0;
      const cog = p.cog || 0;
      return {
        id: `vessel_${p.mmsi}`,
        type: "vessel" as const,
        label: `Vessel ${p.mmsi}`,
        position: { lat: coords[1], lng: coords[0] },
        heading: heading !== 511 ? heading : cog,
        speed: (p.sog || 0) * 1.852,
        metadata: {
          mmsi: p.mmsi,
          status: navLabels[p.navStat] || "Unknown",
          course: cog,
        },
        timestamp: new Date().toISOString(),
      };
    }).filter(Boolean);
    return NextResponse.json({ vessels, timestamp: new Date().toISOString() });
  } catch {
    return NextResponse.json({ vessels: [], timestamp: new Date().toISOString() });
  }
}
