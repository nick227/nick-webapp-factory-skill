# Testing Patterns

Two layers of testing ship with every project: **Vitest integration tests** for the server (spec-driven, auto-generated stubs) and **Playwright smoke tests** for the frontend (golden-path, developer-adapted). Both use real infrastructure — no mocks at the DB or server level.

---

## Layer 1 — Vitest Integration Tests (Server)

### The Pipeline

```
packages/api-spec/openapi.yaml
        │
        ▼ (scripts/generate-tests.ts)
apps/server/src/__tests__/
  auth.test.ts      ← generated stubs, filled in by developer
  posts.test.ts
  users.test.ts
  helpers/
    index.ts        ← buildTestApp, asAuth, validateResponse, testUserId, testOtherUserId
    setup.ts        ← afterEach DB teardown (adapt model list to project)
```

### Generate Script

Copy `templates/scripts/generate-tests.ts` to `scripts/generate-tests.ts` — no changes needed.

Run with `pnpm test:generate`. Re-run whenever routes are added to the spec — appends stubs for new `operationId`s without touching existing tests.

How it works:
- Reads `packages/api-spec/openapi.yaml`
- Groups operations by `tags[0]`, emits one file per tag to `apps/server/src/__tests__/`
- Public routes (`security: []`) get no auth test; protected routes get a 401 test automatically
- Path params replaced with a fixed UUID placeholder for inject URLs
- Re-run safe: checks for existing `describe('operationId'` before appending

### Test Helpers

Copy `templates/server/test-helpers/index.ts` → `apps/server/src/__tests__/helpers/index.ts`
Copy `templates/server/test-helpers/setup.ts` → `apps/server/src/__tests__/helpers/setup.ts`

**`setup.ts` needs one adaptation:** update the `deleteMany` list to match the project's actual Prisma models in FK-safe order (children before parents).

Dev dependencies needed in `apps/server/package.json`:
```json
"@apidevtools/swagger-parser": "^10.0.0",
"ajv": "^8.0.0",
"ajv-formats": "^3.0.0",
"vitest": "^2.0.0"
```

### Two Test Users, Always Available

`buildTestApp()` registers a `beforeEach` that seeds two users before every test:

```typescript
export const testUserId      = '00000000-0000-0000-0000-000000000001' // alice
export const testOtherUserId = '00000000-0000-0000-0000-000000000002' // bob
```

`setup.ts` deletes all rows in `afterEach`; `buildTestApp` re-seeds them for the next test. This cycle means:

- **No per-test user setup** — just create domain data (posts, follows, etc.)
- **Cross-user permission tests are one line** — `asAuth(testOtherUserId)` is ready to use

```typescript
it('cannot delete another user's post', async () => {
  const post = await db.post.create({ data: { authorId: testUserId, body: 'hi' } })
  const res = await app.inject({
    method: 'DELETE',
    url: `/posts/${post.id}`,
    headers: asAuth(testOtherUserId), // wrong user
  })
  expect(res.statusCode).toBe(403)
})
```

### What the Generator Covers Automatically

| Concern | How |
|---|---|
| Route coverage | One `describe` per `operationId` — impossible to miss a route |
| Auth enforcement | 401 test generated for every protected route |
| Response shape | `validateResponse` checks body against spec schema via Ajv |
| New routes | Re-run `pnpm test:generate` — appends stubs, never overwrites filled-in tests |
| Cross-user tests | `testOtherUserId` exported in every generated file — use it |

### What the Developer Adds

- Domain data seed (before domain-specific tests)
- Assertions beyond status code: correct `authorId`, expected item count, forbidden fields absent
- Edge cases: invalid input, 404s, permission boundary violations

### Vitest Config

```typescript
// apps/server/vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    setupFiles: ['./src/__tests__/helpers/setup.ts'],
  }
})
```

---

## Layer 2 — Playwright Smoke Tests (Frontend)

### Setup

In `apps/web/`:

```bash
pnpm add -D @playwright/test
npx playwright install chromium
```

Copy `templates/configs/playwright.config.ts` → `apps/web/playwright.config.ts`
Copy `templates/web/e2e/smoke.spec.ts` → `apps/web/e2e/smoke.spec.ts`

Add to `apps/web/package.json`:
```json
"test:e2e": "playwright test"
```

### What the Smoke Test Covers

The template covers three things that are always present regardless of the app's domain:

1. **Login → protected page → logout** — full auth loop
2. **Register a new account** — onboarding flow
3. **Unauthenticated redirect** — `AuthGuard` actually redirects

These run against the live dev servers (both started by `webServer` in the Playwright config).

### Adapting the Smoke Test

The smoke test has `ADAPT:` comments marking the selectors and URLs to update. Minimum required changes:

1. The post-login URL match (`/feed|\/dashboard|\/home`) — match the app's actual route
2. The logout selector — update to match the app's nav/menu structure
3. The `unauthenticated redirect` test URL — use a real protected route

Then add app-specific flows in the `// EXTEND:` section — one `test.describe` per MVP module, using the `loginAs()` helper for setup.

### Running

```bash
# Requires both dev servers running, and the DB seeded
pnpm db:seed && pnpm test:e2e
```

On CI: the `webServer` blocks in `playwright.config.ts` start both servers automatically.

---

## Plugin Testing Notes

Plugins that add routes need extra setup in the test environment.

### `file-upload`

The test app needs `@fastify/multipart` registered. Add this to `buildTestApp()` in `helpers/index.ts`:

```typescript
import multipart from '@fastify/multipart'
// inside beforeAll, before openapiGlue:
await app.register(multipart)
```

Testing the actual upload:

```typescript
import { createReadStream } from 'fs'
import FormData from 'form-data'

it('POST /media/upload', async () => {
  const form = new FormData()
  form.append('file', createReadStream('./src/__tests__/fixtures/test.jpg'))

  const res = await app.inject({
    method: 'POST',
    url: '/media/upload',
    headers: { ...asAuth(testUserId), ...form.getHeaders() },
    payload: form,
  })
  expect(res.statusCode).toBe(201)
})
```

Add a small `fixtures/test.jpg` to the test directory.

### `google-auth`

The `POST /auth/google` handler calls `googleAuthService.verifyAndLogin()` which calls `google-auth-library`. This cannot be tested with a real token in unit/integration tests.

Options:
1. **Skip the test** — mark it `it.skip('POST /auth/google — requires real Google token')` and test manually
2. **Mock the service** — inject a mock `GoogleAuthService` in the test environment (requires making the service injectable)

Recommended: skip and note in the test. Google login is better verified in a Playwright test using a test Google account.

### `ai-chat`

The `POST /chat` route streams SSE. Fastify `app.inject()` collects the full response body — the stream works but the streaming behavior (individual chunks arriving over time) is not testable with inject.

Test the status code and that the response body contains text:

```typescript
it('POST /chat', async () => {
  // Requires ANTHROPIC_API_KEY to be set — skip on CI if key absent
  if (!process.env.ANTHROPIC_API_KEY) return

  const res = await app.inject({
    method: 'POST',
    url: '/chat',
    headers: asAuth(testUserId),
    payload: { messages: [{ role: 'user', content: 'Say "ok"' }] },
  })
  expect(res.statusCode).toBe(200)
  expect(res.headers['content-type']).toMatch(/text\/event-stream/)
})
```

### `ai-image-gen`

The service calls a real external API (Dezgo, OpenAI, or local). For tests, set `IMAGE_GEN_PROVIDER=local` and run a local server, or intercept at the service layer.

Simplest approach — test validation and rate limiting without making a real generation call:

```typescript
it('rejects empty prompt', async () => {
  const res = await app.inject({
    method: 'POST',
    url: '/ai-image/generate',
    headers: asAuth(testUserId),
    payload: { prompt: '' },
  })
  expect(res.statusCode).toBe(400)
})
```

For a full generation test, set `IMAGE_GEN_PROVIDER=local` with a local Automatic1111 running, or add a `test` provider to the factory that returns a fixed 1×1 PNG buffer.

### `ai-video-gen`

Kling video generation is async and takes minutes — not suitable for integration tests.

Test the submission endpoint and error handling:

```typescript
it('rejects empty prompt', async () => {
  const res = await app.inject({
    method: 'POST',
    url: '/ai-video/generate',
    headers: asAuth(testUserId),
    payload: { prompt: '' },
  })
  expect(res.statusCode).toBe(400)
})

it('404 for another user's task', async () => {
  const task = await db.generatedVideo.create({
    data: { userId: testUserId, prompt: 'test', status: 'pending' },
  })
  const res = await app.inject({
    method: 'GET',
    url: `/ai-video/status/${task.id}`,
    headers: asAuth(testOtherUserId),
  })
  expect(res.statusCode).toBe(404)
})
```

---

## Example Generated Test (fully filled in)

```typescript
// apps/server/src/__tests__/posts.test.ts
import { describe, it, expect } from 'vitest'
import { buildTestApp, asAuth, validateResponse, testUserId, testOtherUserId } from './helpers'
import { db } from '@project/db'

const app = buildTestApp()

describe('getFeed', () => {
  it('requires auth', async () => {
    const res = await app.inject({ method: 'GET', url: '/posts/feed' })
    expect(res.statusCode).toBe(401)
  })

  it('returns posts from followed users', async () => {
    // Bob posts, alice follows bob
    const post = await db.post.create({ data: { authorId: testOtherUserId, body: 'hi from bob' } })
    await db.follow.create({ data: { followerId: testUserId, followingId: testOtherUserId } })

    const res = await app.inject({
      method: 'GET',
      url: '/posts/feed',
      headers: asAuth(testUserId),
    })
    expect(res.statusCode).toBe(200)
    await validateResponse('getFeed', 200, res.json())
    expect(res.json().data.some((p: any) => p.id === post.id)).toBe(true)
  })
})

describe('deletePost', () => {
  it('requires auth', async () => {
    const res = await app.inject({ method: 'DELETE', url: '/posts/00000000-0000-0000-0000-000000000001' })
    expect(res.statusCode).toBe(401)
  })

  it('cannot delete another user's post', async () => {
    const post = await db.post.create({ data: { authorId: testUserId, body: 'mine' } })
    const res = await app.inject({
      method: 'DELETE',
      url: `/posts/${post.id}`,
      headers: asAuth(testOtherUserId),
    })
    expect(res.statusCode).toBe(403)
  })

  it('DELETE /posts/{id}', async () => {
    const post = await db.post.create({ data: { authorId: testUserId, body: 'mine' } })
    const res = await app.inject({
      method: 'DELETE',
      url: `/posts/${post.id}`,
      headers: asAuth(testUserId),
    })
    expect(res.statusCode).toBe(200)
    await validateResponse('deletePost', 200, res.json())
    expect(await db.post.findUnique({ where: { id: post.id } })).toBeNull()
  })
})
```
