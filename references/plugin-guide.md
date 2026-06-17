# Plugin Guide

Plugins extend the factory with optional full-stack features. Each plugin is self-contained — it contributes exactly what it needs across the stack and nothing else.

---

## Plugin Catalog

| Plugin | What it adds | Key deps | Requires |
|---|---|---|---|
| `file-upload` | Local file uploads, provider abstraction, drag-and-drop `FileUpload` component | `@fastify/multipart`, `@fastify/static`, `fastify-plugin` | — |
| `cloudflare-r2` | R2 storage backend — pure provider swap, no new routes | `@aws-sdk/client-s3` | `file-upload` |
| `google-auth` | Google Sign-In (ID token flow) | `google-auth-library` | — |
| `ai-chat` | Streaming AI chatbot (Anthropic SDK) | `@anthropic-ai/sdk` | — |
| `ai-image-gen` | Text-to-image: Dezgo+Flux (default), OpenAI DALL-E, local Stable Diffusion | none / `openai` | `file-upload` |
| `ai-video-gen` | Text-to-video via Kling AI (async polling) | none (native fetch) | `file-upload` |

**Provider plugins** (`cloudflare-r2`, and future `aws-s3`, `gcs`) only ship a provider class — no routes, no handlers, no SDK hooks, no components. They are purely backend swaps activated by `STORAGE_PROVIDER` env var. Always install `file-upload` first.

**Media generation plugins** (`ai-image-gen`, `ai-video-gen`) store generated files through the `file-upload` plugin's `StorageProvider`. Install `file-upload` first. Generated media goes to whatever storage backend is configured (`local`, `r2`, `s3`, etc.).

**Dependency Resolution:** Plugin dependencies (e.g. `file-upload` required by `ai-video-gen`) are **hard failures**, not auto-installs. The `factory-add.ts` script should error clearly (e.g., "install file-upload first") rather than silently expanding the scope to install missing dependencies.

Plugins to build next: `websockets`, `stripe`, `aws-s3`, `push-notifications`, `prisma-postgres`.

---

## Plugin Structure

Every plugin lives at `templates/plugins/{name}/` and follows this layout:

```
templates/plugins/{name}/
  README.md              ← what it does, prerequisites, wiring checklist
  plugin.manifest.json   ← machine-readable install metadata for factory-add
  env.patch.md           ← env vars to append to .env.example
  schema.patch.md        ← Prisma model/field additions (copy-paste blocks)
  openapi.patch.yaml     ← spec additions: schemas + paths to merge in
  server/handlers/       ← copy to apps/server/src/handlers/
  server/services/       ← copy to apps/server/src/services/
  server/providers/      ← copy to apps/server/src/providers/ (provider plugins only)
  server/plugins/        ← copy to apps/server/src/plugins/ (Fastify plugins only)
  sdk/hooks/             ← copy to packages/sdk/src/hooks/
  web/components/        ← copy to apps/web/src/components/
  web/pages/             ← copy to apps/web/src/pages/ (if plugin adds a page)
```

Not every plugin needs every folder. Only ship what the plugin actually contributes.

**Third-party libraries** — specialized libraries required by a plugin (e.g. `embla-carousel-react` for slideshow, `framer-motion` for animation, `recharts` for charts) live with the plugin, not the core scaffold. Document them in the plugin README under Prerequisites and in the wiring checklist package.json step. The developer opts in when they install the plugin. Do not add specialized libraries to the root scaffold or `templates/monorepo-base.md`.

---

## Installing a Plugin

When the developer requests a plugin feature:

1. **Read** `templates/plugins/{name}/README.md` — understand the plugin and its prerequisites
2. **Run installer** — `pnpm factory:add plugin {name}`. If the generated project cannot locate the skill templates, set `NICK_WEBAPP_FACTORY_ROOT=/path/to/nick-webapp-factory` or pass `--templates /path/to/nick-webapp-factory`.
3. **Install package deps** printed by the installer
4. **Schema/spec** — merge files copied to `docs/pending-patches/plugin-{name}/`; then run `pnpm db:push` if schema changed and `pnpm sdk:generate` if OpenAPI changed
5. **Exports/manual wiring** — apply barrel exports and manual follow-up printed by the installer
6. **Tests** — `pnpm test:generate` to add stubs for new operationIds
7. **Verify** — follow the README's verification checklist

---

## Creating a New Plugin

1. Create `templates/plugins/{name}/` following the structure above
2. Write `README.md` — include: what it does, prerequisites, step-by-step wiring, verification checklist, known limitations
3. Write `env.patch.md` — one env var per line with a comment explaining it
4. Write `schema.patch.md` — exact Prisma blocks to add, with FK-safe ordering noted
5. Write `openapi.patch.yaml` — only the new paths and schemas; leave existing spec unchanged
6. Write `plugin.manifest.json` — copy map, deps, patches, exports, and manual follow-up
7. Write server/SDK/frontend files — treat these as real template files: no TODOs, no placeholder logic

*(Note: The `factory-add.ts` installer discovers plugins dynamically by folder name at `templates/plugins/{name}`. The following steps are purely for human documentation and are not mechanical requirements for the installer to work.)*

8. Add a row to the Plugin Catalog table above
9. Add a row to `references/registry.md` plugin section

---

## Plugin Design Rules

- **Zero coupling between plugins.** A plugin may not import from another plugin.
- **Additive only.** Plugins add fields, routes, and files. They never modify existing templates.
- **Handler → service split holds.** Every plugin handler delegates to a service. No business logic in handlers.
- **Same response envelope.** `{ data: T }` for resources, `{ data: T[], meta: { hasMore, nextCursor } }` for paginated lists. Streaming endpoints are the only exception (SSE uses `text/event-stream`).
- **Same list/search contract.** Plugins with list, feed, or search routes must follow `references/list-query-conventions.md`.
- **Same auth model.** Plugins that add auth routes set the `token` httpOnly cookie and return `{ data: User }`. No plugin invents a different auth shape.
- **Plugin SDK hooks use the same client.** Hooks in `sdk/hooks/` call `getApiClient().GET/POST/PATCH/DELETE` and throw `ApiError` on failure — the same pattern as `references/sdk-patterns.md`. No plugin creates its own fetch client or calls `fetch`/`axios` directly (streaming endpoints excepted — see below).
- **Feature pack components are prop-driven.** Frontend pack components (posts, profiles, notifications) receive data as props; data wiring happens in the page and flows down. **Self-contained interaction widgets** (OAuth buttons, upload pickers, chat widgets, AI gen widgets) are the exception — they may call SDK hooks internally when the interaction model requires tight co-location of UI and hook. These widgets still accept configuration via props.
- **Env vars are documented.** Every env var a plugin needs appears in `env.patch.md` with a comment. No undocumented config.
- **No plugin is required.** The base app boots and runs without any plugin installed.

---

## Streaming Exception

Plugins that stream responses (ai-chat, websockets) cannot use `openapi-fetch` for the streaming endpoint — openapi-fetch is request/response, not streaming. These plugins call `fetch` directly in their SDK hooks and document this deviation explicitly in their README.

The spec still declares the streaming route (with `content: text/event-stream`) for documentation purposes. The handler uses `reply.raw` to write SSE frames.
