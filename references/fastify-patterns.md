# Fastify Patterns

The server uses `fastify-openapi-glue` to route requests. The OpenAPI spec is the router — no manual route registration, no per-route validation config.

---

## Server Setup

Copy `templates/server/index.ts` → `apps/server/src/index.ts`. No changes needed.

Includes: `@fastify/cookie` (session cookie support), `@fastify/swagger` + `@fastify/swagger-ui` (live docs at `/docs`), global error handler (Prisma codes → HTTP status), `fastify-openapi-glue` (spec-driven routing), and a `/health` liveness endpoint.

---

## Handler Pattern

Handlers are named exports matching `operationId` values in the spec. They delegate immediately to services — zero business logic in handlers.

```typescript
// apps/server/src/handlers/posts.ts
import { PostService } from '../services/PostService'

const postService = new PostService()

export async function getFeed(request: any, reply: any) {
  const { cursor, limit = 20 } = request.query
  const result = await postService.getFeed(request.user.id, { cursor, limit })
  return reply.send(result)
}

export async function createPost(request: any, reply: any) {
  const post = await postService.create(request.user.id, request.body)
  return reply.status(201).send({ data: post })
}
```

```typescript
// apps/server/src/handlers/index.ts  (barrel — every operationId must be exported here)
export * from './auth'
export * from './posts'
export * from './users'
export * from './follows'
export * from './notifications'
```

**Rule:** every `operationId` in the spec needs a matching named export. The glue throws a startup error if one is missing, making omissions visible immediately.

---

## Security Handlers

Auth is wired to the spec's `securitySchemes` — not to individual routes via `preHandler`. Public routes marked `security: []` in the spec are skipped automatically.

Copy `templates/server/security.ts` → `apps/server/src/plugins/security.ts`. No changes needed.

Exports `bearerAuth` (cookie-first → Bearer header fallback → session lookup → suspendedAt check) and `adminAuth` (extends bearerAuth + `role === 'ADMIN'` check).

---

## Service Pattern

Services own all DB access and business logic. The handler/service split is unchanged — glue only removes the route registration layer.

```typescript
// apps/server/src/services/PostService.ts
import { db } from '@project/db'
import { decodeCursor, encodeCursor, normalizeLimit } from '../lib/pagination'

export class PostService {
  async create(authorId: string, data: { body: string; mediaUrl?: string }) {
    return db.post.create({
      data: { authorId, ...data },
      include: { author: { include: { profile: true } } }
    })
  }

  async getFeed(userId: string, opts: { cursor?: string; limit: number }) {
    const limit = normalizeLimit(opts.limit)
    const follows = await db.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true }
    })
    const followingIds = follows.map(f => f.followingId)

    const cursor = decodeCursor(opts.cursor)
    const posts = await db.post.findMany({
      where: {
        authorId: { in: [...followingIds, userId] },
        deletedAt: null,
        ...(cursor
          ? {
              OR: [
                { createdAt: { lt: new Date(cursor.createdAt) } },
                { createdAt: new Date(cursor.createdAt), id: { lt: cursor.id } },
              ],
            }
          : {})
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
      include: {
        author: { include: { profile: true } },
        _count: { select: { reactions: true, comments: true } }
      }
    })

    const hasMore = posts.length > limit
    const items = hasMore ? posts.slice(0, limit) : posts
    const last = items[items.length - 1]
    const nextCursor = hasMore
      ? encodeCursor({ createdAt: last.createdAt.toISOString(), id: last.id })
      : null

    return { data: items, meta: { hasMore, nextCursor } }
  }
}
```

---

## What the Glue Eliminates

- All `fastify.get/post/patch/delete()` registration calls
- Manual prefix management in `index.ts`
- Per-route `schema: { body: ... }` validation config — the spec drives Ajv automatically
- Per-route `preHandler: [fastify.authenticate]` — replaced by spec-level `security` + `securityHandlers`
- Handler/spec drift — a missing `operationId` export is a startup error, not a silent bug

## What Stays

The handler → service split. Handlers are thin. Services own the logic.

---

## Global Error Handler

Register once in `index.ts` before the glue plugin. Maps known error shapes to HTTP responses — handlers and services throw; this translates.

```typescript
server.setErrorHandler((error, _request, reply) => {
  // fastify-openapi-glue validation errors
  if (error.validation) {
    return reply.status(400).send({ error: 'Validation failed', details: error.validation })
  }

  // explicit { statusCode, message } throws from security handlers / services
  if (error.statusCode) {
    return reply.status(error.statusCode).send({ error: error.message })
  }

  // Prisma not-found
  if ((error as any).code === 'P2025') {
    return reply.status(404).send({ error: 'Not found' })
  }

  // Prisma unique constraint
  if ((error as any).code === 'P2002') {
    return reply.status(409).send({ error: 'Already exists' })
  }

  server.log.error(error)
  reply.status(500).send({ error: 'Internal server error' })
})
```

Services throw `{ statusCode, message }` for expected failures:

```typescript
if (!post) throw { statusCode: 404, message: 'Post not found' }
if (post.authorId !== userId) throw { statusCode: 403, message: 'Forbidden' }
```

---

## Error Response Shape

```typescript
// Success — single resource
reply.send({ data: resource })

// Success — paginated list
reply.send({ data: items, meta: { hasMore, nextCursor } })

// Error
{ error: string, code?: string, details?: unknown }
```

---

## Env Vars (server)

```env
DATABASE_URL=mysql://user:pass@localhost:3306/dbname
SESSION_SECRET=change-me
PORT=3001
```
