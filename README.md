# Shadowbroker Turbo

A streamlined rebuild of the Shadowbroker OSINT platform as a Turborepo monorepo.

## Architecture

```
shadowbroker-turbo/
├── apps/
│   ├── web/          # Next.js 15 — covert OSINT dashboard
│   └── api/          # FastAPI — backend API (subset of original)
├── packages/
│   ├── config/       # Shared eslint, tsconfig, tailwind configs
│   ├── types/        # Shared TypeScript types
│   ├── auth/         # Covert auth utilities (crypto-js)
│   └── ui/           # Shared UI component library
```

## Stack

- **Frontend**: Next.js 15 (App Router), React 18, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: FastAPI (Python), Uvicorn
- **Monorepo**: Turborepo, npm workspaces
- **UI**: Custom component library based on shadcn/ui patterns

## Features

- Covert authentication system (decoy landing page + hidden login)
- Dark tactical OSINT dashboard UI
- Modular architecture — add only the data sources you need
- Built from the [original Shadowbroker](https://github.com/BigBodyCobain/Shadowbroker) blueprint

## Development

```bash
# Install dependencies
npm install

# Run everything
turbo dev

# Run just the web app
cd apps/web && npm run dev

# Run just the API
cd apps/api && uvicorn src.main:app --reload

# Build
turbo build
```

## Deployment

- **Frontend**: Vercel (see `apps/web/`)
- **Backend**: Fly.io (see `apps/api/`)
