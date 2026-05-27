# Frontend Design System

Load this file at Phase 3 (frontend shell). It governs every visual and structural decision in `apps/web`.

---

## Philosophy

**Mobile-first.** Every component is designed at 320px and enhanced upward. `sm:` / `md:` / `lg:` add — they never subtract.

**Minimalist.** One primary action per screen. Surface only what the user needs right now. Secondary actions collapse into menus. Progressive disclosure for settings and advanced features.

**Declarative.** UI structure is declared as config, not written as JSX. Forms, field sets, and list renderers are driven by config arrays — the same philosophy as the OpenAPI spec driving server wiring.

**Generic names.** Components are named for what they are, not what business object they hold. `Card` not `PostCard`. `Avatar` not `UserAvatar`. `List` not `FeedList`. `Modal` not `CreatePostModal`. A component that needs a business-logic name belongs in `pages/`, not `components/`.

**Token-driven.** Every color, radius, and spacing value comes from a CSS variable. Nothing is hard-coded. Changing the theme means changing tokens, not hunting through files.

---

## Stack

| Concern | Choice |
|---|---|
| Styling | Tailwind CSS (token-driven, no custom CSS files) |
| Primitives | shadcn/ui (Radix-based, copied into project as source) |
| Icons | Lucide React |
| Forms | react-hook-form + zod resolver |
| Toasts | Sonner |
| Motion | Tailwind transitions by default; Framer Motion only if drag/page-transitions needed |
| Font | Geist Sans (Inter as fallback) |

---

## Design Tokens

CSS variables in `apps/web/src/index.css`. All Tailwind utilities reference these — never raw color values.

```css
@layer base {
  :root {
    --background: 0 0% 99%;
    --foreground: 240 10% 4%;

    --surface: 0 0% 96%;
    --surface-foreground: 240 6% 30%;

    --primary: 240 6% 10%;
    --primary-foreground: 0 0% 98%;

    --muted: 240 5% 94%;
    --muted-foreground: 240 4% 46%;

    --accent: 240 5% 90%;
    --accent-foreground: 240 6% 10%;

    --border: 240 6% 90%;
    --input-border: 240 6% 82%;
    --ring: 240 6% 10%;

    --destructive: 0 72% 51%;
    --destructive-foreground: 0 0% 98%;

    --radius: 0.5rem;
    --radius-sm: 0.25rem;
    --radius-lg: 0.75rem;
  }

  .dark {
    --background: 240 10% 4%;
    --foreground: 0 0% 98%;

    --surface: 240 8% 8%;
    --surface-foreground: 240 5% 65%;

    --primary: 0 0% 98%;
    --primary-foreground: 240 6% 10%;

    --muted: 240 6% 12%;
    --muted-foreground: 240 5% 55%;

    --accent: 240 5% 16%;
    --accent-foreground: 0 0% 98%;

    --border: 240 6% 16%;
    --input-border: 240 5% 22%;
    --ring: 240 5% 84%;

    --destructive: 0 63% 48%;
    --destructive-foreground: 0 0% 98%;
  }
}

* { border-color: hsl(var(--border)); }
body {
  background-color: hsl(var(--background));
  color: hsl(var(--foreground));
  font-family: 'Geist Sans', 'Inter', system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
}
```

Tailwind `tailwind.config.ts` maps these:
```typescript
import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        surface: { DEFAULT: 'hsl(var(--surface))', foreground: 'hsl(var(--surface-foreground))' },
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        border: 'hsl(var(--border))',
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
      },
      borderRadius: {
        DEFAULT: 'var(--radius)',
        sm: 'var(--radius-sm)',
        lg: 'var(--radius-lg)',
        full: '9999px',
      },
      fontFamily: {
        sans: ['Geist Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['Geist Mono', 'monospace'],
      },
    },
  },
} satisfies Config
```

---

## Component Primitives

Live in `apps/web/src/components/ui/`. Never import business objects. Props only.

**All primitives have working template files — copy them from the skill's `templates/components/` directory rather than generating from scratch.** See `references/registry.md` for the full phase-to-template mapping.

Key behaviors to know:

### Button
`templates/components/Button.tsx` — `cva`-based with 5 variants (`default`, `outline`, `ghost`, `destructive`, `link`) and 4 sizes (`sm`, `md`, `lg`, `icon`). `loading` prop replaces children with `<Spinner size="sm">` and disables the button.

### Input (voice-enabled)
`templates/components/Input.tsx` — all text inputs use this primitive, never raw `<input>`. The `voice` prop adds a microphone button via the shared Web Speech API hook; degrades gracefully if the API is unavailable. `onVoiceResult` fires with the transcript and also triggers `onChange` so react-hook-form picks it up.

### Textarea (voice-enabled)
`templates/components/Textarea.tsx` — same as Input but uses `continuous: true` recognition to handle longer dictation. `voiceMode="append"` is the default.

`templates/components/voice/useSpeechRecognition.ts` and `templates/components/voice/VoiceButton.tsx` — shared speech-to-text primitives used by Input/Textarea and any frontend pack that needs a mic button.

### Card
`templates/components/Card.tsx` — `Card` + `CardHeader` + `CardContent` + `CardFooter`. Surface-colored (`bg-surface`). All four sub-components are in one file.

### Avatar
`templates/components/Avatar.tsx` — rounded image with initials fallback. Props: `src`, `name`, `size` (`sm` | `md` | `lg`). Initials derived from the first letter of each word in `name`.

### EmptyState
`templates/components/EmptyState.tsx` — centered layout with optional icon, title, description, and action button. Always provide a `description` that tells the user what to do next — never leave it explanationless.

### Skeleton / Spinner / PageSpinner

`templates/components/Skeleton.tsx` — `animate-pulse` div, accepts any className for sizing.
`templates/components/Spinner.tsx` — `Loader2` icon in 3 sizes; `PageSpinner` centers in a 48px-tall container. Use `Spinner` for inline button loading; use `PageSpinner` or skeleton arrays for content areas.

---

## Declarative Form Pattern

`templates/components/Form.tsx` — copy verbatim. Forms are declared as a `FieldConfig[]` array + zod schema, not written field-by-field.

`FieldConfig` supports types: `text | email | password | textarea | url | tel`. Add `voice: true` to enable microphone input on any field. Textarea fields use `<Textarea>` (voice-enabled); all others use `<Input>`.

Usage — the only thing you write per form:

```typescript
const loginFields: FieldConfig[] = [
  { name: 'email', label: 'Email', type: 'email', placeholder: 'you@example.com' },
  { name: 'password', label: 'Password', type: 'password', placeholder: '••••••••' },
]

<Form fields={loginFields} schema={loginSchema} onSubmit={handleLogin} submitLabel="Sign in" />
```

---

## Page Layout

### Shell

`templates/layouts/Shell.tsx` — copy verbatim, then update `navItems` to match the app's routes and icons. Uses `<Outlet />` (react-router-dom) — wrap it in the route tree, not around `children`.

Two modes: fixed desktop sidebar (256px) + mobile bottom nav. Content constrained to `max-w-xl mx-auto`. No full-width sprawl.

---

## Toast Pattern

Use Sonner. Register `<Toaster>` once in `main.tsx`. Call `toast()` anywhere.

```typescript
// apps/web/src/main.tsx
import { Toaster } from 'sonner'

// inside JSX:
<Toaster position="bottom-center" richColors />
```

```typescript
// usage in mutation callbacks
import { toast } from 'sonner'

onSuccess: () => toast.success('Posted'),
onError: () => toast.error('Something went wrong'),
```

---

## Cognitive Load Rules

These are constraints, not suggestions. Apply them to every screen.

- **One primary action per screen.** If there are two important buttons, one of them should be somewhere else.
- **Collapse secondary actions.** Overflow menus (`⋯`) exist for edit/delete/report.
- **Empty states are instructional.** Never show a blank screen. Always explain what's missing and how to fix it.
- **Skeletons over spinners** for content areas. Use `<Spinner>` only for inline button actions.
- **Minimise required fields.** Ask for what you need, not everything you might want. Defaults over required.
- **No modals for navigation.** Modals are for confirmations and quick-compose. Complex flows get their own page.

---

## Dark Mode

`templates/lib/theme.ts` — copy verbatim to `apps/web/src/lib/theme.ts`. Reads `localStorage` and `prefers-color-scheme` to set `class="dark"` on `<html>` before React mounts (no flash). Exports `toggleTheme()` for a toggle button.

Import it at the top of `main.tsx` before the React import so it runs synchronously:

```typescript
import './lib/theme'  // must be first — sets dark class before React renders
import React from 'react'
```

---

## File Naming Rules

- Component files are PascalCase: `Button.tsx`, `Avatar.tsx`, `EmptyState.tsx`
- No business logic in file names: `Card.tsx` not `PostCard.tsx`
- Page files are PascalCase and may be domain-named since pages are inherently domain-specific: `Feed.tsx`, `Profile.tsx`
- Utility files are camelCase: `utils.ts`, `theme.ts`
- One component per file. No barrel exports from `components/ui/` except an explicit `index.ts`

---

## Primitive Checklist

Before Phase 4 (feature pages), verify these exist and are used consistently:

- [ ] `Button` — all 4 variants, all 3 sizes
- [ ] `Input` — with and without `voice` prop
- [ ] `Textarea` — with and without `voice` prop
- [ ] `Card`, `CardHeader`, `CardContent`, `CardFooter`
- [ ] `Avatar` — all 3 sizes, fallback initials working
- [ ] `EmptyState` — with and without action
- [ ] `Skeleton`
- [ ] `Spinner`, `PageSpinner`
- [ ] `Form` — declarative field config + zod resolver
- [ ] `Shell` — bottom nav on mobile, sidebar on desktop
- [ ] `Toaster` — registered in `main.tsx`
- [ ] Dark mode toggle functional
