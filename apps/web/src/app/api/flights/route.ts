import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch("https://opensky-network.org/api/states/all", {
      next: { revalidate: 30 },
    });
    if (!res.ok) throw new Error(`${res.status}`);
    const data = await res.json();
    const states = data.states || [];
    const flights = states.slice(0, 50).map((s: any) => ({
      id: `flight_${s[0]}`,
      type: "flight" as const,
      label: (s[1] || "UNKNOWN").trim(),
      position: { lat: s[6], lng: s[5] },
      heading: s[10] || 0,
      altitude: s[7] || 0,
      speed: (s[9] || 0) * 1.852,
      metadata: {
        icao: s[0],
        callsign: (s[1] || "UNKNOWN").trim(),
        origin: s[2],
        on_ground: s[8],
      },
      timestamp: new Date().toISOString(),
    })).filter((f: any) => f.position.lat != null && f.position.lng != null);
    return NextResponse.json({ flights, timestamp: new Date().toISOString() });
  } catch {
    return NextResponse.json({ flights: [], timestamp: new Date().toISOString() });
  }
}
