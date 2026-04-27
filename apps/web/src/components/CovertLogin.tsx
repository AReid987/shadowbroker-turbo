"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Eye, EyeOff, X } from "lucide-react";
import { Input } from "@shadowbroker/ui";
import { useAuth } from "@/hooks/useAuth";

interface CovertLoginProps {
  open: boolean;
  onClose: () => void;
}

export function CovertLogin({ open, onClose }: CovertLoginProps) {
  const [key, setKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const { login, isLoading, error } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await login(key);
    if (ok) {
      window.location.href = "/dashboard";
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-xl border border-sb-border bg-sb-panel p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-sb-accent/10 p-2">
                  <Lock className="h-5 w-5 text-sb-accent" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-sb-text">Secure Access</h2>
                  <p className="text-xs text-sb-muted">Authentication Required</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-sb-muted hover:bg-white/5 hover:text-sb-text"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Input
                  type={showKey ? "text" : "password"}
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="Enter access key..."
                  className="h-11 bg-black/40 border-sb-border pr-10 font-mono text-sm tracking-wider"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sb-muted hover:text-sb-text"
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-sb-danger"
                >
                  {error}
                </motion.p>
              )}

              <button
                type="submit"
                disabled={isLoading || !key}
                className="w-full h-10 rounded-lg bg-sb-accent text-black font-medium text-sm hover:bg-sb-accentDim disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? "Authenticating..." : "Access System"}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
