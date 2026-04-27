"use client";

import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { MapEntity } from "@shadowbroker/types";
import { MapPopup } from "./MapPopup";
import { useDashboardStore } from "@/lib/store";

const ENTITY_COLORS: Record<MapEntity["type"], string> = {
  flight: "#22c55e",
  vessel: "#3b82f6",
  satellite: "#f59e0b",
  ground: "#ef4444",
};

function createMarkerElement(type: MapEntity["type"], isCluster: boolean = false, count?: number): HTMLElement {
  const el = document.createElement("div");
  if (isCluster && count) {
    el.className = "flex items-center justify-center rounded-full border-2 border-white/20 text-white font-bold text-xs shadow-lg cursor-pointer transition-transform hover:scale-110";
    el.style.width = `${Math.min(40, 24 + count)}px`;
    el.style.height = `${Math.min(40, 24 + count)}px`;
    el.style.backgroundColor = "rgba(34, 197, 94, 0.8)";
    el.innerText = String(count);
  } else {
    el.className = "rounded-full border-2 border-white/30 shadow-md cursor-pointer transition-transform hover:scale-125";
    el.style.width = "12px";
    el.style.height = "12px";
    el.style.backgroundColor = ENTITY_COLORS[type];
  }
  return el;
}

export function LiveMap() {
  const { mapEntities: entities, setSelectedEntity } = useDashboardStore();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const [popupEntity, setPopupEntity] = useState<MapEntity | null>(null);
  const [popupPos, setPopupPos] = useState<{ x: number; y: number } | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: {
        version: 8,
        sources: {
          "osm": {
            type: "raster",
            tiles: ["https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"],
            tileSize: 256,
            attribution: "&copy; OpenStreetMap &copy; CARTO",
          },
        },
        layers: [
          {
            id: "osm",
            type: "raster",
            source: "osm",
            minzoom: 0,
            maxzoom: 22,
          },
        ],
      },
      center: [0, 20],
      zoom: 2,
      attributionControl: false,
    });

    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Simple clustering: group nearby points
  const clusters = useMemo(() => {
    const groups: MapEntity[][] = [];
    const visited = new Set<string>();
    const CLUSTER_DISTANCE = 2; // degrees

    for (const entity of entities) {
      if (visited.has(entity.id)) continue;
      const group = [entity];
      visited.add(entity.id);

      for (const other of entities) {
        if (visited.has(other.id)) continue;
        const dLat = Math.abs(entity.position.lat - other.position.lat);
        const dLng = Math.abs(entity.position.lng - other.position.lng);
        if (dLat < CLUSTER_DISTANCE && dLng < CLUSTER_DISTANCE) {
          group.push(other);
          visited.add(other.id);
        }
      }
      groups.push(group);
    }
    return groups;
  }, [entities]);

  // Update markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    clusters.forEach((group) => {
      if (group.length > 1) {
        // Cluster marker
        const avgLng = group.reduce((s, e) => s + e.position.lng, 0) / group.length;
        const avgLat = group.reduce((s, e) => s + e.position.lat, 0) / group.length;
        const el = createMarkerElement("flight", true, group.length);
        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([avgLng, avgLat])
          .addTo(map);

        el.addEventListener("click", () => {
          map.flyTo({ center: [avgLng, avgLat], zoom: Math.min(map.getZoom() + 3, 10) });
        });

        markersRef.current.push(marker);
      } else {
        const entity = group[0];
        const el = createMarkerElement(entity.type);
        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([entity.position.lng, entity.position.lat])
          .addTo(map);

        el.addEventListener("click", (e) => {
          e.stopPropagation();
          setSelectedEntity(entity);
          setPopupEntity(entity);
          const point = map.project([entity.position.lng, entity.position.lat]);
          setPopupPos({ x: point.x, y: point.y - 20 });
        });

        markersRef.current.push(marker);
      }
    });
  }, [clusters, setSelectedEntity]);

  // Fit bounds when entities change
  useEffect(() => {
    const map = mapRef.current;
    if (!map || entities.length === 0) return;
    const lons = entities.map((e) => e.position.lng);
    const lats = entities.map((e) => e.position.lat);
    const bounds: maplibregl.LngLatBoundsLike = [
      [Math.min(...lons), Math.min(...lats)],
      [Math.max(...lons), Math.max(...lats)],
    ];
    map.fitBounds(bounds, { padding: 60, maxZoom: 8, duration: 1000 });
  }, [entities]);

  const handleMapClick = useCallback(() => {
    setPopupEntity(null);
    setPopupPos(null);
    setSelectedEntity(null);
  }, [setSelectedEntity]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.on("click", handleMapClick);
    return () => {
      map.off("click", handleMapClick);
    };
  }, [handleMapClick]);

  return (
    <div className="relative w-full h-[calc(100vh-120px)] rounded-xl overflow-hidden border border-sb-border">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Overlay controls */}
      <div className="absolute top-4 left-4 flex flex-col gap-2">
        <div className="rounded-lg border border-sb-border bg-sb-panel/90 backdrop-blur px-3 py-2 text-xs font-mono">
          <div className="flex items-center gap-2 mb-1">
            <span className="h-2 w-2 rounded-full bg-[#22c55e]" />
            <span className="text-sb-muted">Flights</span>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <span className="h-2 w-2 rounded-full bg-[#3b82f6]" />
            <span className="text-sb-muted">Vessels</span>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <span className="h-2 w-2 rounded-full bg-[#f59e0b]" />
            <span className="text-sb-muted">Satellites</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#ef4444]" />
            <span className="text-sb-muted">Ground</span>
          </div>
        </div>
      </div>

      {/* Entity count */}
      <div className="absolute top-4 right-4 rounded-lg border border-sb-border bg-sb-panel/90 backdrop-blur px-3 py-1.5 text-xs font-mono text-sb-muted">
        {entities.length} entities
      </div>

      {/* Popup */}
      {popupEntity && popupPos && mapContainerRef.current && (
        <div
          className="absolute z-10"
          style={{
            left: popupPos.x,
            top: popupPos.y,
            transform: "translate(-50%, -100%)",
          }}
        >
          <MapPopup entity={popupEntity} onClose={() => { setPopupEntity(null); setSelectedEntity(null); }} />
        </div>
      )}
    </div>
  );
}
