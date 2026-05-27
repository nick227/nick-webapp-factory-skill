# Plugin: ai-video-gen

Adds AI video generation powered by Kling AI. Video generation is asynchronous — the API returns a task ID immediately, and the client polls for completion. Completed videos are stored through the `file-upload` plugin's `StorageProvider`.

**Requires:** `file-upload` plugin must already be installed.

---

## How Kling Works

Kling video generation is a two-step async process:

1. `POST /ai-video/generate` — submits the job, returns `{ taskId, status: "pending" }` immediately
2. `GET /ai-video/status/{taskId}` — poll this until `status` is `"completed"` or `"failed"`

Typical generation time: 1–3 minutes for a 5-second clip. The `VideoGenWidget` polls every 5 seconds automatically.

---

## Kling Authentication

Kling uses API Key + API Secret to generate a short-lived JWT for each request. Both values are required. Get them from the [Kling AI developer console](https://klingai.com).

---

## Prerequisites

1. `file-upload` plugin installed
2. Kling AI account with API access
3. `KLING_API_KEY` and `KLING_API_SECRET` from the Kling developer console

---

## Files to Copy

| Source | Destination |
|---|---|
| `server/providers/videogen.ts` | `apps/server/src/providers/videogen.ts` |
| `server/providers/KlingProvider.ts` | `apps/server/src/providers/KlingProvider.ts` |
| `server/services/VideoGenService.ts` | `apps/server/src/services/VideoGenService.ts` |
| `server/handlers/videoGen.ts` | `apps/server/src/handlers/videoGen.ts` |
| `sdk/hooks/useVideoGen.ts` | `packages/sdk/src/hooks/useVideoGen.ts` |
| `web/components/VideoGenWidget.tsx` | `apps/web/src/components/VideoGenWidget.tsx` |

---

## Wiring Checklist

- [ ] Install `file-upload` plugin first
- [ ] Copy all files from the table above
- [ ] Add `env.patch.md` vars to `.env.example` and `.env`
- [ ] Merge `openapi.patch.yaml` into `packages/api-spec/openapi.yaml`
- [ ] Run `pnpm sdk:generate`
- [ ] Apply `schema.patch.md` to `packages/db/prisma/schema.prisma`, run `pnpm db:push`
- [ ] Add `export * from './videoGen'` to `apps/server/src/handlers/index.ts`
- [ ] Add `export * from './useVideoGen'` to `packages/sdk/src/hooks/index.ts`
- [ ] Run `pnpm test:generate`
- [ ] Drop `<VideoGenWidget />` anywhere in the app

---

## Rate Limiting

Per-user rate limits enforced in-memory:

- `VIDEO_GEN_RATE_LIMIT_RPH` — requests per hour per user (default: `5`)

Video generation is expensive. Start with a conservative limit.

---

## Testing

Video generation takes 1–3 minutes and requires real Kling credentials — do not test end-to-end in integration tests. Test validation, permission boundaries, and status polling logic instead.

```typescript
it('rejects empty prompt', async () => {
  const res = await app.inject({
    method: 'POST', url: '/ai-video/generate',
    headers: asAuth(testUserId),
    payload: { prompt: '' },
  })
  expect(res.statusCode).toBe(400)
})

it('cannot poll another user's task', async () => {
  const task = await db.generatedVideo.create({
    data: { userId: testUserId, prompt: 'test', status: 'pending' },
  })
  const res = await app.inject({
    method: 'GET', url: `/ai-video/status/${task.id}`,
    headers: asAuth(testOtherUserId),
  })
  expect(res.statusCode).toBe(404)
})

it('history returns empty list initially', async () => {
  const res = await app.inject({
    method: 'GET', url: '/ai-video/history',
    headers: asAuth(testUserId),
  })
  expect(res.statusCode).toBe(200)
  expect(res.json().data).toHaveLength(0)
})
```

For the submission flow, mock the Kling API using an environment flag that bypasses the actual HTTP call — or mark those tests as integration-only and run them manually.

---

## Verification

1. Set `KLING_API_KEY` and `KLING_API_SECRET` in `.env`
2. Start `pnpm dev`
3. Navigate to a page with `<VideoGenWidget />`
4. Enter a prompt and submit
5. The widget shows a pulsing "Generating…" state
6. After 1–3 minutes, the video player appears
7. Check the `GeneratedVideo` table: `pnpm db:studio`

---

## Known Limitations

- Only one provider (Kling). Add `Runwayml`, `Pika`, etc. as additional `VideoGenProvider` implementations.
- In-memory rate limiting resets on server restart.
- Kling JWT has a 30-minute TTL — it is regenerated per request, so no expiry issues.
- No webhook support — the client polls. For production, add a webhook endpoint and use Prisma + WebSocket to push status updates.
