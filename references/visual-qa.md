# Visual QA

Use after implementing design-heavy frontend work.

Gate:

1. Run the app.
2. Capture desktop and mobile screenshots.
3. Compare against `docs/design-brief.md` and `docs/visual-system.md`.
4. Fill `docs/design-critique.md`.
5. Revise UI until the checklist passes.

Pass criteria:

- First viewport clearly signals the specific product/domain.
- Mobile and desktop both look intentionally designed.
- No text overlap, clipped controls, or layout shift.
- Palette is not a generic default.
- At least three domain-specific visual details are present.
- Loading, empty, and error states match the visual system.
- Media has stable dimensions or a deliberate placeholder.
- Primary actions are obvious.
- Content density matches the brief.
- The result avoids the listed anti-defaults.

Do not final a studio-quality request before this gate passes when a runnable app exists.
