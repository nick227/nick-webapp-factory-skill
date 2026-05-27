# Plugin: railway

Deploys the Fastify server and provisions a MySQL database on Railway. The web frontend deploys separately — see the `vercel` plugin.

---

## Prerequisites

1. Railway account — railway.app
2. Railway CLI: `npm install -g @railway/cli` then `railway login`
3. A Railway project created for this app

---

## Files to Copy

| Source | Destination |
|---|---|
| `railway.json` | project root |
| `Dockerfile` | project root |

---

## Wiring Checklist

- [ ] Copy `railway.json` and `Dockerfile` to the project root
- [ ] In Railway dashboard: create a new **MySQL** service inside your project
- [ ] Link the MySQL service to your server service — Railway injects `DATABASE_URL` automatically
- [ ] Set these env vars on the **server** service in Railway:
  - `SESSION_SECRET` — a long random string (generate: `openssl rand -base64 32`)
  - `NODE_ENV=production`
  - `CORS_ORIGIN` — your Vercel frontend URL (e.g. `https://your-app.vercel.app`)
  - `PORT` is injected by Railway automatically — do not set it manually
- [ ] Add `?sslaccept=strict` to the DATABASE_URL Railway provides if Prisma connection fails (see below)
- [ ] On first deploy, run the database migration release command (see Deploy Flow below)
- [ ] Confirm `/health` returns 200

---

## DATABASE_URL and SSL

Railway MySQL provides a connection string like:
```
mysql://root:pass@monorail.proxy.rlwy.net:12345/railway
```

If you see a Prisma SSL error on first deploy, append `?sslaccept=strict`:
```
mysql://root:pass@monorail.proxy.rlwy.net:12345/railway?sslaccept=strict
```

Set the final value as `DATABASE_URL` in Railway's environment variables panel.

---

## Deploy Flow

Railway builds the Docker image automatically on push to your connected branch.

**First deploy — push the schema:**
```bash
railway run pnpm --filter "./packages/db" db:push
```

Set this as the Railway **release command** in the service settings so it runs automatically before each deploy. `db:push` syncs the Prisma schema to the database — safe for new deployments. For production apps requiring migration history, switch to `prisma migrate deploy` and see the Prisma docs on migrations.

**Subsequent deploys:** push to main — Railway rebuilds and redeploys.

---

## Health Check

The server template exposes `GET /health → { status: 'ok' }`. Railway uses this as the liveness probe. If your app doesn't have a health route, add one to `apps/server/src/index.ts`:

```typescript
server.get('/health', async () => ({ status: 'ok' }))
```

---

## Environment Variables Reference

| Variable | Set by | Value |
|---|---|---|
| `DATABASE_URL` | Railway (auto) | MySQL connection string from linked service |
| `PORT` | Railway (auto) | Injected at runtime — do not hardcode |
| `NODE_ENV` | You | `production` |
| `SESSION_SECRET` | You | Random 32+ char string |
| `CORS_ORIGIN` | You | Vercel frontend URL |

---

## Verification

1. Push to main — Railway build log should show Docker build + deploy
2. Open the Railway service URL → `GET /health` returns `{ "status": "ok" }`
3. `GET /auth/me` returns 401 (auth route is wired)
4. Open Railway dashboard → MySQL service → Query → tables exist after migration
