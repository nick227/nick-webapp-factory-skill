# Plugin Catalog

Plugins are opt-in. Ask the developer which they need before starting Phase 3. Install after Phase 2 is gated (server running, auth working).

| Plugin | What it adds | Install reference |
|---|---|---|
| `file-upload` | Local file uploads (drag & drop, type + size validation, static serving). Swap to cloud via `STORAGE_PROVIDER` env var. | `templates/plugins/file-upload/README.md` |
| `cloudflare-r2` | R2 storage backend for `file-upload`. Drop-in swap — no route changes. | `templates/plugins/cloudflare-r2/README.md` |
| `google-auth` | Google Sign-In (ID token flow, merges with email accounts) | `templates/plugins/google-auth/README.md` |
| `ai-chat` | Streaming Anthropic chatbot — `ChatWidget` component, SSE handler | `templates/plugins/ai-chat/README.md` |
| `ai-image-gen` | Text-to-image generation with generated media history — requires `file-upload` | `templates/plugins/ai-image-gen/README.md` |
| `ai-video-gen` | Text-to-video generation with async polling and history — requires `file-upload` | `templates/plugins/ai-video-gen/README.md` |
| `railway` | Deploys Fastify server + MySQL to Railway. Dockerfile + railway.json. | `templates/plugins/railway/README.md` |
| `vercel` | Deploys Vite frontend to Vercel. vercel.json + SPA rewrite. Companion to `railway`. | `templates/plugins/vercel/README.md` |

**To install a plugin:**
1. Read its `README.md` for context
2. Run `pnpm factory:add plugin {name}`
3. Install package deps, merge pending schema/OpenAPI patches, and apply exports printed by the installer
4. Run `pnpm db:push` if schema changed, `pnpm sdk:generate` if OpenAPI changed, `pnpm test:generate` for new routes, and `pnpm pages:generate` if the plugin adds new routes that need frontend page stubs

See `references/plugin-guide.md` for the full plugin interface spec and instructions for adding new plugins.
