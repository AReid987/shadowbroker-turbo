"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Table, ChevronRight, FileSpreadsheet, Shield } from "lucide-react";
import { CovertLogin } from "./CovertLogin";

const KONAMI = [
  "ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
  "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight",
  "b", "a",
];

export function DecoyLanding() {
  const [showLogin, setShowLogin] = useState(false);
  const [konamiIndex, setKonamiIndex] = useState(0);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === KONAMI[konamiIndex]) {
        const next = konamiIndex + 1;
        if (next === KONAMI.length) {
          setShowLogin(true);
          setKonamiIndex(0);
        } else {
          setKonamiIndex(next);
        }
      } else {
        setKonamiIndex(0);
      }
    },
    [konamiIndex]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 text-slate-900">
      <header className="border-b bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-600 p-2">
              <Table className="h-5 w-5 text-white" />
            </div>
            <span className="font-semibold text-lg tracking-tight">IASE</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-600">
            <a href="#about" className="hover:text-slate-900">About</a>
            <a href="#events" className="hover:text-slate-900">Events</a>
            <a href="#membership" className="hover:text-slate-900">Membership</a>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            International Association of{" "}
            <span className="text-emerald-700">Spreadsheet Enthusiasts</span>
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Promoting excellence in spreadsheet craftsmanship since 1987.
            Join thousands of professionals who believe every cell tells a story.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {[
            { icon: FileSpreadsheet, title: "Best Practices", desc: "Learn formatting standards from industry veterans." },
            { icon: Shield, title: "Data Integrity", desc: "Master validation techniques that prevent errors." },
            { icon: Table, title: "Community", desc: "Connect with fellow enthusiasts worldwide." },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="rounded-xl border bg-white p-6 shadow-sm"
            >
              <item.icon className="h-8 w-8 text-emerald-600 mb-4" />
              <h3 className="font-semibold mb-2">{item.title}</h3>
              <p className="text-sm text-slate-600">{item.desc}</p>
            </motion.div>
          ))}
        </div>

        <div className="rounded-2xl border bg-white p-8 md:p-12 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-emerald-100 p-3">
              <ChevronRight className="h-5 w-5 text-emerald-700" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Annual Conference 2025</h2>
              <p className="text-slate-600 mb-4">
                Join us in Des Moines for three days of pivot tables, VLOOKUP deep-dives,
                and conditional formatting workshops.
              </p>
              <button className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
                Register Now <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t bg-white mt-16">
        <div className="mx-auto max-w-5xl px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <p>© 2025 International Association of Spreadsheet Enthusiasts</p>
          <button
            onClick={() => setShowLogin(true)}
            className="hover:text-slate-700 transition-colors"
          >
            Privacy Policy
          </button>
        </div>
      </footer>

      <CovertLogin open={showLogin} onClose={() => setShowLogin(false)} />
    </div>
  );
}
