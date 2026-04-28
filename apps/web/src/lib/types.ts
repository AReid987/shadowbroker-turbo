export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface AuthSession {
  token: string;
  expiry: number;
}

export interface AuthResult {
  success: boolean;
  token?: string;
  error?: string;
}

export interface ApiError {
  error: string;
  status: number;
}

export type ThemeMode = 'dark' | 'darker' | 'system';

// Map types
export interface MapEntity {
  id: string;
  type: 'flight' | 'vessel' | 'satellite' | 'ground';
  position: GeoPoint;
  label: string;
  heading?: number;
  altitude?: number;
  speed?: number;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

// News types
export interface NewsSource {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  category: 'general' | 'tech' | 'defense' | 'finance' | 'geopolitics';
  refreshInterval: number;
  lastFetch?: string;
}

export interface NewsItem {
  id: string;
  title: string;
  source: string;
  sourceId: string;
  timestamp: string;
  url?: string;
  summary?: string;
  tags: string[];
  category: string;
}

// Mesh types
export interface MeshChannel {
  id: string;
  name: string;
  type: 'public' | 'encrypted' | 'direct';
  participants: number;
  unread: number;
}

export interface MeshMessage {
  id: string;
  channelId: string;
  sender: string;
  content: string;
  timestamp: string;
  encrypted: boolean;
  signature?: string;
}

// Prediction market types
export interface PredictionMarket {
  id: string;
  title: string;
  category: string;
  outcomes: MarketOutcome[];
  volume: number;
  closingDate: string;
  status: 'open' | 'closed' | 'resolved';
}

export interface MarketOutcome {
  id: string;
  label: string;
  probability: number;
  stake: number;
}

// SIGINT types
export interface RadioSignal {
  id: string;
  frequency: number;
  mode: 'AM' | 'FM' | 'SSB' | 'CW' | 'DIGITAL';
  strength: number;
  label?: string;
  latitude?: number;
  longitude?: number;
  timestamp: string;
  audioUrl?: string;
}

// Shodan types
export interface ShodanResult {
  ip: string;
  port: number;
  org?: string;
  isp?: string;
  country?: string;
  city?: string;
  os?: string;
  product?: string;
  version?: string;
  tags: string[];
  vulns: string[];
  lastUpdate: string;
}

// CCTV types
export interface CCTVCamera {
  id: string;
  url: string;
  country_code: string;
  country: string;
  city: string;
  type: string;
  label: string;
  status: string;
  timestamp: string;
}

export interface CCTVCountry {
  code: string;
  name: string;
  count: number;
}
