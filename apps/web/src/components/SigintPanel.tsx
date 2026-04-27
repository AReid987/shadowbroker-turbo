"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Radio, Play, Square, Activity } from "lucide-react";
import { Panel, Badge } from "@/components/ui";
import { useDashboardStore } from "@/lib/store";

function FrequencySpectrum({ signals }: { signals: { frequency: number; strength: number }[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    ctx.fillStyle = "#0a0a0f";
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Draw grid
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1;
    for (let i = 0; i < rect.width; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, rect.height);
      ctx.stroke();
    }
    for (let i = 0; i < rect.height; i += 30) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(rect.width, i);
      ctx.stroke();
    }

    // Draw bars
    const barWidth = rect.width / 64;
    for (let i = 0; i < 64; i++) {
      const signal = signals.find((_, idx) => idx === i % signals.length);
      const strength = signal ? signal.strength / 100 : Math.random() * 0.3;
      const barHeight = strength * rect.height * 0.8;

      const gradient = ctx.createLinearGradient(0, rect.height - barHeight, 0, rect.height);
      gradient.addColorStop(0, "rgba(34, 197, 94, 0.8)");
      gradient.addColorStop(1, "rgba(34, 197, 94, 0.1)");

      ctx.fillStyle = gradient;
      ctx.fillRect(i * barWidth + 1, rect.height - barHeight, barWidth - 2, barHeight);
    }
  }, [signals]);

  return <canvas ref={canvasRef} className="w-full h-32 rounded-lg" style={{ width: "100%", height: 128 }} />;
}

export function SigintPanel() {
  const { signals, selectedSignal, setSelectedSignal } = useDashboardStore();
  const [isScanning, setIsScanning] = useState(false);

  return (
    <div className="space-y-6">
      <Panel className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-sb-accent" />
            <h3 className="text-sm font-semibold text-sb-text">Frequency Spectrum</h3>
          </div>
          <button
            onClick={() => setIsScanning(!isScanning)}
            className={`h-8 px-3 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
              isScanning ? "bg-sb-danger/10 text-sb-danger" : "bg-sb-accent/10 text-sb-accent"
            }`}
          >
            {isScanning ? <Square className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            {isScanning ? "Stop Scan" : "Start Scan"}
          </button>
        </div>
        <FrequencySpectrum signals={signals} />
        <div className="flex justify-between text-[10px] text-sb-muted font-mono mt-2">
          <span>100 MHz</span>
          <span>500 MHz</span>
          <span>1000 MHz</span>
        </div>
      </Panel>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {signals.map((signal) => (
          <motion.button
            key={signal.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setSelectedSignal(selectedSignal?.id === signal.id ? null : signal)}
            className={`text-left rounded-xl border p-4 transition-colors ${
              selectedSignal?.id === signal.id
                ? "border-sb-accent bg-sb-accent/5"
                : "border-sb-border bg-sb-panel/50 hover:border-sb-border/80"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Radio className="h-3.5 w-3.5 text-sb-accent" />
                <span className="text-xs font-medium text-sb-text">{signal.label}</span>
              </div>
              <Badge variant="outline" className="text-[10px] h-5 border-sb-border text-sb-muted">
                {signal.mode}
              </Badge>
            </div>
            <div className="text-lg font-mono text-sb-accent mb-2">
              {signal.frequency.toFixed(1)} <span className="text-xs text-sb-muted">MHz</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-sb-muted">Signal</span>
                <span className="text-sb-text font-mono">{signal.strength}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-sb-border overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${signal.strength}%` }}
                  className="h-full rounded-full bg-sb-accent"
                />
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
