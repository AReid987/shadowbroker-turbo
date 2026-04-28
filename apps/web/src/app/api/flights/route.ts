import { NextResponse } from "next/server";

export const runtime = "edge";

export async function GET() {
  try {
    const res = await fetch("https://api.airplanes.live/v2/point/0/0/12000", {
      headers: { "Accept": "application/json" },
    });
    if (!res.ok) {
      return NextResponse.json(
        { flights: [], error: `airplanes.live ${res.status}`, timestamp: new Date().toISOString() },
        { status: 200 }
      );
    }
    const data = await res.json();
    const ac = data.ac || [];
    const flights = ac.slice(0, 50).map((a: any) => ({
      id: `flight_${a.hex}`,
      type: "flight" as const,
      label: (a.flight || a.r || a.hex || "UNKNOWN").trim(),
      position: { lat: a.lat, lng: a.lon },
      heading: a.track || 0,
      altitude: (a.alt_baro || 0) * 0.3048, // ft to m
      speed: (a.gs || 0) * 1.852, // knots to km/h
      metadata: {
        icao: a.hex,
        callsign: (a.flight || "").trim(),
        reg: a.r,
        type: a.t,
        squawk: a.squawk,
      },
      timestamp: new Date().toISOString(),
    })).filter((f: any) => f.position.lat != null && f.position.lng != null);

    return NextResponse.json({ flights, timestamp: new Date().toISOString() });
  } catch (e: any) {
    return NextResponse.json(
      { flights: [], error: e.message, timestamp: new Date().toISOString() },
      { status: 200 }
    );
  }
}
