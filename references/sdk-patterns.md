# SDK Patterns

The SDK (`packages/sdk`) is the portable, self-contained API + hook layer. Any React app installs it and gets typed data access with zero setup.

The client uses `openapi-fetch` — a typed fetch wrapper auto-derived from the generated spec types. No hand-written method per route.

---

## Package Setup

*Use the `packages/sdk/package.json` template from `templates/monorepo-base.md` as the authoritative source. Do not re-write it from scratch.*

---

## Generation Script

Generates TypeScript types for the typed client. Copy `templates/sdk/generate.ts` verbatim — it runs `openapi-typescript` against the spec and writes `src/generated/types.ts`.

Frontend form Zod schemas are **not** generated from the spec — `pnpm pages:generate` infers them from field types at page-generation time. This keeps the SDK dependency surface minimal.

Add to `packages/sdk/package.json` devDependencies:
```json
"openapi-typescript": "^7.0.0",
"tsx": "^4.0.0"
```

Root `package.json` should have:
```json
"sdk:generate": "pnpm --filter @project/sdk generate",
"sdk:check": "tsx scripts/check-sdk-drift.ts"
```

**Contract drift check** (`scripts/check-sdk-drift.ts`) — run in CI before build to guarantee committed types match the spec:

```typescript
// scripts/check-sdk-drift.ts
// Registry source: fullstack-contract-drift-check@1.0.0
import { execSync } from 'child_process'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { tmpdir } from 'os'
import { join } from 'path'

const specPath = resolve(__dirname, '../packages/api-spec/openapi.yaml')
const committedPath = resolve(__dirname, '../packages/sdk/src/generated/types.ts')
const tempPath = join(tmpdir(), `types-drift-${Date.now()}.ts`)

execSync(`npx openapi-typescript ${specPath} -o ${tempPath}`, { stdio: 'pipe' })

const committed = readFileSync(committedPath, 'utf8').trim()
const fresh = readFileSync(tempPath, 'utf8').trim()

if (committed !== fresh) {
  console.error('❌  SDK types are out of sync with the OpenAPI spec.')
  console.error('    Run `pnpm sdk:generate` and commit the updated types.ts')
  process.exit(1)
}

console.log('✓  SDK types match the spec')
```

---

## Generated Types

After running `pnpm sdk:generate`, `src/generated/types.ts` contains path/operation/schema types derived from the spec. Never edit this file. Example shape:

```typescript
// src/generated/types.ts (DO NOT EDIT — generated from openapi.yaml)
export interface paths {
  "/posts/feed": {
    get: {
      parameters: { query?: { cursor?: string; limit?: number } }
      responses: {
        200: {
          content: {
            "application/json": {
              data: Post[]
              meta: { hasMore: boolean; nextCursor: string | null }
            }
          }
        }
      }
    }
  }
  "/posts": {
    post: {
      requestBody: { content: { "application/json": CreatePostInput } }
      responses: {
        201: { content: { "application/json": { data: Post } } }
      }
    }
  }
}

export interface components {
  schemas: {
    Post: { id: string; body: string; authorId: string; createdAt: string }
    CreatePostInput: { body: string; mediaUrl?: string }
    User: { id: string; email: string; profile: Profile | null }
    Profile: { username: string; displayName: string; avatarUrl: string | null }
  }
}

export type Post = components["schemas"]["Post"]
export type User = components["schemas"]["User"]
export type Profile = components["schemas"]["Profile"]
export type CreatePostInput = components["schemas"]["CreatePostInput"]
```

---

## Typed Client

The client uses `openapi-fetch` — paths, params, and response shapes are all inferred from the generated types. No method is ever written by hand.

**Default auth: httpOnly cookies** — the server sets a `Set-Cookie` header on login; the client passes `credentials: 'include'` on every request. This keeps tokens off `localStorage` and out of XSS reach.

`getToken` is an optional override for native app contexts (React Native, Electron) where cookies aren't available and a Bearer token must be injected from secure storage instead.

```typescript
// packages/sdk/src/client.ts
import createClient, { type Middleware } from 'openapi-fetch'
import type { paths } from './generated/types'

type ClientConfig = {
  baseUrl: string
  getToken?: () => string | null  // only needed for native apps; web uses httpOnly cookies
}

let _client: ReturnType<typeof createClient<paths>> | null = null

export function createApiClient(config: ClientConfig) {
  const client = createClient<paths>({
    baseUrl: config.baseUrl,
    credentials: 'include',  // send httpOnly session cookie on every request
  })

  if (config.getToken) {
    // native app override: inject Bearer token from secure storage
    const authMiddleware: Middleware = {
      async onRequest({ request }) {
        const token = config.getToken!()
        if (token) request.headers.set('Authorization', `Bearer ${token}`)
        return request
      }
    }
    client.use(authMiddleware)
  }

  _client = client
  return client
}

export function getApiClient() {
  if (!_client) throw new Error('API client not initialized. Call createApiClient() first.')
  return _client
}

export class ApiError extends Error {
  constructor(public status: number, message: string, public code?: string) {
    super(message)
  }
}
```

The server's auth handler must accept both a session cookie (`request.cookies.token`) and a `Bearer` header so native apps work without code changes. Check cookie first, fall back to header.

Adding a new route to the spec automatically makes it callable — no client changes needed.

---

## Hook Layer

Hooks use React Query. They call `getApiClient().GET/POST/PATCH/DELETE` with path literals — fully typed from the spec.

```typescript
// packages/sdk/src/hooks/usePosts.ts
import { useQuery, useMutation, useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { getApiClient, ApiError } from '../client'

export function useFeed() {
  return useInfiniteQuery({
    queryKey: ['feed'],
    queryFn: async ({ pageParam }) => {
      const { data, error, response } = await getApiClient().GET('/posts/feed', {
        params: { query: { cursor: pageParam, limit: 20 } }
      })
      if (error) throw new ApiError(response.status, (error as any).error)
      return data!
    },
    getNextPageParam: (lastPage) => lastPage.meta.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
  })
}

export function useCreatePost() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: { body: string; mediaUrl?: string }) => {
      const { data, error, response } = await getApiClient().POST('/posts', { body })
      if (error) throw new ApiError(response.status, (error as any).error)
      return data!
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] })
    }
  })
}
```

```typescript
// packages/sdk/src/hooks/useAuth.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getApiClient, ApiError } from '../client'

export function useCurrentUser() {
  return useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const { data, error, response } = await getApiClient().GET('/auth/me')
      if (error) throw new ApiError(response.status, (error as any).error)
      return data!
    },
    retry: false,
  })
}

export function useLogin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: { email: string; password: string }) => {
      const { data, error, response } = await getApiClient().POST('/auth/login', { body })
      if (error) throw new ApiError(response.status, (error as any).error)
      return data!
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] })
    }
  })
}
```

```typescript
// packages/sdk/src/hooks/index.ts
export * from './useAuth'
export * from './usePosts'
export * from './useUsers'
export * from './useNotifications'
export * from './useFollows'
```

```typescript
// packages/sdk/src/index.ts
export { createApiClient, getApiClient, ApiError } from './client'
export * from './hooks'
export type * from './generated/types'
```

---

## Query Key Convention

Query keys must be consistent across hooks — cross-hook invalidation only works if the key format matches exactly. Follow this convention for every hook:

| Shape | When | Example |
|---|---|---|
| `['entity']` | Global or self-referential resource | `['me']`, `['feed']` |
| `['entity', id]` | Resource by identifier | `['profile', userId]`, `['post', postId]` |
| `['entity', 'list', params]` | Filtered or scoped list | `['notifications', 'list', { unread: true }]` |

**Rule:** when a mutation invalidates a query, it must use the same key format as the hook that owns the query. If `useProfile(userId)` uses `['profile', userId]`, then `useFollow` must invalidate `['profile', userId]` — not `['profiles', userId]` or `['user-profile', userId]`. Mismatched keys fail silently with stale data.

---

## App Setup (in apps/web, apps/mobile, etc.)

The app is responsible for ONE thing: initializing the client.

```typescript
// apps/web/src/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query'
export const queryClient = new QueryClient()
```

```typescript
// apps/web/src/main.tsx
import { QueryClientProvider } from '@tanstack/react-query'
import { createApiClient } from '@project/sdk'
import { queryClient } from './lib/queryClient'

createApiClient({
  baseUrl: import.meta.env.VITE_API_URL,
  // no getToken — web apps use httpOnly cookies via credentials: 'include'
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
)
```

---

## Page Usage

Pages import from `@project/sdk` only. Nothing else.

```typescript
// apps/web/src/pages/Feed.tsx
import { useFeed } from '@project/sdk'
import { PostCard } from '../components/PostCard'

export function FeedPage() {
  const { data, isLoading, fetchNextPage, hasNextPage } = useFeed()
  const posts = data?.pages.flatMap(p => p.data) ?? []

  if (isLoading) return <div>Loading...</div>

  return (
    <div className="max-w-xl mx-auto py-6 space-y-4">
      {posts.map(post => <PostCard key={post.id} post={post} />)}
      {hasNextPage && <button onClick={() => fetchNextPage()}>Load more</button>}
    </div>
  )
}
```

---

## List Hooks

Follow `references/list-query-conventions.md` for all list, feed, and search hooks.

- GET operations with `cursor` use `useInfiniteQuery`.
- `getNextPageParam` reads `lastPage.meta.nextCursor`.
- Query keys include all filters/search params.
- Hooks accept typed param objects for `q`, `limit`, and explicit filters.

---

## Portability Contract

The SDK has zero knowledge of:
- Which bundler the app uses (Vite, webpack, Turbopack)
- Which router the app uses (react-router, TanStack Router, Next.js)
- Where tokens are stored (localStorage, cookies, memory)
- What CSS framework the app uses

To use the SDK in a new frontend:
1. `pnpm add @project/sdk @tanstack/react-query`
2. Call `createApiClient({ baseUrl, getToken })` once at app startup
3. Wrap the app in `<QueryClientProvider>`
4. Import hooks directly — they work immediately
