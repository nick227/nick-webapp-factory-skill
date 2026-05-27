# Append to .env.example (cloudflare-r2 plugin)
# Also change STORAGE_PROVIDER=local to STORAGE_PROVIDER=r2

```env
# Cloudflare R2 (cloudflare-r2 plugin)
STORAGE_PROVIDER=r2
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-r2-access-key-id
R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
R2_BUCKET=your-bucket-name
# Public URL for serving files — either the R2 public bucket URL or your custom domain
R2_PUBLIC_URL=https://pub-xxxx.r2.dev
```
