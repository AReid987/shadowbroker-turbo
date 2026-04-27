# Shadowbroker-Turbo Implementation Plan

## Current State
- Turborepo scaffolded with Next.js 15 (apps/web) + FastAPI (apps/api)
- Frontend shell complete: dark tactical UI, 9-tab dashboard, collapsible sidebar
- Demo data populates all tabs (map, news, mesh, markets, sigint, shodan)
- Maplibre dark basemap with clustering works
- Auth system ported (covert login, session cookies)

## Step 1: FastAPI Backend Fetchers

### 1.1 ADS-B / Live Flights
- **Source**: ADS-B Exchange API (free tier) or Opensky Network
- **Endpoint**: `GET /api/v1/flights`
- **Data**: callsign, lat/lng, altitude, heading, speed, aircraft type
- **Cache**: 30s Redis/memory

### 1.2 AIS / Vessel Tracking
- **Source**: MarineTraffic or VesselFinder (free tier limits)
- **Endpoint**: `GET /api/v1/vessels`
- **Data**: MMSI, name, lat/lng, heading, speed, vessel type
- **Fallback**: Mock data rotation for demo

### 1.3 News Aggregation
- **Source**: NewsAPI.org (free tier: 100 req/day), GNews, or RSS feeds
- **Endpoint**: `GET /api/v1/news?source=&q=`
- **Data**: title, summary, url, timestamp, source, tags
- **Source config**: JSON config file for enabled sources + categories

### 1.4 SIGINT / Radio Signals
- **Source**: WebSDR.org scraping or KiwiSDR network
- **Endpoint**: `GET /api/v1/sigint`
- **Data**: frequency, mode, strength, label, timestamp
- **Note**: Mostly synthetic/demo with real SDR hook placeholders

### 1.5 Shodan Integration (Free Tier)
- **Source**: Shodan API (free tier: 100 credits/month)
- **Endpoints**:
  - `GET /api/v1/shodan/search?q=` — host search
  - `GET /api/v1/shodan/host/{ip}` — host details
- **Strategy**: Aggressive caching, result deduplication, credit usage tracking
- **Free tier limits**: 100 search credits/month → cache everything, serve stale

### 1.6 Prediction Markets
- **Source**: Polymarket API, Kalshi, or Manifold Markets
- **Endpoint**: `GET /api/v1/markets`
- **Data**: title, outcomes, probabilities, volume, closing date

### 1.7 Satellite TLE / Tracking
- **Source**: CelesTrak (NORAD TLEs), N2YO API
- **Endpoint**: `GET /api/v1/satellites`
- **Data**: name, norad id, lat/lng, altitude, velocity, TLE epoch

## Step 2: Frontend API Integration

### 2.1 Store Updates
- Replace demo data with async fetch functions in Zustand store
- Add loading states, error handling, refresh intervals
- Use SWR or React Query pattern for caching

### 2.2 Polling Strategy
- Flights: 30s
- Vessels: 60s
- News: 300s
- Signals: 15s
- Markets: 300s
- Shodan: on-demand only (respect free tier)
- Satellites: 60s

### 2.3 Error States
- Offline indicator in top bar
- Retry with exponential backoff
- Fallback to demo data on persistent failure

## Step 3: Satellite Tab

### 3.1 UI Components
- Satellite list table (name, type, altitude, velocity, next pass)
- 3D globe view (optional: CesiumJS or Three.js)
- Pass prediction for ground stations
- TLE display

### 3.2 Backend
- TLE parser (pyephem or skyfield)
- Propagation to current lat/lng
- Pass prediction calculator

## Step 4: Polish & Deploy

### 4.1 Theme Refinement
- Ensure generous spacing throughout (not dense)
- Monospace fonts for data, sans-serif for UI
- Subtle glow effects on active elements

### 4.2 Performance
- Map marker pooling (recycle DOM elements)
- Virtualized news lists
- Code splitting per tab

### 4.3 Build & Deploy
- Fix pnpm lockfile warning (outputFileTracingRoot)
- Vercel deploy for web
- Fly.io / Railway for FastAPI backend

## Free Tier Constraints
| Service | Free Limit | Strategy |
|---------|-----------|----------|
| Shodan | 100 credits/month | Cache aggressively, on-demand only |
| NewsAPI | 100 req/day | Batch requests, local cache |
| ADS-B Exchange | Limited | Fallback to Opensky |
| MarineTraffic | 100 req/day | Heavy caching + mock fallback |
