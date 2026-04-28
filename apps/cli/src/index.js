#!/usr/bin/env node
/**
 * sb-code — Blacktivism Invite Code CLI
 *
 * Usage:
 *   sb-code generate [label]     Generate a new invite code
 *   sb-code list                 List all active codes
 *   sb-code revoke <code>        Revoke a code
 *   sb-code help                 Show this help
 *
 * Environment:
 *   ADMIN_TOKEN   Required. Admin bearer token.
 *   API_URL       Optional. Backend URL.
 */

const API_URL = process.env.API_URL || "https://shadowbroker-api.onrender.com";
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

const C = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
};

function box(title, lines) {
  const width = Math.max(title.length, ...lines.map((l) => l.replace(/\x1b\[\d+m/g, "").length)) + 4;
  const top = "╔" + "═".repeat(width - 2) + "╗";
  const mid = "║" + " " + C.bold + title.padEnd(width - 3) + C.reset + "║";
  const bot = "╚" + "═".repeat(width - 2) + "╝";
  console.log("\n" + C.cyan + top + C.reset);
  console.log(C.cyan + mid + C.reset);
  for (const line of lines) {
    const plain = line.replace(/\x1b\[\d+m/g, "");
    const pad = width - 3 - plain.length;
    console.log(C.cyan + "║" + C.reset + " " + line + " ".repeat(Math.max(0, pad)) + C.cyan + "║" + C.reset);
  }
  console.log(C.cyan + bot + C.reset + "\n");
}

function usage() {
  console.log(`
${C.bold}sb-code${C.reset} — Shadowbroker Invite Code CLI

${C.bold}Usage:${C.reset}
  sb-code generate [label]     Generate a new invite code
  sb-code list                 List all active codes
  sb-code revoke <code>        Revoke a code

${C.bold}Environment:${C.reset}
  ADMIN_TOKEN   Required. Set in ~/.zshrc or ~/.bashrc:
                export ADMIN_TOKEN="sb-admin-d5df6d98ee5f01f7846e28ce0690e3ae"
  API_URL       Optional. Default: ${API_URL}
`);
  process.exit(1);
}

async function request(path, opts = {}) {
  const url = `${API_URL}${path}`;
  const res = await fetch(url, {
    ...opts,
    headers: {
      Authorization: `Bearer ${ADMIN_TOKEN}`,
      "Content-Type": "application/json",
      ...opts.headers,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.detail || `HTTP ${res.status}`);
  }
  return data;
}

async function generate(label = "") {
  const qs = label ? `?label=${encodeURIComponent(label)}` : "";
  const data = await request(`/api/codes/generate${qs}`, { method: "POST" });
  box("NEW INVITE CODE", [
    `${C.bold}Code:${C.reset}  ${C.green}${data.code}${C.reset}`,
    ...(data.label ? [`${C.bold}Label:${C.reset} ${data.label}`] : []),
  ]);
  console.log("Give this code to the user. They enter it in the login modal.");
  console.log("(Click 'Privacy Policy' on the site to open the modal)\n");
}

async function list() {
  const data = await request("/api/codes", { method: "GET" });
  const entries = Object.entries(data.codes || {});
  if (entries.length === 0) {
    console.log("\nNo active codes found.\n");
    return;
  }
  box("ACTIVE INVITE CODES", [
    `${entries.length} code(s) active:`,
    "",
    ...entries.map(([code, meta]) => {
      const label = meta.label ? ` ${C.dim}(${meta.label})${C.reset}` : "";
      return `  ${C.green}${code}${C.reset}${label}`;
    }),
  ]);
}

async function revoke(code) {
  await request(`/api/codes/${code}`, { method: "DELETE" });
  console.log(`\n${C.green}✓${C.reset} Code revoked: ${code}\n`);
}

async function main() {
  if (!ADMIN_TOKEN) {
    console.error(`\n${C.red}Error:${C.reset} ADMIN_TOKEN is not set.`);
    console.error(`Run: ${C.yellow}export ADMIN_TOKEN="sb-admin-d5df6d98ee5f01f7846e28ce0690e3ae"${C.reset}\n`);
    process.exit(1);
  }

  const [cmd, ...args] = process.argv.slice(2);

  try {
    switch (cmd) {
      case "generate":
      case "g":
      case "gen": {
        const label = args.join(" ");
        await generate(label);
        break;
      }
      case "list":
      case "ls":
      case "l":
        await list();
        break;
      case "revoke":
      case "rm":
      case "delete": {
        if (!args[0]) usage();
        await revoke(args[0]);
        break;
      }
      case "help":
      case "-h":
      case "--help":
      default:
        usage();
    }
  } catch (err) {
    console.error(`\n${C.red}Error:${C.reset} ${err.message}\n`);
    process.exit(1);
  }
}

main();
