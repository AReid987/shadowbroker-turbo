import { NextResponse } from "next/server";

const knownSignals = [
  { freq: 5000, mode: "USB", band: "HF", label: "WWV time signal", type: "time" },
  { freq: 10000, mode: "USB", band: "HF", label: "WWV time signal", type: "time" },
  { freq: 15000, mode: "USB", band: "HF", label: "WWV time signal", type: "time" },
  { freq: 20000, mode: "USB", band: "HF", label: "WWV time signal", type: "time" },
  { freq: 25000, mode: "USB", band: "HF", label: "WWV time signal", type: "time" },
  { freq: 14100, mode: "USB", band: "HF", label: "20m ham band", type: "ham" },
  { freq: 7100, mode: "LSB", band: "HF", label: "40m ham band", type: "ham" },
  { freq: 3600, mode: "LSB", band: "HF", label: "80m ham band", type: "ham" },
  { freq: 10100, mode: "CW", band: "HF", label: "30m ham band", type: "ham" },
  { freq: 18100, mode: "USB", band: "HF", label: "17m ham band", type: "ham" },
  { freq: 21200, mode: "USB", band: "HF", label: "15m ham band", type: "ham" },
  { freq: 24900, mode: "USB", band: "HF", label: "12m ham band", type: "ham" },
  { freq: 28300, mode: "USB", band: "HF", label: "10m ham band", type: "ham" },
  { freq: 472, mode: "CW", band: "MF", label: "630m ham band", type: "ham" },
  { freq: 198, mode: "CW", band: "MF", label: "1600m ham band", type: "ham" },
];

export async function GET() {
  const now = new Date().toISOString();
  const signals = knownSignals.map((s, i) => ({
    id: `sig_${i.toString().padStart(3, "0")}`,
    frequency: s.freq,
    mode: s.mode,
    band: s.band,
    label: s.label,
    type: s.type,
    strength: 0.5 + (Math.abs(Math.sin(s.freq)) * 0.5),
    timestamp: now,
  }));

  const receivers: any[] = [];
  try {
    const rxRes = await fetch("http://websdr.ewi.utwente.nl:8901/", { next: { revalidate: 60 } });
    if (rxRes.ok) {
      const html = await rxRes.text();
      const usersMatch = html.match(/(\d+)\s+user/i);
      receivers.push({
        id: "rx_twente",
        name: "Twente (NL)",
        url: "http://websdr.ewi.utwente.nl:8901/",
        lat: 52.239,
        lon: 6.857,
        status: "online",
        users: usersMatch ? parseInt(usersMatch[1]) : 0,
        last_seen: now,
      });
    }
  } catch {
    // ignore
  }

  return NextResponse.json({
    signals,
    receivers,
    count: signals.length,
    receiverCount: receivers.length,
    timestamp: now,
  });
}
