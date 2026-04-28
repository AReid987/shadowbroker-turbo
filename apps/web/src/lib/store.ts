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
  CCTVCamera,
  CCTVCountry,
} from "@/lib/types";
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

  // CCTV
  cctvCameras: CCTVCamera[];
  cctvCountries: CCTVCountry[];
  cctvTotal: number;
  cctvSelectedCountry: string | null;
  setCctvCameras: (cameras: CCTVCamera[]) => void;
  setCctvCountries: (countries: CCTVCountry[]) => void;
  setCctvSelectedCountry: (country: string | null) => void;
  refreshCctv: (country?: string, limit?: number) => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  isLoading: false,
  backendOnline: false,
  setBackendOnline: (v) => set({ backendOnline: v }),

  // Real data only — start empty, fetch from backend
  mapEntities: [],
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

  newsItems: [],
  newsSources: [],
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

  meshChannels: [],
  meshMessages: [],
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

  markets: [],
  setMarkets: (markets) => set({ markets }),
  refreshMarkets: async () => {
    try {
      const data = await api.markets();
      set({ markets: data.markets as PredictionMarket[], backendOnline: true });
    } catch {
      set({ backendOnline: false });
    }
  },

  signals: [],
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

  shodanResults: [],
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

  // CCTV
  cctvCameras: [],
  cctvCountries: [],
  cctvTotal: 0,
  cctvSelectedCountry: null,
  setCctvCameras: (cameras) => set({ cctvCameras: cameras }),
  setCctvCountries: (countries) => set({ cctvCountries: countries }),
  setCctvSelectedCountry: (country) => set({ cctvSelectedCountry: country }),
  refreshCctv: async (country, limit = 50) => {
    try {
      const [camData, countryData] = await Promise.all([
        api.cctv(country || undefined, limit),
        api.cctvCountries(),
      ]);
      set({
        cctvCameras: camData.cameras as CCTVCamera[],
        cctvTotal: camData.total,
        cctvCountries: countryData.countries as CCTVCountry[],
        backendOnline: true,
      });
    } catch {
      set({ backendOnline: false });
    }
  },
}));
