# Reference Social Feed Smoke Fixture

This fixture is the permanent copy-safety check for `nick-webapp-factory`.

It represents an approved, intentionally boring MVP:

- Email/password auth with httpOnly session cookies
- Profiles created at registration
- A protected feed page
- Create post
- Cursor-paginated feed

Run from the skill root:

```bash
node scripts/smoke-reference-app.mjs
```

The smoke script builds a fresh app in a unique temp directory, copies canonical templates into it, overlays the MVP-specific files from this fixture, and verifies:

1. `pnpm install`
2. `pnpm db:push`
3. `pnpm sdk:generate`
4. `pnpm sdk:check`
5. `pnpm test:generate`
6. `pnpm pages:generate`
7. server boot via `/health`
8. web boot via Vite
9. `pnpm test`
10. `pnpm db:seed`
11. Playwright Chromium install
12. `pnpm --filter web test:e2e`

The fixture uses SQLite so the smoke test is self-contained. Product apps still default to MySQL unless their approved MVP overrides the database.

## Verified Baseline

Verified on Windows / PowerShell on 2026-05-27:

- `pnpm install`
- `pnpm db:push`
- `pnpm sdk:generate`
- `pnpm sdk:check`
- `pnpm test:generate`
- `pnpm pages:generate`
- `pnpm typecheck`
- server boot check
- web boot check
- `pnpm test`
- `pnpm db:seed`
- `pnpm --filter web exec playwright install chromium`
- `pnpm --filter web test:e2e`

Result: 10 Vitest server tests passed and 3 Playwright Chromium tests passed.

Playwright requires host browser libraries. On Debian/Ubuntu runners, install them once with:

```bash
cd /tmp/nick-webapp-factory/reference-social-feed/apps/web
pnpm exec playwright install --with-deps chromium
```

If the command prompts for `sudo`, run it in the CI image or host setup step before executing the smoke script.

For debugging a stable output directory, set `FACTORY_SMOKE_DIR`:

```bash
FACTORY_SMOKE_DIR=/tmp/nick-webapp-factory/reference-social-feed node scripts/smoke-reference-app.mjs
```

On Windows, prefer the default unique temp directory for normal runs because active dev-server or browser processes can keep files locked after failures.
