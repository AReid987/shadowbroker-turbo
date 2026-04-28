import { NextResponse } from "next/server";

const cameras = [
  { country_code: "US", country: "United States" },
  { country_code: "GB", country: "United Kingdom" },
  { country_code: "FR", country: "France" },
  { country_code: "JP", country: "Japan" },
  { country_code: "AU", country: "Australia" },
  { country_code: "DE", country: "Germany" },
  { country_code: "IT", country: "Italy" },
  { country_code: "ES", country: "Spain" },
  { country_code: "BR", country: "Brazil" },
  { country_code: "CA", country: "Canada" },
  { country_code: "NL", country: "Netherlands" },
  { country_code: "CH", country: "Switzerland" },
  { country_code: "SE", country: "Sweden" },
  { country_code: "NO", country: "Norway" },
  { country_code: "DK", country: "Denmark" },
  { country_code: "FI", country: "Finland" },
  { country_code: "RU", country: "Russia" },
  { country_code: "CN", country: "China" },
  { country_code: "IN", country: "India" },
  { country_code: "ZA", country: "South Africa" },
  { country_code: "EG", country: "Egypt" },
  { country_code: "AE", country: "United Arab Emirates" },
  { country_code: "SG", country: "Singapore" },
  { country_code: "TH", country: "Thailand" },
  { country_code: "KR", country: "South Korea" },
  { country_code: "MX", country: "Mexico" },
  { country_code: "AR", country: "Argentina" },
  { country_code: "TR", country: "Turkey" },
  { country_code: "GR", country: "Greece" },
  { country_code: "PT", country: "Portugal" },
];

export async function GET() {
  const counts = new Map<string, number>();
  for (const c of cameras) {
    counts.set(c.country_code, (counts.get(c.country_code) || 0) + 1);
  }
  const countries = Array.from(counts.entries()).map(([code, count]) => ({
    code,
    name: cameras.find((c) => c.country_code === code)?.country || code,
    count,
  }));
  return NextResponse.json({ countries, timestamp: new Date().toISOString() });
}
