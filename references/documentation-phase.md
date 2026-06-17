# Documentation Phase

Load this file at Phase 6. Covers developer documentation.

---

## Overview

Documentation is generated where possible — the same spec-driven philosophy applied to tests and SDK. What can be derived from existing artifacts (OpenAPI spec, Prisma schema, env vars) should be generated, not written by hand.

Admin capabilities are handled separately — see `references/admin-pipeline.md`, loaded at Phase 4.

---

## Part 1 — Developer Documentation

Generated to `docs/` at the project root. Markdown files, readable on GitHub or any docs host.

### Doc Generator Script

Copy `templates/scripts/generate-docs.ts` → `scripts/generate-docs.ts`. No changes needed.

Generates three files in a single run:
- `docs/api-reference.md` — table of all routes grouped by tag, from `openapi.yaml`
- `docs/env-vars.md` — table of all env vars, from `.env.example`
- `docs/database.md` — list of all Prisma models and enums, from `schema.prisma`

Re-run whenever routes, env vars, or schema change.

---

### Developer Doc Files

Generate these files in `docs/`. Content is mostly stable â€” write once, update when architecture changes.

**`docs/architecture.md`**

```markdown
# Architecture

## The Pipeline

Every feature flows from the OpenAPI spec:

\`\`\`
packages/api-spec/openapi.yaml   â† source of truth for all routes
  â”œâ”€â”€ openapi-typescript          â†’ packages/sdk/src/generated/types.ts
  â”œâ”€â”€ openapi-fetch               â†’ packages/sdk/src/client.ts (typed, zero hand-written methods)
  â”œâ”€â”€ fastify-openapi-glue        â†’ apps/server routes, validation, and auth wired automatically
  â”œâ”€â”€ generate-tests.ts           â†’ apps/server/src/__tests__/ (one stub per operationId)
  â””â”€â”€ generate-docs.ts            â†’ docs/api-reference.md
\`\`\`

## Packages

| Package | Purpose |
|---|---|
| `packages/db` | Prisma client and schema â€” only place DB structure is defined |
| `packages/api-spec` | OpenAPI 3.1 YAML â€” the contract between server and client |
| `packages/sdk` | Typed fetch client + React Query hooks â€” portable across any React app |
| `apps/server` | Fastify API server â€” implements what the spec declares |
| `apps/web` | Vite + React frontend â€” imports data only from `@project/sdk` |

## Rules

- A route exists only if it is in `openapi.yaml`
- The SDK never imports from `apps/server`
- Pages never call `fetch` directly â€” all data comes from `@project/sdk` hooks
- Generated files (`types.ts`, test stubs, API reference) are never edited by hand
```

**`docs/setup.md`**

```markdown
# Developer Setup

## Prerequisites

- Node.js 20+
- pnpm 9+
- MySQL 8+ (or compatible)

## First-time setup

\`\`\`bash
pnpm install
cp .env.example .env        # fill in DATABASE_URL and secrets
pnpm db:push                # push Prisma schema
pnpm db:seed                # seed development data
pnpm sdk:generate           # generate SDK types from OpenAPI spec
\`\`\`

## Running

\`\`\`bash
pnpm dev      # starts all apps in parallel
\`\`\`

Web: http://localhost:5173
API: http://localhost:3001
API Docs: http://localhost:3001/docs   â† live Swagger UI

## Code generators

| Command | What it does |
|---|---|
| `pnpm sdk:generate` | Regenerate SDK types from `openapi.yaml` â€” run after spec changes |
| `pnpm test:generate` | Append test stubs for new routes â€” run after spec changes |
| `pnpm docs:generate` | Regenerate `docs/api-reference.md` from spec |

## Adding a new route

1. Add the route + schemas to `packages/api-spec/openapi.yaml`
2. `pnpm sdk:generate` â€” updates `packages/sdk/src/generated/types.ts`
3. Add a named export to `apps/server/src/handlers/` matching the `operationId`
4. Add the service method to `apps/server/src/services/`
5. `pnpm test:generate` â€” appends a test stub
6. Add the hook call to the relevant page in `apps/web`
7. `pnpm docs:generate` â€” updates API reference
```

**`docs/sdk.md`**

```markdown
# Using the SDK in another app

`@project/sdk` is a portable, self-contained API + hook layer. Any React app can install it.

\`\`\`bash
pnpm add @project/sdk @tanstack/react-query
\`\`\`

## Setup

\`\`\`typescript
import { createApiClient } from '@project/sdk'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

createApiClient({
  baseUrl: 'https://api.yourapp.com',
  getToken: () => localStorage.getItem('token'),
})

// Wrap your app in <QueryClientProvider client={queryClient}>
\`\`\`

## Usage

\`\`\`typescript
import { useFeed, useCreatePost, useCurrentUser } from '@project/sdk'

function FeedPage() {
  const { data, isLoading } = useFeed()
  // ...
}
\`\`\`

All hooks are typed from the OpenAPI spec. No additional setup required.
```

**`docs/deployment.md`**

```markdown
# Deployment

## Environment variables

See `.env.example` for all required variables. Never commit `.env`.

## Server

The Fastify server (`apps/server`) is a standard Node.js process.

\`\`\`bash
pnpm --filter apps/server build
node apps/server/dist/index.js
\`\`\`

Recommended hosts: Railway, Render, Fly.io. All support Node.js with a Dockerfile or buildpack.

**Dockerfile (server):**

\`\`\`dockerfile
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm install -g pnpm && pnpm install --frozen-lockfile
RUN pnpm --filter @project/db generate
RUN pnpm --filter apps/server build
EXPOSE 3001
CMD ["node", "apps/server/dist/index.js"]
\`\`\`

## Web

The Vite frontend builds to static files.

\`\`\`bash
VITE_API_URL=https://api.yourapp.com pnpm --filter apps/web build
\`\`\`

Recommended hosts: Vercel, Netlify, Cloudflare Pages.

## Database

Run migrations before deploying a new server version:

\`\`\`bash
pnpm db:push   # dev/staging
# or: pnpm --filter @project/db exec prisma migrate deploy   # production
\`\`\`
```


---

## Phase 6 Gate

- [ ] `pnpm docs:generate` runs and produces `docs/api-reference.md`
- [ ] `docs/` directory contains: `architecture.md`, `setup.md`, `sdk.md`, `deployment.md`, `api-reference.md`
