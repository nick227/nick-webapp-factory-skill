# nick-webapp-factory

A Claude Code skill that scaffolds production-ready full-stack web apps. Point it at a project idea and it writes real files — schema, API spec, server, SDK, frontend pages, tests, CI, and deployment config — across a structured six-phase build.

## What it generates

```
your-app/
  apps/
    web/          Vite + React + TypeScript + Tailwind
    server/       Fastify + TypeScript
  packages/
    api-spec/     OpenAPI 3.1 YAML — single source of truth for all routes
    sdk/          Generated types + openapi-fetch client + React Query hooks
    db/           Prisma + MySQL
  .github/        CI workflow (typecheck, lint, test, e2e)
  scripts/        Code generators (pages, tests, docs)
  CLAUDE.md       Project memory — phase progress, deviations, plugin list
```

The architectural spine: the OpenAPI spec is written first, routes and types are generated from it, and the SDK is the only bridge between frontend and backend. No hand-written route registration, no raw `fetch` in pages, no manually authored generated types.

## Stack

| Layer | Default |
|---|---|
| Monorepo | pnpm workspaces |
| Frontend | Vite + React 18 + TypeScript + Tailwind CSS |
| Backend | Fastify + fastify-openapi-glue |
| Database | Prisma + MySQL |
| API contract | OpenAPI 3.1 YAML |
| SDK types | openapi-typescript (generated, never hand-edited) |
| API client | openapi-fetch (fully typed from spec) |
| Data hooks | React Query v5 (portable across Vite, Next.js, Expo) |
| Unit tests | Vitest |
| E2E tests | Playwright |

## Installation

```bash
git clone https://github.com/nicholasrios/nick-webapp-factory \
  ~/.claude/skills/nick-webapp-factory
```

Claude Code picks it up automatically on next session — no restart needed.

## Usage

### Start a new project

Invoke the skill and pre-answer the four discovery questions in one message. This skips the back-and-forth and goes straight to the MVP Definition:

```
Use nick-webapp-factory.

Build a creator social network.

1. What it does: Creators publish posts with media; followers see a personalized feed.
2. Users / roles: Creator (posts, manages profile), Viewer (follows, reacts, comments)
3. V1 features: auth, user profiles, follow/unfollow, post feed (cursor-paginated),
   comments, reactions, notifications
4. Not in V1: DMs, payments, analytics, mobile app

Plugins: file-upload, google-auth
Frontend packs: quality-designer, activity-feed, smart-media, animation
```

The skill writes an MVP Definition and asks for approval, then charges through all six phases without stopping.

### Continue an existing project

```
Use nick-webapp-factory. Keep going — finish the Fastify routes and start on the frontend pages.
```

The skill reads `CLAUDE.md`, finds the last completed phase, and resumes.

## Phases

| Phase | What gets built |
|---|---|
| 0 — Discovery | Four questions → written MVP Definition → developer approval |
| 1 — Contract | Monorepo scaffold, Prisma schema, OpenAPI spec, SDK package, type generation |
| 2 — Server | Fastify handlers + services, auth, integration test stubs |
| 3 — Frontend Shell | Vite app, Tailwind tokens, UI primitives, layout, page stubs, Playwright smoke test |
| 4 — Feature Pages | SDK hooks, feature pages, forms, optional admin panel |
| 5 — Polish | Skeletons, error boundaries, toasts, seed script, session close checklist |
| 6 — Documentation | Generated API/env/DB docs, architecture docs, final CLAUDE.md |

Each phase has a concrete gate checklist. No phase starts until its predecessor's gate passes.

## Plugins

Opt-in. Install after Phase 2 with `pnpm factory:add plugin <name>`.

| Plugin | What it adds |
|---|---|
| `file-upload` | Drag-and-drop uploads, type/size validation, static serving, swappable storage backend |
| `cloudflare-r2` | R2 storage swap for `file-upload` — no route changes |
| `google-auth` | Google Sign-In (ID token flow, merges with email accounts) |
| `ai-chat` | Streaming Anthropic chatbot — `ChatWidget` + SSE handler |
| `ai-image-gen` | Text-to-image generation with media history (requires `file-upload`) |
| `ai-video-gen` | Async text-to-video with polling and history (requires `file-upload`) |
| `railway` | Fastify + MySQL deployment — Dockerfile + `railway.json` |
| `vercel` | Vite frontend deployment — `vercel.json` + SPA rewrite |

## Frontend Packs

Opt-in UI assets. Install in Phase 3 or 4 with `pnpm factory:add frontend-pack <name>`.

| Pack | Type | What it adds |
|---|---|---|
| `quality-designer` | Design workflow | Style brief + matrix for non-generic visual direction |
| `admin-ops` | Theme | Restrained ops/dashboard token set |
| `creator-social` | Theme | Warm creator/community token set |
| `data-table` | Component | Sortable table with search and load-more |
| `activity-feed` | Component | Feed item list and composer |
| `smart-media` | Component | Lazy image/video with shimmer and intrinsic size capture |
| `slideshow` | Component | Hero slider (Embla + CTA overlay) and thumbnail gallery browser |
| `animation` | Component | Framer Motion primitives — FadeIn, SlideUp, StaggerList, PageTransition |
| `charts` | Component | Recharts charts wired to CSS token colors — Line, Bar, Area, Pie |
| `feed` | Page | Composed feed page using SDK feed hooks |
| `dashboard` | Page | Compact dashboard scaffold |
| `creator-social` | Mock content | Creator profiles and post fixtures for dev/seed |

## Repository layout

```
SKILL.md                   Skill activation contract, phase order, architecture rules
SKILL_ARCHITECTURE.md      Internal architecture reference for contributors
references/                Phase-specific implementation guides (loaded on demand)
templates/                 Canonical files copied verbatim into generated apps
  configs/                 Tailwind, Playwright, tsconfig templates
  components/              UI primitives (Button, Input, Card, Avatar, Form, …)
  layouts/                 Shell layout with nav
  plugins/                 One folder per plugin — server, SDK, and frontend assets
  frontend-packs/          Themes, component packs, page templates, mock content
  scripts/                 Code generators (pages, tests, docs, factory-add)
  server/                  Fastify index, security plugin, auth handlers, pagination
  sdk/                     Client, hooks, generate script
  web/                     main.tsx, AuthGuard, queryClient, e2e smoke test
fixtures/                  Reference social-feed app for testing
scripts/                   Skill-level utility scripts
```

## Architecture rules (short form)

- **Spec first.** No route exists in Fastify that isn't in the OpenAPI YAML.
- **SDK is the only bridge.** Pages never call `fetch` directly — all data goes through `@project/sdk` hooks.
- **Hooks live in the SDK, not the app.** A hook in `apps/web/` is a bug.
- **No manual route registration.** `fastify-openapi-glue` maps `operationId` → handler at startup.
- **Generated types are never edited.** Fix the spec; regenerate.
- **Templates first.** Before generating any file, check `templates/` for a ready-made version. Generating from scratch when a template exists is a bug.
- **`CLAUDE.md` is the project memory.** Future sessions read it to understand what's been built and which phase to resume.
