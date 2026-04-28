# Blacktivism Agent Instructions

## RULE NUMBER ONE — MOST IMPORTANT OF ALL RULES

**REAL DATA ONLY. NEVER USE DEMO DATA, SIMULATION DATA, OR FAKE DATA UNDER ANY CIRCUMSTANCES.**

- **Only ever use real data**, no matter what.
- **Never use simulation data**.
- **Never use demo data**.
- **Never use fake data**.
- **Never use placeholder data**.
- **Never use mock data**.
- If real data is unavailable, fetch it from live sources. Do not substitute with fabricated data.
- This rule is absolute. No exceptions. No workarounds. No "just for now."

## Project

- **Name**: Blacktivism Turbo
- **Frontend**: Next.js 15 (`apps/web`) — deployed to Vercel
- **Backend**: FastAPI (`apps/api`) — deployed to Render
- **CLI**: `sb-code` global npm package (`apps/cli`)

## Conventions

- Use TypeScript strict mode.
- Tailwind CSS for styling.
- `blacktivism_session` cookie for auth (not `shadow_session`).
- Backend API at `https://shadowbroker-api.onrender.com`.
- Frontend at `https://web-aigency0.vercel.app`.
