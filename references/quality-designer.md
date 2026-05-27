# Quality Designer

Use this optional workflow when visual quality, brand fit, or design variety matters.

Goal: produce a specific design direction before copying frontend packs or composing pages, then iterate with screenshots when a runnable app exists.

---

## Inputs To Resolve

Ask only what is missing and costly to guess:

- Business/app type
- Audience
- Primary user task
- Brand adjectives to use
- Brand adjectives to avoid
- Content density: sparse, balanced, dense
- Visual energy: calm, lively, premium, playful, utilitarian
- Media needs: none, product photos, people, food, dashboards, generated art
- App surface: marketing site, authenticated app, admin tool, marketplace, community

If the user gives enough signal, infer the rest and proceed.

---

## Design Artifacts

Copy and complete:

- `docs/design-brief.md`
- `docs/visual-system.md`
- `docs/asset-plan.md`
- `docs/design-critique.md`

`docs/design-brief.md` is copied from `templates/frontend-packs/designers/quality-designer/design-brief.md`. Key requirements:

- `Archetype:` must be named explicitly — not described in prose
- Theme Tokens must be exact CSS variable values — not adjectives
- Content And Media must describe specific seed data (names, prices, quantities) — not generic placeholders
- Verification Notes must be falsifiable checkpoints — not vibes

Keep it concrete. No generic phrases like "modern and clean" unless paired with exact choices.

`docs/visual-system.md` holds token, layout, component, motion, media, mobile, and accessibility decisions.

`docs/asset-plan.md` lists required images, generated assets, prompts, framing, fallbacks, and where each asset appears.

`docs/design-critique.md` is filled after screenshot review.

---

## Selection Rules

- Food, venue, hospitality: use rich media, tactile surfaces, strong first-viewport identity.
- Wellness: calm rhythm, generous whitespace, soft contrast, restrained motion.
- SaaS/admin: dense but quiet, fast scanning, tables/toolbars, minimal decoration.
- Creator/community: expressive feed surfaces, avatars, composer, media-forward cards.
- AI/tooling: workbench layout, strong input surfaces, visible outputs, state clarity.
- Luxury/premium: fewer elements, higher contrast, editorial spacing, exact typography.

Do not let every app become blue SaaS, purple gradients, beige wellness, or generic card grids.

---

## Install Flow

1. Read `templates/frontend-packs/designers/quality-designer/manifest.yaml`.
2. Read `style-matrix.yaml`.
3. Read `anti-defaults.md` and `screenshot-gate.md`.
4. Resolve inputs. Pin to an archetype explicitly — name it in `Archetype:` in the brief. If it's between two archetypes, name both and say which direction tilts.
5. Create design artifacts (`docs/design-brief.md`, `docs/visual-system.md`, `docs/asset-plan.md`). Fill every section. Theme Tokens must be exact CSS variable values — not adjectives. Content And Media must name the actual seed data characters (8 leather goods at $40–$280, not "some products"). Verification Notes must be falsifiable checkpoints, not vibes.
6. **Apply tokens immediately**: copy the Token Direction values from `docs/visual-system.md` into `apps/web/src/index.css` — overwrite the defaults. If a named theme pack matches (admin-ops, creator-social), copy its `tokens.css` instead. Do not leave the app running on slate defaults while docs say otherwise.
7. Select and copy component/page packs based on Page Composition. Install only what the composition actually uses.
8. Replace generated page stubs where matching page packs exist.
9. **Execute asset plan**: for each asset in `docs/asset-plan.md`, either source it (URL/file the user provides) or generate it using the Generation Prompts — via the `ai-image-gen` plugin if installed, or by prompting the user to generate externally. Write outputs to `apps/web/public/`. Update the Usage Map as assets land.
10. Verify mobile and desktop screenshots per `screenshot-gate.md` viewports and states.
11. Fill `docs/design-critique.md` against the pass checklist. Fix every item in "Issues To Fix" before declaring the design phase complete.

---

## Design Source Adapter: Figma

Use this only when the project already has a Figma file and the developer wants token values pulled directly rather than manually copied from Inspect. Figma is not an app plugin and is not required for quality-designer.

**Setup:**
1. Copy `templates/scripts/figma-sync.ts` → `scripts/figma-sync.ts`
2. Copy `templates/scripts/figma.config.example.json` → `figma.config.example.json`
3. Copy `figma.config.example.json` → `figma.config.json` (gitignored)
4. Get a Figma API token: figma.com → Account Settings → Personal access tokens
5. Add to `.env`: `FIGMA_API_TOKEN=your-token`
6. Add to root `package.json` scripts: `"figma:sync": "tsx scripts/figma-sync.ts"`
7. Add to root `.gitignore`: `figma.config.json`
8. Fill `figma.config.json`:
   - `fileId`: the ID in the Figma URL (`figma.com/file/{fileId}/...`)
   - `mapping`: Figma style name → CSS variable name

**The mapping problem:** Figma style names are arbitrary — your file might use `"Brand/Primary 500"` or `"blue-500"` or `"Action/CTA"`. The `figma.config.example.json` shows the expected format. Open Figma → Assets panel → Local styles to see your style names, then map each one to its CSS variable.

**Run:**
```bash
pnpm figma:sync
```

This fetches FILL styles from the Figma file, converts RGB colors to HSL values in the shadcn/ui convention (`210 40% 98%`), and writes a "Token Direction (from Figma)" section to `docs/visual-system.md`. Phase 3 step 10 then applies them to `src/index.css`.

**Re-run any time** the Figma file is updated. The section in visual-system.md is overwritten cleanly.

**Limitations:** Only solid FILL styles are supported. Text styles (font size, weight, line height) and effect styles (shadows, blurs) are skipped — map those manually in visual-system.md.

---

## Brief as a Living Document

The brief is not written once and forgotten. Re-read it:

- **Phase 3 — after copying index.css**: apply Token Direction overrides to `src/index.css`.
- **Phase 4 — before any domain page or component**: check Page Composition for the matching page. Match its density, component vocabulary, and archetype's `avoid:` list. If the layout you're about to build appears in `avoid:`, redesign — do not update the brief to permit the violation.
- **Phase 5 — before session close**: run through Verification Notes as the visual checklist alongside the functional golden-path items. Fill `docs/design-critique.md` if not already done.
