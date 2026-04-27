# Shadowbroker-Turbo Implementation Plan

## 1. Architecture Overview

### Current State

```
shadowbroker-turbo/
├── apps/
│   ├── web/          # Next.js 15 App Router — auth, dashboard shell, placeholder tabs
│   └── api/          # FastAPI — health + stub endpoints (/api/health, /api/live-data, /api/news)
├── packages/
│   ├── auth/         # Shared auth logic (token validation)
│   ├── config/       # Shared tailwind + eslint + tsconfig bases
│   ├── types/        # Shared TS interfaces (GeoPoint, MapEntity, NewsItem, etc.)
│   └── ui/           # Component library (Button, Card, Panel, Terminal, Input, Badge, Tooltip)
```

The dashboard shell (`DashboardShell.tsx`) already has sidebar navigation with tabs for Overview, Live Map, News Feed, SIGINT, Satellites, and Settings — all rendering placeholder content. The design tokens (sb-black, sb-panel, sb-accent #22c55e) and Framer Motion are wired up.

### Target Architecture

```
shadowbroker-turbo/
├── apps/
│   ├── web/
│   │   └── src/
│   │       ├── app/
│   │       │   └── dashboard/
│   │       │       └── page.tsx            # (existing — routes to DashboardShell)
│   │       ├── components/
│   │       │   ├── DashboardShell.tsx       # (existing — add new nav items)
│   │       │   ├── map/
│   │       │   │   ├── LiveMap.tsx          # MapLibre container + controls
│   │       │   │   ├── MapControls.tsx      # Layer toggles, fit-bounds, clustering
│   │       │   │   ├── MapPopup.tsx         # Entity detail popup
│   │       │   │   └── useMapData.ts        # Hook: fetch + SSE live data
│   │       │   ├── news/
│   │       │   │   ├── NewsFeed.tsx         # Feed list + filter bar
│   │       │   │   ├── NewsCard.tsx         # Single item card
│   │       │   │   ├── NewsConfigPanel.tsx  # Add/remove/select sources modal
│   │       │   │   └── useNewsFeed.ts       # Hook: polling, source config, localStorage
│   │       │   ├── mesh/
│   │       │   │   ├── MeshChat.tsx         # Channel list + message area
│   │       │   │   ├── ChannelSidebar.tsx   # Channel list + presence indicators
│   │       │   │   ├── MessageList.tsx      # Virtual-scroll message list
│   │       │   │   ├── MessageInput.tsx     # Input with send action
│   │       │   │   └── useMeshChat.ts       # Hook: channels, messages, presence (WebSocket scaffold)
│   │       │   ├── markets/
│   │       │   │   ├── PredictionMarkets.tsx  # Market list + detail
│   │       │   │   ├── MarketCard.tsx         # Single market with odds bar
│   │       │   │   ├── StakePanel.tsx         # Stake/bet UI
│   │       │   │   └── usePredictionMarkets.ts # Hook: fetch markets, place stake scaffold
│   │       │   ├── sigint/
│   │       │   │   ├── SigintPanel.tsx      # Scanner interface container
│   │       │   │   ├── FrequencyDisplay.tsx # Tuned frequency + waterfall
│   │       │   │   ├── SignalMeter.tsx      # Signal strength gauge
│   │       │   │   ├── AudioPlayer.tsx      # Audio playback scaffold
│   │       │   │   └── useSigint.ts         # Hook: frequency state, signal data
│   │       │   └── shodan/
│   │       │       ├── ShodanSearch.tsx      # Search input + results grid
│   │       │       ├── ShodanResultCard.tsx  # Single device result
│   │       │       ├── ShodanFilters.tsx     # Filter bar (port, country, org)
│   │       │       └── useShodan.ts          # Hook: debounced search, caching, rate-limit state
│   │       ├── hooks/
│   │       │   ├── useAuth.ts               # (existing)
│   │       │   ├── useDebounce.ts           # Generic debounce hook
│   │       │   ├── useLocalStorage.ts       # Generic localStorage hook
│   │       │   └── useSSE.ts               # Server-Sent Events hook
│   │       └── lib/
│   │           ├── api.ts                   # Typed fetch wrapper (base URL from env)
│   │           ├── cache.ts                 # Client-side LRU cache with TTL
│   │           └── auth.ts                  # (existing)
│   └── api/
│       └── src/
│           ├── main.py                      # (existing — extend with new routers)
│           ├── routers/
│           │   ├── __init__.py
│           │   ├── live_data.py             # /api/live-data SSE endpoint
│           │   ├── news.py                  # /api/news + /api/news/sources
│           │   ├── mesh.py                  # /api/mesh/channels + /api/mesh/messages
│           │   ├── markets.py               # /api/markets + /api/markets/stake
│           │   ├── sigint.py                # /api/sigint/frequencies + /api/sigint/stream
│           │   └── shodan.py                # /api/shodan/search + /api/shodan/cache-status
│           ├── services/
│           │   ├── __init__.py
│           │   ├── shodan_client.py         # Shodan API wrapper with caching + rate limiting
│           │   ├── news_aggregator.py       # RSS feed fetcher + parser
│           │   └── live_data_provider.py    # Data provider abstraction
│           ├── models/
│           │   ├── __init__.py
│           │   ├── live.py                  # Pydantic models for live data
│           │   ├── news.py                  # Pydantic models for news
│           │   ├── mesh.py                  # Pydantic models for mesh/chat
│           │   ├── markets.py               # Pydantic models for prediction markets
│           │   ├── sigint.py                # Pydantic models for SIGINT
│           │   └── shodan.py                # Pydantic models for Shodan
│           └── core/
│               ├── __init__.py
│               ├── config.py                # Settings via pydantic-settings
│               └── cache.py                 # Server-side cache (in-memory LRU or Redis)
├── packages/
│   ├── types/
│   │   └── src/
│   │       ├── index.ts                     # (existing — extend)
│   │       ├── map.ts                       # Map-related types
│   │       ├── news.ts                      # News types
│   │       ├── mesh.ts                      # Mesh/chat types
│   │       ├── markets.ts                   # Prediction market types
│   │       ├── sigint.ts                    # SIGINT types
│   │       └── shodan.ts                    # Shodan types
│   └── ui/
│       └── src/
│           ├── index.ts                     # (existing — extend exports)
│           ├── signal-meter.tsx             # Animated signal strength gauge
│           ├── odds-bar.tsx                 # Horizontal odds visualization
│           ├── presence-dot.tsx             # Online/offline/away indicator
│           ├── frequency-display.tsx        # Digital frequency readout
│           └── skeleton.tsx                 # Loading skeleton component
```

### Data Flow

```
┌─────────────────┐    fetch/SSE     ┌──────────────┐    external APIs    ┌─────────────┐
│  Next.js Client  │ ──────────────► │   FastAPI     │ ──────────────────► │ Shodan API  │
│                  │ ◄────────────── │              │ ◄────────────────── │ RSS Feeds   │
│  - React hooks   │    JSON/SSE     │  - Routers   │    JSON             │ Datastream  │
│  - localStorage  │                 │  - Services  │                     │             │
│  - LRU cache     │                 │  - LRU cache │                     │             │
└─────────────────┘                  └──────────────┘                     └─────────────┘
```

---

## 2. Data Models / Types

### `packages/types/src/map.ts`

```typescript
import { z } from "zod";

// ── Geo primitives ──
export const GeoPointSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});
export type GeoPoint = z.infer<typeof GeoPointSchema>;

// ── Map entities ──
export const EntityTypeSchema = z.enum(["flight", "vessel", "satellite", "ground"]);
export type EntityType = z.infer<typeof EntityTypeSchema>;

export const MapEntitySchema = z.object({
  id: z.string(),
  type: EntityTypeSchema,
  position: GeoPointSchema,
  heading: z.number().min(0).max(360).optional(),
  speed: z.number().nonnegative().optional(),
  altitude: z.number().optional(),
  label: z.string().optional(),
  callsign: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  updatedAt: z.string().datetime(),
});
export type MapEntity = z.infer<typeof MapEntitySchema>;

export const MapLayerSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: EntityTypeSchema,
  visible: z.boolean(),
  color: z.string(), // hex
  entityCount: z.number().nonnegative(),
});
export type MapLayer = z.infer<typeof MapLayerSchema>;

export const LiveDataPayloadSchema = z.object({
  flights: z.array(MapEntitySchema),
  vessels: z.array(MapEntitySchema),
  satellites: z.array(MapEntitySchema),
  ground: z.array(MapEntitySchema),
  timestamp: z.string().datetime(),
});
export type LiveDataPayload = z.infer<typeof LiveDataPayloadSchema>;
```

### `packages/types/src/news.ts`

```typescript
export const NewsSourceSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string().url(),
  type: z.enum(["rss", "atom", "api"]),
  enabled: z.boolean(),
  pollIntervalSec: z.number().positive().default(300),
  category: z.string().optional(),
  favicon: z.string().url().optional(),
});
export type NewsSource = z.infer<typeof NewsSourceSchema>;

export const NewsItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  source: z.string(),
  sourceId: z.string(),
  timestamp: z.string().datetime(),
  url: z.string().url().optional(),
  summary: z.string().optional(),
  tags: z.array(z.string()).optional(),
  imageUrl: z.string().url().optional(),
});
export type NewsItem = z.infer<typeof NewsItemSchema>;

export const NewsFeedConfigSchema = z.object({
  sources: z.array(NewsSourceSchema),
  selectedSourceIds: z.array(z.string()), // empty = all
  maxItems: z.number().positive().default(100),
});
export type NewsFeedConfig = z.infer<typeof NewsFeedConfigSchema>;
```

### `packages/types/src/mesh.ts`

```typescript
export const PresenceStatusSchema = z.enum(["online", "away", "offline"]);
export type PresenceStatus = z.infer<typeof PresenceStatusSchema>;

export const MeshUserSchema = z.object({
  id: z.string(),
  callsign: z.string(),
  status: PresenceStatusSchema,
  lastSeen: z.string().datetime(),
});
export type MeshUser = z.infer<typeof MeshUserSchema>;

export const MeshChannelSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  encrypted: z.boolean().default(false),
  memberCount: z.number().nonnegative(),
  unreadCount: z.number().nonnegative().default(0),
});
export type MeshChannel = z.infer<typeof MeshChannelSchema>;

export const MeshMessageSchema = z.object({
  id: z.string(),
  channelId: z.string(),
  authorId: z.string(),
  authorCallsign: z.string(),
  content: z.string(),
  timestamp: z.string().datetime(),
  edited: z.boolean().default(false),
  replyTo: z.string().optional(),
});
export type MeshMessage = z.infer<typeof MeshMessageSchema>;
```

### `packages/types/src/markets.ts`

```typescript
export const MarketOutcomeSchema = z.object({
  id: z.string(),
  label: z.string(),
  odds: z.number().positive(),       // decimal odds e.g. 2.50
  probability: z.number().min(0).max(1),
  volume: z.number().nonnegative(),
});
export type MarketOutcome = z.infer<typeof MarketOutcomeSchema>;

export const PredictionMarketSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  category: z.string(),
  outcomes: z.array(MarketOutcomeSchema).min(2),
  totalVolume: z.number().nonnegative(),
  liquidity: z.number().nonnegative(),
  closesAt: z.string().datetime(),
  resolvedAt: z.string().datetime().optional(),
  resolvedOutcomeId: z.string().optional(),
  source: z.string(),               // e.g. "polymarket", "metaculus"
  externalUrl: z.string().url().optional(),
});
export type PredictionMarket = z.infer<typeof PredictionMarketSchema>;

export const StakeRequestSchema = z.object({
  marketId: z.string(),
  outcomeId: z.string(),
  amount: z.number().positive(),
});
export type StakeRequest = z.infer<typeof StakeRequestSchema>;
```

### `packages/types/src/sigint.ts`

```typescript
export const SignalDataSchema = z.object({
  frequency: z.number(),             // Hz
  strength: z.number().min(0).max(100), // percentage
  bandwidth: z.number(),             // Hz
  mode: z.enum(["AM", "FM", "SSB", "CW", "DIGITAL"]),
  timestamp: z.string().datetime(),
  label: z.string().optional(),
});
export type SignalData = z.infer<typeof SignalDataSchema>;

export const FrequencyBandSchema = z.object({
  name: z.string(),                  // e.g. "HF", "VHF", "UHF"
  startHz: z.number(),
  endHz: z.number(),
});
export type FrequencyBand = z.infer<typeof FrequencyBandSchema>;

export const SigintSessionSchema = z.object({
  id: z.string(),
  tunedFrequency: z.number(),
  band: FrequencyBandSchema,
  signals: z.array(SignalDataSchema),
  isRecording: z.boolean(),
  isStreaming: z.boolean(),
});
export type SigintSession = z.infer<typeof SigintSessionSchema>;
```

### `packages/types/src/shodan.ts`

```typescript
export const ShodanHostSchema = z.object({
  ip: z.string(),
  port: z.number(),
  org: z.string().optional(),
  isp: z.string().optional(),
  country: z.string().optional(),
  countryCode: z.string().optional(),
  city: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  os: z.string().optional(),
  product: z.string().optional(),
  version: z.string().optional(),
  data: z.string().optional(),       // banner snippet
  timestamp: z.string().datetime().optional(),
});
export type ShodanHost = z.infer<typeof ShodanHostSchema>;

export const ShodanSearchQuerySchema = z.object({
  query: z.string().min(1),
  page: z.number().positive().default(1),
  facets: z.array(z.string()).optional(),
  filters: z.object({
    port: z.number().optional(),
    country: z.string().optional(),
    org: z.string().optional(),
    os: z.string().optional(),
  }).optional(),
});
export type ShodanSearchQuery = z.infer<typeof ShodanSearchQuerySchema>;

export const ShodanSearchResultSchema = z.object({
  matches: z.array(ShodanHostSchema),
  total: z.number().nonnegative(),
  page: z.number().positive(),
  facets: z.record(z.array(z.object({
    value: z.string(),
    count: z.number(),
  }))).optional(),
});
export type ShodanSearchResult = z.infer<typeof ShodanSearchResultSchema>;

export const ShodanCacheEntrySchema = z.object({
  query: z.string(),
  result: ShodanSearchResultSchema,
  cachedAt: z.string().datetime(),
  expiresAt: z.string().datetime(),
  hitCount: z.number().nonnegative(),
});
export type ShodanCacheEntry = z.infer<typeof ShodanCacheEntrySchema>;
```

### `packages/types/src/index.ts` (extend existing)

```typescript
// Existing exports...
export * from "./map";
export * from "./news";
export * from "./mesh";
export * from "./markets";
export * from "./sigint";
export * from "./shodan";
```

---

## 3. API Endpoints (FastAPI)

### `routers/live_data.py`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/live-data` | Returns current snapshot of all map entities |
| `GET` | `/api/live-data/stream` | SSE endpoint — pushes `LiveDataPayload` every N seconds |
| `GET` | `/api/live-data/layers` | Returns available layers + visibility state |

### `routers/news.py`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/news` | Returns aggregated news items (query: `?source_ids=...&limit=...`) |
| `GET` | `/api/news/sources` | Returns configured news sources |
| `POST` | `/api/news/sources` | Add a new news source `{name, url, type, pollIntervalSec}` |
| `DELETE` | `/api/news/sources/{source_id}` | Remove a news source |
| `PATCH` | `/api/news/sources/{source_id}` | Toggle source enabled/disabled |

### `routers/mesh.py`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/mesh/channels` | List channels |
| `POST` | `/api/mesh/channels` | Create channel |
| `GET` | `/api/mesh/channels/{id}/messages` | Get messages (cursor pagination) |
| `POST` | `/api/mesh/channels/{id}/messages` | Send message |
| `GET` | `/api/mesh/presence` | Get online users |
| `WS` | `/api/mesh/ws` | WebSocket for real-time messages + presence |

### `routers/markets.py`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/markets` | List prediction markets (query: `?category=...&sort=...`) |
| `GET` | `/api/markets/{id}` | Single market detail |
| `POST` | `/api/markets/stake` | Place stake (scaffold — returns 501 until oracle integrated) |

### `routers/sigint.py`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/sigint/bands` | Available frequency bands |
| `GET` | `/api/sigint/signals` | Current signal data snapshot |
| `GET` | `/api/sigint/stream` | SSE stream of signal strength updates |
| `POST` | `/api/sigint/tune` | Tune to frequency `{frequency: number}` |

### `routers/shodan.py`

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/shodan/search` | Search Shodan `{query, page?, filters?}` — cached, rate-limited |
| `GET` | `/api/shodan/cache-status` | Cache stats + remaining API credits |
| `DELETE` | `/api/shodan/cache` | Clear Shodan cache |

### `core/config.py`

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    SHODAN_API_KEY: str = ""
    SHODAN_CACHE_TTL_SEC: int = 3600        # 1 hour
    SHODAN_RATE_LIMIT_SEC: int = 1           # min interval between API calls
    SHODAN_MAX_RESULTS_PER_PAGE: int = 100
    NEWS_DEFAULT_POLL_SEC: int = 300
    LIVE_DATA_REFRESH_SEC: int = 5
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]

    class Config:
        env_file = ".env"
```

---

## 4. Component Breakdown (File-by-File)

### 4.1 Live Map

**`apps/web/src/components/map/LiveMap.tsx`** — `"use client"`

```
Props: none (self-contained)
State:
  - entities: MapEntity[]
  - layers: MapLayer[]
  - selectedEntity: MapEntity | null
  - mapRef: RefObject<Map>

Renders:
  - MapLibre GL map (dark style URL)
  - GeoJSON sources per entity type
  - Clustered point layers
  - Fit-bounds control
  - Layer toggle sidebar overlay
  - MapPopup on click

Hook: useMapData() → { entities, layers, isLoading, error }
```

**`apps/web/src/components/map/MapControls.tsx`**

```
Props: layers: MapLayer[], onToggleLayer: (id: string) => void, onFitBounds: () => void
Renders: Floating control panel with layer checkboxes + fit-bounds button
```

**`apps/web/src/components/map/MapPopup.tsx`**

```
Props: entity: MapEntity | null, onClose: () => void
Renders: Floating card with entity details (callsign, type, speed, altitude, heading)
```

**`apps/web/src/components/map/useMapData.ts`**

```
Returns: { entities: MapEntity[], layers: MapLayer[], isLoading: boolean, error: string | null }
Logic:
  - Fetches /api/live-data on mount
  - Connects to /api/live-data/stream (SSE) for updates
  - Computes layer entity counts
  - Cleans up SSE on unmount
```

### 4.2 News Feed

**`apps/web/src/components/news/NewsFeed.tsx`** — `"use client"`

```
State: config (NewsFeedConfig), searchQuery: string, selectedSourceIds: string[]
Hook: useNewsFeed()
Renders:
  - Filter bar (source selector, search input)
  - Config panel toggle button
  - Virtual or paginated NewsCard list
  - NewsConfigPanel (modal)
```

**`apps/web/src/components/news/NewsCard.tsx`**

```
Props: item: NewsItem
Renders: Card with title, source badge, timestamp, summary, tags
Uses: Panel from @shadowbroker/ui, motion.div for enter animation
```

**`apps/web/src/components/news/NewsConfigPanel.tsx`**

```
Props: config: NewsFeedConfig, onUpdate: (config: NewsFeedConfig) => void, onClose: () => void
Renders: Modal/panel with:
  - Source list (add, remove, toggle enabled, edit poll interval)
  - "Add Source" form (name, URL, type selector)
  - Save button → persists to localStorage + POST /api/news/sources
```

**`apps/web/src/components/news/useNewsFeed.ts`**

```
Returns: { items: NewsItem[], config: NewsFeedConfig, isLoading: boolean, refresh: () => void }
Logic:
  - Loads config from localStorage (key: "sb-news-config"), falls back to defaults
  - Fetches /api/news?source_ids=... on mount + on config change
  - Polls at configured interval per source (minimum of all enabled)
  - Saves config to localStorage on change
```

### 4.3 Mesh / Chat

**`apps/web/src/components/mesh/MeshChat.tsx`** — `"use client"`

```
State: activeChannelId: string | null
Hook: useMeshChat()
Renders:
  - Flex container
  - ChannelSidebar (left, 240px)
  - Message area (right, flex-1): MessageList + MessageInput
```

**`apps/web/src/components/mesh/ChannelSidebar.tsx`**

```
Props: channels: MeshChannel[], activeChannelId: string | null, onSelect: (id: string) => void, users: MeshUser[]
Renders:
  - Channel list with unread badges
  - Presence section (online users with PresenceDot)
```

**`apps/web/src/components/mesh/MessageList.tsx`**

```
Props: messages: MeshMessage[], currentUserId: string
Renders:
  - Scrollable message list (div with ref for auto-scroll)
  - Grouped by time proximity
  - Callsign-colored author names
  - Timestamp formatting (relative)
```

**`apps/web/src/components/mesh/MessageInput.tsx`**

```
Props: onSend: (content: string) => void, disabled?: boolean
Renders:
  - Textarea with auto-resize
  - Send button
  - Enter to send, Shift+Enter for newline
```

**`apps/web/src/components/mesh/useMeshChat.ts`**

```
Returns: {
  channels: MeshChannel[],
  messages: MeshMessage[],
  users: MeshUser[],
  activeChannel: MeshChannel | null,
  sendMessage: (content: string) => void,
  setActiveChannel: (id: string) => void,
  isConnected: boolean,
}
Logic:
  - Fetches /api/mesh/channels, /api/mesh/presence on mount
  - Fetches /api/mesh/channels/{id}/messages on channel change
  - WebSocket connect to /api/mesh/ws for real-time messages + presence
  - Scaffold: if WS fails, falls back to polling every 5s
  - Local state append for optimistic message display
```

### 4.4 Prediction Markets

**`apps/web/src/components/markets/PredictionMarkets.tsx`** — `"use client"`

```
State: selectedCategory: string | null, selectedMarket: PredictionMarket | null
Hook: usePredictionMarkets()
Renders:
  - Category filter tabs
  - MarketCard grid
  - StakePanel slide-over when market selected
```

**`apps/web/src/components/markets/MarketCard.tsx`**

```
Props: market: PredictionMarket, onSelect: () => void
Renders:
  - Panel with title, category badge, volume, closes-at countdown
  - OddsBar for top 2 outcomes
  - Click → opens StakePanel
```

**`apps/web/src/components/markets/StakePanel.tsx`**

```
Props: market: PredictionMarket | null, onClose: () => void
Renders:
  - Slide-over panel
  - Outcome list with odds + probability bars
  - Stake amount input
  - Potential payout calculation
  - "Place Stake" button (scaffold: shows "Oracle integration pending" toast)
```

**`apps/web/src/components/markets/usePredictionMarkets.ts`**

```
Returns: { markets: PredictionMarket[], isLoading: boolean, placeStake: (req: StakeRequest) => Promise<void> }
Logic:
  - Fetches /api/markets on mount
  - placeStake: calls POST /api/markets/stake, handles 501 gracefully
```

### 4.5 SIGINT / Radio Intercept

**`apps/web/src/components/sigint/SigintPanel.tsx`** — `"use client"`

```
State: tunedFrequency: number, isStreaming: boolean
Hook: useSigint()
Renders:
  - Full-height panel with:
    - FrequencyDisplay (large digital readout)
    - SignalMeter (animated bar gauge)
    - Waterfall/spectrogram placeholder (canvas element)
    - Band selector
    - AudioPlayer scaffold
    - Tune controls (up/down buttons, direct entry)
```

**`apps/web/src/components/sigint/FrequencyDisplay.tsx`**

```
Props: frequency: number, unit?: "Hz" | "kHz" | "MHz"
Renders: Large monospace digital display, auto-scales unit (e.g. "14.225 MHz")
```

**`apps/web/src/components/sigint/SignalMeter.tsx`**

```
Props: strength: number (0-100), peak?: number
Renders: Horizontal bar gauge with green gradient, peak hold indicator
Uses: Framer Motion for smooth strength transitions
```

**`apps/web/src/components/sigint/AudioPlayer.tsx`**

```
Props: isPlaying: boolean, onToggle: () => void, volume: number, onVolumeChange: (v: number) => void
Renders:
  - Play/pause button
  - Volume slider
  - Waveform visualization placeholder (static bars)
  - Status label ("No signal" / "Receiving" / "Recording")
```

**`apps/web/src/components/sigint/useSigint.ts`**

```
Returns: {
  session: SigintSession | null,
  signals: SignalData[],
  tuneTo: (freq: number) => void,
  toggleStream: () => void,
}
Logic:
  - Fetches /api/sigint/bands and /api/sigint/signals on mount
  - SSE connect to /api/sigint/stream when streaming enabled
  - tuneTo: POST /api/sigint/tune
  - Generates mock signal data if API returns empty (for UI testing)
```

### 4.6 Shodan Integration

**`apps/web/src/components/shodan/ShodanSearch.tsx`** — `"use client"`

```
State: query: string, results: ShodanSearchResult | null
Hook: useShodan()
Renders:
  - Search input (debounced)
  - ShodanFilters bar
  - Cache status indicator (remaining credits, cached results count)
  - Results grid of ShodanResultCard
  - Pagination
  - Rate limit warning banner
```

**`apps/web/src/components/shodan/ShodanResultCard.tsx`**

```
Props: host: ShodanHost
Renders:
  - Panel with IP:port, org, country flag emoji, OS, product/version
  - Expandable banner snippet
  - Map link if lat/lng available
```

**`apps/web/src/components/shodan/ShodanFilters.tsx`**

```
Props: filters: ShodanFilters, onChange: (filters: ShodanFilters) => void
Renders: Inline filter chips for port, country, org, OS
```

**`apps/web/src/components/shodan/useShodan.ts`**

```
Returns: {
  results: ShodanSearchResult | null,
  isSearching: boolean,
  cacheStatus: { cached: number, remainingCredits: number | null },
  error: string | null,
  search: (query: ShodanSearchQuery) => void,
  clearCache: () => void,
}
Logic:
  - Debounced search (500ms delay via useDebounce)
  - Client-side LRU cache (query string → result, TTL 1hr)
  - Before API call: check local cache → if hit, return cached + background refresh
  - On 429 response: show rate limit banner, disable search for cooldown period
  - Tracks remaining API credits from response headers
  - clearCache: clears both client cache + calls DELETE /api/shodan/cache
```

### 4.7 Shared Hooks

**`apps/web/src/hooks/useDebounce.ts`**

```typescript
export function useDebounce<T>(value: T, delayMs: number): T
```

**`apps/web/src/hooks/useLocalStorage.ts`**

```typescript
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void]
```

**`apps/web/src/hooks/useSSE.ts`**

```typescript
export function useSSE<T>(url: string, options?: {
  onMessage: (data: T) => void;
  onError?: (err: Event) => void;
  enabled?: boolean;
}): { isConnected: boolean; connect: () => void; disconnect: () => void }
```

### 4.8 Shared UI Components (packages/ui)

**`packages/ui/src/signal-meter.tsx`**

```typescript
interface SignalMeterProps {
  strength: number;    // 0-100
  peak?: number;       // 0-100 peak hold
  className?: string;
}
// Animated horizontal bar, green gradient, Framer Motion spring transition
```

**`packages/ui/src/odds-bar.tsx`**

```typescript
interface OddsBarProps {
  outcomes: Array<{ label: string; probability: number; color?: string }>;
  className?: string;
}
// Stacked horizontal bar, each outcome colored, labels with percentages
```

**`packages/ui/src/presence-dot.tsx`**

```typescript
interface PresenceDotProps {
  status: "online" | "away" | "offline";
  size?: "sm" | "md" | "lg";
  className?: string;
}
// Colored dot: green=online, yellow=away, gray=offline, with pulse animation for online
```

**`packages/ui/src/frequency-display.tsx`**

```typescript
interface FrequencyDisplayProps {
  frequency: number;   // Hz
  unit?: "Hz" | "kHz" | "MHz";
  className?: string;
}
// Large monospace digital readout, segment-style with glow effect
```

**`packages/ui/src/skeleton.tsx`**

```typescript
interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
}
// Animated pulse placeholder, dark-bg compatible
```

### 4.9 Client Lib

**`apps/web/src/lib/api.ts`**

```typescript
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T>

export function createSSE(
  path: string,
  onMessage: (data: unknown) => void,
  onError?: (err: Event) => void
): EventSource
```

**`apps/web/src/lib/cache.ts`**

```typescript
export class LRUCache<T> {
  constructor(maxSize: number, ttlMs: number);
  get(key: string): T | undefined;
  set(key: string, value: T): void;
  has(key: string): boolean;
  delete(key: string): void;
  clear(): void;
  size(): number;
  stats(): { hits: number; misses: number; evictions: number };
}
```

### 4.10 DashboardShell Modifications

Update `apps/web/src/components/DashboardShell.tsx`:

- Add `Mesh` (MessageSquare icon) and `Markets` (TrendingUp icon) and `Shodan` (Search icon) to `NAV_ITEMS`
- Add tab renderers for `mesh`, `markets`, `shodan`
- Import and render new components conditionally

Updated NAV_ITEMS:

```typescript
const NAV_ITEMS = [
  { id: "overview", label: "Overview", icon: Activity },
  { id: "map", label: "Live Map", icon: MapPin },
  { id: "news", label: "News Feed", icon: Newspaper },
  { id: "mesh", label: "Mesh Comms", icon: MessageSquare },
  { id: "markets", label: "Markets", icon: TrendingUp },
  { id: "sigint", label: "SIGINT", icon: Radio },
  { id: "shodan", label: "Shodan", icon: Search },
  { id: "settings", label: "Settings", icon: Settings },
];
```

---

## 5. Implementation Order (4 Phases)

### Phase 1: Infrastructure + Live Map (Days 1-3)

**Goal:** Wire up API plumbing, shared types, client lib, and deliver the first real feature (Live Map).

1. **Shared types** — Create `packages/types/src/{map,news,mesh,markets,sigint,shodan}.ts` with Zod schemas
2. **Client lib** — Create `apps/web/src/lib/api.ts` and `apps/web/src/lib/cache.ts`
3. **Shared hooks** — Create `useDebounce.ts`, `useLocalStorage.ts`, `useSSE.ts`
4. **API config** — Create `apps/api/src/core/config.py` with pydantic-settings
5. **API router scaffold** — Create `apps/api/src/routers/` directory, wire all routers into `main.py` with stub endpoints
6. **API models** — Create `apps/api/src/models/` with Pydantic models mirroring the Zod types
7. **Install MapLibre** — `npm install maplibre-gl` in `apps/web`, add type definitions
8. **LiveMap component** — Implement `LiveMap.tsx`, `MapControls.tsx`, `MapPopup.tsx`, `useMapData.ts`
9. **live_data router** — Implement SSE endpoint in `apps/api/src/routers/live_data.py`
10. **DashboardShell update** — Wire map tab to LiveMap component
11. **New UI components** — Create `packages/ui/src/skeleton.tsx`

**Verification:**
- `npm run dev` — dashboard loads, map tab renders MapLibre map with dark style
- `curl localhost:8080/api/live-data` returns entity data
- Map clusters points, popups show on click, fit-bounds works

### Phase 2: News Feed + Mesh Chat (Days 4-6)

**Goal:** Two data-heavy UIs — news aggregation with config and real-time chat scaffold.

1. **news router** — Implement `/api/news` and `/api/news/sources` endpoints
2. **news_aggregator service** — RSS feed fetcher using `httpx` + `feedparser`
3. **NewsFeed components** — `NewsFeed.tsx`, `NewsCard.tsx`, `NewsConfigPanel.tsx`, `useNewsFeed.ts`
4. **mesh router** — Implement `/api/mesh/channels` and `/api/mesh/channels/{id}/messages`
5. **mesh WebSocket** — Implement `/api/mesh/ws` endpoint (FastAPI WebSocket)
6. **MeshChat components** — `MeshChat.tsx`, `ChannelSidebar.tsx`, `MessageList.tsx`, `MessageInput.tsx`, `useMeshChat.ts`
7. **New UI components** — `packages/ui/src/presence-dot.tsx`
8. **DashboardShell update** — Wire mesh tab

**Verification:**
- News feed loads with mock sources, config panel persists to localStorage
- Mesh chat renders channels, messages mock data, presence dots animate
- WebSocket connection shows connected state in UI

### Phase 3: Prediction Markets + SIGINT (Days 7-9)

**Goal:** Two visualization-heavy interfaces — odds display and radio scanner.

1. **markets router** — Implement `/api/markets` and `/api/markets/stake` (501 for stake)
2. **PredictionMarkets components** — `PredictionMarkets.tsx`, `MarketCard.tsx`, `StakePanel.tsx`, `usePredictionMarkets.ts`
3. **sigint router** — Implement `/api/sigint/bands`, `/api/sigint/signals`, `/api/sigint/stream`
4. **SigintPanel components** — `SigintPanel.tsx`, `FrequencyDisplay.tsx`, `SignalMeter.tsx`, `AudioPlayer.tsx`, `useSigint.ts`
5. **New UI components** — `packages/ui/src/odds-bar.tsx`, `packages/ui/src/signal-meter.tsx`, `packages/ui/src/frequency-display.tsx`
6. **DashboardShell update** — Wire markets + sigint tabs

**Verification:**
- Markets render with odds bars, stake panel opens with payout calculation
- SIGINT frequency display renders, signal meter animates, tune controls work
- SSE stream pushes signal data updates

### Phase 4: Shodan + Polish (Days 10-12)

**Goal:** Shodan integration with free-tier strategy, then end-to-end polish.

1. **Shodan backend** — `apps/api/src/services/shodan_client.py` with caching + rate limiting
2. **shodan router** — Implement `/api/shodan/search`, `/api/shodan/cache-status`, `/api/shodan/cache`
3. **ShodanSearch components** — `ShodanSearch.tsx`, `ShodanResultCard.tsx`, `ShodanFilters.tsx`, `useShodan.ts`
4. **DashboardShell update** — Wire shodan tab
5. **Overview tab upgrade** — Wire real stats from API (entity counts, source counts, system status)
6. **Settings tab upgrade** — Functional settings (refresh rate, notifications toggle)
7. **Responsive pass** — Sidebar collapse on mobile, grid breakpoints, touch targets
8. **Animation pass** — Page transitions, list enter/exit, hover states, loading states
9. **Error boundary** — Add React error boundary to DashboardShell
10. **TypeScript strict pass** — Run `npm run typecheck`, fix all issues

**Verification:**
- Shodan search with debouncing, cache hits logged, rate limit banner appears when throttled
- Mobile viewport: sidebar collapses, content stacks vertically
- All tabs load without console errors
- `npm run build` passes

---

## 6. Key Technical Decisions

### MapLibre over Leaflet/Google Maps
MapLibre GL JS is open-source, supports vector tiles with custom dark styles, has native clustering via `supercluster`, and has zero API key requirements for self-hosted tiles. The project uses free tile sources (e.g., MapTiler dark style or self-hosted tiles via `tiles.shadowbroker.local`).

**Tile source:** Use `https://demotiles.maplibre.org/style.json` for development. For production, either MapTiler (free tier: 100K loads/month) or self-hosted MBTiles with `tileserver-gl`.

### SSE over WebSocket for one-way data streams
Live map data and SIGINT signal streams are server→client only. SSE is simpler than WebSocket (auto-reconnects, works through proxies, no upgrade handshake). WebSocket is reserved for mesh chat where bidirectional communication is needed.

### Zod on client, Pydantic on server
Both validate at runtime. Shared type definitions live in `packages/types/` as Zod schemas. The TS types are inferred from schemas. FastAPI uses Pydantic models defined separately in `apps/api/src/models/`. The schemas are kept in sync manually (both are source-of-truth for their runtime).

### Client-side LRU cache with TTL
`apps/web/src/lib/cache.ts` implements a Map-based LRU with eviction on maxSize and expiration on TTL. Used by Shodan search and news feed. Cache stats (hits/misses/evictions) are exposed for the cache-status endpoint.

### localStorage for user preferences
News source config and UI preferences persist to `localStorage` via the `useLocalStorage` hook. This avoids needing a user preferences API. Sync conflict is not a concern (single-user tool).

### Component library incremental growth
New components go into `packages/ui/src/` only if they're reusable across 2+ features. Feature-specific components stay in `apps/web/src/components/{feature}/`. The five new UI primitives (signal-meter, odds-bar, presence-dot, frequency-display, skeleton) are generic enough to reuse.

### State management: hooks + context (no Redux/Zustand)
Each feature has a single `use{Feature}.ts` hook that encapsulates all state, API calls, and side effects. No global state store is needed — the sidebar tab state in DashboardShell is the only cross-feature concern, and `useState` handles it fine. If mesh chat needs shared presence state across components, a thin React context is added inside the mesh directory.

---

## 7. Shodan Free Tier Strategy

Shodan free tier provides **100 API credits/month** with rate limits. Search costs 1 credit. Key constraints:
- Limited query volume
- Rate limiting on bursts
- No access to some premium facets

### Strategy

#### Client-Side Caching (`apps/web/src/lib/cache.ts` + `useShodan.ts`)

```
Cache Layer 1: In-memory LRU (browser)
  - Key: normalized query JSON string (sorted keys)
  - TTL: 1 hour (configurable)
  - Max entries: 50
  - On cache hit: return immediately, no API call

Cache Layer 2: Server-side (FastAPI)
  - File: apps/api/src/core/cache.py
  - Key: same normalized query
  - TTL: 1 hour (SHODAN_CACHE_TTL_SEC)
  - Persists across restarts (SQLite or JSON file)
```

#### Debounced Search

```
User types → useDebounce(query, 500ms) → check client cache → if miss → POST /api/shodan/search
                                                              ↓
                                                      server checks cache → if miss → Shodan API
```

The 500ms debounce prevents firing API calls on every keystroke. Minimum query length: 3 characters.

#### Rate Limit Awareness

```
Response headers from Shodan include:
  - X-RateLimit-Remaining (credits left this month)
  - X-RateLimit-Limit (total credits)

Backend stores these in cache-status. Frontend displays:
  - "Credits remaining: 87/100" in ShodanFilters bar
  - Warning banner when < 10 credits remaining
  - Hard block when 0 credits remaining (shows cached results only)
```

#### Fallback Behavior

```
If Shodan API is unreachable or rate-limited:
  1. Return cached results (even if expired — stale-while-revalidate)
  2. Show "Showing cached results from {timestamp}" banner
  3. Background retry every 60s until API recovers
  4. If no cache exists: show "Service unavailable" with retry button
```

#### Search Optimization

```
- Only search on explicit user action (Enter key or search button) — never auto-search on type
- Facets are cached separately (they rarely change)
- Pagination: 100 results per page (default), cache per page
- Filters are applied client-side on cached results when possible
- Deduplicate queries: "apache" and "Apache " normalize to same cache key
```

---

## 8. Testing Approach

### Unit Tests

| Layer | Tool | What to test |
|-------|------|-------------|
| `packages/types` | Vitest | Zod schema validation (valid/invalid inputs, edge cases) |
| `apps/web/src/lib/cache.ts` | Vitest | LRU eviction, TTL expiration, hit/miss counting |
| `apps/web/src/hooks/*` | Vitest + @testing-library/react-hooks | useDebounce delay, useLocalStorage persistence, useSSE connect/disconnect |
| `apps/api/src/services/shodan_client.py` | pytest | Cache logic, rate limiting, API call mocking |
| `apps/api/src/routers/*` | pytest + httpx.AsyncClient | Endpoint responses, status codes, error handling |

### Integration Tests

| Area | Tool | What to test |
|------|------|-------------|
| Shodan flow | pytest + respx | Mock Shodan API → verify caching → verify rate limit handling |
| News aggregation | pytest + unittest.mock | Mock RSS feeds → verify parsing → verify source filtering |
| Map data pipeline | Vitest | Mock SSE events → verify entity state updates → verify layer computation |

### E2E / Browser Tests

| Flow | Tool | What to test |
|------|------|-------------|
| Dashboard navigation | Playwright | Click each tab → verify content renders → verify sidebar collapse |
| Shodan search | Playwright | Type query → wait for debounce → verify results render → verify cache hit |
| News config | Playwright | Open config → add source → verify localStorage → verify feed updates |
| Map interaction | Playwright | Click entity → verify popup → toggle layer → verify visibility |

### Commands

```bash
# Unit tests
npm run test                    # Vitest (web)
cd apps/api && pytest           # pytest (api)

# Type checking
npm run typecheck               # tsc --noEmit across all packages

# Linting
npm run lint                    # eslint across all packages

# E2E
npx playwright test             # from apps/web/

# Full check
npm run build && npm run typecheck && npm run lint && npm run test
```

### Test file locations

```
apps/web/src/lib/__tests__/cache.test.ts
apps/web/src/hooks/__tests__/useDebounce.test.ts
apps/web/src/hooks/__tests__/useLocalStorage.test.ts
apps/web/src/components/map/__tests__/useMapData.test.ts
apps/web/src/components/shodan/__tests__/useShodan.test.ts
apps/api/tests/test_shodan_client.py
apps/api/tests/test_news_aggregator.py
apps/api/tests/test_routers.py
apps/web/e2e/dashboard.spec.ts
apps/web/e2e/shodan-search.spec.ts
```

---

## 9. Deployment Notes

### Environment Variables

**`apps/web/.env.local`**
```
NEXT_PUBLIC_API_URL=http://localhost:8080
```

**`apps/api/.env`**
```
SHODAN_API_KEY=your_key_here
SHODAN_CACHE_TTL_SEC=3600
SHODAN_RATE_LIMIT_SEC=1
CORS_ORIGINS=["http://localhost:3000","https://shadowbroker.vercel.app"]
```

### Dependencies to Install

**`apps/web` (npm)**
```bash
npm install maplibre-gl
npm install -D @types/maplibre-gl  # if needed
```

**`apps/api` (pip)**
```
# Add to requirements.txt:
feedparser>=6.0
websockets>=12.0
shodan>=1.30
pydantic-settings>=2.0
cachetools>=5.0
```

### Turbo Pipeline Changes

No changes needed — existing `build`, `dev`, `lint`, `typecheck` tasks cover new files automatically.

### Next.js Config

Add MapLibre webpack config to `apps/web/next.config.js` if needed for GL worker:

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["maplibre-gl"],
  // ...existing config
};
```

### FastAPI Entrypoint

`apps/api/src/main.py` already uses `uvicorn.run`. Routers are mounted via `app.include_router()`:

```python
from routers import live_data, news, mesh, markets, sigint, shodan

app.include_router(live_data.router, prefix="/api")
app.include_router(news.router, prefix="/api")
app.include_router(mesh.router, prefix="/api")
app.include_router(markets.router, prefix="/api")
app.include_router(sigint.router, prefix="/api")
app.include_router(shodan.router, prefix="/api")
```

### Production Considerations

- **Map tiles:** Switch from `demotiles.maplibre.org` to MapTiler or self-hosted tiles
- **WebSocket:** FastAPI WebSocket works for single-instance. For multi-instance, add Redis pub/sub behind the WS handler
- **Shodan API key:** Store in environment, never commit. Use `pydantic-settings` to load from `.env`
- **CORS:** Tighten `allow_origins` in production to actual domain
- **Rate limiting:** Add `slowapi` middleware to FastAPI for API-wide rate limiting
- **Static assets:** MapLibre CSS needs to be imported: `import 'maplibre-gl/dist/maplibre-gl.css'`

---

## Appendix: File Creation Checklist (Ordered)

### Phase 1 — Infrastructure + Map

- [ ] `packages/types/src/map.ts`
- [ ] `packages/types/src/news.ts`
- [ ] `packages/types/src/mesh.ts`
- [ ] `packages/types/src/markets.ts`
- [ ] `packages/types/src/sigint.ts`
- [ ] `packages/types/src/shodan.ts`
- [ ] `packages/types/src/index.ts` (update)
- [ ] `apps/web/src/lib/api.ts`
- [ ] `apps/web/src/lib/cache.ts`
- [ ] `apps/web/src/hooks/useDebounce.ts`
- [ ] `apps/web/src/hooks/useLocalStorage.ts`
- [ ] `apps/web/src/hooks/useSSE.ts`
- [ ] `apps/api/src/core/__init__.py`
- [ ] `apps/api/src/core/config.py`
- [ ] `apps/api/src/core/cache.py`
- [ ] `apps/api/src/models/__init__.py`
- [ ] `apps/api/src/models/live.py`
- [ ] `apps/api/src/models/news.py`
- [ ] `apps/api/src/models/mesh.py`
- [ ] `apps/api/src/models/markets.py`
- [ ] `apps/api/src/models/sigint.py`
- [ ] `apps/api/src/models/shodan.py`
- [ ] `apps/api/src/routers/__init__.py`
- [ ] `apps/api/src/routers/live_data.py`
- [ ] `apps/api/src/routers/news.py` (stub)
- [ ] `apps/api/src/routers/mesh.py` (stub)
- [ ] `apps/api/src/routers/markets.py` (stub)
- [ ] `apps/api/src/routers/sigint.py` (stub)
- [ ] `apps/api/src/routers/shodan.py` (stub)
- [ ] `apps/api/src/routers/live_data.py` (full impl)
- [ ] `apps/api/src/main.py` (update — include routers)
- [ ] `apps/api/requirements.txt` (update)
- [ ] `packages/ui/src/skeleton.tsx`
- [ ] `packages/ui/src/index.ts` (update)
- [ ] `apps/web/src/components/map/useMapData.ts`
- [ ] `apps/web/src/components/map/MapControls.tsx`
- [ ] `apps/web/src/components/map/MapPopup.tsx`
- [ ] `apps/web/src/components/map/LiveMap.tsx`
- [ ] `apps/web/src/components/DashboardShell.tsx` (update — map tab)

### Phase 2 — News + Mesh

- [ ] `apps/api/src/services/__init__.py`
- [ ] `apps/api/src/services/news_aggregator.py`
- [ ] `apps/api/src/routers/news.py` (full impl)
- [ ] `apps/web/src/components/news/useNewsFeed.ts`
- [ ] `apps/web/src/components/news/NewsCard.tsx`
- [ ] `apps/web/src/components/news/NewsConfigPanel.tsx`
- [ ] `apps/web/src/components/news/NewsFeed.tsx`
- [ ] `apps/api/src/routers/mesh.py` (full impl)
- [ ] `packages/ui/src/presence-dot.tsx`
- [ ] `packages/ui/src/index.ts` (update)
- [ ] `apps/web/src/components/mesh/useMeshChat.ts`
- [ ] `apps/web/src/components/mesh/MessageInput.tsx`
- [ ] `apps/web/src/components/mesh/MessageList.tsx`
- [ ] `apps/web/src/components/mesh/ChannelSidebar.tsx`
- [ ] `apps/web/src/components/mesh/MeshChat.tsx`
- [ ] `apps/web/src/components/DashboardShell.tsx` (update — news + mesh tabs)

### Phase 3 — Markets + SIGINT

- [ ] `apps/api/src/routers/markets.py` (full impl)
- [ ] `apps/web/src/components/markets/usePredictionMarkets.ts`
- [ ] `apps/web/src/components/markets/MarketCard.tsx`
- [ ] `apps/web/src/components/markets/StakePanel.tsx`
- [ ] `apps/web/src/components/markets/PredictionMarkets.tsx`
- [ ] `apps/api/src/routers/sigint.py` (full impl)
- [ ] `packages/ui/src/odds-bar.tsx`
- [ ] `packages/ui/src/signal-meter.tsx`
- [ ] `packages/ui/src/frequency-display.tsx`
- [ ] `packages/ui/src/index.ts` (update)
- [ ] `apps/web/src/components/sigint/useSigint.ts`
- [ ] `apps/web/src/components/sigint/FrequencyDisplay.tsx`
- [ ] `apps/web/src/components/sigint/SignalMeter.tsx`
- [ ] `apps/web/src/components/sigint/AudioPlayer.tsx`
- [ ] `apps/web/src/components/sigint/SigintPanel.tsx`
- [ ] `apps/web/src/components/DashboardShell.tsx` (update — markets + sigint tabs)

### Phase 4 — Shodan + Polish

- [ ] `apps/api/src/services/shodan_client.py`
- [ ] `apps/api/src/routers/shodan.py` (full impl)
- [ ] `apps/web/src/components/shodan/useShodan.ts`
- [ ] `apps/web/src/components/shodan/ShodanResultCard.tsx`
- [ ] `apps/web/src/components/shodan/ShodanFilters.tsx`
- [ ] `apps/web/src/components/shodan/ShodanSearch.tsx`
- [ ] `apps/web/src/components/DashboardShell.tsx` (update — shodan tab + overview stats)
- [ ] `apps/web/next.config.js` (update — transpilePackages)
- [ ] Responsive + animation polish pass (all components)
- [ ] Error boundary component
- [ ] Test files (unit + integration + e2e)

**Total new files: ~65** (including test files)
**Modified existing files: ~8** (DashboardShell, main.py, requirements.txt, next.config.js, types/index.ts, ui/index.ts, globals.css, tailwind.config)
