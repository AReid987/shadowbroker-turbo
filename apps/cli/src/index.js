#!/usr/bin/env node

const ADMIN_TOKEN = process.env.ADMIN_TOKEN;
const API_URL = process.env.API_URL || "https://shadowbroker-api.onrender.com";

// Simple ANSI helpers (no deps)
const g = (s) => `\x1b[32m${s}\x1b[0m`;
const r = (s) => `\x1b[31m${s}\x1b[0m`;
const c = (s) => `\x1b[36m${s}\x1b[0m`;
const y = (s) => `\x1b[33m${s}\x1b[0m`;
const b = (s) => `\x1b[1m${s}\x1b[0m`;

async function request(path, opts = {}) {
  if (!ADMIN_TOKEN) {
    throw new Error("ADMIN_TOKEN not set. Set the env var and try again.");
  }
  const url = `${API_URL}${path}`;
  const res = await fetch(url, {
    ...opts,
    headers: {
      Authorization: `Bearer ${ADMIN_TOKEN}`,
      "Content-Type": "application/json",
      ...(opts.headers || {}),
    },
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}${txt ? " — " + txt : ""}`);
  }
  return res.json().catch(() => ({}));
}

async function generate(label = "") {
  const data = await request("/api/codes/generate", {
    method: "POST",
    body: JSON.stringify({ label }),
  });
  if (data.code) {
    console.log(g("Generated invite code:"));
    console.log(b(data.code));
    if (data.label) console.log(`Label: ${data.label}`);
    console.log(`Expires: ${data.expires_at || "never"}`);
  } else {
    console.log(r("Failed to generate code"), data);
    process.exit(1);
  }
}

async function list() {
  const data = await request("/api/codes");
  const codes = data.codes || {};
  const entries = Object.entries(codes);
  if (entries.length === 0) {
    console.log(y("No invite codes found."));
    return;
  }
  console.log(c(`Invite codes (${entries.length}):`));
  console.log("-".repeat(60));
  entries.forEach(([code, info]) => {
    const status = info.uses > 0 ? r("USED") : g("ACTIVE");
    const line = `${b(code)}  ${status}  uses:${info.uses}  ${info.label || ""}`;
    console.log(line);
  });
}

async function revoke(code) {
  if (!code) {
    console.log(r("Usage: sb-code revoke <code>"));
    process.exit(1);
  }
  await request(`/api/codes/${code}`, { method: "DELETE" });
  console.log(g(`Revoked ${code}`));
}

const cmd = process.argv[2];
(async () => {
  try {
    switch (cmd) {
      case "generate":
        await generate(process.argv[3] || "");
        break;
      case "list":
        await list();
        break;
      case "revoke":
        await revoke(process.argv[3]);
        break;
      default:
        console.log(c("Blacktivism Invite Code CLI"));
        console.log("Usage:");
        console.log("  sb-code generate [label]   Create a new invite code");
        console.log("  sb-code list               List all invite codes");
        console.log("  sb-code revoke <code>      Revoke an invite code");
        process.exit(cmd ? 1 : 0);
    }
  } catch (err) {
    console.error(r(err.message));
    process.exit(1);
  }
})();
