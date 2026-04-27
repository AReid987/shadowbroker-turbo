import type { Config } from "tailwindcss";
import base from "@shadowbroker/config/tailwind.base";

const config: Config = {
  ...base,
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    ...base.theme,
    extend: {
      ...base.theme?.extend,
      colors: {
        ...base.theme?.extend?.colors,
        sb: {
          black: "#0a0a0f",
          panel: "#111118",
          border: "#1e1e2a",
          accent: "#22c55e",
          accentDim: "#15803d",
          text: "#e2e8f0",
          muted: "#64748b",
          danger: "#ef4444",
          warning: "#f59e0b",
          info: "#3b82f6",
        },
      },
    },
  },
};

export default config;
