import type { MapEntity, NewsItem, NewsSource, MeshChannel, MeshMessage, PredictionMarket, RadioSignal, ShodanResult } from "@shadowbroker/types";

export function generateMockEntities(count: number = 50): MapEntity[] {
  const types: MapEntity["type"][] = ["flight", "vessel", "satellite", "ground"];
  const entities: MapEntity[] = [];

  for (let i = 0; i < count; i++) {
    const type = types[Math.floor(Math.random() * types.length)];
    const lat = (Math.random() - 0.5) * 160;
    const lng = (Math.random() - 0.5) * 360;

    entities.push({
      id: `entity-${i}`,
      type,
      position: { lat, lng },
      label: `${type.charAt(0).toUpperCase() + type.slice(1)} ${String(i + 1).padStart(3, "0")}`,
      heading: type === "flight" || type === "vessel" ? Math.random() * 360 : undefined,
      altitude: type === "flight" || type === "satellite" ? Math.floor(Math.random() * 40000) : undefined,
      speed: type === "flight" ? Math.floor(Math.random() * 900) : type === "vessel" ? Math.floor(Math.random() * 50) : undefined,
      timestamp: new Date().toISOString(),
    });
  }

  return entities;
}

export const mockNewsSources: NewsSource[] = [
  { id: "reuters", name: "Reuters", url: "https://reuters.com", enabled: true, category: "general", refreshInterval: 300 },
  { id: "defense-one", name: "Defense One", url: "https://defenseone.com", enabled: true, category: "defense", refreshInterval: 600 },
  { id: "bloomberg", name: "Bloomberg", url: "https://bloomberg.com", enabled: true, category: "finance", refreshInterval: 300 },
  { id: "techcrunch", name: "TechCrunch", url: "https://techcrunch.com", enabled: false, category: "tech", refreshInterval: 600 },
  { id: "stratcom", name: "STRATCOM", url: "https://stratcom.mil", enabled: true, category: "geopolitics", refreshInterval: 900 },
];

export function generateMockNews(count: number = 20): NewsItem[] {
  const titles = [
    "Naval exercises begin in South China Sea",
    "New satellite constellation launched for Earth observation",
    "Cybersecurity breach detected in critical infrastructure",
    "Defense budget increase approved by committee",
    "Commercial flight diverted due to unidentified radar contact",
    "Ship tracking data shows unusual patterns near Strait",
    "SpaceX launches classified payload for NRO",
    "AI-driven intelligence analysis platform deployed",
    "Border surveillance drone fleet expanded",
    "Submarine communications cable maintenance scheduled",
  ];

  return titles.slice(0, count).map((title, i) => ({
    id: `news-${i}`,
    title,
    source: mockNewsSources[i % mockNewsSources.length].name,
    sourceId: mockNewsSources[i % mockNewsSources.length].id,
    timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
    summary: `This is a mock summary for the news item regarding ${title.toLowerCase()}.`,
    tags: ["mock", "test"],
    category: mockNewsSources[i % mockNewsSources.length].category,
  }));
}

export const mockMeshChannels: MeshChannel[] = [
  { id: "general", name: "General", type: "public", participants: 12, unread: 3 },
  { id: "ops", name: "Operations", type: "encrypted", participants: 5, unread: 0 },
  { id: "intel", name: "Intelligence", type: "encrypted", participants: 8, unread: 7 },
  { id: "direct-1", name: "Direct: Alpha", type: "direct", participants: 2, unread: 1 },
];

export function generateMockMessages(channelId: string, count: number = 15): MeshMessage[] {
  const senders = ["Operative_A", "Operative_B", "Command", "Analyst_7", "Field_Unit_3"];
  return Array.from({ length: count }, (_, i) => ({
    id: `msg-${channelId}-${i}`,
    channelId,
    sender: senders[i % senders.length],
    content: `Mock message content for channel ${channelId}, message ${i + 1}.`,
    timestamp: new Date(Date.now() - (count - i) * 300000).toISOString(),
    encrypted: channelId !== "general",
  }));
}

export function generateMockMarkets(): PredictionMarket[] {
  return [
    {
      id: "m1",
      title: "Will tensions escalate in Region X by Q3?",
      category: "geopolitics",
      outcomes: [
        { id: "o1", label: "Yes", probability: 0.62, stake: 45000 },
        { id: "o2", label: "No", probability: 0.38, stake: 28000 },
      ],
      volume: 73000,
      closingDate: "2025-09-30",
      status: "open",
    },
    {
      id: "m2",
      title: "New satellite launch success probability",
      category: "space",
      outcomes: [
        { id: "o1", label: "Success", probability: 0.88, stake: 120000 },
        { id: "o2", label: "Partial", probability: 0.09, stake: 8000 },
        { id: "o3", label: "Failure", probability: 0.03, stake: 3000 },
      ],
      volume: 131000,
      closingDate: "2025-08-15",
      status: "open",
    },
  ];
}

export function generateMockSignals(count: number = 12): RadioSignal[] {
  const modes: RadioSignal["mode"][] = ["AM", "FM", "SSB", "CW", "DIGITAL"];
  return Array.from({ length: count }, (_, i) => ({
    id: `sig-${i}`,
    frequency: 100 + Math.random() * 900,
    mode: modes[Math.floor(Math.random() * modes.length)],
    strength: Math.floor(Math.random() * 100),
    label: `Signal ${String.fromCharCode(65 + i)}`,
    latitude: (Math.random() - 0.5) * 80,
    longitude: (Math.random() - 0.5) * 160,
    timestamp: new Date().toISOString(),
  }));
}

export function generateMockShodan(count: number = 8): ShodanResult[] {
  const products = ["Apache", "nginx", "Microsoft-IIS", "OpenSSH", "MySQL", "PostgreSQL"];
  return Array.from({ length: count }, (_, i) => ({
    ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
    port: [80, 443, 22, 3306, 5432, 8080][Math.floor(Math.random() * 6)],
    org: `ISP-${String.fromCharCode(65 + i)}`,
    country: ["US", "CN", "RU", "DE", "GB", "FR"][Math.floor(Math.random() * 6)],
    city: `City-${i}`,
    os: ["Linux", "Windows", "FreeBSD"][Math.floor(Math.random() * 3)],
    product: products[Math.floor(Math.random() * products.length)],
    version: `${Math.floor(Math.random() * 5)}.${Math.floor(Math.random() * 20)}`,
    tags: ["web", "database"],
    vulns: Math.random() > 0.7 ? ["CVE-2024-XXXX"] : [],
    lastUpdate: new Date().toISOString(),
  }));
}
