"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, Volume2, Calendar, X } from "lucide-react";
import { Panel, Badge, Button } from "@shadowbroker/ui";
import { useDashboardStore } from "@/lib/store";

export function PredictionMarkets() {
  const { markets } = useDashboardStore();
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);
  const [stakeAmount, setStakeAmount] = useState(100);

  const market = markets.find((m) => m.id === selectedMarket);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {markets.map((m) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Panel
              className="p-5 cursor-pointer hover:border-sb-accent/30 transition-colors"
              onClick={() => setSelectedMarket(m.id)}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <Badge variant="outline" className="text-[10px] h-5 border-sb-border text-sb-muted mb-2">
                    {m.category}
                  </Badge>
                  <h3 className="text-sm font-medium text-sb-text">{m.title}</h3>
                </div>
                <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded ${
                  m.status === "open" ? "bg-sb-accent/10 text-sb-accent" : "bg-sb-muted/10 text-sb-muted"
                }`}>
                  {m.status}
                </span>
              </div>

              <div className="space-y-3">
                {m.outcomes.map((outcome) => (
                  <div key={outcome.id}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-sb-text">{outcome.label}</span>
                      <span className="text-sb-accent font-mono">{(outcome.probability * 100).toFixed(0)}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-sb-border overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${outcome.probability * 100}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="h-full rounded-full bg-sb-accent"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-4 mt-4 pt-3 border-t border-sb-border text-[10px] text-sb-muted">
                <span className="flex items-center gap-1">
                  <Volume2 className="h-3 w-3" />
                  ${m.volume.toLocaleString()}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Closes {m.closingDate}
                </span>
              </div>
            </Panel>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {market && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setSelectedMarket(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-xl border border-sb-border bg-sb-panel p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-sb-text">Stake on Outcome</h3>
                <button onClick={() => setSelectedMarket(null)} className="text-sb-muted hover:text-sb-text">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="text-xs text-sb-muted mb-4">{market.title}</p>

              <div className="space-y-2 mb-4">
                {market.outcomes.map((outcome) => (
                  <button
                    key={outcome.id}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-lg border border-sb-border hover:border-sb-accent/50 transition-colors"
                  >
                    <span className="text-sm text-sb-text">{outcome.label}</span>
                    <span className="text-xs font-mono text-sb-accent">{(outcome.probability * 100).toFixed(0)}%</span>
                  </button>
                ))}
              </div>

              <div className="mb-4">
                <label className="text-xs text-sb-muted mb-1.5 block">Stake Amount</label>
                <input
                  type="number"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(Number(e.target.value))}
                  className="w-full h-10 rounded-lg border border-sb-border bg-black/30 px-3 text-sm text-sb-text font-mono"
                />
              </div>

              <Button className="w-full h-10 bg-sb-accent text-black hover:bg-sb-accentDim">
                <TrendingUp className="h-4 w-4 mr-2" />
                Place Stake
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
