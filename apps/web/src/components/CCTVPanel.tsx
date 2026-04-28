"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Video, MapPin, Globe, Loader2, RefreshCw, Maximize2, X } from "lucide-react";
import { Panel, Badge } from "@/components/ui";
import { useDashboardStore } from "@/lib/store";
import type { CCTVCamera } from "@/lib/types";

function CameraCard({ camera, index }: { camera: CCTVCamera; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 0.02 }}
        className="group relative aspect-video rounded-lg overflow-hidden border border-sb-border bg-black cursor-pointer hover:border-sb-accent/50 transition-colors"
        onClick={() => setExpanded(true)}
      >
        {!error ? (
          <img
            src={camera.url}
            alt={camera.label}
            className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
            onLoad={() => setLoaded(true)}
            onError={() => setError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-sb-panel">
            <Video className="h-8 w-8 text-sb-muted" />
          </div>
        )}

        {!loaded && !error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-5 w-5 text-sb-muted animate-spin" />
          </div>
        )}

        {/* Overlay */}
        <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] h-5 border-sb-accent/30 text-sb-accent bg-black/50">
              LIVE
            </Badge>
            <span className="text-xs text-white truncate">{camera.label}</span>
          </div>
          <div className="flex items-center gap-1 mt-1 text-[10px] text-white/60">
            <MapPin className="h-3 w-3" />
            <span>{camera.city}, {camera.country}</span>
          </div>
        </div>

        {/* Live indicator */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/60">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[10px] text-white/80 font-mono">LIVE</span>
        </div>

        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Maximize2 className="h-4 w-4 text-white/80" />
        </div>
      </motion.div>

      {/* Expanded modal */}
      {expanded && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setExpanded(false)}
        >
          <div className="relative w-full max-w-4xl">
            <button
              onClick={() => setExpanded(false)}
              className="absolute -top-10 right-0 p-2 text-white/60 hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>
            <div className="aspect-video rounded-lg overflow-hidden border border-sb-border bg-black">
              {!error ? (
                <img
                  src={camera.url}
                  alt={camera.label}
                  className="w-full h-full object-cover"
                  onError={() => setError(true)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Video className="h-12 w-12 text-sb-muted" />
                </div>
              )}
            </div>
            <div className="mt-3 flex items-center gap-3">
              <Badge variant="outline" className="text-xs border-red-500/30 text-red-400">
                LIVE
              </Badge>
              <h3 className="text-white font-medium">{camera.label}</h3>
              <span className="text-sm text-sb-muted">{camera.city}, {camera.country}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function CCTVPanel() {
  const {
    cctvCameras,
    cctvCountries,
    cctvTotal,
    cctvSelectedCountry,
    setCctvSelectedCountry,
    refreshCctv,
  } = useDashboardStore();

  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    refreshCctv(cctvSelectedCountry || undefined);
  }, [cctvSelectedCountry]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshCctv(cctvSelectedCountry || undefined);
    setIsRefreshing(false);
  };

  return (
    <div className="space-y-6">
      {/* Header stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-sb-border bg-sb-panel">
            <Video className="h-4 w-4 text-sb-accent" />
            <span className="text-sm font-mono text-sb-text">{cctvTotal} cameras</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-sb-border bg-sb-panel">
            <Globe className="h-4 w-4 text-sb-accent" />
            <span className="text-sm font-mono text-sb-text">{cctvCountries.length} countries</span>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-sb-border text-sm text-sb-muted hover:text-sb-text hover:border-sb-accent/50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Country filters */}
      {cctvCountries.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCctvSelectedCountry(null)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-colors ${
              !cctvSelectedCountry
                ? "border-sb-accent bg-sb-accent/10 text-sb-accent"
                : "border-sb-border text-sb-muted hover:text-sb-text hover:border-sb-accent/30"
            }`}
          >
            ALL
          </button>
          {cctvCountries.map((c) => (
            <button
              key={c.code}
              onClick={() => setCctvSelectedCountry(c.code)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-colors ${
                cctvSelectedCountry === c.code
                  ? "border-sb-accent bg-sb-accent/10 text-sb-accent"
                  : "border-sb-border text-sb-muted hover:text-sb-text hover:border-sb-accent/30"
              }`}
            >
              {c.code} ({c.count})
            </button>
          ))}
        </div>
      )}

      {/* Camera grid */}
      {cctvCameras.length === 0 ? (
        <Panel className="p-12 text-center">
          <Video className="h-10 w-10 text-sb-muted mx-auto mb-3" />
          <p className="text-sm text-sb-muted">No cameras available.</p>
          <p className="text-xs text-sb-muted mt-1">Check backend connection.</p>
        </Panel>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {cctvCameras.map((camera, i) => (
            <CameraCard key={camera.id} camera={camera} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
