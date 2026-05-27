# Append to .env.example

```env
# File uploads (file-upload plugin)
# local | r2 | s3  — defaults to local, no keys needed
STORAGE_PROVIDER=local

# Max upload size in megabytes (default: 10)
UPLOAD_MAX_SIZE_MB=10

# Public base URL used to build local file URLs.
# In production with a cloud provider this is ignored (provider returns its own URL).
BASE_URL=http://localhost:3001
```
