# Plugin: file-upload

Adds file upload with a provider abstraction. Local storage works out of the box — no keys, no cloud account. Swap to R2 or S3 by setting `STORAGE_PROVIDER` and installing the matching provider plugin.

Routes: `POST /media/upload`, `DELETE /media/:key`
Local files served at: `GET /uploads/:filename` (dev only)

---

## Prerequisites

None for local storage. For production cloud providers, install the matching plugin:
- `cloudflare-r2` plugin — requires R2 bucket + API token
- `aws-s3` plugin — requires S3 bucket + IAM credentials

---

## Files to Copy

| Source | Destination |
|---|---|
| `server/providers/storage.ts` | `apps/server/src/providers/storage.ts` |
| `server/providers/LocalStorageProvider.ts` | `apps/server/src/providers/LocalStorageProvider.ts` |
| `server/services/MediaService.ts` | `apps/server/src/services/MediaService.ts` |
| `server/handlers/media.ts` | `apps/server/src/handlers/media.ts` |
| `server/plugins/uploads.ts` | `apps/server/src/plugins/uploads.ts` |
| `sdk/hooks/useUpload.ts` | `packages/sdk/src/hooks/useUpload.ts` |
| `web/components/FileUpload.tsx` | `apps/web/src/components/FileUpload.tsx` |

---

## Wiring Checklist

- [ ] Copy all files from the table above
- [ ] Apply `schema.patch.md` (optional — only if tracking uploads in DB)
- [ ] Run `pnpm db:push` if schema was updated
- [ ] Add vars from `env.patch.md` to `.env.example` and `.env`
- [ ] Merge `openapi.patch.yaml` into `packages/api-spec/openapi.yaml`
- [ ] Run `pnpm sdk:generate`
- [ ] Add to `apps/server/package.json` dependencies:
  ```json
  "@fastify/multipart": "^8.0.0",
  "@fastify/static": "^7.0.0",
  "fastify-plugin": "^4.0.0"
  ```
- [ ] Add to `apps/server/src/index.ts` **before** the glue registration:
  ```typescript
  import uploadsPlugin from './plugins/uploads'
  // inside main():
  await server.register(uploadsPlugin)
  ```
- [ ] Add `export * from './media'` to `apps/server/src/handlers/index.ts`
- [ ] Add `export * from './useUpload'` to `packages/sdk/src/hooks/index.ts`
- [ ] Add `uploads/` to `.gitignore` (local files should not be committed)
- [ ] Run `pnpm test:generate` — stubs for `uploadMedia` and `deleteMedia` will appear

---

## .gitignore entry

```
apps/server/uploads/
```

---

## Switching to a cloud provider

1. Install the cloud provider plugin (`cloudflare-r2` or `aws-s3`)
2. Copy the provider file to `apps/server/src/providers/`
3. Set `STORAGE_PROVIDER=r2` (or `s3`) in `.env`
4. `pnpm dev` — the factory in `storage.ts` picks up the new provider automatically

No handler, service, or route changes needed.

---

## Allowed file types

Defined in `MediaService.ts` as `ALLOWED_TYPES`. Default allow-list:
images (jpeg, png, gif, webp), video (mp4, webm), audio (mpeg, wav, ogg), pdf.

Edit the allow-list in `MediaService.ts` to match your app's needs.

---

## Testing

The test app needs `@fastify/multipart` registered. Add this to `buildTestApp()` in `apps/server/src/__tests__/helpers/index.ts`, inside `beforeAll` before the `openapiGlue` registration:

```typescript
import multipart from '@fastify/multipart'
// inside beforeAll:
await app.register(multipart)
```

Testing upload with a real file buffer:

```typescript
import { createReadStream } from 'fs'
import FormData from 'form-data'

it('POST /media/upload', async () => {
  const form = new FormData()
  form.append('file', createReadStream('./src/__tests__/fixtures/test.jpg'))

  const res = await app.inject({
    method: 'POST',
    url: '/media/upload',
    headers: { ...asAuth(testUserId), ...form.getHeaders() },
    payload: form,
  })
  expect(res.statusCode).toBe(201)
  expect(res.json().data.url).toBeTruthy()
})
```

Add a small `fixtures/test.jpg` to the test directory. Set `STORAGE_PROVIDER=local` and `BASE_URL=http://localhost:3001` in the test environment.

---

## Verification

1. `pnpm dev`
2. `curl -F "file=@/path/to/image.jpg" -b "token=..." http://localhost:3001/media/upload`
3. Response should include `{ data: { url, key, mimeType, size } }`
4. For local: `GET http://localhost:3001/uploads/{key}` should serve the file
