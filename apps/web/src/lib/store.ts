import { create } from "zustand";
import type {
  MapEntity,
  NewsItem,
  NewsSource,
  MeshChannel,
  MeshMessage,
  PredictionMarket,
  RadioSignal,
  ShodanResult,
} from "@shadowbroker/types";
import { api } from "./api";

interface DashboardState {
  // Loading / error
  isLoading: boolean;
  backendOnline: boolean;
  setBackendOnline: (v: boolean) => void;

  // Map
  mapEntities: MapEntity[];
  selectedEntity: MapEntity | null;
  setMapEntities: (entities: MapEntity[]) => void;
  setSelectedEntity: (entity: MapEntity | null) => void;
  refreshMap: () => Promise<void>;

  // News
  newsItems: NewsItem[];
  newsSources: NewsSource[];
  setNewsItems: (items: NewsItem[]) => void;
  setNewsSources: (sources: NewsSource[]) => void;
  toggleNewsSource: (id: string) => void;
  refreshNews: (source?: string, q?: string) => Promise<void>;

  // Mesh
  meshChannels: MeshChannel[];
  meshMessages: MeshMessage[];
  activeChannel: string;
  setMeshChannels: (channels: MeshChannel[]) => void;
  setMeshMessages: (messages: MeshMessage[]) => void;
  setActiveChannel: (id: string) => void;
  refreshMesh: () => Promise<void>;

  // Markets
  markets: PredictionMarket[];
  setMarkets: (markets: PredictionMarket[]) => void;
  refreshMarkets: () => Promise<void>;

  // SIGINT
  signals: RadioSignal[];
  selectedSignal: RadioSignal | null;
  setSignals: (signals: RadioSignal[]) => void;
  setSelectedSignal: (signal: RadioSignal | null) => void;
  refreshSigint: () => Promise<void>;

  // Shodan
  shodanResults: ShodanResult[];
  shodanQuery: string;
  setShodanResults: (results: ShodanResult[]) => void;
  setShodanQuery: (query: string) => void;
  searchShodan: (query: string) => Promise<void>;
}

const now = new Date().toISOString();

const demoNewsSources: NewsSource[] = [
  { id: "osint", name: "OSINT Curator", url: "", enabled: true, category: "general", refreshInterval: 300 },
  { id: "defcon", name: "DEFCON Alerts", url: "", enabled: true, category: "defense", refreshInterval: 600 },
  { id: "bloomberg", name: "Bloomberg Terminal", url: "", enabled: true, category: "finance", refreshInterval: 60 },
  { id: "techcrunch", name: "TechCrunch", url: "", enabled: true, category: "tech", refreshInterval: 300 },
  { id: "reuters", name: "Reuters Global", url: "", enabled: false, category: "geopolitics", refreshInterval: 120 },
  { id: "natgeo", name: "NatGeo Intel", url: "", enabled: false, category: "general", refreshInterval: 3600 },
];

const demoNewsItems: NewsItem[] = [
  { id: "1", title: "Unidentified vessel detected in restricted waters near Singapore Strait", source: "OSINT Curator", sourceId: "osint", timestamp: new Date(Date.now() - 120000).toISOString(), summary: "AIS spoofing suspected. Vessel broadcasting conflicting MMSI codes.", tags: ["maritime", "ais"], category: "general" },
  { id: "2", title: "Zero-day vulnerability disclosed in widely deployed industrial router firmware", source: "DEFCON Alerts", sourceId: "defcon", timestamp: new Date(Date.now() - 300000).toISOString(), summary: "CVE pending. Exploitation observed in the wild by APT group.", tags: ["vulnerability", "ics"], category: "defense" },
  { id: "3", title: "Global semiconductor supply chain disruption reported following seismic event", source: "Bloomberg Terminal", sourceId: "bloomberg", timestamp: new Date(Date.now() - 900000).toISOString(), summary: "TSMC Fab 18 reports temporary halt. Memory prices up 4% pre-market.", tags: ["supply-chain", "semiconductors"], category: "finance" },
  { id: "4", title: "New satellite constellation reaches operational status, expands Earth observation coverage", source: "TechCrunch", sourceId: "techcrunch", timestamp: new Date(Date.now() - 1800000).toISOString(), summary: "Planet Labs confirms 150th Dove satellite operational. 3m resolution.", tags: ["satellite", "imaging"], category: "tech" },
  { id: "5", title: "Diplomatic tensions rise following border incident in Eastern Europe", source: "Reuters Global", sourceId: "reuters", timestamp: new Date(Date.now() - 3600000).toISOString(), tags: ["geopolitics", "europe"], category: "geopolitics" },
  { id: "6", title: "Shadow fleet tanker reroutes through Arctic route amid Red Sea tensions", source: "OSINT Curator", sourceId: "osint", timestamp: new Date(Date.now() - 7200000).toISOString(), summary: "Ice-class tanker transits Northern Sea Route unescorted.", tags: ["energy", "shipping"], category: "general" },
];

const demoMapEntities: MapEntity[] = [
  { id: "f1", type: "flight", position: { lat: 51.47, lng: -0.46 }, label: "BA117 LHR→JFK", heading: 285, altitude: 36000, speed: 540, metadata: { type: "B777", callsign: "BAW117" }, timestamp: now },
  { id: "f2", type: "flight", position: { lat: 40.64, lng: -73.78 }, label: "DL4 JFK→CDG", heading: 65, altitude: 32000, speed: 510, metadata: { type: "A350", callsign: "DAL4" }, timestamp: now },
  { id: "f3", type: "flight", position: { lat: 35.55, lng: 139.78 }, label: "NH1 HND→LAX", heading: 45, altitude: 41000, speed: 560, metadata: { type: "A380", callsign: "ANA1" }, timestamp: now },
  { id: "v1", type: "vessel", position: { lat: 1.26, lng: 103.83 }, label: "MV Atlas Trader", heading: 110, speed: 18, metadata: { type: "Container", mmsi: "123456789" }, timestamp: now },
  { id: "v2", type: "vessel", position: { lat: 35.0, lng: -15.0 }, label: "STI Sapphire", heading: 270, speed: 14, metadata: { type: "Tanker", mmsi: "987654321" }, timestamp: now },
  { id: "s1", type: "satellite", position: { lat: 0, lng: -100 }, label: "ISS (ZARYA)", heading: 0, altitude: 408000, speed: 27600, metadata: { type: "ISS", norad: "25544" }, timestamp: now },
  { id: "s2", type: "satellite", position: { lat: 28.5, lng: -80.6 }, label: "Starlink-1234", heading: 0, altitude: 550000, speed: 27300, metadata: { type: "LEO", norad: "45678" }, timestamp: now },
  { id: "g1", type: "ground", position: { lat: 51.507, lng: -0.127 }, label: "GCHQ Cheltenham", metadata: { type: "SIGINT" }, timestamp: now },
  { id: "g2", type: "ground", position: { lat: 38.9, lng: -77.0 }, label: "NSA Fort Meade", metadata: { type: "SIGINT" }, timestamp: now },
];

const demoChannels: MeshChannel[] = [
  { id: "general", name: "#general", type: "public", participants: 12, unread: 0 },
  { id: "ops", name: "#ops-secure", type: "encrypted", participants: 4, unread: 3 },
  { id: "sigint", name: "#sigint-feed", type: "public", participants: 8, unread: 1 },
  { id: "cmd", name: "@command", type: "direct", participants: 2, unread: 0 },
];

const demoMessages: MeshMessage[] = [
  { id: "m1", channelId: "general", sender: "operator-alpha", content: "New vessel contact bearing 045 from SigInt station. Classify as merchant.", timestamp: new Date(Date.now() - 300000).toISOString(), encrypted: false },
  { id: "m2", channelId: "general", sender: "observer-north", content: "Confirm visual on same contact. No suspicious activity observed.", timestamp: new Date(Date.now() - 240000).toISOString(), encrypted: false },
  { id: "m3", channelId: "ops", sender: "handler-7", content: "Package delivered. Awaiting confirmation from field unit.", timestamp: new Date(Date.now() - 180000).toISOString(), encrypted: true },
  { id: "m4", channelId: "ops", sender: "field-unit-3", content: "Confirmed. Exfil route clear. Proceeding to extraction point.", timestamp: new Date(Date.now() - 120000).toISOString(), encrypted: true },
  { id: "m5", channelId: "sigint", sender: "automation", content: "New signal detected: 142.350 MHz FM, strength 73%, bearing 210°.", timestamp: new Date(Date.now() - 60000).toISOString(), encrypted: false },
  { id: "m6", channelId: "ops", sender: "handler-7", content: "Maintain radio silence until waypoint Bravo.", timestamp: new Date(Date.now() - 30000).toISOString(), encrypted: true },
];

const demoMarkets: PredictionMarket[] = [
  {
    id: "m1",
    title: "Will a major shipping lane close due to conflict in Q2 2025?",
    category: "Geopolitics",
    outcomes: [
      { id: "o1", label: "Yes", probability: 0.34, stake: 14200 },
      { id: "o2", label: "No", probability: 0.66, stake: 27800 },
    ],
    volume: 42000,
    closingDate: "2025-06-30",
    status: "open",
  },
  {
    id: "m2",
    title: "Will a critical zero-day in open-source infrastructure be exploited at scale?",
    category: "Cybersecurity",
    outcomes: [
      { id: "o1", label: "Yes, within 30 days", probability: 0.52, stake: 8900 },
      { id: "o2", label: "Yes, within 90 days", probability: 0.31, stake: 5300 },
      { id: "o3", label: "No", probability: 0.17, stake: 2900 },
    ],
    volume: 17100,
    closingDate: "2025-04-15",
    status: "open",
  },
  {
    id: "m3",
    title: "Will satellite imagery resolution commercially available exceed 25cm by EOY?",
    category: "Technology",
    outcomes: [
      { id: "o1", label: "Yes", probability: 0.71, stake: 34500 },
      { id: "o2", label: "No", probability: 0.29, stake: 14100 },
    ],
    volume: 48600,
    closingDate: "2025-12-31",
    status: "open",
  },
];

const demoSignals: RadioSignal[] = [
  { id: "r1", frequency: 142.350, mode: "FM", strength: 73, label: "Maritime Ch 16", latitude: 51.5, longitude: -0.1, timestamp: now },
  { id: "r2", frequency: 446.006, mode: "FM", strength: 45, label: "PMR Ch 1", latitude: 40.7, longitude: -74.0, timestamp: now },
  { id: "r3", frequency: 3.500, mode: "CW", strength: 28, label: "80m Amateur", latitude: 35.7, longitude: 139.7, timestamp: now },
  { id: "r4", frequency: 145.800, mode: "FM", strength: 91, label: "ISS Downlink", latitude: 0, longitude: -100, timestamp: now },
  { id: "r5", frequency: 118.100, mode: "AM", strength: 62, label: "ATC Tower", latitude: 51.47, longitude: -0.46, timestamp: now },
  { id: "r6", frequency: 437.500, mode: "DIGITAL", strength: 55, label: "CubeSat Beacon", latitude: 28.5, longitude: -80.6, timestamp: now },
];

const demoShodanResults: ShodanResult[] = [
  {
    ip: "192.168.1.1", port: 80, org: "Example ISP", country: "US", city: "New York",
    os: "Linux 3.2", product: "Apache", version: "2.4.41",
    tags: ["web", "http"], vulns: ["CVE-2021-41773"], lastUpdate: now,
  },
  {
    ip: "10.0.0.5", port: 22, org: "Cloud Provider", country: "DE", city: "Frankfurt",
    os: "Ubuntu 20.04", product: "OpenSSH", version: "8.2",
    tags: ["ssh"], vulns: [], lastUpdate: now,
  },
  {
    ip: "172.16.0.1", port: 443, org: "CorpNet", country: "JP", city: "Tokyo",
    os: "Windows Server 2019", product: "IIS", version: "10.0",
    tags: ["web", "ssl", "https"], vulns: ["CVE-2022-21907"], lastUpdate: now,
  },
  {
    ip: "203.0.113.7", port: 554, org: "Telecom", country: "BR", city: "São Paulo",
    product: "DVR", version: "V4.02",
    tags: ["rtsp", "iot", "camera"], vulns: ["CVE-2018-9995"], lastUpdate: now,
  },
  {
    ip: "198.51.100.22", port: 502, org: "Industrial", country: "CN", city: "Shenzhen",
    product: "Modbus Gateway", version: "1.2",
    tags: ["scada", "ics", "modbus"], vulns: [], lastUpdate: now,
  },
  {
    ip: "192.0.2.100", port: 9100, org: "OfficeNet", country: "GB", city: "London",
    product: "HP Printer", version: "FW 2023.1",
    tags: ["printer", "jetdirect"], vulns: ["CVE-2023-27500"], lastUpdate: now,
  },
];

export const useDashboardStore = create<DashboardState>((set, get) => ({
  isLoading: false,
  backendOnline: false,
  setBackendOnline: (v) => set({ backendOnline: v }),

  mapEntities: demoMapEntities,
  selectedEntity: null,
  setMapEntities: (entities) => set({ mapEntities: entities }),
  setSelectedEntity: (entity) => set({ selectedEntity: entity }),
  refreshMap: async () => {
    try {
      const [f, v, s] = await Promise.all([api.flights(), api.vessels(), api.satellites()]);
      const all = [...f.flights, ...v.vessels, ...s.satellites] as MapEntity[];
      set({ mapEntities: all, backendOnline: true });
    } catch {
      set({ backendOnline: false });
    }
  },

  newsItems: demoNewsItems,
  newsSources: demoNewsSources,
  setNewsItems: (items) => set({ newsItems: items }),
  setNewsSources: (sources) => set({ newsSources: sources }),
  toggleNewsSource: (id) =>
    set((state) => ({
      newsSources: state.newsSources.map((s) =>
        s.id === id ? { ...s, enabled: !s.enabled } : s
      ),
    })),
  refreshNews: async (source, q) => {
    try {
      const data = await api.news(source, q);
      set({ newsItems: data.items as NewsItem[], backendOnline: true });
    } catch {
      set({ backendOnline: false });
    }
  },

  meshChannels: demoChannels,
  meshMessages: demoMessages,
  activeChannel: "general",
  setMeshChannels: (channels) => set({ meshChannels: channels }),
  setMeshMessages: (messages) => set({ meshMessages: messages }),
  setActiveChannel: (id) => set({ activeChannel: id }),
  refreshMesh: async () => {
    try {
      const ch = await api.meshChannels();
      const msg = await api.meshMessages(get().activeChannel);
      set({ meshChannels: ch.channels as MeshChannel[], meshMessages: msg.messages as MeshMessage[], backendOnline: true });
    } catch {
      set({ backendOnline: false });
    }
  },

  markets: demoMarkets,
  setMarkets: (markets) => set({ markets }),
  refreshMarkets: async () => {
    try {
      const data = await api.markets();
      set({ markets: data.markets as PredictionMarket[], backendOnline: true });
    } catch {
      set({ backendOnline: false });
    }
  },

  signals: demoSignals,
  selectedSignal: null,
  setSignals: (signals) => set({ signals }),
  setSelectedSignal: (signal) => set({ selectedSignal: signal }),
  refreshSigint: async () => {
    try {
      const data = await api.sigint();
      set({ signals: data.signals as RadioSignal[], backendOnline: true });
    } catch {
      set({ backendOnline: false });
    }
  },

  shodanResults: demoShodanResults,
  shodanQuery: "",
  setShodanResults: (results) => set({ shodanResults: results }),
  setShodanQuery: (query) => set({ shodanQuery: query }),
  searchShodan: async (query) => {
    if (!query.trim()) return;
    set({ isLoading: true });
    try {
      const data = await api.shodan(query);
      set({ shodanResults: data.results as ShodanResult[], shodanQuery: query, backendOnline: true });
    } catch {
      set({ backendOnline: false });
    } finally {
      set({ isLoading: false });
    }
  },
}));
