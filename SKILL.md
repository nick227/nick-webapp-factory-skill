---
name: nick-webapp-factory
description: >
  Use this skill whenever User asks to build, scaffold, plan, generate, implement, continue, or finish
  a web app or website — especially ones with users, auth, social features, feeds, profiles, follows,
  posts, notifications, or media. Also trigger when User says things like "keep going", "finish this out",
  "build the next part", "don't stop", "keep building", or "continue" in the context of a web project.
  This skill encodes Nick's preferred tech stack, architecture, and MVP discipline, and is biased toward
  writing real files and working code — not plans or outlines — and finishing what it starts.
---

# Nick Web App Factory

You are building User's web apps using his preferred stack and architecture.

**Your primary directive: keep building until the work is done. Do not stop at plans, outlines, or summaries. Write real files. Generate real code. Keep going until the app runs.**

---

## Bias Toward Action

**This applies once an MVP definition exists.** Before that, run Phase 0. After it, charge forward without asking permission.

- If you have enough context to generate a file, generate it. Don't ask for permission.
- If a step is ambiguous, make a reasonable decision, note it inline with a comment, and keep going.
- If you finish one layer (e.g. schema), immediately move to the next (routes, then frontend pages, then components).
- Never stop at a "here's the plan" summary. Plans are only valid if followed immediately by implementation.
- After completing a section, say what you're doing next and do it — do not ask "should I continue?"
- If context runs long, summarize what's been built and list exactly what remains, then continue.

---

## Dynamic Context Loading

Do not preload files from `references/`.

Only read a reference file when the current task matches its trigger.

| Trigger | Load |
|---|---|
| Scaffolding, stack decisions, OpenAPI, SDK generation, folder structure, architecture rules, code style | `references/core-architecture.md` |
| Phase 0/1 planning, MVP scope, default app modules, social app defaults, domain model choices | `references/domain-defaults.md` |
| Plugin/package/library selection, integrations, auth, uploads, email, payments, search | `references/plugin-catalog.md` |
| Frontend pages, UI packs, themes, dashboards, landing pages, visual component generation | `references/frontend-pack-catalog.md` |
| Admin panel, role-based access, system stats, user management | `references/admin-pipeline.md` |
| Any phase — consult before generating any component, layout, pattern, or script | `references/registry.md` |

When multiple triggers apply, load only the smallest necessary set.
When unsure, continue with `SKILL.md` alone until the workflow requires more detail.

---

## Generation Order

Work through phases in sequence. Complete each phase's gate before starting the next. Do not bleed Phase 4 work into Phase 2.

---

### Phase 0 — Discovery

*Load if needed: `references/discovery.md`, `references/domain-defaults.md`*

**Run this phase only when starting a new project with no existing `CLAUDE.md`.** Skip it entirely on continuation prompts ("keep going", "finish this", etc.) — in that case, read `CLAUDE.md` and resume at the correct phase.

Ask the four discovery questions from `references/discovery.md`. Wait for the developer's answers. Then produce a **MVP Definition** — a compact structured summary of scope, user roles, modules in/out, and stack. Get explicit approval before writing a single file.

**Phase 0 gate:**
- [ ] Developer has answered the four discovery questions
- [ ] MVP Definition has been written and shown to the developer
- [ ] Developer has approved it (said "build it", "looks good", "yes", or equivalent)
- [ ] Plugin selections are noted (even if "decide after Phase 2")

Once approved, move immediately to Phase 1 — no further questions.

---

### Phase 1 — Contract

*Load if needed: `references/core-architecture.md`, `references/openapi-conventions.md`, `references/prisma-patterns.md`, `references/sdk-patterns.md`, and `references/list-query-conventions.md` if the app has any list, feed, or search endpoint*

1. **Scaffold monorepo structure** — `pnpm-workspace.yaml`, root `package.json`, all `packages/*/package.json` from `templates/monorepo-base.md`. Copy all scripts from `templates/scripts/` verbatim. Copy `templates/github/` verbatim to `.github/` — CI runs on first push with no further configuration.
2. **Prisma schema** (`packages/db/prisma/schema.prisma`) — DB source of truth
3. **OpenAPI spec** (`packages/api-spec/openapi.yaml`) — API source of truth. Every route, every request/response shape. Complete before any implementation.
4. **SDK package** — copy `templates/sdk/client.ts`, `templates/sdk/index.ts`, `templates/sdk/hooks/useAuth.ts`, `templates/sdk/hooks/index.ts`, `templates/sdk/generate.ts` verbatim into the right paths
5. **Run `pnpm sdk:generate`** — produces `packages/sdk/src/generated/types.ts`

**Phase 1 gate:**
- [ ] `pnpm sdk:generate` runs clean
- [ ] `pnpm sdk:check` passes — no drift between spec and committed `types.ts`
- [ ] `npx @redocly/cli lint packages/api-spec/openapi.yaml` — spec validates clean
- [ ] `pnpm typecheck` passes across all packages
- [ ] Every route has an `operationId`
- [ ] Spec covers every feature in the MVP scope

---

### Phase 2 — Server

*Load if needed: `references/fastify-patterns.md`, `references/testing-patterns.md`*

6. **Server package scaffold** — copy `apps/server/src/index.ts` from `templates/server/index.ts`, `apps/server/src/plugins/security.ts` from `templates/server/security.ts`, and `apps/server/src/lib/pagination.ts` from `templates/server/pagination.ts`
7. **Auth handlers + service** — copy `templates/server/handlers/auth.ts` and `templates/server/services/AuthService.ts` verbatim; add `export * from './auth'` to the handlers barrel
8. **Domain handlers** (`apps/server/src/handlers/`) — one named export per `operationId`; delegate immediately to services
9. **Domain services** (`apps/server/src/services/`) — all business logic and DB access here
10. **Test stubs** — run `pnpm test:generate`; one file per tag, one `describe` per `operationId`. Fill in seed data. Copy test helpers from `templates/server/test-helpers/` verbatim.

**Phase 2 gate:**
- [ ] Server starts without errors (`pnpm --filter server dev`)
- [ ] Auth routes work: register → login returns cookie → GET /auth/me returns user
- [ ] `pnpm test:generate` has been run — every route has a test stub
- [ ] `pnpm test` passes
- [ ] No `fastify.get/post/patch/delete()` calls anywhere

---

### Phase 3 — Frontend Shell

*Load if needed: `references/frontend-design.md`*

11. **Scaffold Vite app** — `pnpm create vite apps/web -- --template react-ts`. Install dependencies: `pnpm --filter apps/web add react-router-dom @tanstack/react-query sonner zod react-hook-form @hookform/resolvers lucide-react class-variance-authority clsx tailwind-merge`
12. **Tailwind config + CSS tokens** — copy `templates/configs/tailwind.config.ts` and `templates/configs/index.css` verbatim; copy `templates/lib/utils.ts` and `templates/lib/theme.ts`. **If `docs/visual-system.md` exists**, apply its Token Direction values to `src/index.css` immediately — overwrite the defaults so the app matches the brief from the first render, not just in docs. If a named theme pack (admin-ops, creator-social) was selected, copy its `tokens.css` directly instead.
13. **UI primitives** — copy all files from `templates/components/` into `apps/web/src/components/ui/`: Button, Input, Textarea, Card, Avatar, EmptyState, Skeleton, Spinner, Form
14. **Layout** — copy `templates/layouts/Shell.tsx` into `apps/web/src/components/layout/Shell.tsx`; adapt `navItems` to match the app's routes
15. **Entry point + AuthGuard** — copy `templates/web/main.tsx` → `apps/web/src/main.tsx`, `templates/web/queryClient.ts` → `apps/web/src/lib/queryClient.ts`, `templates/web/AuthGuard.tsx` → `apps/web/src/lib/AuthGuard.tsx`
16. **Generate page stubs** — run `pnpm pages:generate`. Produces: `App.tsx` (routes wired, AuthGuard applied), auth pages (Login, Register), and list/detail/form stubs for every non-skipped operationId. Re-run safe — skips existing files.
17. **Dark mode** toggle wired
18. **Playwright** — `pnpm --filter apps/web add -D @playwright/test && pnpm --filter apps/web exec playwright install chromium`. Add `"test:e2e": "playwright test"` to `apps/web/package.json`. Copy `templates/configs/playwright.config.ts` → `apps/web/playwright.config.ts`. Copy `templates/web/e2e/smoke.spec.ts` → `apps/web/e2e/smoke.spec.ts`. Adapt the three `ADAPT:` markers to match the app's routes and selectors.

**Phase 3 gate:**
- [ ] `pnpm create vite` scaffold exists; `pnpm dev` starts the web app
- [ ] `pnpm pages:generate` ran — `App.tsx` and page stubs exist
- [ ] App renders with correct shell on mobile (320px) and desktop (1024px)
- [ ] Auth flow complete: login → protected route → logout → redirect
- [ ] All primitives from `frontend-design.md` checklist exist and render correctly
- [ ] Dark mode toggles without flash
- [ ] `smoke.spec.ts` adapted and `pnpm test:e2e` passes (auth loop + redirect)

---

### Phase 4 — Feature Pages

*Load if needed: `references/react-patterns.md`, `references/frontend-design.md`, `references/social-modules.md`*

**If `docs/design-brief.md` exists**, read it before building any domain page or component. For each page: check its entry in Page Composition for which components to use and what density is expected. Check the archetype's `avoid:` list — if the layout you're about to build appears there, redesign it. Match the token vocabulary (radius, spacing, accent) from visual-system.md.

19. **Domain SDK hooks** (`packages/sdk/src/hooks/`) — before touching pages, write one hook file per domain module (e.g. `usePosts.ts`, `useUsers.ts`) following `references/sdk-patterns.md`. Use `getApiClient().GET/POST/PATCH/DELETE` with typed paths. Add each new hook file to `packages/sdk/src/hooks/index.ts` barrel before importing it anywhere.
20. **Feature pages** (`src/pages/`) — the stubs from `pnpm pages:generate` are the starting point. Replace the `JSON.stringify` placeholders with real component renders. Import hooks from `@project/sdk` only — no raw fetch.
21. **Feature components** (`src/components/`) — props only; no hooks that fetch data. Build card/row/cell components that the page passes data into.
22. **Forms** — all use declarative `<Form>` with zod schema; all text fields use `<Input>` or `<Textarea>` primitives. Generated stubs include inferred FieldConfig[] and Zod schema — fill in placeholder text and add validation rules.
23. **(Optional) Admin panel** — if required by MVP scope: add `role: UserRole` to User, add admin routes to spec with `adminAuth` security, regenerate SDK + tests, implement handlers + services + frontend. Full pipeline in `references/admin-pipeline.md`.

**Phase 4 gate:**
- [ ] All MVP features implemented
- [ ] All domain hooks written in `packages/sdk/src/hooks/` and barrel-exported from `hooks/index.ts`
- [ ] No raw `fetch` / `axios` calls in pages or components
- [ ] No `<input>` or `<textarea>` elements outside of `components/ui/`
- [ ] All data comes from `@project/sdk` hooks
- [ ] If admin was built: verify Admin Gate in `references/admin-pipeline.md`

---

### Phase 5 — Polish

*Load if needed: `references/frontend-design.md`, `references/react-patterns.md`; if quality-designer was run: `docs/design-brief.md`, `docs/design-critique.md`*

24. **Skeleton loaders** for all content areas
25. **Error boundaries** wrapping each page route
26. **Toast notifications** wired on all mutations
27. **`.env.example`** finalized
28. **`README.md`** — setup steps; mention `pnpm bootstrap` for first-run
29. **Seed script** — copy `templates/db/seed.ts` → `packages/db/prisma/seed.ts`, adapt to project models and add domain-specific data
30. **Session close** — run `pnpm bootstrap`, confirm servers start, hand off to developer for browser verification. See `references/session-close.md` for the exact protocol.

**Phase 5 gate:**
- [ ] `pnpm bootstrap` runs clean on a fresh checkout
- [ ] `pnpm dev` starts both apps — web at :5173, API at :3001
- [ ] `pnpm lint` clean
- [ ] `npx fallow` clean (codebase intelligence: dead code, duplication, circular deps)
- [ ] `pnpm typecheck` clean
- [ ] `pnpm test` all pass
- [ ] Every list view has an empty state
- [ ] Every content area has a skeleton loader
- [ ] Every mutation has a toast on success and error
- [ ] `pnpm test:e2e` passes — Playwright smoke test covers auth loop and key features
- [ ] **If `docs/design-critique.md` exists**: all Passes checked, Issues To Fix resolved — visual quality confirmed, not just functional
- [ ] Session close protocol completed — golden-path checklist shown, `CLAUDE.md` written
- [ ] **Developer has confirmed the app works in their browser**

---

**Re-run `pnpm test:generate` whenever routes are added to the spec.** Appends stubs for new `operationId`s, never touches filled-in tests.

---

### Phase 6 — Documentation

*Load if needed: `references/documentation-phase.md`*

31. **`pnpm docs:generate`** — generates `docs/api-reference.md`, `docs/env-vars.md`, `docs/database.md` from spec + schema + env file
32. **Developer docs** (`docs/`) — `architecture.md`, `setup.md`, `sdk.md`, `deployment.md` — templates in `references/documentation-phase.md`
33. **Admin docs** — `docs/admin.md`; only if admin panel was built in Phase 4
34. **`CLAUDE.md`** — final update: mark Phase 6 complete

**Phase 6 gate:**
- [ ] `pnpm docs:generate` runs clean
- [ ] `docs/api-reference.md` lists every route in the spec
- [ ] `docs/env-vars.md` covers every variable in `.env.example`
- [ ] `docs/database.md` lists every Prisma model
- [ ] `docs/architecture.md`, `docs/setup.md`, `docs/sdk.md`, `docs/deployment.md` exist
- [ ] `docs/admin.md` exists if admin was built
- [ ] Root `README.md` links to `docs/`

---

## Continuation Protocol

If the user says "keep going", "finish this", "continue", "don't stop", or similar:

1. **Skip Phase 0.** A continuation means the MVP is already defined.
2. Read `CLAUDE.md` at the project root. It must exist past Phase 0. If it is missing, flag it to the developer as a corrupted project state rather than guessing the phase.
3. Re-read what's been generated so far.
4. Identify the next uncompleted step in the Generation Order.
5. Generate it fully.
6. State what was just completed and what comes next.
7. Keep going without asking.

---

## Reference Files

Load per phase — do not load all refs upfront.

| Phase / Need | Load |
|---|---|
| Phase 0 — Discovery, MVP scope, default modules | `references/discovery.md`, `references/domain-defaults.md` |
| Phase 1 — Contract, scaffold, architecture, OpenAPI, SDK | `references/core-architecture.md`, `references/openapi-conventions.md`, `references/prisma-patterns.md`, `references/sdk-patterns.md`; add `references/list-query-conventions.md` for list/feed/search endpoints |
| Phase 2 — Server | `references/fastify-patterns.md`, `references/testing-patterns.md` |
| Phase 3 — Frontend Shell | `references/frontend-design.md`; add `references/frontend-pack-catalog.md` only when selecting a frontend pack |
| Phase 4 — Feature Pages | `references/react-patterns.md`, `references/frontend-design.md`, `references/social-modules.md`, `references/admin-pipeline.md`; if quality-designer ran: `docs/design-brief.md` |
| Phase 5 — Polish | `references/frontend-design.md`, `references/react-patterns.md`, `references/session-close.md`; if quality-designer ran: `docs/design-brief.md`, `docs/design-critique.md` |
| Phase 6 — Documentation | `references/documentation-phase.md` |
| Plugin/package selection | `references/plugin-catalog.md` |
| Plugin install | `references/plugin-guide.md` + `templates/plugins/{name}/README.md` + `templates/plugins/{name}/plugin.manifest.json` |
| Frontend pack selection | `references/frontend-pack-catalog.md` |
| Frontend pack install | `references/frontend-pack-guide.md` + `templates/frontend-packs/**/manifest.yaml` + `templates/frontend-packs/**/pack.manifest.json` |
| Any phase | `templates/monorepo-base.md` for workspace/package scaffolding |
| Any phase | `references/registry.md` — consult before generating any component, layout, pattern, or script |
| Any list/search/feed work | `references/list-query-conventions.md` |
| Design direction | `references/quality-designer.md` + `templates/frontend-packs/designers/quality-designer/manifest.yaml` |
| Visual QA | `references/visual-qa.md` |

---

## Invocation Examples

```
Use nick-webapp-factory. Build an MVP for a local business directory with profiles, reviews, and follows.
```

```
Use nick-webapp-factory. Keep going — finish the Fastify routes and start on the frontend pages.
```

```
Use nick-webapp-factory. Generate the Prisma schema and all server routes for a creator social network.
```
