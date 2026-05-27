# Plugin: google-auth

Adds Google Sign-In using the ID token flow. The frontend uses the Google Identity Services script to get a credential (JWT), sends it to `POST /auth/google`, and the server verifies it with `google-auth-library`. On success the server creates or finds the user and sets the same httpOnly session cookie as email/password login.

No redirect URLs. No OAuth callback routes. Works with the existing session model unchanged.

---

## Prerequisites

1. Google Cloud project with OAuth 2.0 credentials
2. In the Google Console: Authorized JavaScript origins must include `http://localhost:5173` (dev) and your production domain
3. Copy your **Client ID** — it goes in both `GOOGLE_CLIENT_ID` and `VITE_GOOGLE_CLIENT_ID`

---

## Files to Copy

| Source | Destination |
|---|---|
| `server/handlers/googleAuth.ts` | `apps/server/src/handlers/googleAuth.ts` |
| `server/services/GoogleAuthService.ts` | `apps/server/src/services/GoogleAuthService.ts` |
| `sdk/hooks/useGoogleAuth.ts` | `packages/sdk/src/hooks/useGoogleAuth.ts` |
| `web/components/GoogleLoginButton.tsx` | `apps/web/src/components/GoogleLoginButton.tsx` |

---

## Wiring Checklist

- [ ] Apply `schema.patch.md` to `packages/db/prisma/schema.prisma`
- [ ] Run `pnpm db:push`
- [ ] Add vars from `env.patch.md` to `.env.example` and `.env`
- [ ] Merge `openapi.patch.yaml` blocks into `packages/api-spec/openapi.yaml`
- [ ] Run `pnpm sdk:generate`
- [ ] Copy handler and service files (see table above)
- [ ] Add `export * from './googleAuth'` to `apps/server/src/handlers/index.ts`
- [ ] Add `google-auth-library` to `apps/server/package.json` dependencies
- [ ] Copy SDK hook; add `export * from './useGoogleAuth'` to `packages/sdk/src/hooks/index.ts`
- [ ] Copy `GoogleLoginButton.tsx` to web
- [ ] Add Google Identity Services script to `apps/web/index.html` (see below)
- [ ] Drop `<GoogleLoginButton />` onto your login and register pages
- [ ] Run `pnpm test:generate` — stubs for `googleAuth` will appear

---

## index.html script tag

Add inside `<head>` in `apps/web/index.html`:

```html
<script src="https://accounts.google.com/gsi/client" async defer></script>
```

---

## Verification

1. Start `pnpm dev`
2. Navigate to `/login`
3. Click "Continue with Google" — Google picker appears
4. Choose an account — you should be redirected to `/` as a logged-in user
5. Check the browser DevTools → Application → Cookies: `token` cookie should be set, httpOnly

---

## Testing

`POST /auth/google` calls `google-auth-library`'s `verifyIdToken` — this requires a real Google-issued JWT. It cannot be tested with a fake token in integration tests.

**What to test:**

```typescript
it('rejects missing credential', async () => {
  const res = await app.inject({
    method: 'POST', url: '/auth/google',
    payload: {},
  })
  expect(res.statusCode).toBe(400)
})
```

**For the full flow:** test manually via the browser (Verification steps below), or use a Playwright test with a real Google test account. Add it to `apps/web/e2e/smoke.spec.ts` under a `test.describe('google auth')` block that is skipped on CI unless `GOOGLE_TEST_EMAIL` is set.

---

## Known Limitations

- Requires a Google Cloud project. Cannot be tested offline.
- `GOOGLE_CLIENT_ID` and `VITE_GOOGLE_CLIENT_ID` are the same public Client ID. Keep `GOOGLE_CLIENT_SECRET` out of the frontend — this plugin does not use it.
- The ID token approach works for web apps. For native apps (React Native) the flow differs; use `expo-auth-session` and send the same credential to the same endpoint.
