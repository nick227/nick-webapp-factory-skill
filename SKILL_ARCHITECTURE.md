# Nick Web App Factory Skill Architecture

This document maps the architecture of the `nick-webapp-factory` skill itself: how the skill is organized, how its references and templates work together, and what inventory is available for generated web application work.

The skill currently contains:

- 1 root skill definition: `SKILL.md`
- 17 reference documents in `references/`
- 195 files across `references/` and `templates/`
- 8 installable plugins
- 12 frontend packs
- 8 root automation scripts

## Architectural Model

The skill is a copy-first web app factory. Its core rule is that an agent should prefer existing templates and phase-specific references over inventing equivalent code from scratch.

At a high level, the skill has four layers:

| Layer | Location | Purpose |
|---|---|---|
| Orchestration | `SKILL.md` | Defines when the skill activates, the default stack, the phase order, gates, architecture rules, catalogs, and continuation protocol. |
| Knowledge base | `references/` | Phase-specific implementation guidance, conventions, QA gates, plugin contracts, and template registry documentation. |
| Implementation library | `templates/` | Canonical files copied into generated apps: configs, components, server files, SDK files, scripts, plugins, frontend packs, CI, and deployment assets. |
| Install automation | `templates/scripts/factory-add.ts` plus manifests | Copies plugin and frontend-pack files into target apps, appends env vars, stages schema/OpenAPI patches, and reports manual follow-up. |

The generated app architecture enforced by this skill is:

```text
OpenAPI spec
  -> generated SDK types
  -> typed API client
  -> React Query SDK hooks
  -> web pages

OpenAPI spec
  -> fastify-openapi-glue
  -> operationId handlers
  -> services
  -> Prisma
```

The factory skill itself mirrors that discipline: `SKILL.md` is the control plane, references define the rules, templates provide the working implementations, and manifests describe what automation can safely copy.

## Root Skill Definition

`SKILL.md` is the activation and execution contract.

It defines:

- Trigger scope: web apps, websites, scaffolding, continuation prompts, social apps, auth, feeds, profiles, follows, media, and similar MVP work.
- Default stack: PNPM workspaces, Vite React, Fastify, Prisma with MySQL, OpenAPI 3.1, generated SDK, React Query, Vitest, Playwright.
- OpenAPI-to-SDK pipeline: the spec is the single source of truth for routes and generated types.
- Seven generation phases:
  - Phase 0: Discovery
  - Phase 1: Contract
  - Phase 2: Server
  - Phase 3: Frontend Shell
  - Phase 4: Feature Pages
  - Phase 5: Polish
  - Phase 6: Documentation
- Phase gates: concrete validation checks before moving on.
- Architecture rules: no manual Fastify routes, no hand-written generated types, no raw frontend fetch, SDK hooks outside `apps/web`, generated docs where possible.
- Catalogs for plugins and frontend packs.
- Reference loading map: which files in `references/` to load for each phase or concern.
- Continuation protocol: read `CLAUDE.md`, resume the next incomplete phase, and keep building.

`SKILL.md` is intentionally dense. It is the root routing table for agent behavior, while detailed implementation guidance lives in reference files.

## Reference Inventory

Reference files are loaded on demand, not all at once. They are the skill's policy and pattern library.

| File | Lines | Role |
|---|---:|---|
| `references/discovery.md` | 177 | Phase 0 discovery questions, MVP definition format, approval gate, and scope discipline. |
| `references/openapi-conventions.md` | 287 | Phase 1 OpenAPI skeleton, schema conventions, auth/security conventions, operationId expectations, and response envelope rules. |
| `references/prisma-patterns.md` | 148 | Phase 1 Prisma model conventions, social schema defaults, relation naming, soft delete patterns, and seed expectations. |
| `references/sdk-patterns.md` | 378 | Phase 1 and Phase 4 SDK structure, generated types, `openapi-fetch`, React Query hook patterns, and drift checking. |
| `references/list-query-conventions.md` | 161 | Cursor pagination, list/search query parameters, envelopes, filters, sorting, and infinite query behavior. |
| `references/fastify-patterns.md` | 196 | Phase 2 Fastify setup, `fastify-openapi-glue`, handler/service split, security handlers, and no manual route registration. |
| `references/testing-patterns.md` | 341 | Phase 2 server integration tests, generated stubs, test helpers, Ajv response validation, Playwright smoke tests. |
| `references/frontend-design.md` | 276 | Phase 3 design system: mobile-first layout, tokens, primitives, Tailwind conventions, interaction states, and UI constraints. |
| `references/react-patterns.md` | 317 | Phase 4 page/component conventions, SDK hook usage, form patterns, loading/empty/error states, and component boundaries. |
| `references/social-modules.md` | 138 | Reusable social app modules: auth, profile, follows, posts/feed, comments, reactions, notifications, media, search, settings. |
| `references/documentation-phase.md` | 597 | Phase 6 generated docs, narrative docs, admin docs, deployment docs, and documentation checklists. |
| `references/session-close.md` | 205 | Phase 5 closeout protocol: tests, app startup, seed credentials, browser checklist, and developer confirmation. |
| `references/registry.md` | 363 | Human-readable index of canonical templates and why templates should be copied verbatim. |
| `references/plugin-guide.md` | 99 | Plugin interface, plugin catalog, installation flow, required files, patch handling, and new plugin creation rules. |
| `references/frontend-pack-guide.md` | 23 | Frontend pack installation flow and constraints. |
| `references/quality-designer.md` | 119 | Design-heavy workflow for visual direction, style selection, asset planning, and critique. |
| `references/visual-qa.md` | 26 | Visual QA gate for screenshot review and design polish. |

### Reference Loading Map

| Situation | Reference Set |
|---|---|
| New project discovery | `discovery.md` |
| Contract/schema/spec work | `openapi-conventions.md`, `prisma-patterns.md`, `sdk-patterns.md` |
| Lists, feeds, or search | `list-query-conventions.md` |
| Server implementation | `fastify-patterns.md`, `testing-patterns.md` |
| Frontend shell | `frontend-design.md` |
| Feature pages | `react-patterns.md`, `frontend-design.md`, `social-modules.md` |
| Polish and closeout | `frontend-design.md`, `react-patterns.md`, `session-close.md` |
| Documentation | `documentation-phase.md` |
| Plugin install or authoring | `plugin-guide.md`, plugin README, plugin manifest |
| Frontend pack install | `frontend-pack-guide.md`, pack YAML manifest, pack JSON manifest |
| Design-heavy work | `quality-designer.md`, `visual-qa.md` |
| Template lookup | `registry.md` |

## Template System

Templates are the canonical implementation layer. The factory expects files to be copied into the generated project and adapted only where the app's domain requires it.

The root `templates/` inventory:

| Directory | Files | Purpose |
|---|---:|---|
| `templates/components/` | 11 | Core UI primitives and voice input helpers. |
| `templates/configs/` | 7 | Tailwind, PostCSS, CSS tokens, TypeScript configs, Playwright config. |
| `templates/db/` | 1 | Seed script template. |
| `templates/frontend-packs/` | 60 | Optional design workflows, themes, components, pages, and mock content. |
| `templates/github/` | 3 | CI, Dependabot, and pull request template. |
| `templates/layouts/` | 1 | App shell layout. |
| `templates/lib/` | 2 | Shared frontend utilities. |
| `templates/plugins/` | 66 | Optional full-stack and deployment plugins. |
| `templates/scripts/` | 8 | App generation, drift checking, docs, page/test generation, plugin/pack installation, Figma sync. |
| `templates/sdk/` | 5 | Typed SDK client, generation script, auth hooks, barrels. |
| `templates/server/` | 7 | Fastify server core, auth handler/service, security, pagination, test helpers. |
| `templates/web/` | 6 | Vite entry, Vite env types, query client, auth guard, config, Playwright smoke test. |
| `templates/monorepo-base.md` | 1 | Package JSON and workspace scaffolding snippets. |

## Core Template Inventory

### Workspace and Packages

`templates/monorepo-base.md` contains copyable scaffolding for:

- `pnpm-workspace.yaml`
- Root `package.json`
- Root scripts
- `packages/api-spec/package.json`
- `packages/sdk/package.json`
- `apps/server/package.json`
- `apps/web/package.json`
- `packages/db/package.json`
- `packages/shared/package.json`
- TS config placement
- Env examples and README structure

It is the package scaffold reference for Phase 1 and can be consulted at any phase.

### Configs

| File | Purpose |
|---|---|
| `templates/configs/tailwind.config.ts` | Tailwind token mapping, dark mode, app path globs. |
| `templates/configs/postcss.config.cjs` | PostCSS plugins for Tailwind and Autoprefixer. |
| `templates/configs/index.css` | Base light/dark CSS variables and Tailwind layers. |
| `templates/configs/tsconfig.base.json` | Shared strict TypeScript settings. |
| `templates/configs/tsconfig.app.json` | React/Vite app TypeScript config. |
| `templates/configs/tsconfig.server.json` | Server TypeScript config. |
| `templates/configs/playwright.config.ts` | Playwright e2e configuration. |

### Core UI Components

| File | Purpose |
|---|---|
| `templates/components/Button.tsx` | CVA-based button variants, sizes, loading state. |
| `templates/components/Input.tsx` | Tokenized input with optional voice support. |
| `templates/components/Textarea.tsx` | Tokenized textarea with optional voice support. |
| `templates/components/Form.tsx` | Declarative form builder with `FieldConfig[]` and Zod integration. |
| `templates/components/Card.tsx` | Card primitives. |
| `templates/components/Avatar.tsx` | Image avatar with initials fallback. |
| `templates/components/EmptyState.tsx` | Icon, title, description, optional action. |
| `templates/components/Skeleton.tsx` | Loading skeleton. |
| `templates/components/Spinner.tsx` | Spinner and page spinner. |
| `templates/components/voice/VoiceButton.tsx` | Mic toggle UI. |
| `templates/components/voice/useSpeechRecognition.ts` | Shared Web Speech API hook. |

### Layout, Web, and Lib

| File | Purpose |
|---|---|
| `templates/layouts/Shell.tsx` | Responsive shell with mobile bottom nav and desktop sidebar. |
| `templates/web/main.tsx` | React entry with API client, QueryClient provider, router, and toaster. |
| `templates/web/vite-env.d.ts` | Vite client type declarations for `import.meta.env`. |
| `templates/web/queryClient.ts` | QueryClient singleton defaults. |
| `templates/web/AuthGuard.tsx` | Auth redirect wrapper. |
| `templates/web/vite.config.ts` | Vite alias config. |
| `templates/web/e2e/smoke.spec.ts` | Playwright smoke test with adaptation markers. |
| `templates/lib/utils.ts` | `cn()` helper with `clsx` and `tailwind-merge`. |
| `templates/lib/theme.ts` | Theme initialization and toggle helpers. |

### SDK

| File | Purpose |
|---|---|
| `templates/sdk/client.ts` | Typed `openapi-fetch` client setup, cookie-first auth behavior. |
| `templates/sdk/generate.ts` | Runs `openapi-typescript` against the API spec. |
| `templates/sdk/index.ts` | SDK barrel. |
| `templates/sdk/hooks/useAuth.ts` | Auth hooks for current user, login, register, logout. |
| `templates/sdk/hooks/index.ts` | Hook barrel for auth and later domain hooks. |

### Server

| File | Purpose |
|---|---|
| `templates/server/index.ts` | Fastify setup with cookies, CORS, Swagger, error handling, OpenAPI glue, and health check. |
| `templates/server/security.ts` | `bearerAuth` and `adminAuth` security handlers. |
| `templates/server/pagination.ts` | Opaque cursor helpers and limit normalization. |
| `templates/server/handlers/auth.ts` | Auth operation handlers. |
| `templates/server/services/AuthService.ts` | Register/login/logout/current-user logic. |
| `templates/server/test-helpers/index.ts` | Integration test app builder, auth helpers, response validation helpers. |
| `templates/server/test-helpers/setup.ts` | Test teardown scaffold. |

### Scripts

| File | Purpose |
|---|---|
| `templates/scripts/bootstrap.ts` | First-run project bootstrap: install, db push, SDK generation, page generation, seed. |
| `templates/scripts/factory-add.ts` | Plugin/frontend-pack installer. |
| `templates/scripts/check-sdk-drift.ts` | CI guard that regenerated OpenAPI types match committed SDK types. |
| `templates/scripts/generate-tests.ts` | Spec-driven server test stub generator. |
| `templates/scripts/generate-docs.ts` | Generates API, env, and database docs. |
| `templates/scripts/generate-pages.ts` | Spec-driven page stub and route generator. |
| `templates/scripts/figma-sync.ts` | Optional Figma style-to-token adapter. |
| `templates/scripts/figma.config.example.json` | Figma style mapping example. |

### GitHub and Database

| File | Purpose |
|---|---|
| `templates/github/workflows/ci.yml` | CI for lint, typecheck, SDK drift, tests, and MySQL service. |
| `templates/github/dependabot.yml` | Dependabot config. |
| `templates/github/pull_request_template.md` | Pull request template. |
| `templates/db/seed.ts` | Demo user seed script, intended to be adapted to app domain models. |

## Install Automation Contracts

The factory has two manifest families:

| Manifest | Audience | Purpose |
|---|---|---|
| `manifest.yaml` | Agents and humans | Compact context: what a frontend pack is, what it copies, what it requires, and how it should be used. |
| `pack.manifest.json` | Installer script | Machine-readable frontend-pack copy/dependency/export/manual-follow-up contract. |
| `plugin.manifest.json` | Installer script | Machine-readable plugin copy/dependency/patch/export/manual-follow-up contract. |

`templates/scripts/factory-add.ts` supports:

- `pnpm factory:add plugin {name}`
- `pnpm factory:add frontend-pack {name-or-path}`
- `--target` for a target app directory
- `--templates` or `NICK_WEBAPP_FACTORY_ROOT` for locating this skill

Installer behavior:

1. Find the plugin or frontend-pack manifest.
2. Copy files listed in `copy`.
3. Append env patch content to existing `.env.example` and `.env`, with a marker.
4. Copy schema and OpenAPI patches to `docs/pending-patches/{namespace}/`.
5. Print package dependencies to install.
6. Print barrel exports to add.
7. Print manual follow-up instructions.

Important limitation: schema and OpenAPI patches are staged for manual merge. The installer does not mutate Prisma schema or OpenAPI YAML directly.

## Frontend Pack Inventory

Frontend packs are optional UI and design assets. They do not add backend routes and must not introduce raw frontend fetch calls.

### Registry

`templates/frontend-packs/registry.yaml` is the high-level catalog.

It groups packs into:

- `designers`
- `themes`
- `components`
- `pages`
- `mockContent`

### Design Workflow

| Pack | Type | Files | Purpose |
|---|---|---:|---|
| `quality-designer` | `design-workflow` | 9 | Copies design planning docs and provides style matrix, anti-defaults, screenshot gate, and visual QA workflow. |

Key files:

- `design-brief.md`
- `visual-system.md`
- `asset-plan.md`
- `design-critique.md`
- `style-matrix.yaml`
- `anti-defaults.md`
- `screenshot-gate.md`

### Themes

| Pack | Type | Purpose | Output |
|---|---|---|---|
| `admin-ops` | `theme` | Restrained operations/dashboard token set. | `apps/web/src/styles/admin-ops.tokens.css` |
| `creator-social` | `theme` | Warm creator/community token set. | `apps/web/src/styles/creator-social.tokens.css` |

Themes copy CSS token overrides and require a manual import after `index.css`.

### Component Packs

| Pack | Type | Dependencies | Purpose |
|---|---|---|---|
| `activity-feed` | `component-pack` | Core `Avatar`, `Button`, `Card`, `Textarea` | Activity feed and composer components. |
| `data-table` | `component-pack` | Core `Button`, `Input` | Generic table shell with search and load-more controls. |
| `smart-media` | `component-pack` | Core `Skeleton` | Lazy image/video wrappers with shimmer and intrinsic size capture. |
| `slideshow` | `component-pack` | `embla-carousel-react`, `embla-carousel-autoplay` | Hero slider and gallery browser. |
| `animation` | `component-pack` | `framer-motion` | Motion primitives: `FadeIn`, `SlideUp`, `StaggerList`, `PageTransition`. |
| `charts` | `component-pack` | `recharts` | Token-aware Line, Bar, Area, and Pie charts. |

### Page Packs

| Pack | Replaces | Requires | Purpose |
|---|---|---|---|
| `feed` | `FeedPage` | `activity-feed`, `useFeed`, `useCreatePost` | Composed feed page using SDK hooks and activity components. |
| `dashboard` | `DashboardPage` | Core `Card` | Compact dashboard scaffold. |

### Mock Content

| Pack | Output | Purpose |
|---|---|---|
| `creator-social` | `apps/web/src/mock/creatorSocial.ts` | Creator profiles and post fixtures for previews, demos, or seeds. |

## Plugin Inventory

Plugins are optional full-stack or deployment add-ons. They can copy backend, SDK, frontend, patch, and deployment files.

### Plugin Summary

| Plugin | Type | Requires | Adds |
|---|---|---|---|
| `file-upload` | `plugin` | None | Local upload provider, media service, OpenAPI/schema patches, upload hook, `FileUpload` component. |
| `cloudflare-r2` | `plugin` | `file-upload` | R2 storage provider swap and env vars. |
| `google-auth` | `plugin` | None | Google Sign-In ID token flow, schema/OpenAPI patches, hook, button component. |
| `ai-chat` | `plugin` | None | Streaming Anthropic chatbot, SSE handler, hook, `ChatWidget`. |
| `ai-image-gen` | `plugin` | `file-upload` | Text-to-image providers, media history, schema/OpenAPI patches, hook, widget. |
| `ai-video-gen` | `plugin` | `file-upload` | Text-to-video via Kling, async polling, schema/OpenAPI patches, hook, widget. |
| `railway` | `deploy-plugin` | None | Railway deployment files for Fastify server and MySQL. |
| `vercel` | `deploy-plugin` | None | Vercel deployment config for Vite frontend. |

### Plugin File Shapes

Most feature plugins follow this pattern:

```text
templates/plugins/{name}/
  README.md
  plugin.manifest.json
  env.patch.md
  schema.patch.md
  openapi.patch.yaml
  server/
  sdk/
  web/
```

Provider and deployment plugins are smaller:

- `cloudflare-r2` ships only a provider class and env patch.
- `railway` ships `Dockerfile`, `railway.json`, README, env patch, and manifest.
- `vercel` ships `vercel.json`, README, env patch, and manifest.

### Plugin Details

| Plugin | Key copied files | Patches | Dependencies |
|---|---|---|---|
| `file-upload` | Storage interfaces/providers, media service/handler, upload Fastify plugin, `useUpload`, `FileUpload` | Env, schema, OpenAPI | `@fastify/multipart`, `@fastify/static`, `fastify-plugin` |
| `cloudflare-r2` | `R2StorageProvider.ts` | Env | `@aws-sdk/client-s3` |
| `google-auth` | Google auth handler/service, `useGoogleAuth`, `GoogleLoginButton` | Env, schema, OpenAPI | `google-auth-library` |
| `ai-chat` | Chat handler/service, `useChat`, `ChatWidget` | Env, OpenAPI | `@anthropic-ai/sdk` |
| `ai-image-gen` | Image provider interface, Dezgo/OpenAI/local providers, service/handler, `useImageGen`, widget | Env, schema, OpenAPI | Optional `openai` |
| `ai-video-gen` | Video provider interface, Kling provider, service/handler, `useVideoGen`, widget | Env, schema, OpenAPI | Native fetch |
| `railway` | `Dockerfile`, `railway.json` | Env | None declared |
| `vercel` | `vercel.json` | Env | None declared |

### Plugin Dependency Topology

```text
file-upload
  -> cloudflare-r2
  -> ai-image-gen
  -> ai-video-gen

google-auth
ai-chat
railway
vercel
```

Media generation plugins depend on `file-upload` because generated assets are stored through the storage provider abstraction. `cloudflare-r2` is a provider swap for the same abstraction.

## Phase-To-Template Map

| Phase | Primary templates |
|---|---|
| Phase 1: Contract | `templates/monorepo-base.md`, `templates/scripts/*`, `templates/github/*`, `templates/sdk/*` |
| Phase 2: Server | `templates/server/index.ts`, `templates/server/security.ts`, `templates/server/pagination.ts`, `templates/server/handlers/auth.ts`, `templates/server/services/AuthService.ts`, `templates/server/test-helpers/*` |
| Phase 3: Frontend Shell | `templates/configs/*`, `templates/lib/*`, `templates/components/*`, `templates/layouts/Shell.tsx`, `templates/web/*` |
| Phase 4: Feature Pages | `templates/frontend-packs/**`, SDK hook patterns from `references/sdk-patterns.md`, React patterns from `references/react-patterns.md` |
| Phase 5: Polish | `templates/db/seed.ts`, `templates/web/e2e/smoke.spec.ts`, `references/session-close.md` |
| Phase 6: Documentation | `templates/scripts/generate-docs.ts`, narrative doc templates inside `references/documentation-phase.md` |
| Plugin work | `templates/plugins/{name}/**`, `templates/scripts/factory-add.ts` |
| Design-heavy work | `templates/frontend-packs/designers/quality-designer/**`, theme packs, visual QA references |

## Generated App Contract

The skill is opinionated about generated app boundaries:

- `packages/api-spec/openapi.yaml` owns the API contract.
- `packages/sdk/src/generated/types.ts` is generated and never hand-edited.
- `packages/sdk/src/client.ts` exposes typed `GET`, `POST`, `PATCH`, and `DELETE`.
- `packages/sdk/src/hooks/` owns data hooks.
- `apps/web` imports hooks from `@project/sdk`.
- `apps/web/src/components/` contains prop-driven UI components.
- `apps/server` uses `fastify-openapi-glue` and operationId-named handlers.
- `apps/server/src/services/` owns business logic and database access.
- `packages/db/prisma/schema.prisma` owns database structure.
- Scripts generate docs, tests, pages, and SDK types from source artifacts.

This contract is enforced culturally by the skill instructions and mechanically by generated scripts such as `check-sdk-drift.ts`, `generate-tests.ts`, `generate-pages.ts`, and CI.

## Factory Smoke Fixture

The permanent copy-safety fixture lives in `fixtures/reference-social-feed/`.

It provides:

- `MVP.md`: approved MVP definition for a tiny social feed.
- `overlay/`: domain-specific files layered over copied factory templates.
- `README.md`: command and host setup notes.

Run it with:

```bash
node scripts/smoke-reference-app.mjs
```

The script builds a fresh app outside the skill repository, copies the canonical templates, overlays the fixture implementation, and verifies install, Prisma push, SDK generation, SDK drift check, test generation, page generation, typecheck, server boot, web boot, Vitest, seed, and Playwright.

## Extension Points

New capabilities usually belong in one of three places:

| Need | Add To | Notes |
|---|---|---|
| Reusable project convention | `references/` | Keep phase-specific and load on demand. |
| Canonical reusable file | `templates/` | Prefer copyable, working source over prose instructions. |
| Optional feature bundle | `templates/plugins/{name}/` | Include README, manifest, env patch, and only the files the feature needs. |
| Optional frontend asset | `templates/frontend-packs/{category}/{name}/` | Include YAML context manifest plus JSON installer manifest. |
| Automation | `templates/scripts/` | Scripts should be copied into generated apps and run there. |

## Maintenance Notes

- Keep `SKILL.md` catalogs synchronized with the actual `templates/plugins/` and `templates/frontend-packs/` directories.
- Keep `references/registry.md` synchronized with new or renamed templates.
- When adding a frontend pack, provide both `manifest.yaml` and `pack.manifest.json`.
- When adding a plugin, provide `plugin.manifest.json` and a README at minimum.
- Keep installer manifests explicit: copy targets, dependencies, exports, patches, and manual follow-up should all be declared.
- Prefer pending patch files for structured artifacts that are risky to merge automatically, especially Prisma and OpenAPI.
- Keep generated-app scripts copy-safe; they should assume they run in the target project, not inside the skill repository.
- Avoid adding specialized frontend dependencies to the core scaffold. Put them in frontend packs or plugins.

## Quick Inventory Checklist

Use this checklist when auditing the skill:

- `SKILL.md` phase gates still match the available templates.
- Every reference file listed in `SKILL.md` exists.
- Every plugin listed in `SKILL.md` has a directory, README, and `plugin.manifest.json`.
- Every frontend pack listed in `SKILL.md` has `manifest.yaml` and `pack.manifest.json`.
- `templates/frontend-packs/registry.yaml` agrees with the actual pack directories.
- `templates/scripts/factory-add.ts` supports the current manifest schema.
- `references/registry.md` includes new core templates.
- CI, Playwright, SDK drift, page generation, docs generation, and test generation templates remain coherent with the default stack.
