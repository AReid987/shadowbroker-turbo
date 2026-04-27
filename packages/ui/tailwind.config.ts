import type { Config } from "tailwindcss";
import base from "@shadowbroker/config/tailwind.base";

const config: Config = {
  ...base,
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
};

export default config;
