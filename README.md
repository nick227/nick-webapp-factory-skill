# nick-webapp-factory

A Claude Code skill that scaffolds production-ready full-stack web apps. Describe your idea, answer four discovery questions, approve the MVP definition — then the skill writes the schema, API spec, server, SDK, frontend, tests, CI, and deployment config across a structured six-phase build.

---

## How it works

The skill has four layers. Understanding them makes every customization decision obvious.

| Layer | Location | Role |
|---|---|---|
| **Orchestration** | `SKILL.md` | Activation triggers, phase order, phase gates, architecture rules, lazy-load map |
| **Knowledge base** | `references/` | Phase-specific implementation guides loaded on demand — conventions, patterns, QA gates |
| **Implementation library** | `templates/` | Canonical files copied verbatim into generated apps — configs, components, server, SDK, scripts |
| **Install automation** | `templates/scripts/factory-add.ts` + manifests | Copies plugin and frontend-pack files, appends env vars, stages schema/spec patches |

The architectural spine of generated apps:

```
OpenAPI spec  →  generated SDK types  →  typed API client  →  React Query hooks  →  pages
OpenAPI spec  →  fastify-openapi-glue  →  operationId handlers  →  services  →  Prisma
```

The spec is the single source of truth for all routes. No hand-written route registration, no raw `fetch` in pages, no manually authored generated types.

---

## Install

```bash
git clone https://github.com/nicholasrios/nick-webapp-factory \
  ~/.claude/skills/nick-webapp-factory
```

Claude Code picks it up on the next session — no restart needed. The skill name is `nick-webapp-factory`.

---

## Usage

### Start a new project

Pre-answering the four discovery questions in one message skips the back-and-forth and goes straight to the MVP Definition:

```
Use nick-webapp-factory.

Build a creator social network.

1. What it does: Creators publish posts with media; followers see a personalized feed.
2. Users / roles: Creator (posts, manages profile), Viewer (follows, reacts, comments)
3. V1 features: auth, profiles, follow/unfollow, feed (cursor-paginated), comments, reactions, notifications
4. Not in V1: DMs, payments, analytics, mobile app

Plugins: file-upload, google-auth
Frontend packs: quality-designer, activity-feed, smart-media
```

The skill writes a compact MVP Definition, waits for your approval (`"build it"`, `"yes"`, or equivalent), then works through all six phases without stopping.

### Continue a session

```
Use nick-webapp-factory. Keep going.
```

The skill reads `CLAUDE.md` at the project root, finds the last completed phase, and resumes. Never re-run discovery on an existing project — the continuation protocol skips it automatically.

### Install a plugin mid-build

```bash
pnpm factory:add plugin file-upload
pnpm factory:add plugin cloudflare-r2   # provider swap — requires file-upload
```

### Install a frontend pack

```bash
pnpm factory:add frontend-pack activity-feed
pnpm factory:add frontend-pack quality-designer
```

---

## Stack

| Layer | Default |
|---|---|
| Monorepo | pnpm workspaces |
| Frontend | Vite + React 18 + TypeScript + Tailwind CSS |
| Backend | Fastify 4 + fastify-openapi-glue |
| Database | Prisma + MySQL |
| API contract | OpenAPI 3.1 YAML |
| SDK types | openapi-typescript (generated, never hand-edited) |
| API client | openapi-fetch (fully typed from spec) |
| Data hooks | React Query v5 |
| Unit tests | Vitest |
| E2E tests | Playwright |

---

## Customizing the skill

Most customizations touch one or two files. The table below maps each concern to the right location.

### Stack defaults

| What to change | Where |
|---|---|
| Default database (MySQL → PostgreSQL) | `templates/monorepo-base.md` → db `package.json`, `.env.example` datasource line; `references/prisma-patterns.md` datasource block |
| Auth strategy (session cookies → JWT) | `templates/server/security.ts`, `templates/server/services/AuthService.ts`, `references/openapi-conventions.md` security scheme section |
| Default social modules included in MVP | `references/domain-defaults.md` |
| CSS token palette and design language | `templates/configs/index.css`, `templates/configs/tailwind.config.ts` |
| UI primitive components | `templates/components/` — each file is self-contained; swap implementations freely |
| App shell layout | `templates/layouts/Shell.tsx` |

### Architecture rules

Architecture rules live in two places:

- **`references/core-architecture.md`** — the rules agents must follow when building (spec-first, no raw fetch, no manual routes, etc.)
- **`SKILL.md`** Phase sections — the concrete steps and gates that enforce those rules during generation

To add a new rule: write it in `core-architecture.md` and add a corresponding gate check in the relevant Phase section of `SKILL.md`.

### Discovery questions and MVP defaults

`references/discovery.md` owns the four discovery questions, the MVP Definition format, and the approval gate. Edit this to change what gets asked or how scope is framed.

`references/domain-defaults.md` controls which modules are in/out by default for social apps and how the skill reasons about MVP scope. Edit this to change default module selections.

---

## Extending the skill

### Add a plugin

A plugin adds optional full-stack capability (auth provider, storage, AI features, deployment). Minimum required files:

```
templates/plugins/{name}/
  README.md                  What it does and wiring instructions
  plugin.manifest.json       Machine-readable copy/dep/patch/export contract
  env.patch.md               Env vars to append
  server/                    Fastify handler, service, Fastify plugin if needed
  sdk/hooks/                 React Query hook
  web/components/            Frontend component
  openapi.patch.yaml         Route additions (staged to docs/pending-patches/, not auto-merged)
  schema.patch.md            Prisma model additions (staged, not auto-merged)
```

Then add the plugin to the catalog in `references/plugin-catalog.md` and the inventory tables in `SKILL_ARCHITECTURE.md`.

### Add a frontend pack

A frontend pack adds optional UI assets (theme tokens, component packs, page templates, mock content). Minimum required files:

```
templates/frontend-packs/{category}/{name}/
  manifest.yaml              Human/agent context: what it is, what it copies, requirements
  pack.manifest.json         Machine-readable copy/dep/export contract
  *.tsx / *.css / *.ts       The actual assets
```

Categories: `themes/`, `components/`, `pages/`, `mock-content/`, `designers/`.

Then add it to `references/frontend-pack-catalog.md` and the inventory tables in `SKILL_ARCHITECTURE.md`.

### Add a reference file

Reference files are loaded on demand — the skill doesn't preload them. If you add one:

1. Write it in `references/` following the existing style (phase-scoped, convention-focused)
2. Add a row to the **Dynamic Context Loading** table in `SKILL.md` naming the trigger and the file
3. Add a row to the **Reference Loading Map** in `SKILL_ARCHITECTURE.md`
4. Update the file count in `SKILL_ARCHITECTURE.md`

### Modify an existing reference file

Reference files are the skill's policy layer. Changes here propagate to every project built after the change — be precise. For conventions (naming, response shapes, error codes), edit the relevant reference directly. For phase gates, edit the gate checklist in `SKILL.md` to match.

---

## Verifying your changes

A smoke fixture builds a complete reference social-feed app from the canonical templates and runs the full verification chain:

```bash
node scripts/smoke-reference-app.mjs
```

Verifies: `pnpm install` → `db:push` → `sdk:generate` → `sdk:check` → `test:generate` → `pages:generate` → typecheck → server boot → web boot → Vitest → seed → Playwright.

Run this after any change to `templates/` before committing. The fixture uses SQLite so it's self-contained with no external DB required.

To debug with a stable output path:

```bash
FACTORY_SMOKE_DIR=/tmp/nick-webapp-factory/reference-social-feed node scripts/smoke-reference-app.mjs
```

---

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

Each phase has a concrete gate checklist in `SKILL.md`. No phase starts until its predecessor's gate passes.

---

## Plugins

| Plugin | What it adds |
|---|---|
| `file-upload` | Drag-and-drop uploads, type/size validation, static serving, swappable storage provider |
| `cloudflare-r2` | R2 storage provider swap for `file-upload` (requires `file-upload`) |
| `google-auth` | Google Sign-In via ID token flow |
| `ai-chat` | Streaming Anthropic chatbot — SSE handler + `ChatWidget` |
| `ai-image-gen` | Text-to-image with media history (requires `file-upload`) |
| `ai-video-gen` | Async text-to-video with polling and history (requires `file-upload`) |
| `railway` | Fastify + MySQL deployment — Dockerfile + `railway.json` |
| `vercel` | Vite frontend deployment — `vercel.json` + SPA rewrite |

---

## Frontend packs

| Pack | Type | What it adds |
|---|---|---|
| `quality-designer` | Design workflow | Style brief, style matrix, anti-defaults, screenshot gate, visual QA |
| `admin-ops` | Theme | Restrained ops/dashboard CSS token set |
| `creator-social` | Theme | Warm creator/community CSS token set |
| `data-table` | Component | Sortable table with search and load-more |
| `activity-feed` | Component | Feed item list and composer |
| `smart-media` | Component | Lazy image/video with shimmer and intrinsic size capture |
| `slideshow` | Component | Hero slider and thumbnail gallery browser (Embla) |
| `animation` | Component | Framer Motion primitives — FadeIn, SlideUp, StaggerList, PageTransition |
| `charts` | Component | Recharts charts wired to CSS token colors — Line, Bar, Area, Pie |
| `feed` | Page | Composed feed page using SDK feed hooks |
| `dashboard` | Page | Compact dashboard scaffold |
| `creator-social` | Mock content | Creator profiles and post fixtures for dev/seed |

---

## File map

```
SKILL.md                    Activation contract, phase order, phase gates, lazy-load map
SKILL_ARCHITECTURE.md       Contributor reference — layer model, full template inventory
references/                 Phase-specific guides (loaded on demand, not preloaded)
templates/
  monorepo-base.md          Package.json templates, workspace config, tsconfig placement
  components/               UI primitives (Button, Input, Card, Avatar, Form, Skeleton…)
  configs/                  Tailwind, PostCSS, tsconfig, Playwright configs
  layouts/                  App shell with mobile bottom nav + desktop sidebar
  lib/                      cn() utility, theme toggle helpers
  server/                   Fastify index, security plugin, auth handler/service, pagination
  sdk/                      openapi-fetch client, generate script, auth hooks
  web/                      main.tsx, AuthGuard, queryClient, Vite config, Playwright smoke
  db/                       Prisma seed script template
  github/                   CI workflow, Dependabot config, PR template
  scripts/                  bootstrap, factory-add, sdk drift check, test/page/doc generators
  plugins/                  One folder per plugin (server + sdk + web + manifests)
  frontend-packs/           themes/, components/, pages/, mock-content/, designers/
fixtures/
  reference-social-feed/    Smoke fixture — minimal verified MVP for copy-safety testing
scripts/
  smoke-reference-app.mjs   Builds the fixture and runs the full verification chain
```
