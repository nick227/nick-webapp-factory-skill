# Plugin: ai-chat

Adds a streaming AI chatbot powered by the Anthropic SDK. The server streams SSE frames; the frontend accumulates them into a live-updating message list. No message persistence — history lives in React state. Add a `Message` model to the schema if persistence is needed.

Uses `ANTHROPIC_MODEL` with `claude-sonnet-4-6` as the default. Change the env var when you intentionally upgrade models.

---

## Prerequisites

1. Anthropic API key — get one at console.anthropic.com
2. Add to `.env`: `ANTHROPIC_API_KEY=sk-ant-...`
3. Optional: set `ANTHROPIC_MODEL` to another Anthropic model ID

---

## Files to Copy

| Source | Destination |
|---|---|
| `server/handlers/chat.ts` | `apps/server/src/handlers/chat.ts` |
| `server/services/ChatService.ts` | `apps/server/src/services/ChatService.ts` |
| `sdk/hooks/useChat.ts` | `packages/sdk/src/hooks/useChat.ts` |
| `web/components/ChatWidget.tsx` | `apps/web/src/components/ChatWidget.tsx` |

---

## Wiring Checklist

- [ ] Add vars from `env.patch.md` to `.env.example` and `.env`
- [ ] Merge `openapi.patch.yaml` blocks into `packages/api-spec/openapi.yaml`
- [ ] Run `pnpm sdk:generate`
- [ ] Copy handler and service files (see table above)
- [ ] Add `@anthropic-ai/sdk` to `apps/server/package.json` dependencies
- [ ] Add `export * from './chat'` to `apps/server/src/handlers/index.ts`
- [ ] Copy SDK hook; add `export * from './useChat'` to `packages/sdk/src/hooks/index.ts`
- [ ] Copy `ChatWidget.tsx` to web
- [ ] Drop `<ChatWidget />` anywhere in the app — it is self-contained
- [ ] Run `pnpm test:generate` — stub for `chat` will appear (mark as skip or test manually)

---

## Streaming Exception

This plugin does NOT use `openapi-fetch` for the `/chat` request. SSE streaming requires `fetch` with a `ReadableStream` reader, which `openapi-fetch` does not support. The `useChat` hook calls `fetch` directly. This is documented in `references/plugin-guide.md` under "Streaming Exception."

The spec still declares the route for documentation. The operationId `chat` maps to the handler, but the frontend bypasses the SDK client for this one route.

`useChat` accepts a `baseUrl` option. The bundled `ChatWidget` passes `import.meta.env.VITE_API_URL`, matching the core web template's API client setup.

---

## Customisation Points

- **System prompt**: pass `systemPrompt` in the request body or hardcode it in `ChatService.ts`
- **Model**: set `ANTHROPIC_MODEL` in `.env`
- **Auth**: the route uses `bearerAuth` by default. To make it public, add `security: []` to the spec path
- **Persistence**: add a `Message` model to schema.prisma and save messages in `ChatService`
- **Rate limiting**: add a check in the service before calling the API

---

## Testing

`app.inject()` collects the full SSE response — the route is testable for status code and content-type, but streaming behavior (individual chunks arriving over time) is not verifiable in Vitest.

```typescript
it('requires auth', async () => {
  const res = await app.inject({ method: 'POST', url: '/chat' })
  expect(res.statusCode).toBe(401)
})

it('POST /chat streams a response', async () => {
  // Skip if no API key configured (e.g. CI without secrets)
  if (!process.env.ANTHROPIC_API_KEY) return

  const res = await app.inject({
    method: 'POST',
    url: '/chat',
    headers: asAuth(testUserId),
    payload: { messages: [{ role: 'user', content: 'Reply with only the word "ok"' }] },
  })
  expect(res.statusCode).toBe(200)
  expect(res.headers['content-type']).toMatch(/text\/event-stream/)
  expect(res.body).toContain('data:')
})
```

For streaming behavior, test via the Playwright smoke test: open `<ChatWidget />`, type a message, assert the response text appears and grows.

---

## Verification

1. Start `pnpm dev`
2. Navigate to any page that includes `<ChatWidget />`
3. Type a message and press Enter
4. Text should stream in token by token
5. Check the Network tab — you should see a `POST /chat` request with `text/event-stream` response type
