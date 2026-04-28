#!/usr/bin/env node
/**
 * Manage invite codes for Blacktivism Turbo
 *
 * Usage:
 *   export ADMIN_TOKEN="your-admin-token"
 *   export API_URL="https://shadowbroker-api.onrender.com"
 *
 *   node scripts/manage-codes.js generate          # Generate a new code
 *   node scripts/manage-codes.js generate --label "VIP Guest"
 *   node scripts/manage-codes.js list              # List all valid codes
 *   node scripts/manage-codes.js revoke ABC123xyz  # Revoke a code
 */

const API_URL = process.env.API_URL || "https://shadowbroker-api.onrender.com";
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

function usage() {
  console.log(`
Usage: node manage-codes.js <command> [options]

Commands:
  generate [--label "description"]   Generate a new invite code
  list                               List all valid invite codes
  revoke <code>                      Revoke an invite code

Environment:
  ADMIN_TOKEN    Required. Admin bearer token.
  API_URL        Optional. Backend URL (default: ${API_URL})
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
  console.log("\n╔═══════════════════════════════════════════════════════════╗");
  console.log("║           NEW INVITE CODE GENERATED                       ║");
  console.log("╚═══════════════════════════════════════════════════════════╝\n");
  console.log("Code:", data.code);
  if (data.label) console.log("Label:", data.label);
  console.log("\nGive this code to the user. They enter it in the login modal.");
  console.log("(Click 'Privacy Policy' on the site to open the modal)\n");
}

async function list() {
  const data = await request("/api/codes", { method: "GET" });
  const entries = Object.entries(data.codes || {});
  console.log("\n╔═══════════════════════════════════════════════════════════╗");
  console.log("║           VALID INVITE CODES                              ║");
  console.log("╚═══════════════════════════════════════════════════════════╝\n");
  if (entries.length === 0) {
    console.log("No valid codes found.\n");
    return;
  }
  console.log(`${entries.length} code(s) active:\n`);
  for (const [code, meta] of entries) {
    console.log(`  ${code}`);
    console.log(`    Created: ${meta.created_at || "unknown"}`);
    console.log(`    Uses:    ${meta.uses || 0}`);
    if (meta.label) console.log(`    Label:   ${meta.label}`);
    console.log("");
  }
}

async function revoke(code) {
  await request(`/api/codes/${code}`, { method: "DELETE" });
  console.log(`\n✅ Code revoked: ${code}\n`);
}

async function main() {
  if (!ADMIN_TOKEN) {
    console.error("❌ ADMIN_TOKEN environment variable is required.");
    console.error("   Set it with: export ADMIN_TOKEN=your-token-here\n");
    process.exit(1);
  }

  const [cmd, ...args] = process.argv.slice(2);

  try {
    switch (cmd) {
      case "generate": {
        const labelIdx = args.indexOf("--label");
        const label = labelIdx !== -1 ? args[labelIdx + 1] || "" : "";
        await generate(label);
        break;
      }
      case "list":
        await list();
        break;
      case "revoke":
        if (!args[0]) usage();
        await revoke(args[0]);
        break;
      default:
        usage();
    }
  } catch (err) {
    console.error("\n❌ Error:", err.message, "\n");
    process.exit(1);
  }
}

main();
