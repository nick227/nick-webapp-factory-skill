# Plugin: ai-image-gen

Adds AI image generation with a swappable provider backend. Supports Dezgo+Flux (default), OpenAI DALL-E, and a local Stable Diffusion endpoint. Generated images are stored through the `file-upload` plugin's `StorageProvider` so no separate file handling is needed.

**Requires:** `file-upload` plugin must already be installed.

---

## Providers

| `IMAGE_GEN_PROVIDER` | Package needed | Notes |
|---|---|---|
| `dezgo` (default) | none (native `fetch`) | Dezgo Flux model, fast, cheap |
| `openai` | `openai` | DALL-E 3, highest quality |
| `local` | none | Calls Automatic1111 / ComfyUI REST at `LOCAL_DIFFUSION_URL` |

Switch providers by changing `IMAGE_GEN_PROVIDER` in `.env` — no code changes needed.

---

## Prerequisites

1. `file-upload` plugin installed
2. Provider credentials (see `env.patch.md`)
3. For `local`: Automatic1111 running at `http://localhost:7860` with the API enabled (`--api` flag)

---

## Files to Copy

| Source | Destination |
|---|---|
| `server/providers/imagegen.ts` | `apps/server/src/providers/imagegen.ts` |
| `server/providers/DezgoProvider.ts` | `apps/server/src/providers/DezgoProvider.ts` |
| `server/providers/OpenAIDalleProvider.ts` | `apps/server/src/providers/OpenAIDalleProvider.ts` |
| `server/providers/LocalDiffusionProvider.ts` | `apps/server/src/providers/LocalDiffusionProvider.ts` |
| `server/services/ImageGenService.ts` | `apps/server/src/services/ImageGenService.ts` |
| `server/handlers/imageGen.ts` | `apps/server/src/handlers/imageGen.ts` |
| `sdk/hooks/useImageGen.ts` | `packages/sdk/src/hooks/useImageGen.ts` |
| `web/components/ImageGenWidget.tsx` | `apps/web/src/components/ImageGenWidget.tsx` |

---

## Wiring Checklist

- [ ] Install `file-upload` plugin first
- [ ] Copy all files from the table above
- [ ] Add `env.patch.md` vars to `.env.example` and `.env`
- [ ] Merge `openapi.patch.yaml` into `packages/api-spec/openapi.yaml`
- [ ] Run `pnpm sdk:generate`
- [ ] Apply `schema.patch.md` to `packages/db/prisma/schema.prisma`, run `pnpm db:push`
- [ ] If using `openai` provider: `pnpm add openai` in `apps/server/`
- [ ] Add `export * from './imageGen'` to `apps/server/src/handlers/index.ts`
- [ ] Add `export * from './useImageGen'` to `packages/sdk/src/hooks/index.ts`
- [ ] Run `pnpm test:generate`
- [ ] Drop `<ImageGenWidget />` anywhere in the app

---

## Rate Limiting

The service enforces per-user rate limits in memory (single-server only). Configure via env vars:

- `IMAGE_GEN_RATE_LIMIT_RPM` — requests per minute per user (default: `10`)

For multi-server deployments, replace the in-memory `RateLimiter` in `ImageGenService.ts` with a Redis-backed implementation.

---

## Cost Controls

- Max prompt length: 1000 characters (configurable in `ImageGenService.ts`)
- Max image dimensions: 1536×1536 (clipped silently, no error)
- Min image dimensions: 256×256

---

## Testing

Don't test generation end-to-end in integration tests — it hits a real API, costs money, and is slow. Test validation and rate limiting instead; test the full generation flow manually via the Playwright smoke test.

**Validation tests (no external calls):**

```typescript
it('rejects empty prompt', async () => {
  const res = await app.inject({
    method: 'POST', url: '/ai-image/generate',
    headers: asAuth(testUserId),
    payload: { prompt: '' },
  })
  expect(res.statusCode).toBe(400)
})

it('rejects prompt over 1000 characters', async () => {
  const res = await app.inject({
    method: 'POST', url: '/ai-image/generate',
    headers: asAuth(testUserId),
    payload: { prompt: 'x'.repeat(1001) },
  })
  expect(res.statusCode).toBe(400)
})

it('history returns empty list when no images generated', async () => {
  const res = await app.inject({
    method: 'GET', url: '/ai-image/history',
    headers: asAuth(testUserId),
  })
  expect(res.statusCode).toBe(200)
  expect(res.json().data).toHaveLength(0)
})
```

To test actual generation without hitting the real API, add a `test` case to the provider factory in `imagegen.ts` that returns a fixed 1×1 PNG buffer, then set `IMAGE_GEN_PROVIDER=test` in the test environment.

---

## Verification

1. Set `IMAGE_GEN_PROVIDER` and the matching credentials in `.env`
2. Start `pnpm dev`
3. Navigate to a page with `<ImageGenWidget />`
4. Enter a prompt and generate
5. Image should appear and the file should appear in your storage (local `uploads/` or cloud bucket)
6. Check the `GeneratedImage` table in Prisma Studio: `pnpm db:studio`

---

## Known Limitations

- No content moderation. Add a moderation API call in `ImageGenService.generate()` before calling the provider if needed.
- Rate limiting is in-memory — resets on server restart. Use Redis for production.
- `local` provider assumes Automatic1111 API format. ComfyUI requires a different request format.
- OpenAI DALL-E 3 only supports three fixed sizes: 1024×1024, 1792×1024, 1024×1792. Requested dimensions are mapped to the closest ratio.
