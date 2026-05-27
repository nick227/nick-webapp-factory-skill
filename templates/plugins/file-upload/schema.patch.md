# Schema additions for file-upload (optional)

Add a `Media` model only if you need to track uploads in the database — e.g. to list a user's uploaded files or enforce ownership on delete.

If you're only storing a `avatarUrl: String?` field on Profile, you do NOT need this model.

```prisma
model Media {
  id        String   @id @default(cuid())
  url       String                          // publicly accessible URL
  key       String   @unique                // opaque key for deletion (filename for local, object key for R2/S3)
  mimeType  String
  size      Int                             // bytes
  authorId  String
  author    User     @relation(fields: [authorId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
}

// Add to User model:
model User {
  // ... existing fields ...
  media     Media[]
}
```

After editing `schema.prisma`, run:

```bash
pnpm db:push
```
