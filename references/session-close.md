# Session Close Protocol

Run this as the final step of Phase 5. The session is not done until the developer confirms the app works in their browser.

---

## Step 1 — Run Automated Tests First

Before asking the developer to open a browser, run the test suite:

```bash
pnpm test          # Vitest — server integration tests
pnpm test:e2e      # Playwright — frontend smoke test (requires both servers running)
```

Fix any failures before proceeding. If `test:e2e` fails on a specific step, fix it or note it explicitly — don't paper over it with a "manually verify instead."

A passing Playwright smoke test means the auth loop already works. The manual checklist in Step 3 focuses on the app-specific flows the smoke test doesn't cover.

---

## Step 2 — Start the App

Run bootstrap if it hasn't been run yet, otherwise just start dev:

```bash
pnpm bootstrap
# then (already runs as part of bootstrap, but confirm it stays up):
pnpm dev
```

Report the result:

```
Server running at http://localhost:3001
Web app running at http://localhost:5173
```

If either fails, fix it before proceeding. Do not hand off a broken app.

---

## Step 3 — Surface Seed Credentials

State the seed credentials explicitly so the developer doesn't have to hunt for them:

```
Seed credentials:
  alice@example.com / password123  (regular user)
  bob@example.com / password123    (regular user)
```

Adapt to whatever names and roles the seed script created. If the app has admin users, list those too.

---

## Step 4 — Golden Path Checklist

Write a short, numbered checklist tailored to the app's actual MVP modules. This is what the developer opens in their browser and verifies manually. Keep it to 6–10 items covering the core user journey.

**Template — adapt to the specific app:**

```
The Playwright smoke test already confirmed: login, logout, register, and
unauthenticated redirect. Focus the manual checklist on app-specific flows:

Open http://localhost:5173, log in as alice@example.com / password123, then verify:

 1. [Core create action — e.g. "Create a post" / "Add a listing" / "Submit a review"]
    → item appears immediately in the list
 2. [Core browse action — e.g. "Feed shows posts" / "Directory shows listings"]
 3. [Social action if present — e.g. "Follow bob" → bob's posts appear in feed]
 4. [Secondary feature — e.g. "Leave a comment" / "Upload a photo" / "Send a message"]
 5. [Dark mode toggle if built — switches without flash]
 6. On mobile (320px wide) — shell nav appears at bottom, content is readable
```

**Plugin-specific items to add:**
- If `file-upload`: "Upload a photo → appears inline after upload"
- If `google-auth`: "Sign in with Google button appears on login page"
- If `ai-chat`: "Chat widget opens, sends a message, response streams in"
- If `ai-image-gen`: "Image generator accepts a prompt, shimmer shows, image appears"
- If `ai-video-gen`: "Video generator submits, status shows 'Generating…', polling starts"

---

## Step 5 — Write CLAUDE.md

Write `CLAUDE.md` at the project root with this structure. This is the memory for the next session.

```markdown
# [App Name]

## Status
Phase 5 complete — app verified in browser [date].

## MVP Scope
[paste the approved MVP Definition from Phase 0, or summarize what was built]

## Modules Built
- Auth (register, login, logout, session cookie)
- [Module 2]
- [Module 3]
- [etc.]

## Plugins Installed
- [plugin name] — [brief note, e.g. "STORAGE_PROVIDER=local, swap to r2 for prod"]
- none

## Stack
- Defaults (Vite + React, Fastify, MySQL, Prisma)
- [Any deviations — e.g. "PostgreSQL instead of MySQL"]

## Seed Credentials
- alice@example.com / password123
- bob@example.com / password123
- [admin@example.com / password123 — admin role] ← if applicable

## Parking Lot (V2)
- [item from Phase 0 parking lot]
- [item from Phase 0 parking lot]
- [any new items deferred during build]

## Known Deviations
- [anything that differs from the factory defaults or the approved MVP Definition]

## Next Session
Read this file first, then pick up at [next uncompleted task or Phase 6].
```

---

## Step 6 — Wait for Confirmation

After showing the checklist and seed credentials, say:

> **Open http://localhost:5173 and walk through the list above. Let me know what you find.**

Then wait. Do not summarize or declare success — the developer hasn't confirmed yet.

**If the developer confirms ("works", "all good", "looks great"):**
- Session is done.
- Give the handoff message (Step 6).

**If the developer reports a bug:**
- Fix it.
- Re-run the affected checklist items.
- Do not re-run the entire checklist — just the affected flow.
- Wait for confirmation again.

**If the developer asks to defer a bug:**
- Add it to the `CLAUDE.md` parking lot.
- Note it in the handoff message.

---

## Step 7 — Handoff Message

Once confirmed, close with a compact summary. Three parts:

1. **What was built** — one sentence per module (not a list of files)
2. **What's parked** — the V2 items from the MVP Definition
3. **How to resume** — the one command they need

**Example:**

```
Done. Here's what shipped:

**Built:** Auth with sessions, user profiles, post feed with cursor pagination,
follow/unfollow, comments, reactions, notifications.

**Parked for V2:** Search, DMs, admin panel, push notifications.

**To resume:** Run `pnpm dev` and tell me what to build next. CLAUDE.md has
the full state — any new session starts by reading it.
```

Keep it under 10 lines. No bullet lists for every file. No "I created X, then I did Y" narration.

---

## What "Session Done" Means

The session is done when:
- The app starts with `pnpm dev`
- The developer has seen the core flow work in their browser
- `CLAUDE.md` exists and is accurate
- The parking lot is documented

It is NOT done if:
- The developer hasn't opened the browser yet
- The build passes but `pnpm bootstrap` fails
- There's a known broken flow the developer hasn't explicitly deferred

---

## Next Session Entry Point

When the developer returns and says "keep going" or "continue":

1. Read `CLAUDE.md`
2. If Phase 5 is complete: ask what they want to do (Phase 6 docs, a V2 feature, a plugin)
3. If Phase 5 is incomplete: resume at the last uncompleted step
4. Never ask "where were we?" — `CLAUDE.md` tells you
