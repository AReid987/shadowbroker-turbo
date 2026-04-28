const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://shadowbroker-api.onrender.com";

async function fetchJson<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { cache: "no-store", ...opts });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

export const api = {
  health: () => fetchJson<{ status: string; version: string; timestamp: string }>("/api/health"),
  flights: () => fetchJson<{ flights: unknown[]; timestamp: string }>("/api/flights"),
  vessels: () => fetchJson<{ vessels: unknown[]; timestamp: string }>("/api/vessels"),
  satellites: () => fetchJson<{ satellites: unknown[]; timestamp: string }>("/api/satellites"),
  news: (source?: string, q?: string) => {
    const params = new URLSearchParams();
    if (source) params.set("source", source);
    if (q) params.set("q", q);
    return fetchJson<{ items: unknown[]; timestamp: string }>(`/api/news?${params}`);
  },
  sigint: () => fetchJson<{ signals: unknown[]; timestamp: string }>("/api/sigint"),
  markets: () => fetchJson<{ markets: unknown[]; timestamp: string }>("/api/markets"),
  shodan: (query: string) => fetchJson<{ query: string; results: unknown[]; total: number }>(`/api/shodan/search?q=${encodeURIComponent(query)}`),
  meshChannels: () => fetchJson<{ channels: unknown[]; timestamp: string }>("/api/mesh/channels"),
  meshMessages: (channel: string) => fetchJson<{ messages: unknown[]; timestamp: string }>(`/api/mesh/messages?channel=${encodeURIComponent(channel)}`),
  sendMessage: (channel: string, sender: string, content: string) =>
    fetchJson<{ message: unknown; timestamp: string }>("/api/mesh/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel, sender, content }),
    }),
  cctv: (country?: string, limit?: number) => {
    const params = new URLSearchParams();
    if (country) params.set("country", country);
    if (limit) params.set("limit", String(limit));
    return fetchJson<{ cameras: unknown[]; total: number; timestamp: string }>(`/api/cctv?${params}`);
  },
  cctvCountries: () => fetchJson<{ countries: unknown[]; timestamp: string }>("/api/cctv/countries"),
};
