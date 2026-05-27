# Template: pnpm-workspace.yaml

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

---

# Template: Root package.json

```json
{
  "name": "<project-name>",
  "private": true,
  "scripts": {
    "dev": "pnpm --parallel --filter './apps/*' dev",
    "build": "pnpm --filter './packages/*' build && pnpm --filter './apps/*' build",
    "typecheck": "pnpm --recursive typecheck",
    "lint": "pnpm --recursive lint",
    "test": "pnpm --recursive test",
    "bootstrap": "tsx scripts/bootstrap.ts",
    "factory:add": "tsx scripts/factory-add.ts",
    "sdk:generate": "pnpm --filter @project/sdk generate",
    "sdk:check": "tsx scripts/check-sdk-drift.ts",
    "test:generate": "tsx scripts/generate-tests.ts",
    "docs:generate": "tsx scripts/generate-docs.ts",
    "pages:generate": "tsx scripts/generate-pages.ts",
    "db:push": "pnpm --filter @project/db db:push",
    "db:seed": "pnpm --filter @project/db db:seed",
    "db:studio": "pnpm --filter @project/db db:studio"
  },
  "devDependencies": {
    "@types/js-yaml": "^4.0.0",
    "eslint": "^8.0.0",
    "js-yaml": "^4.0.0",
    "tsx": "^4.0.0",
    "typescript": "^5.0.0"
  }
}
```

---

# Template: Root scripts (copy these files from templates/scripts/)

| Script file | Copy from | When |
|---|---|---|
| `scripts/bootstrap.ts` | `templates/scripts/bootstrap.ts` | Always |
| `scripts/factory-add.ts` | `templates/scripts/factory-add.ts` | Always |
| `scripts/check-sdk-drift.ts` | `templates/scripts/check-sdk-drift.ts` | Always |
| `scripts/generate-tests.ts` | `templates/scripts/generate-tests.ts` | Always |
| `scripts/generate-docs.ts` | `templates/scripts/generate-docs.ts` | Always |
| `scripts/generate-pages.ts` | `templates/scripts/generate-pages.ts` | Always |
| `scripts/figma-sync.ts` | `templates/scripts/figma-sync.ts` | Optional design source adapter: only if quality-designer + existing Figma file |
| `figma.config.example.json` | `templates/scripts/figma.config.example.json` | Optional design source adapter: only if quality-designer + existing Figma file |

Also add to root `package.json` scripts:
```json
"bootstrap": "tsx scripts/bootstrap.ts",
"factory:add": "tsx scripts/factory-add.ts"
```

If the Figma design source adapter is selected, also add:
```json
"figma:sync": "tsx scripts/figma-sync.ts"
```

---

# Template: packages/api-spec/package.json

```json
{
  "name": "@project/api-spec",
  "version": "0.0.1",
  "main": "./openapi.yaml"
}
```

---

# Template: packages/sdk/package.json

```json
{
  "name": "@project/sdk",
  "version": "0.0.1",
  "exports": {
    ".": "./src/index.ts"
  },
  "scripts": {
    "generate": "tsx scripts/generate.ts"
  },
  "dependencies": {
    "@tanstack/react-query": "^5.0.0",
    "openapi-fetch": "^0.12.0"
  },
  "devDependencies": {
    "openapi-typescript": "^7.0.0",
    "tsx": "^4.0.0"
  },
  "peerDependencies": {
    "react": "^18.0.0"
  }
}
```

SDK files to copy from templates (all verbatim):

| File | Copy from |
|---|---|
| `packages/sdk/src/client.ts` | `templates/sdk/client.ts` |
| `packages/sdk/src/index.ts` | `templates/sdk/index.ts` |
| `packages/sdk/src/hooks/useAuth.ts` | `templates/sdk/hooks/useAuth.ts` |
| `packages/sdk/src/hooks/index.ts` | `templates/sdk/hooks/index.ts` |
| `packages/sdk/scripts/generate.ts` | `templates/sdk/generate.ts` |

---

# Template: apps/server/package.json

```json
{
  "name": "server",
  "version": "0.0.1",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "vitest run",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@fastify/cookie": "^9.0.0",
    "@fastify/cors": "^9.0.0",
    "@fastify/swagger": "^8.0.0",
    "@fastify/swagger-ui": "^3.0.0",
    "@project/db": "workspace:*",
    "bcryptjs": "^2.4.3",
    "fastify": "^4.0.0",
    "fastify-openapi-glue": "^4.0.0",
    "js-yaml": "^4.0.0"
  },
  "devDependencies": {
    "@apidevtools/swagger-parser": "^10.0.0",
    "@types/bcryptjs": "^2.4.0",
    "@types/js-yaml": "^4.0.0",
    "ajv": "^8.0.0",
    "ajv-formats": "^3.0.0",
    "tsx": "^4.0.0",
    "typescript": "^5.0.0",
    "vitest": "^2.0.0"
  }
}
```

Auth handler files to copy from templates (verbatim):

| File | Copy from |
|---|---|
| `apps/server/src/handlers/auth.ts` | `templates/server/handlers/auth.ts` |
| `apps/server/src/services/AuthService.ts` | `templates/server/services/AuthService.ts` |

---

# Template: apps/web/package.json (if not using pnpm create vite)

`pnpm create vite apps/web -- --template react-ts` generates this automatically.
If bootstrapping manually, use:

```json
{
  "name": "web",
  "version": "0.0.1",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit",
    "test:e2e": "playwright test"
  },
  "dependencies": {
    "@hookform/resolvers": "^3.0.0",
    "@project/sdk": "workspace:*",
    "@tanstack/react-query": "^5.0.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "lucide-react": "^0.400.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "react-hook-form": "^7.0.0",
    "react-router-dom": "^6.0.0",
    "sonner": "^1.0.0",
    "tailwind-merge": "^2.0.0",
    "zod": "^3.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0",
    "@vitejs/plugin-react": "^4.0.0",
    "@playwright/test": "^1.45.0",
    "autoprefixer": "^10.0.0",
    "postcss": "^8.0.0",
    "tailwindcss": "^3.0.0",
    "typescript": "^5.0.0",
    "vite": "^5.0.0"
  }
}
```

Web files to copy from templates:

| File | Copy from | Notes |
|---|---|---|
| `apps/web/vite.config.ts` | `templates/web/vite.config.ts` | No changes needed |
| `apps/web/postcss.config.cjs` | `templates/configs/postcss.config.cjs` | No changes needed |
| `apps/web/src/vite-env.d.ts` | `templates/web/vite-env.d.ts` | No changes needed |
| `apps/web/src/main.tsx` | `templates/web/main.tsx` | No changes needed |
| `apps/web/src/lib/queryClient.ts` | `templates/web/queryClient.ts` | No changes needed |
| `apps/web/src/lib/AuthGuard.tsx` | `templates/web/AuthGuard.tsx` | No changes needed |

---

# Template: packages/db/package.json

```json
{
  "name": "@project/db",
  "version": "0.0.1",
  "main": "./src/client.ts",
  "scripts": {
    "db:push": "prisma db push",
    "db:seed": "tsx prisma/seed.ts",
    "db:studio": "prisma studio"
  },
  "dependencies": {
    "@prisma/client": "^5.0.0"
  },
  "devDependencies": {
    "prisma": "^5.0.0",
    "tsx": "^4.0.0"
  }
}
```

---

# Template: packages/db/src/client.ts

```typescript
import { PrismaClient } from '@prisma/client'

declare global {
  var __db: PrismaClient | undefined
}

export const db = global.__db ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  global.__db = db
}
```

---

# Template: .env.example

```env
# Database
DATABASE_URL=mysql://root:password@localhost:3306/<project>_dev

# Server
PORT=3001
SESSION_SECRET=change-me-in-production
CORS_ORIGIN=http://localhost:5173

# Web
VITE_API_URL=http://localhost:3001
```

---

# Template: README.md skeleton

```markdown
# <Project Name>

## Setup

1. Copy env: `cp .env.example .env` and fill in `DATABASE_URL`
2. Run bootstrap: `pnpm bootstrap` — installs deps, pushes schema, generates SDK + pages + tests, seeds data

## Dev

```bash
pnpm dev
```

Web: http://localhost:5173  
API: http://localhost:3001

## Commands

| Command | Description |
|---|---|
| `pnpm bootstrap` | First-run: install, push schema, generate everything, seed |
| `pnpm dev` | Run all apps in dev mode |
| `pnpm sdk:generate` | Regenerate types + Zod schemas from OpenAPI spec |
| `pnpm sdk:check` | Fail if committed types.ts has drifted from spec |
| `pnpm test:generate` | Generate test stubs for new operationIds |
| `pnpm docs:generate` | Regenerate docs from spec/schema/env |
| `pnpm pages:generate` | Generate page stubs + App.tsx from spec (re-run safe) |
| `pnpm typecheck` | TypeScript check all packages |
| `pnpm lint` | Lint all packages |
| `pnpm test` | Run all tests |
| `pnpm db:push` | Push Prisma schema to DB |
| `pnpm db:seed` | Seed development data |
| `pnpm db:studio` | Open Prisma Studio |
```

---

# Template: CLAUDE.md

```markdown
# Project State

## Stack

Default stack. No overrides.

## Phase Completed

Phase N — <Phase Name>

## Modules Built

- [x] Auth (JWT / session)
- [x] User + Profile
- [x] Follow
- [x] Post / Feed
- [x] Comment
- [x] Reaction
- [x] Notification
- [ ] Media
- [ ] Search
- [ ] Admin

## Deviations from Defaults

_None — or list here._

## Last Session Summary

_What was built, what's next, any blockers._
```
