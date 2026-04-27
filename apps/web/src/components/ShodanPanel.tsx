"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Search, Globe, Server, AlertTriangle, Shield, Clock } from "lucide-react";
import { Panel, Badge } from "@/components/ui";
import { useDashboardStore } from "@/lib/store";

export function ShodanPanel() {
  const { shodanResults, shodanQuery, searchShodan, isLoading } = useDashboardStore();
  const [lastSearch, setLastSearch] = useState<string | null>(null);

  const handleSearch = useCallback(async () => {
    if (!shodanQuery.trim()) return;
    await searchShodan(shodanQuery);
    setLastSearch(new Date().toISOString());
  }, [shodanQuery, searchShodan]);

  const suggestions = [
    "apache",
    "nginx",
    "webcam",
    "router",
    "printer",
    "database",
  ];

  return (
    <div className="space-y-6">
      <Panel className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sb-muted" />
            <input
              type="text"
              value={shodanQuery}
              onChange={(e) => useDashboardStore.getState().setShodanQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search Shodan (e.g., apache, webcam)..."
              className="w-full h-11 pl-10 pr-4 rounded-lg border border-sb-border bg-black/30 text-sm text-sb-text placeholder:text-sb-muted focus:outline-none focus:border-sb-accent/50 font-mono"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={isLoading || !shodanQuery.trim()}
            className="h-11 px-5 rounded-lg bg-sb-accent text-black text-sm font-medium hover:bg-sb-accentDim disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Searching..." : "Search"}
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="text-[10px] text-sb-muted uppercase tracking-wider py-1">Suggestions:</span>
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => { useDashboardStore.getState().setShodanQuery(s); }}
              className="text-[10px] px-2 py-1 rounded-md border border-sb-border text-sb-muted hover:text-sb-accent hover:border-sb-accent/30 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>

        {lastSearch && (
          <div className="flex items-center gap-2 mt-3 text-[10px] text-sb-muted">
            <Clock className="h-3 w-3" />
            Last search: {new Date(lastSearch).toLocaleTimeString()}
            <Badge variant="outline" className="text-[10px] h-4 border-sb-border">Cached</Badge>
          </div>
        )}
      </Panel>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {shodanResults.map((result, i) => (
          <motion.div
            key={result.ip + result.port}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Panel className="p-4 hover:border-sb-accent/30 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Server className="h-4 w-4 text-sb-accent" />
                  <span className="text-sm font-mono text-sb-text">{result.ip}:{result.port}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Globe className="h-3 w-3 text-sb-muted" />
                  <span className="text-[10px] text-sb-muted">{result.country}</span>
                </div>
              </div>

              <div className="space-y-2 text-xs font-mono">
                {result.product && (
                  <div className="flex justify-between">
                    <span className="text-sb-muted">Product</span>
                    <span className="text-sb-text">{result.product} {result.version}</span>
                  </div>
                )}
                {result.os && (
                  <div className="flex justify-between">
                    <span className="text-sb-muted">OS</span>
                    <span className="text-sb-text">{result.os}</span>
                  </div>
                )}
                {result.org && (
                  <div className="flex justify-between">
                    <span className="text-sb-muted">Org</span>
                    <span className="text-sb-text truncate max-w-[120px]">{result.org}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-sb-border">
                {result.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-[10px] h-5 border-sb-border text-sb-muted">
                    {tag}
                  </Badge>
                ))}
                {result.vulns.length > 0 && (
                  <Badge className="text-[10px] h-5 bg-sb-danger/10 text-sb-danger border-0 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {result.vulns.length}
                  </Badge>
                )}
                {!result.vulns.length && (
                  <Badge className="text-[10px] h-5 bg-sb-accent/10 text-sb-accent border-0 flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    Clean
                  </Badge>
                )}
              </div>
            </Panel>
          </motion.div>
        ))}
      </div>

      {shodanResults.length === 0 && !isLoading && (
        <Panel className="p-12 text-center">
          <Search className="h-10 w-10 text-sb-muted mx-auto mb-3" />
          <p className="text-sm text-sb-muted">Search for IoT devices, services, and vulnerabilities.</p>
          <p className="text-xs text-sb-muted mt-1">Results are cached to respect Shodan free tier limits.</p>
        </Panel>
      )}
    </div>
  );
}
