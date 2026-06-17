# Admin Pipeline

Load this file at Phase 4 when admin panel is in MVP scope.

Admin is a first-class feature, not an afterthought. It goes through the full pipeline.

### Step 1 — Schema

Add `role` to the User model:

```prisma
// packages/db/prisma/schema.prisma

enum UserRole {
  USER
  ADMIN
}

model User {
  // existing fields...
  role      UserRole @default(USER)
}
```

### Step 2 — OpenAPI Spec

Add admin routes to `packages/api-spec/openapi.yaml`. Mark them with `x-admin: true` (documentation only — not enforced by the spec itself; enforcement is in the security handler).

```yaml
# Add to components/schemas:
AdminUserView:
  type: object
  required: [id, email, role, createdAt, _count]
  properties:
    id: { type: string }
    email: { type: string }
    role: { type: string, enum: [USER, ADMIN] }
    createdAt: { type: string, format: date-time }
    suspendedAt: { type: string, format: date-time, nullable: true }
    _count:
      type: object
      properties:
        posts: { type: integer }

SystemStats:
  type: object
  required: [userCount, postCount, activeToday]
  properties:
    userCount: { type: integer }
    postCount: { type: integer }
    activeToday: { type: integer }

# Add to paths:
/admin/stats:
  get:
    operationId: adminGetStats
    tags: [admin]
    summary: System-wide statistics
    responses:
      '200':
        description: Stats
        content:
          application/json:
            schema:
              type: object
              properties:
                data: { $ref: '#/components/schemas/SystemStats' }

/admin/users:
  get:
    operationId: adminListUsers
    tags: [admin]
    parameters:
      - $ref: '#/components/parameters/SearchQuery'
      - $ref: '#/components/parameters/Cursor'
      - $ref: '#/components/parameters/Limit'
    responses:
      '200':
        description: User list
        content:
          application/json:
            schema:
              type: object
              required: [data, meta]
              properties:
                data:
                  type: array
                  items: { $ref: '#/components/schemas/AdminUserView' }
                meta:
                  $ref: '#/components/schemas/PaginatedMeta'

/admin/users/{userId}:
  patch:
    operationId: adminUpdateUser
    tags: [admin]
    parameters:
      - in: path
        name: userId
        required: true
        schema: { type: string }
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            properties:
              role: { type: string, enum: [USER, ADMIN] }
              suspendedAt: { type: string, format: date-time, nullable: true }
    responses:
      '200':
        description: Updated user
        content:
          application/json:
            schema:
              type: object
              properties:
                data: { $ref: '#/components/schemas/AdminUserView' }
```

### Step 3 — Admin Security Handler

The admin security handler extends the bearer auth check with a role assertion.

```typescript
// apps/server/src/plugins/security.ts  (extend existing file)

export async function adminAuth(request: any, _reply: any, _params: any) {
  // reuse bearer auth to populate request.user
  await bearerAuth(request, _reply, _params)
  if (request.user.role !== 'ADMIN') {
    throw { statusCode: 403, message: 'Forbidden' }
  }
}
```

Register in `index.ts`:
```typescript
await server.register(openapiGlue, {
  specification: specPath,
  service: handlers,
  securityHandlers: { bearerAuth, adminAuth },
  noAdditional: true,
})
```

Mark admin routes in the spec with the `adminAuth` security scheme:
```yaml
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
    adminAuth:          # ← add this
      type: http
      scheme: bearer

# on each admin route:
/admin/stats:
  get:
    security:
      - adminAuth: []
```

### Step 4 — Admin Handlers + Services

```typescript
// apps/server/src/handlers/admin.ts
import { AdminService } from '../services/AdminService'

const adminService = new AdminService()

export async function adminGetStats(_request: any, reply: any) {
  const stats = await adminService.getStats()
  return reply.send({ data: stats })
}

export async function adminListUsers(request: any, reply: any) {
  const { q, cursor, limit = 50 } = request.query
  const result = await adminService.listUsers({ q, cursor, limit })
  return reply.send(result)
}

export async function adminUpdateUser(request: any, reply: any) {
  const user = await adminService.updateUser(request.params.userId, request.body)
  return reply.send({ data: user })
}
```

```typescript
// apps/server/src/services/AdminService.ts
import { db } from '@project/db'
import { decodeCursor, encodeCursor, normalizeLimit } from '../lib/pagination'

export class AdminService {
  async getStats() {
    const [userCount, postCount] = await Promise.all([
      db.user.count(),
      db.post.count({ where: { deletedAt: null } }),
    ])
    const activeToday = await db.user.count({
      where: { updatedAt: { gte: new Date(Date.now() - 86_400_000) } }
    })
    return { userCount, postCount, activeToday }
  }

  async listUsers(opts: { q?: string; cursor?: string; limit: number }) {
    const limit = normalizeLimit(opts.limit, 100, 50)
    const decoded = decodeCursor(opts.cursor)
    const users = await db.user.findMany({
      where: {
        AND: [
          ...(opts.q
            ? [{ OR: [{ email: { contains: opts.q } }, { profile: { username: { contains: opts.q } } }] }]
            : []),
          ...(decoded
            ? [{
                OR: [
                  { createdAt: { lt: new Date(decoded.createdAt) } },
                  { createdAt: new Date(decoded.createdAt), id: { lt: decoded.id } },
                ],
              }]
            : []),
        ],
      },
      take: limit + 1,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      include: { _count: { select: { posts: true } } },
    })
    const hasMore = users.length > limit
    const items = hasMore ? users.slice(0, limit) : users
    const last = items[items.length - 1]
    return {
      data: items,
      meta: {
        hasMore,
        nextCursor: hasMore ? encodeCursor({ createdAt: last.createdAt.toISOString(), id: last.id }) : null,
      },
    }
  }

  async updateUser(userId: string, data: { role?: string; suspendedAt?: string | null }) {
    return db.user.update({
      where: { id: userId },
      data: {
        ...(data.role && { role: data.role as any }),
        ...(data.suspendedAt !== undefined && { suspendedAt: data.suspendedAt ? new Date(data.suspendedAt) : null }),
      },
      include: { _count: { select: { posts: true } } },
    })
  }
}
```

### Step 5 — Admin Frontend

```typescript
// apps/web/src/lib/AdminGuard.tsx
import { Navigate, Outlet } from 'react-router-dom'
import { useCurrentUser } from '@project/sdk'
import { PageSpinner } from '@/components/ui/Spinner'

export function AdminGuard() {
  const { data, isLoading } = useCurrentUser()
  if (isLoading) return <PageSpinner />
  if (!data?.data || data.data.role !== 'ADMIN') return <Navigate to="/" replace />
  return <Outlet />
}
```

```typescript
// apps/web/src/components/layout/AdminShell.tsx
// Same structure as Shell but with admin-specific nav items
import { NavLink, Outlet } from 'react-router-dom'
import { Users, BarChart2, ArrowLeft } from 'lucide-react'

const adminNav = [
  { to: '/admin', label: 'Stats', icon: BarChart2, end: true },
  { to: '/admin/users', label: 'Users', icon: Users },
]

export function AdminShell() {
  return (
    <div className="min-h-screen bg-background">
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-48 flex-col border-r px-3 py-6 gap-1">
        <NavLink to="/" className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft size={16} /> Back to app
        </NavLink>
        {adminNav.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded text-sm font-medium transition-colors ${
                isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
              }`
            }
          >
            <item.icon size={16} />
            {item.label}
          </NavLink>
        ))}
      </aside>
      <main className="md:ml-48 min-h-screen">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
```

Wire into routing:
```typescript
// apps/web/src/App.tsx  (add inside Routes)
<Route element={<AdminGuard />}>
  <Route element={<AdminShell />}>
    <Route path="/admin" element={<AdminStatsPage />} />
    <Route path="/admin/users" element={<AdminUsersPage />} />
  </Route>
</Route>
```

Admin pages import from `@project/sdk` hooks as usual — `useAdminStats`, `useAdminUsers`, `useAdminUpdateUser` generated by the SDK pipeline.

### Step 6 — Admin Documentation

Generate `docs/admin.md`:

```markdown
# Admin Guide

Access the admin panel at `/admin`. Requires `role: ADMIN` on your user account.

## Getting admin access

In development, promote yourself via Prisma Studio:
\`\`\`bash
pnpm db:studio
\`\`\`
Find your user record and set `role` to `ADMIN`.

In production, use the Prisma CLI:
\`\`\`bash
pnpm --filter @project/db exec prisma studio
\`\`\`

## Pages

### /admin — Stats
System-wide counts: total users, total posts, active users in the last 24 hours.

### /admin/users — User Management
- Search users by email or username
- Promote/demote admin role
- Suspend accounts (sets `suspendedAt`; suspended users are rejected at auth)

## Suspended users

The auth handler should check `suspendedAt`:
\`\`\`typescript
if (session.user.suspendedAt) {
  throw { statusCode: 403, message: 'Account suspended' }
}
\`\`\`
Add this check to `apps/server/src/plugins/security.ts`.
```


---

## Admin Gate

- [ ] Admin routes are in the OpenAPI spec with `adminAuth` security
- [ ] `pnpm sdk:generate` updated — admin hooks exist in `@project/sdk`
- [ ] `pnpm test:generate` run — admin route stubs exist
- [ ] Admin panel accessible at `/admin` — blocks non-admin users
- [ ] `AdminGuard` redirects regular users to `/`
- [ ] Admin stats page shows real data
- [ ] Admin user list is searchable and paginates correctly
- [ ] Role change and suspend/unsuspend work end-to-end
