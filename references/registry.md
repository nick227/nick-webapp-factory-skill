# Templates Index

The skill ships actual working template files in its `templates/` directory. **Copy these verbatim into the project rather than generating equivalent code from scratch.** They represent the canonical, tested implementation of each pattern. Only deviate when the project explicitly requires different behavior.

---

## Why Templates Beat Generation

- **Zero variance** — the same component looks identical across every project
- **No transcription errors** — Claude reads the file and copies it; it doesn't re-derive the implementation
- **Token-efficient** — a targeted `Read` on a template file is cheaper than reasoning about what a component should contain
- **Battle-tested** — changes flow from the template into all future projects automatically

---

## Templates Directory

```
templates/
  configs/
    tailwind.config.ts         ← CSS variable token mapping, darkMode: 'class'
    postcss.config.cjs         ← Tailwind + Autoprefixer PostCSS plugins
    index.css                  ← Design token CSS variables (light + dark)
    tsconfig.base.json         ← Strict TypeScript base (all packages extend this)
    tsconfig.app.json          ← App (Vite/React) — extends base, adds jsx + paths
    tsconfig.server.json       ← Server (Fastify) — extends base, CommonJS
  lib/
    utils.ts                   ← cn() helper (clsx + tailwind-merge)
    theme.ts                   ← Dark mode toggle + init script (run before React mounts)
  components/
    Button.tsx                 ← cva-based, 5 variants, 4 sizes, loading state
    Input.tsx                  ← Voice-enabled text input (Web Speech API)
    Textarea.tsx               ← Voice-enabled textarea (continuous recognition)
    voice/
      useSpeechRecognition.ts  ← shared Web Speech API hook
      VoiceButton.tsx          ← mic toggle button
    Card.tsx                   ← Card + CardHeader + CardContent + CardFooter
    Avatar.tsx                 ← Image with initials fallback, 3 sizes
    EmptyState.tsx             ← Icon + title + description + optional action
    Skeleton.tsx               ← Pulse skeleton for content loading
    Spinner.tsx                ← Spinner + PageSpinner
    Form.tsx                   ← Declarative form: FieldConfig[] + zod schema
  layouts/
    Shell.tsx                  ← Mobile bottom nav + desktop sidebar (uses <Outlet />)
  sdk/
    client.ts                  ← Typed openapi-fetch client, cookie-first auth
    index.ts                   ← Barrel: client + hooks + generated types
    generate.ts                ← Runs openapi-typescript → src/generated/types.ts
    hooks/
      useAuth.ts               ← useCurrentUser, useLogin, useRegister, useLogout
      index.ts                 ← Barrel (add domain hook exports here)
  web/
    vite.config.ts             ← @/ path alias wired
    vite-env.d.ts              ← Vite client types for import.meta.env
    main.tsx                   ← App entry: QueryClientProvider + createApiClient + Toaster
    queryClient.ts             ← QueryClient singleton with sensible defaults
    AuthGuard.tsx              ← useCurrentUser → redirect to /login if unauthenticated
  server/
    index.ts                   ← Fastify setup: cookie, swagger, error handler, glue
    security.ts                ← bearerAuth + adminAuth security handlers
    pagination.ts              ← opaque cursor helpers + limit normalization
    handlers/
      auth.ts                  ← register, login, logout, getCurrentUser
    services/
      AuthService.ts           ← bcrypt register/login, session creation
    test-helpers/
      index.ts                 ← buildTestApp, asAuth, validateResponse, testUserId
      setup.ts                 ← afterEach DB teardown (adapt model list to project)
  db/
    seed.ts                    ← Demo users with bcrypt hash; adapt for domain data
  scripts/
    bootstrap.ts               ← First-run: install → db:push → sdk:generate → pages:generate → seed
    factory-add.ts             ← Installs plugins/frontend packs from manifests; copies files and reports manual merges
    check-sdk-drift.ts         ← Fails CI if committed types.ts drifted from spec
    generate-tests.ts          ← Emits one test file per tag, one describe per operationId
    generate-docs.ts           ← Generates api-reference.md, env-vars.md, database.md
    generate-pages.ts          ← Emits page stubs + App.tsx from spec (re-run safe)
    figma-sync.ts              ← Optional design source adapter: Figma FILL styles → docs/visual-system.md token values
    figma.config.example.json  ← Optional; copy → figma.config.json; map Figma style names to CSS vars
  github/
    workflows/
      ci.yml                   ← GitHub Actions: lint + typecheck + sdk:check + test (MySQL service)
    pull_request_template.md   ← PR template: What / Why / Test plan
    dependabot.yml             ← Weekly grouped npm updates
  monorepo-base.md             ← package.json templates for all packages + README, CLAUDE.md
```

---

## Phase → Template Mapping

### Phase 1 — Contract

| File to create | Copy from | Notes |
|---|---|---|
| `.github/workflows/ci.yml` | `templates/github/workflows/ci.yml` | No changes needed |
| `.github/pull_request_template.md` | `templates/github/pull_request_template.md` | No changes needed |
| `.github/dependabot.yml` | `templates/github/dependabot.yml` | No changes needed |
| `packages/db/tsconfig.json` | `templates/configs/tsconfig.server.json` | Adapt paths |
| `packages/db/prisma/seed.ts` | `templates/db/seed.ts` | Adapt to project models |
| `packages/api-spec/package.json` | `templates/monorepo-base.md` → api-spec section | |
| `packages/sdk/package.json` | `templates/monorepo-base.md` → sdk section | |
| `packages/sdk/tsconfig.json` | `templates/configs/tsconfig.server.json` | Adapt paths |
| `packages/sdk/src/client.ts` | `templates/sdk/client.ts` | No changes needed |
| `packages/sdk/src/index.ts` | `templates/sdk/index.ts` | No changes needed |
| `packages/sdk/src/hooks/useAuth.ts` | `templates/sdk/hooks/useAuth.ts` | No changes needed |
| `packages/sdk/src/hooks/index.ts` | `templates/sdk/hooks/index.ts` | Add domain hook exports |
| `packages/sdk/scripts/generate.ts` | `templates/sdk/generate.ts` | No changes needed |
| `scripts/bootstrap.ts` | `templates/scripts/bootstrap.ts` | No changes needed |
| `scripts/check-sdk-drift.ts` | `templates/scripts/check-sdk-drift.ts` | No changes needed |
| `scripts/generate-tests.ts` | `templates/scripts/generate-tests.ts` | No changes needed |
| `scripts/generate-docs.ts` | `templates/scripts/generate-docs.ts` | No changes needed |
| `scripts/generate-pages.ts` | `templates/scripts/generate-pages.ts` | No changes needed |

### Phase 2 — Server

| File to create | Copy from | Notes |
|---|---|---|
| `apps/server/package.json` | `templates/monorepo-base.md` → server section | |
| `apps/server/tsconfig.json` | `templates/configs/tsconfig.server.json` | No changes needed |
| `apps/server/src/index.ts` | `templates/server/index.ts` | No changes needed |
| `apps/server/src/plugins/security.ts` | `templates/server/security.ts` | No changes needed |
| `apps/server/src/lib/pagination.ts` | `templates/server/pagination.ts` | No changes needed |
| `apps/server/src/handlers/auth.ts` | `templates/server/handlers/auth.ts` | No changes needed |
| `apps/server/src/services/AuthService.ts` | `templates/server/services/AuthService.ts` | No changes needed |
| `apps/server/src/__tests__/helpers/index.ts` | `templates/server/test-helpers/index.ts` | No changes needed |
| `apps/server/src/__tests__/helpers/setup.ts` | `templates/server/test-helpers/setup.ts` | Adapt model list to project schema |

### Phase 3 — Frontend Shell

All of these are direct copies with minimal adaptation (nav items, route names).

| File to create | Copy from | Notes |
|---|---|---|
| `apps/web/tailwind.config.ts` | `templates/configs/tailwind.config.ts` | No changes needed |
| `apps/web/postcss.config.cjs` | `templates/configs/postcss.config.cjs` | No changes needed |
| `apps/web/src/index.css` | `templates/configs/index.css` | No changes needed |
| `apps/web/tsconfig.json` | `templates/configs/tsconfig.app.json` | No changes needed |
| `apps/web/src/lib/utils.ts` | `templates/lib/utils.ts` | No changes needed |
| `apps/web/src/lib/theme.ts` | `templates/lib/theme.ts` | No changes needed |
| `apps/web/src/components/ui/Button.tsx` | `templates/components/Button.tsx` | No changes needed |
| `apps/web/src/components/ui/Input.tsx` | `templates/components/Input.tsx` | No changes needed |
| `apps/web/src/components/ui/Textarea.tsx` | `templates/components/Textarea.tsx` | No changes needed |
| `apps/web/src/components/ui/voice/useSpeechRecognition.ts` | `templates/components/voice/useSpeechRecognition.ts` | No changes needed |
| `apps/web/src/components/ui/voice/VoiceButton.tsx` | `templates/components/voice/VoiceButton.tsx` | No changes needed |
| `apps/web/src/components/ui/Card.tsx` | `templates/components/Card.tsx` | No changes needed |
| `apps/web/src/components/ui/Avatar.tsx` | `templates/components/Avatar.tsx` | No changes needed |
| `apps/web/src/components/ui/EmptyState.tsx` | `templates/components/EmptyState.tsx` | No changes needed |
| `apps/web/src/components/ui/Skeleton.tsx` | `templates/components/Skeleton.tsx` | No changes needed |
| `apps/web/src/components/ui/Spinner.tsx` | `templates/components/Spinner.tsx` | No changes needed |
| `apps/web/src/components/ui/Form.tsx` | `templates/components/Form.tsx` | No changes needed |
| `apps/web/src/components/layout/Shell.tsx` | `templates/layouts/Shell.tsx` | Adapt `navItems` to match the app's routes |
| `apps/web/vite.config.ts` | `templates/web/vite.config.ts` | No changes needed |
| `apps/web/src/vite-env.d.ts` | `templates/web/vite-env.d.ts` | No changes needed |
| `apps/web/src/main.tsx` | `templates/web/main.tsx` | No changes needed |
| `apps/web/src/lib/queryClient.ts` | `templates/web/queryClient.ts` | No changes needed |
| `apps/web/src/lib/AuthGuard.tsx` | `templates/web/AuthGuard.tsx` | No changes needed |
| `scripts/generate-pages.ts` | `templates/scripts/generate-pages.ts` | No changes needed |

### Phase 5 — Polish

| File to create | Copy from | Notes |
|---|---|---|
| Root `tsconfig.base.json` | `templates/configs/tsconfig.base.json` | Extend from all package tsconfigs |

---

## Adapting Templates

Most templates copy verbatim. The only ones that need adaptation:

**`Shell.tsx`** — update `navItems` to match the app's actual routes and icons.

**`tsconfig.*.json`** — update `paths` aliases and `include` if the project layout differs.

**`check-sdk-drift.ts`** — the `__dirname` path is relative to `scripts/` at the monorepo root; verify the relative paths to `api-spec` and `sdk` match the project structure.

---

## Adding to the Template Library

When a component or config pattern proves stable across projects, add it here:

1. Write the file to `templates/<category>/<Name>.tsx` (or appropriate extension)
2. Add a row to the Phase → Template Mapping table above
3. Update `frontend-design.md` or the relevant reference doc to reference the template instead of embedding the full code

---

## Plugins

Optional features installed on request. Each plugin is a self-contained folder.

```
templates/plugins/
  file-upload/
    plugin.manifest.json     ← factory-add install metadata
    README.md              ← local storage provider + upload wiring checklist
    env.patch.md           ← STORAGE_PROVIDER, UPLOAD_DIR, PUBLIC_UPLOAD_BASE_URL
    schema.patch.md        ← Media model
    openapi.patch.yaml     ← POST /media/upload, DELETE /media/{key}
    server/plugins/uploads.ts
    server/providers/storage.ts
    server/providers/LocalStorageProvider.ts
    server/services/MediaService.ts
    server/handlers/media.ts
    sdk/hooks/useUpload.ts
    web/components/FileUpload.tsx

  cloudflare-r2/            ← requires file-upload
    plugin.manifest.json     ← factory-add install metadata
    README.md               ← R2 provider swap checklist
    env.patch.md            ← R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET
    server/providers/R2StorageProvider.ts

  google-auth/
    plugin.manifest.json    ← factory-add install metadata
    README.md              ← wiring checklist + verification steps
    env.patch.md           ← GOOGLE_CLIENT_ID + VITE_GOOGLE_CLIENT_ID
    schema.patch.md        ← googleId field on User
    openapi.patch.yaml     ← POST /auth/google
    server/handlers/googleAuth.ts ← copy to apps/server/src/handlers/
    server/services/GoogleAuthService.ts
    sdk/hooks/useGoogleAuth.ts
    web/components/GoogleLoginButton.tsx

  ai-chat/
    plugin.manifest.json    ← factory-add install metadata
    README.md              ← wiring checklist + streaming exception note
    env.patch.md           ← ANTHROPIC_API_KEY
    openapi.patch.yaml     ← POST /chat (SSE)
    server/handlers/chat.ts       ← copy to apps/server/src/handlers/
    server/services/ChatService.ts
    sdk/hooks/useChat.ts   ← calls fetch() directly (SSE, not openapi-fetch)
    web/components/ChatWidget.tsx

  ai-image-gen/            ← requires file-upload
    plugin.manifest.json    ← factory-add install metadata
    README.md              ← providers table, wiring checklist, cost controls
    env.patch.md           ← IMAGE_GEN_PROVIDER, DEZGO_API_KEY, OPENAI_API_KEY, LOCAL_DIFFUSION_URL
    schema.patch.md        ← GeneratedImage model
    openapi.patch.yaml     ← POST /ai-image/generate, GET /ai-image/history
    server/providers/imagegen.ts          ← ImageGenProvider interface + factory
    server/providers/DezgoProvider.ts     ← Dezgo + Flux
    server/providers/OpenAIDalleProvider.ts ← DALL-E 3
    server/providers/LocalDiffusionProvider.ts ← Automatic1111 REST
    server/services/ImageGenService.ts    ← rate limiting, storage integration
    server/handlers/imageGen.ts
    sdk/hooks/useImageGen.ts
    web/components/ImageGenWidget.tsx     ← aspect ratio selector, shimmer, download

  ai-video-gen/            ← requires file-upload
    plugin.manifest.json    ← factory-add install metadata
    README.md              ← async polling explanation, wiring checklist
    env.patch.md           ← KLING_API_KEY, KLING_API_SECRET, VIDEO_GEN_RATE_LIMIT_RPH
    schema.patch.md        ← GeneratedVideo model (status, providerTaskId, mediaUrl)
    openapi.patch.yaml     ← POST /ai-video/generate, GET /ai-video/status/{taskId}, GET /ai-video/history
    server/providers/videogen.ts          ← VideoGenProvider interface + factory
    server/providers/KlingProvider.ts     ← Kling AI (JWT auth, submit + poll)
    server/services/VideoGenService.ts    ← rate limiting, polling, storage on completion
    server/handlers/videoGen.ts
    sdk/hooks/useVideoGen.ts              ← auto-polling via refetchInterval
    web/components/VideoGenWidget.tsx     ← duration/ratio controls, spinner, video player

  railway/                 ← deployment: Fastify server + MySQL on Railway
    plugin.manifest.json    ← factory-add install metadata
    README.md              ← wiring checklist, DATABASE_URL SSL note, deploy flow
    env.patch.md           ← SESSION_SECRET, NODE_ENV, CORS_ORIGIN (DATABASE_URL + PORT injected by Railway)
    railway.json           ← copy to project root; builder: DOCKERFILE
    Dockerfile             ← copy to project root; pnpm monorepo-aware multi-stage build

  vercel/                  ← deployment: Vite frontend on Vercel (companion to railway)
    plugin.manifest.json    ← factory-add install metadata
    README.md              ← wiring checklist, VITE_API_URL, preview deployments, custom domain
    env.patch.md           ← VITE_API_URL (dev: localhost:3001, prod: Railway URL)
    vercel.json            ← copy to project root; build command, output dir, SPA rewrite
```

See `references/plugin-guide.md` for the full plugin interface and how to add new plugins.

---

## Frontend Packs

Copy-first UI assets. Read the manifest, copy files, and keep backend behavior unchanged.

```
templates/frontend-packs/
  registry.yaml

  designers/
    quality-designer/
      manifest.yaml
      pack.manifest.json
      design-brief.md
      visual-system.md
      asset-plan.md
      design-critique.md
      style-matrix.yaml
      anti-defaults.md
      screenshot-gate.md

  themes/
    admin-ops/
      manifest.yaml
      pack.manifest.json
      tokens.css
    creator-social/
      manifest.yaml
      pack.manifest.json
      tokens.css

  components/
    data-table/
      manifest.yaml
      pack.manifest.json
      DataTable.tsx
    activity-feed/
      manifest.yaml
      pack.manifest.json
      ActivityFeed.tsx
      ActivityComposer.tsx
    smart-media/
      manifest.yaml
      pack.manifest.json
      MediaFrame.tsx
      SmartImage.tsx
      SmartVideo.tsx
    slideshow/
      manifest.yaml
      pack.manifest.json
      SlideShow.tsx          ← shared types, SlideButtonEl, mode router
      HeroSlider.tsx         ← Embla full-screen slider with CTA overlay + dots + arrows
      GalleryBrowser.tsx     ← thumbnail grid sidebar + main view
    animation/               ← Framer Motion primitives (FadeIn, SlideUp, StaggerList)
      manifest.yaml
      pack.manifest.json
    charts/                  ← Recharts wired to CSS token colors (Line, Bar, Area, Pie)
      manifest.yaml
      pack.manifest.json

  pages/
    feed/
      manifest.yaml
      pack.manifest.json
      FeedPage.tsx
    dashboard/
      manifest.yaml
      pack.manifest.json
      DashboardPage.tsx

  mock-content/
    creator-social/
      manifest.yaml
      pack.manifest.json
      fixtures.ts
```

See `references/frontend-pack-guide.md`.

---

## Anti-Patterns

- Do not re-generate a file from scratch if a template exists — use the template
- Do not modify a template to be project-specific — adapt the copy, not the source
- Do not embed duplicate implementations in reference docs — reference the template path instead
