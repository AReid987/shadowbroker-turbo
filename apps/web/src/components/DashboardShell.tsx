"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  MapPin,
  Newspaper,
  Radio,
  Satellite,
  Settings,
  LogOut,
  Activity,
  Menu,
  X,
  Network,
  TrendingUp,
  Search,
  Video,
} from "lucide-react";
import { Panel, Terminal, Button } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import { useDashboardStore } from "@/lib/store";
import { LiveMap } from "./LiveMap";
import { NewsFeed } from "./NewsFeed";
import { MeshChat } from "./MeshChat";
import { PredictionMarkets } from "./PredictionMarkets";
import { SigintPanel } from "./SigintPanel";
import { ShodanPanel } from "./ShodanPanel";
import { CCTVPanel } from "./CCTVPanel";

const NAV_ITEMS = [
  { id: "overview", label: "Overview", icon: Activity },
  { id: "map", label: "Live Map", icon: MapPin },
  { id: "news", label: "News Feed", icon: Newspaper },
  { id: "mesh", label: "Mesh Chat", icon: Network },
  { id: "markets", label: "Markets", icon: TrendingUp },
  { id: "sigint", label: "SIGINT", icon: Radio },
  { id: "shodan", label: "Shodan", icon: Search },
  { id: "cctv", label: "CCTV Feeds", icon: Video },
  { id: "satellites", label: "Satellites", icon: Satellite },
  { id: "settings", label: "Settings", icon: Settings },
];

export function DashboardShell() {
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { logout } = useAuth();
  const {
    mapEntities,
    newsItems,
    newsSources,
    signals,
    markets,
    cctvCameras,
    cctvTotal,
    backendOnline,
    refreshMap,
    refreshNews,
    refreshSigint,
    refreshMarkets,
    refreshMesh,
    refreshCctv,
  } = useDashboardStore();

  // Initial data fetch
  useEffect(() => {
    refreshMap();
    refreshNews();
    refreshSigint();
    refreshMarkets();
    refreshMesh();
    refreshCctv();
  }, [refreshMap, refreshNews, refreshSigint, refreshMarkets, refreshMesh, refreshCctv]);

  // Polling per tab
  useEffect(() => {
    if (!backendOnline) return;
    const interval = setInterval(() => {
      if (activeTab === "map") refreshMap();
      if (activeTab === "news") refreshNews();
      if (activeTab === "sigint") refreshSigint();
      if (activeTab === "markets") refreshMarkets();
      if (activeTab === "mesh") refreshMesh();
    }, 30000);
    return () => clearInterval(interval);
  }, [activeTab, backendOnline, refreshMap, refreshNews, refreshSigint, refreshMarkets, refreshMesh]);

  return (
    <div className="h-screen flex overflow-hidden bg-sb-black text-sb-text">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 240 : 64 }}
        className="flex-shrink-0 border-r border-sb-border bg-sb-panel flex flex-col"
      >
        <div className="h-14 flex items-center justify-between px-4 border-b border-sb-border">
          {sidebarOpen && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-mono text-sm font-bold tracking-widest text-sb-accent"
            >
              BLACKTIVISM
            </motion.span>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded hover:bg-white/5 text-sb-muted"
          >
            {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>

        <nav className="flex-1 py-3 space-y-1 px-2">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? "bg-sb-accent/10 text-sb-accent"
                    : "text-sb-muted hover:bg-white/5 hover:text-sb-text"
                }`}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                {sidebarOpen && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="p-2 border-t border-sb-border">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sb-muted hover:bg-white/5 hover:text-sb-danger transition-colors"
          >
            <LogOut className="h-4 w-4" />
            {sidebarOpen && <span>Disconnect</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-14 flex items-center justify-between px-6 border-b border-sb-border bg-sb-panel/50 backdrop-blur">
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full animate-pulse ${backendOnline ? "bg-sb-accent" : "bg-sb-danger"}`} />
            <span className={`text-xs font-mono uppercase tracking-wider ${backendOnline ? "text-sb-accent" : "text-sb-danger"}`}>
              {backendOnline ? "Live" : "Offline"}
            </span>
            <span className="text-[10px] text-sb-muted ml-2">
              Flights: {mapEntities.filter((e) => e.type === "flight").length} ·
              Vessels: {mapEntities.filter((e) => e.type === "vessel").length} ·
              News: {newsItems.length} ·
              Signals: {signals.length} ·
              CCTV: {cctvTotal}
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono text-sb-muted">
            <span>UTC {new Date().toISOString().slice(11, 19)}</span>
            <span className="px-2 py-0.5 rounded bg-sb-accent/10 text-sb-accent">v2.0.0</span>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {activeTab === "overview" && <OverviewTab />}
          {activeTab === "map" && <LiveMap />}
          {activeTab === "news" && <NewsFeed />}
          {activeTab === "mesh" && <MeshChat />}
          {activeTab === "markets" && <PredictionMarkets />}
          {activeTab === "sigint" && <SigintPanel />}
          {activeTab === "shodan" && <ShodanPanel />}
          {activeTab === "cctv" && <CCTVPanel />}
          {activeTab === "satellites" && <SatellitesTab />}
          {activeTab === "settings" && <SettingsTab />}
        </div>
      </main>
    </div>
  );
}

function OverviewTab() {
  const { mapEntities, newsItems, newsSources, signals, markets, shodanResults, cctvTotal, backendOnline } = useDashboardStore();
  const activeSources = newsSources.filter((s) => s.enabled).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: "Active Flights", value: mapEntities.filter((e) => e.type === "flight").length.toString(), status: "good" },
          { label: "Vessels Tracked", value: mapEntities.filter((e) => e.type === "vessel").length.toString(), status: "neutral" },
          { label: "Radio Signals", value: signals.length.toString(), status: "neutral" },
          { label: "News Sources", value: `${activeSources}/${newsSources.length}`, status: "neutral" },
          { label: "Markets", value: markets.length.toString(), status: "neutral" },
          { label: "CCTV Feeds", value: cctvTotal.toString(), status: "neutral" },
          { label: "Shodan Hits", value: shodanResults.length.toString(), status: "neutral" },
        ].map((stat) => (
          <Panel key={stat.label} className="p-4">
            <p className="text-xs text-sb-muted uppercase tracking-wider">{stat.label}</p>
            <p className={`text-2xl font-mono font-bold mt-1 ${
              stat.status === "good" ? "text-sb-accent" : "text-sb-text"
            }`}>
              {stat.value}
            </p>
          </Panel>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Panel title="System Log" className="min-h-[320px]">
          <Terminal
            lines={[
              `[${new Date().toISOString().slice(11, 19)}] Connection ${backendOnline ? "established" : "offline — using local cache"}`,
              `[${new Date().toISOString().slice(11, 19)}] Authentication successful`,
              `[${new Date().toISOString().slice(11, 19)}] Loaded ${mapEntities.length} map entities`,
              `[${new Date().toISOString().slice(11, 19)}] Loaded ${newsItems.length} news items from ${activeSources} sources`,
              `[${new Date().toISOString().slice(11, 19)}] Loaded ${signals.length} radio signals`,
              `[${new Date().toISOString().slice(11, 19)}] Loaded ${markets.length} prediction markets`,
              `[${new Date().toISOString().slice(11, 19)}] Subsystems online — Ready for operations`,
            ]}
          />
        </Panel>

        <Panel title="Quick Actions" className="min-h-[320px]">
          <div className="grid grid-cols-2 gap-3">
            {["Refresh Data", "Export Report", "Toggle Alerts", "Mesh Sync"].map((action) => (
              <Button
                key={action}
                variant="outline"
                className="h-20 border-sb-border bg-transparent hover:bg-white/5 hover:border-sb-accent/50"
              >
                <span className="text-xs">{action}</span>
              </Button>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function SatellitesTab() {
  return (
    <Panel title="Satellite Tracking" className="min-h-[calc(100vh-120px)]">
      <div className="space-y-3">
        <p className="text-sm text-sb-muted">Satellite tracking ready. Connect backend API to populate with live TLE data.</p>
      </div>
    </Panel>
  );
}

function SettingsTab() {
  return (
    <Panel title="Settings" className="min-h-[calc(100vh-120px)]">
      <div className="space-y-4 max-w-md">
        <div className="flex items-center justify-between py-3 border-b border-sb-border">
          <span className="text-sm">Theme</span>
          <span className="text-xs text-sb-muted">Dark (fixed)</span>
        </div>
        <div className="flex items-center justify-between py-3 border-b border-sb-border">
          <span className="text-sm">Data Refresh Rate</span>
          <span className="text-xs text-sb-muted">30s</span>
        </div>
        <div className="flex items-center justify-between py-3 border-b border-sb-border">
          <span className="text-sm">Notifications</span>
          <span className="text-xs text-sb-muted">Enabled</span>
        </div>
      </div>
    </Panel>
  );
}
