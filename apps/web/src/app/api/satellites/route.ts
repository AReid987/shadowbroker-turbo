import { NextResponse } from "next/server";

function sgp4Simple(tle: any) {
  const n = tle.MEAN_MOTION || 15;
  const period = 1440 / n;
  const i = (tle.INCLINATION || 0) * (Math.PI / 180);
  const raan = (tle.RA_OF_ASC_NODE || 0) * (Math.PI / 180);
  const argp = (tle.ARG_OF_PERICENTER || 0) * (Math.PI / 180);
  const ma = (tle.MEAN_ANOMALY || 0) * (Math.PI / 180);
  const e = tle.ECCENTRICITY || 0;

  const now = new Date();
  const epoch = new Date(tle.EPOCH || Date.now());
  const mins = (now.getTime() - epoch.getTime()) / 60000;

  let E = (ma + 2 * Math.PI * (mins / period)) % (2 * Math.PI);
  for (let k = 0; k < 5; k++) E = ma + e * Math.sin(E);
  const nu = 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2));
  const u = argp + nu;

  const mu = 398600.4418;
  const a = Math.pow(mu ** (1 / 3) / ((n * 2 * Math.PI / 86400) ** (2 / 3)), 1);
  const r = a * (1 - e * Math.cos(E));

  const x_orb = r * Math.cos(u);
  const y_orb = r * Math.sin(u);

  const x_inc = x_orb;
  const y_inc = y_orb * Math.cos(i);
  const z_inc = y_orb * Math.sin(i);

  const x_eq = x_inc * Math.cos(raan) - y_inc * Math.sin(raan);
  const y_eq = x_inc * Math.sin(raan) + y_inc * Math.cos(raan);
  const z_eq = z_inc;

  const jdNow = now.getTime() / 86400000 + 2440587.5;
  const jdEpoch = epoch.getTime() / 86400000 + 2440587.5;
  let lat = Math.asin(Math.max(-1, Math.min(1, z_eq / r))) * (180 / Math.PI);
  let lon = Math.atan2(y_eq, x_eq) * (180 / Math.PI);
  const earthRotation = 360.9856 * (jdNow - jdEpoch);
  lon = (lon - earthRotation) % 360;
  if (lon > 180) lon -= 360;

  return { lat, lon, alt: r - 6371 };
}

export async function GET() {
  try {
    const groups = [
      { slug: "starlink", name: "Starlink" },
      { slug: "visual", name: "Brightest Satellites" },
      { slug: "active", name: "Active Satellites" },
    ];
    const satellites: any[] = [];
    for (const g of groups) {
      const res = await fetch(
        `https://celestrak.org/NORAD/elements/gp.php?GROUP=${g.slug}&FORMAT=json`,
        { next: { revalidate: 60 } }
      );
      if (!res.ok) continue;
      const data = await res.json();
      for (const tle of data.slice(0, 20)) {
        const pos = sgp4Simple(tle);
        satellites.push({
          id: `sat_${tle.NORAD_CAT_ID}`,
          type: "satellite",
          label: tle.OBJECT_NAME || "Unknown",
          position: { lat: pos.lat, lng: pos.lon },
          heading: 0,
          altitude: Math.max(0, pos.alt),
          speed: 0,
          metadata: {
            norad_id: tle.NORAD_CAT_ID,
            object_id: tle.OBJECT_ID,
            group: g.name,
            epoch: tle.EPOCH,
          },
          timestamp: new Date().toISOString(),
        });
      }
    }
    return NextResponse.json({ satellites, timestamp: new Date().toISOString() });
  } catch {
    return NextResponse.json({ satellites: [], timestamp: new Date().toISOString() });
  }
}
