"use client";

import { motion } from "framer-motion";
import type { MapEntity } from "@/lib/types";
import { Plane, Ship, Satellite, MapPin } from "lucide-react";

interface MapPopupProps {
  entity: MapEntity;
  onClose: () => void;
}

const typeIcons = {
  flight: Plane,
  vessel: Ship,
  satellite: Satellite,
  ground: MapPin,
};

export function MapPopup({ entity, onClose }: MapPopupProps) {
  const Icon = typeIcons[entity.type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.95 }}
      className="min-w-[220px] rounded-lg border border-sb-border bg-sb-panel/95 backdrop-blur shadow-xl p-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="rounded-md bg-sb-accent/10 p-1.5">
          <Icon className="h-4 w-4 text-sb-accent" />
        </div>
        <h3 className="text-sm font-semibold text-sb-text">{entity.label}</h3>
        <button
          onClick={onClose}
          className="ml-auto text-sb-muted hover:text-sb-text text-xs"
        >
          ✕
        </button>
      </div>

      <div className="space-y-1.5 text-xs font-mono">
        <div className="flex justify-between">
          <span className="text-sb-muted">Type</span>
          <span className="text-sb-text capitalize">{entity.type}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sb-muted">Position</span>
          <span className="text-sb-text">
            {entity.position.lat.toFixed(4)}, {entity.position.lng.toFixed(4)}
          </span>
        </div>
        {entity.altitude !== undefined && (
          <div className="flex justify-between">
            <span className="text-sb-muted">Altitude</span>
            <span className="text-sb-text">{entity.altitude.toLocaleString()} ft</span>
          </div>
        )}
        {entity.speed !== undefined && (
          <div className="flex justify-between">
            <span className="text-sb-muted">Speed</span>
            <span className="text-sb-text">{entity.speed} knots</span>
          </div>
        )}
        {entity.heading !== undefined && (
          <div className="flex justify-between">
            <span className="text-sb-muted">Heading</span>
            <span className="text-sb-text">{entity.heading.toFixed(0)}°</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
