# Discovery Phase

Run this phase at the start of every new project. The goal is a written MVP definition the developer approves before a single file is written.

**Skip this phase entirely** when continuing an existing project (`CLAUDE.md` already exists, or the developer says "keep going", "continue", etc.).

---

## When to Run Discovery

- Developer asks to build or scaffold a new app
- No `CLAUDE.md` exists at the project root
- The prompt is a first-session description of an idea

---

## The Four Questions

Ask all four in a single message. Do not ask them one at a time — that wastes turns.

```
Before I start building, I need to understand the scope. Four quick questions:

1. **What does it do?**
   One sentence — who are the users and what do they accomplish?
   (e.g. "Freelancers invoice clients and track payments")

2. **Who are the users? Are there roles?**
   Single user type, or multiple? (e.g. buyer/seller, creator/viewer, admin/member, employer/candidate)

3. **What are the 3–5 most important things a user can do in V1?**
   These become the MVP modules. Be specific — not "social features" but "follow other users" and "see a feed of posts from followed users."

4. **What's explicitly NOT in V1?**
   Anything you want to defer? Calling it out now prevents scope creep.
   (e.g. "No payments, no mobile app, no admin panel")

Bonus — if you have any of these, mention them:
- Stack overrides (different DB, must use Next.js, existing auth system, etc.)
- Plugins you know you'll need (file uploads, Google login, AI chat, image gen, video gen)
- Launch timeline or constraints
```

---

## Interpreting Answers

**Partial answers are fine.** If the developer answers 3 of 4, fill in the gap with a reasonable default and note the assumption in the MVP Definition.

**Vague answers get one follow-up.** If the answer to Q3 is "the usual social stuff", reply:

> "By 'social stuff' do you mean: posts/feed, follows, comments, reactions, DMs? Pick the subset that belongs in V1."

Only one follow-up per question. Don't keep probing — make a reasonable call and note it as an assumption.

**Don't ask questions you can derive.** If the developer says "a marketplace for freelance designers", you know there are two user roles (designer and client). Don't ask Q2 again.

---

## MVP Definition Format

After getting answers, write this document in the chat. Keep it tight — it should fit in one screen.

```markdown
## MVP Definition — [App Name]

**What it does:** [one-liner from Q1]

**Users:**
- [Role 1]: [what they do]
- [Role 2]: [what they do]  ← omit if single role

**In V1:**
- [module / feature 1]
- [module / feature 2]
- [module / feature 3]
- [etc.]

**Parking lot (V2+):**
- [deferred feature 1]
- [deferred feature 2]

**Stack:** [defaults / any overrides]

**Plugins:** [list, or "will confirm after Phase 2"]

**Assumptions:**
- [any gap you filled with a default — e.g. "Assumed single currency, USD"]
```

Then end with exactly:

> **Does this scope look right? Say "build it" and I'll start Phase 1.**

---

## Transition to Phase 1

When the developer approves (says "build it", "yes", "looks good", "go", or equivalent):

1. Write the MVP Definition to `CLAUDE.md` at the project root under a `## MVP` section — this becomes the project memory
2. Immediately start Phase 1 — no further questions
3. Never return to the discovery phase in this project

If the developer adjusts scope (adds or removes features), update the MVP Definition in the chat and ask for approval again. One revision round maximum.

---

## Common Mistakes to Avoid

- **Don't start building before approval.** The MVP Definition exists to prevent wasted work on the wrong scope.
- **Don't ask more than four questions up front.** More questions = developer fatigue = vague answers.
- **Don't ask about implementation details.** Database choice, component names, color schemes — those are your decisions, not discovery questions.
- **Don't conflate "parking lot" with "never."** Phase 2 items get a `## Phase 2` comment in relevant files. They ship eventually.
- **Don't skip the "Assumptions" section.** Every assumed default is a potential surprise. Surface them explicitly.

---

## Example

**Developer prompt:** "Build me an app where people can sell handmade goods."

**Skill response:**

> Before I start building, I need to understand the scope. Four quick questions:
>
> 1. **What does it do?** One sentence — who are the users and what do they accomplish?
> 2. **Who are the users? Are there roles?** (e.g. buyer/seller)
> 3. **What are the 3–5 most important things a user can do in V1?**
> 4. **What's explicitly NOT in V1?**
>
> Bonus: any stack overrides or plugins you know you'll need?

**Developer answers:**

> 1. Sellers list handmade products and buyers purchase them directly.
> 2. Two roles: seller and buyer. Sellers can also buy.
> 3. Sellers: create listings with photos, manage their shop, see their orders. Buyers: browse listings, buy, track orders.
> 4. No subscriptions, no physical shipping integration, no reviews in V1.

**Skill produces:**

```markdown
## MVP Definition — Handmade Marketplace

**What it does:** Sellers list handmade products and buyers purchase them directly.

**Users:**
- Seller: creates listings, manages their shop, sees orders received
- Buyer: browses and purchases listings, tracks their orders
- (A user can be both)

**In V1:**
- Auth (register/login)
- User profile + shop profile (sellers)
- Product listings (create, edit, delete, photo upload)
- Browse + search listings
- Checkout (Stripe — buy now, no cart)
- Orders (buyer order history, seller order management)

**Parking lot (V2+):**
- Reviews and ratings
- Shipping carrier integration
- Subscriptions / featured listings
- Buyer wishlist

**Stack:** defaults (Vite + React, Fastify, MySQL, Prisma)

**Plugins:** file-upload (product photos), stripe (payments — install after Phase 2)

**Assumptions:**
- Stripe for payments; no cart — buy now only
- Single currency (USD); multi-currency is V2
- No admin panel in V1
```

> **Does this scope look right? Say "build it" and I'll start Phase 1.**
