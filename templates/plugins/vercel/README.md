# Plugin: vercel

Deploys the Vite + React frontend to Vercel. The server deploys separately — see the `railway` plugin.

---

## Prerequisites

1. Vercel account — vercel.com
2. Vercel CLI: `npm install -g vercel` then `vercel login`
3. Server already deployed (you'll need its public URL for `VITE_API_URL`)

---

## Files to Copy

| Source | Destination |
|---|---|
| `vercel.json` | project root |

---

## Wiring Checklist

- [ ] Copy `vercel.json` to the project root
- [ ] Run `vercel link` to connect the local repo to a Vercel project (or create one in the dashboard)
- [ ] Set environment variables in the Vercel dashboard (Project → Settings → Environment Variables):
  - `VITE_API_URL` — your Railway server URL (e.g. `https://your-api.up.railway.app`)
- [ ] Push to main — Vercel deploys automatically on push
- [ ] Confirm the deployed app loads and can reach the API

---

## How It Works

`vercel.json` tells Vercel:
- Build command: `pnpm --filter "./apps/web" build`
- Output: `apps/web/dist`
- SPA rewrites: all routes serve `index.html` (required for React Router)

Vercel detects pnpm from the lockfile and uses it automatically.

---

## Environment Variables

| Variable | Where to set | Value |
|---|---|---|
| `VITE_API_URL` | Vercel dashboard | Railway server URL, e.g. `https://your-api.up.railway.app` |

Add to `.env.example`:
```
VITE_API_URL=http://localhost:3001   # overridden in Vercel dashboard for production
```

The local `.env` value (`http://localhost:3001`) is used in dev. Vercel's dashboard value overrides it in production builds.

---

## Preview Deployments

Vercel creates a preview URL for every pull request automatically. To make preview deploys hit the production API (rather than localhost), set `VITE_API_URL` for the **Preview** environment in Vercel's environment variable settings.

---

## Custom Domain

In the Vercel dashboard: Project → Domains → Add your domain. Update `CORS_ORIGIN` in Railway to match.

---

## Verification

1. Push to main
2. Vercel build log completes — no errors
3. Open the Vercel URL
4. Log in with seed credentials — confirms API connection is working
5. Check Network tab: requests go to your Railway URL, not localhost
