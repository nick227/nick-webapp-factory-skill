# Frontend Pack Guide

Frontend packs are copy-first UI assets. Keep instructions short; put value in files.

Install:

1. Read `manifest.yaml` for human context and `pack.manifest.json` for install metadata.
2. Run `pnpm factory:add frontend-pack {name-or-path}`. If the generated project cannot locate the skill templates, set `NICK_WEBAPP_FACTORY_ROOT=/path/to/nick-webapp-factory` or pass `--templates /path/to/nick-webapp-factory`.
3. Install package deps printed by the installer.
4. Apply token imports, page replacements, and exports printed by the installer.
5. Replace generated page stubs only when the pack is selected for the app's actual routes.
6. Do not add backend routes.
7. Do not add raw fetch.
8. Verify mobile and desktop.

Rules:

- Pages use SDK hooks only.
- Components receive props and do not fetch.
- Styles use token CSS and existing Tailwind tokens.
- Packs may depend on core UI primitives.
- Mock content is for seeds, demos, and empty/loading previews only.
- `pack.manifest.json` is the automation contract; `manifest.yaml` is the compact context guide for agents.
