# Frontend Pack Catalog

Frontend packs are opt-in UI assets. Use them in Phase 3 or Phase 4 when the user asks for a visual direction, prebuilt pages, reusable component packs, or mock content. They do not add backend routes.

| Pack | Type | What it adds | Install reference |
|---|---|---|---|
| `quality-designer` | design-workflow | design brief workflow and style matrix for non-generic visual direction | `templates/frontend-packs/designers/quality-designer/manifest.yaml` |
| `admin-ops` | theme | restrained ops/dashboard token set | `templates/frontend-packs/themes/admin-ops/manifest.yaml` |
| `creator-social` | theme | warm creator/community token set | `templates/frontend-packs/themes/creator-social/manifest.yaml` |
| `data-table` | component | generic table shell with search and load-more controls | `templates/frontend-packs/components/data-table/manifest.yaml` |
| `activity-feed` | component | feed item list and composer components | `templates/frontend-packs/components/activity-feed/manifest.yaml` |
| `smart-media` | component | lazy image/video wrappers with shimmer and intrinsic size capture | `templates/frontend-packs/components/smart-media/manifest.yaml` |
| `slideshow` | component | hero slider (Embla, CTA overlay) + gallery browser (thumbnail grid + main) | `templates/frontend-packs/components/slideshow/manifest.yaml` |
| `animation` | component | Framer Motion primitives — FadeIn, SlideUp, StaggerList, PageTransition (~100kb) | `templates/frontend-packs/components/animation/manifest.yaml` |
| `charts` | component | Recharts charts wired to CSS token colors — Line, Bar, Area, Pie (~300kb) | `templates/frontend-packs/components/charts/manifest.yaml` |
| `feed` | page | composed FeedPage using SDK feed hooks | `templates/frontend-packs/pages/feed/manifest.yaml` |
| `dashboard` | page | compact dashboard page scaffold | `templates/frontend-packs/pages/dashboard/manifest.yaml` |
| `creator-social` | mock-content | creator profiles and posts fixtures | `templates/frontend-packs/mock-content/creator-social/manifest.yaml` |

**To install a frontend pack:**
1. Read `manifest.yaml` for context
2. Run `pnpm factory:add frontend-pack {name-or-path}`
3. Install package deps and apply exports/manual wiring printed by the installer
4. Verify mobile and desktop

See `references/frontend-pack-guide.md` for the frontend pack interface.

Use `references/quality-designer.md` before selecting packs when the user asks for studio-quality, brand-specific, varied, polished, non-generic, or design-heavy output. For those requests, complete visual QA from `references/visual-qa.md` before final when a runnable app exists.
