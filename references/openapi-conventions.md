# OpenAPI Spec Conventions

The spec lives at `packages/api-spec/openapi.yaml`. It is written before Fastify routes and before SDK code. It is the contract between server and client.

---

## Package Setup

```json
// packages/api-spec/package.json
{
  "name": "@project/api-spec",
  "version": "0.0.1",
  "exports": {
    ".": "./openapi.yaml"
  }
}
```

---

## Spec Skeleton

```yaml
openapi: 3.1.0
info:
  title: <Project> API
  version: 0.0.1

servers:
  - url: http://localhost:3001
    description: Local dev

security:
  - bearerAuth: []

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer

  schemas:
    PaginatedMeta:
      type: object
      required: [hasMore, nextCursor]
      properties:
        hasMore: { type: boolean }
        nextCursor:
          type: string
          nullable: true

    User:
      type: object
      required: [id, email, createdAt]
      properties:
        id: { type: string }
        email: { type: string }
        createdAt: { type: string, format: date-time }
        profile: { $ref: '#/components/schemas/Profile' }

    Profile:
      type: object
      required: [id, userId, username, displayName]
      properties:
        id: { type: string }
        userId: { type: string }
        username: { type: string }
        displayName: { type: string }
        bio: { type: string, nullable: true }
        avatarUrl: { type: string, nullable: true }

    Post:
      type: object
      required: [id, authorId, body, createdAt]
      properties:
        id: { type: string }
        authorId: { type: string }
        body: { type: string }
        mediaUrl: { type: string, nullable: true }
        mediaType: { type: string, enum: [IMAGE, VIDEO, AUDIO], nullable: true }
        createdAt: { type: string, format: date-time }
        author: { $ref: '#/components/schemas/Profile' }
        _count:
          type: object
          properties:
            reactions: { type: integer }
            comments: { type: integer }

    CreatePostInput:
      type: object
      required: [body]
      properties:
        body: { type: string, minLength: 1, maxLength: 5000 }
        mediaUrl: { type: string }
        mediaType: { type: string, enum: [IMAGE, VIDEO, AUDIO] }

    RegisterInput:
      type: object
      required: [email, password, username, displayName]
      properties:
        email: { type: string, format: email }
        password: { type: string, minLength: 8 }
        username: { type: string, minLength: 3, maxLength: 30 }
        displayName: { type: string, minLength: 1, maxLength: 50 }

    LoginInput:
      type: object
      required: [email, password]
      properties:
        email: { type: string, format: email }
        password: { type: string }

    AuthResponse:
      type: object
      required: [data]
      properties:
        data: { $ref: '#/components/schemas/User' }
      # Token is delivered via Set-Cookie (httpOnly) — not in the body.
      # Document the cookie in each auth route's response headers (see below).

    ErrorResponse:
      type: object
      required: [error]
      properties:
        error: { type: string }
        code: { type: string }

  responses:
    Unauthorized:
      description: Not authenticated
      content:
        application/json:
          schema: { $ref: '#/components/schemas/ErrorResponse' }

  parameters:
    Cursor:
      in: query
      name: cursor
      schema: { type: string }
      description: Opaque cursor returned by the previous page.
    Limit:
      in: query
      name: limit
      schema: { type: integer, minimum: 1, maximum: 100, default: 20 }
    SearchQuery:
      in: query
      name: q
      schema: { type: string, minLength: 1, maxLength: 200 }

paths:
  /auth/register:
    post:
      operationId: register
      security: []
      tags: [auth]
      requestBody:
        required: true
        content:
          application/json:
            schema: { $ref: '#/components/schemas/RegisterInput' }
      responses:
        '201':
          description: Registered — session token delivered via Set-Cookie (httpOnly)
          headers:
            Set-Cookie:
              schema: { type: string }
          content:
            application/json:
              schema: { $ref: '#/components/schemas/AuthResponse' }

  /auth/login:
    post:
      operationId: login
      security: []
      tags: [auth]
      requestBody:
        required: true
        content:
          application/json:
            schema: { $ref: '#/components/schemas/LoginInput' }
      responses:
        '200':
          description: Authenticated — session token delivered via Set-Cookie (httpOnly)
          headers:
            Set-Cookie:
              schema: { type: string }
          content:
            application/json:
              schema: { $ref: '#/components/schemas/AuthResponse' }

  /auth/logout:
    post:
      operationId: logout
      tags: [auth]
      responses:
        '200':
          description: Logged out — clears session cookie
          content:
            application/json:
              schema:
                type: object
                properties:
                  data: { nullable: true }

  /auth/me:
    get:
      operationId: getCurrentUser
      tags: [auth]
      responses:
        '200':
          description: Current user
          content:
            application/json:
              schema: { $ref: '#/components/schemas/AuthResponse' }

  /users/me:
    put:
      operationId: updateCurrentUser
      tags: [users]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                username: { type: string, minLength: 3, maxLength: 30 }
                displayName: { type: string, minLength: 1, maxLength: 50 }
                bio: { type: string, nullable: true }
                avatarUrl: { type: string, nullable: true }
      responses:
        '200':
          description: Updated user profile
          content:
            application/json:
              schema:
                type: object
                properties:
                  data: { $ref: '#/components/schemas/User' }

  /posts:
    post:
      operationId: createPost
      tags: [posts]
      requestBody:
        required: true
        content:
          application/json:
            schema: { $ref: '#/components/schemas/CreatePostInput' }
      responses:
        '201':
          description: Post created
          content:
            application/json:
              schema:
                type: object
                properties:
                  data: { $ref: '#/components/schemas/Post' }

  /posts/feed:
    get:
      operationId: getFeed
      tags: [posts]
      parameters:
        - $ref: '#/components/parameters/Cursor'
        - $ref: '#/components/parameters/Limit'
      responses:
        '200':
          description: Paginated feed
          content:
            application/json:
              schema:
                type: object
                required: [data, meta]
                properties:
                  data:
                    type: array
                    items: { $ref: '#/components/schemas/Post' }
                  meta:
                    $ref: '#/components/schemas/PaginatedMeta'
```

---

## Rules for Writing the Spec

- Every Fastify route must be in the spec. No undocumented routes.
- Every schema used by a route must be in `components/schemas`. Never inline.
- Input shapes (`CreatePostInput`) are separate from response shapes (`Post`).
- Use `operationId` on every operation — this is how `openapi-typescript` names types.
- Mark public routes with `security: []`.
- Response schemas always use `{ data: T }` for resources and `{ data: T[], meta: { hasMore: boolean, nextCursor: string | null } }` for paginated lists.
- Reuse standard list/search params from `components/parameters`: `Cursor`, `Limit`, `SearchQuery`, and explicit filter params.

---

## Fastify + Swagger

Copy `templates/server/index.ts` verbatim — it registers `@fastify/swagger`, `@fastify/swagger-ui`, and `fastify-openapi-glue` in the correct order. Live docs at `/docs` in dev. Spec drift becomes visible immediately.

No `/api/` prefix — the server mounts at the root. Paths in the spec (`/auth/me`, `/posts/feed`) are the literal paths Fastify serves.

---

## Route Naming

- Plural nouns: `/users`, `/posts`, `/comments`
- Nested for ownership: `/posts/:postId/comments`
- Actions as sub-resources: `/follows/:userId`, `/reactions`
- Current user as `/me`: `/users/me`, `/auth/me`
- Auth under `/auth`
