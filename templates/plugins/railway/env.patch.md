# Railway Environment Variables

Add to `.env.example` (Railway sets these in the dashboard, not in `.env`):

```
# Railway — set these in the Railway service environment panel, not in .env
DATABASE_URL=                   # injected by Railway from linked MySQL service
PORT=                           # injected by Railway automatically
NODE_ENV=production
SESSION_SECRET=                 # openssl rand -base64 32
CORS_ORIGIN=https://your-app.vercel.app
```

Local `.env` values are unchanged — Railway env vars only apply to the deployed service.
