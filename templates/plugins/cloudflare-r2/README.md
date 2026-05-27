# Plugin: cloudflare-r2

Swaps the `file-upload` plugin's storage backend to Cloudflare R2.

**Requires:** `file-upload` plugin must already be installed.

R2 is S3-compatible, so this uses `@aws-sdk/client-s3` — the same SDK you'd use for AWS S3. No separate Cloudflare SDK needed.

---

## Prerequisites

1. Cloudflare account with R2 enabled
2. Create an R2 bucket
3. Create an R2 API token with "Object Read & Write" permissions
4. (Recommended) Enable public access on the bucket OR set up a custom domain for serving files

---

## Files to Copy

| Source | Destination |
|---|---|
| `server/providers/R2StorageProvider.ts` | `apps/server/src/providers/R2StorageProvider.ts` |

No new routes, handlers, hooks, or components. The `file-upload` plugin's factory detects `STORAGE_PROVIDER=r2` and loads this provider automatically.

---

## Wiring Checklist

- [ ] Copy `R2StorageProvider.ts` to `apps/server/src/providers/`
- [ ] Add `@aws-sdk/client-s3` to `apps/server/package.json` dependencies
- [ ] Add vars from `env.patch.md` to `.env.example` and `.env`
- [ ] Set `STORAGE_PROVIDER=r2` in `.env`
- [ ] Restart the server — files now go to R2

---

## Verification

1. Upload a file via the app
2. Check your R2 bucket in the Cloudflare dashboard — the file should appear
3. The returned `url` should be your `R2_PUBLIC_URL` + the object key
