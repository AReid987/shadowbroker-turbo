"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Newspaper, Settings, Check, X, ExternalLink, Clock } from "lucide-react";
import { Panel, Badge } from "@shadowbroker/ui";
import { useDashboardStore } from "@/lib/store";

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function NewsFeed() {
  const { newsItems, newsSources, toggleNewsSource, refreshNews } = useDashboardStore();
  const [showConfig, setShowConfig] = useState(false);
  const [search, setSearch] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = useCallback(async () => {
    setIsSearching(true);
    await refreshNews(undefined, search || undefined);
    setIsSearching(false);
  }, [search, refreshNews]);

  const filtered = newsItems.filter((item) => {
    const sourceEnabled = newsSources.find((s) => s.id === item.sourceId)?.enabled ?? true;
    return sourceEnabled;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <input
          type="text"
          placeholder="Search news..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="flex-1 h-10 rounded-lg border border-sb-border bg-black/30 px-4 text-sm text-sb-text placeholder:text-sb-muted focus:outline-none focus:border-sb-accent/50"
        />
        <button
          onClick={handleSearch}
          disabled={isSearching}
          className="h-10 px-4 rounded-lg border border-sb-border bg-transparent text-sm text-sb-muted hover:text-sb-text hover:border-sb-accent/50 transition-colors disabled:opacity-50"
        >
          {isSearching ? "..." : "Search"}
        </button>
        <button
          onClick={() => setShowConfig(!showConfig)}
          className={`h-10 px-4 rounded-lg border text-sm flex items-center gap-2 transition-colors ${
            showConfig
              ? "border-sb-accent bg-sb-accent/10 text-sb-accent"
              : "border-sb-border bg-transparent text-sb-muted hover:text-sb-text"
          }`}
        >
          <Settings className="h-4 w-4" />
          Sources
        </button>
      </div>

      <AnimatePresence>
        {showConfig && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <Panel className="p-4">
              <h3 className="text-sm font-semibold text-sb-text mb-3">News Sources</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {newsSources.map((source) => (
                  <button
                    key={source.id}
                    onClick={() => toggleNewsSource(source.id)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left text-sm transition-colors ${
                      source.enabled
                        ? "border-sb-accent/30 bg-sb-accent/5 text-sb-text"
                        : "border-sb-border bg-transparent text-sb-muted"
                    }`}
                  >
                    {source.enabled ? (
                      <Check className="h-4 w-4 text-sb-accent" />
                    ) : (
                      <X className="h-4 w-4 text-sb-muted" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="truncate">{source.name}</p>
                      <p className="text-[10px] text-sb-muted uppercase">{source.category}</p>
                    </div>
                  </button>
                ))}
              </div>
            </Panel>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <Panel className="p-8 text-center">
            <Newspaper className="h-8 w-8 text-sb-muted mx-auto mb-3" />
            <p className="text-sm text-sb-muted">No news items match your filters.</p>
          </Panel>
        )}

        {filtered.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
          >
            <Panel className="p-4 hover:border-sb-accent/30 transition-colors cursor-pointer group">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Badge variant="outline" className="text-[10px] h-5 border-sb-border text-sb-muted">
                      {item.source}
                    </Badge>
                    <span className="text-[10px] text-sb-muted flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {relativeTime(item.timestamp)}
                    </span>
                  </div>
                  <h3 className="text-sm font-medium text-sb-text group-hover:text-sb-accent transition-colors truncate">
                    {item.title}
                  </h3>
                  {item.summary && (
                    <p className="text-xs text-sb-muted mt-1.5 line-clamp-2">{item.summary}</p>
                  )}
                </div>
                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sb-muted hover:text-sb-accent transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
            </Panel>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
