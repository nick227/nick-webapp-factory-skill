# Schema additions for google-auth

Add `googleId` to the `User` model. This field stores the Google account's unique subject identifier so returning users are found by their Google account, not just email.

```prisma
model User {
  // ... existing fields ...
  googleId  String?  @unique  // null for email/password users
}
```

After editing `schema.prisma`, run:

```bash
pnpm db:push
```

No migration needed for dev. For production use `prisma migrate dev`.
