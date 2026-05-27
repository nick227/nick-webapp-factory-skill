# Design Brief

## Product

<!-- One sentence: what the app does and for whom. -->

## Audience

<!-- Primary user. Their context, technical level, and what matters to them. -->

## Design Direction

Archetype: <!-- bbq-joint | wellness-app | saas-admin | creator-social | ai-workbench | marketplace | custom -->

Identity: <!-- quiet | expressive | premium | playful | utilitarian -->
Density: <!-- sparse | balanced | dense -->
Shape: <!-- sharp | soft | tactile -->
Media: <!-- none | editorial | product | people | dashboard | generated -->

<!-- One paragraph: the specific visual character. No generic phrases. -->

## Layout System

<!-- Shell type (sidebar/bottom-nav), primary page pattern (feed/detail/grid/workbench), key layout decisions. -->

## Theme Tokens

<!-- Exact values. Document your token direction here for reference.
     Phase 3 applies token overrides from docs/visual-system.md —
     copy these values into its Token Direction section. -->

```
--background: ;
--foreground: ;
--card: ;
--primary: ;         /* main action color */
--primary-foreground: ;
--accent: ;
--muted: ;
--border: ;
--radius: ;          /* e.g. 0.375rem for soft, 0 for sharp */
```

Dark mode overrides (if different from auto-invert):
```
/* .dark { ... } */
```

## Component Packs

<!-- Which frontend-packs/components/ to copy (data-table, activity-feed, smart-media). One bullet each with why. -->

## Page Composition

<!-- For each main page: which components it uses, density, dominant element.
     Format: PageName → [component list] — one sentence description. -->

## Content And Media

<!-- What seed data looks like: realistic names, quantities, categories, image style.
     The skill reads this when writing seed.ts. Be specific — not "some products" but "8 handmade leather goods with artisan names, $40–$280 price range." -->

## Avoid

<!-- List specific patterns from the archetype's avoid list + any project-specific exclusions. -->

## Verification Notes

<!-- Concrete visual checkpoints for the Phase 5 manual review.
     Not "looks good" — exact, falsifiable criteria. -->

- [ ] Hero / first viewport:
- [ ] Primary action color (no default blue visible):
- [ ] Card density at 1440px wide:
- [ ] Mobile at 320px — shell nav at bottom, no horizontal scroll:
- [ ] Dark mode — no harsh flash, token swap is complete:
- [ ] Typography — heading weight and body contrast match brief:
- [ ] Seed content — realistic names and data (not lorem ipsum or alice/bob):
- [ ] Empty states — styled, not browser-default:
