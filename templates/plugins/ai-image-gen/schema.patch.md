# Schema additions for ai-image-gen

Add the `GeneratedImage` model to track generation history and enable per-user galleries.

```prisma
model GeneratedImage {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  prompt    String   @db.Text
  provider  String                          // dezgo | openai | local
  mediaKey  String                          // storage key for deletion via file-upload plugin
  mediaUrl  String                          // public URL served to clients
  width     Int
  height    Int
  createdAt DateTime @default(now())

  @@index([userId])
}

// Add to User model:
model User {
  // ... existing fields ...
  generatedImages GeneratedImage[]
}
```

After editing `schema.prisma`, run:

```bash
pnpm db:push
```

> **Note:** The `GeneratedImage` model is optional. If you only need to display the image immediately after generation without a history/gallery feature, skip this model and remove the `prisma.generatedImage.create()` call from `ImageGenService.ts`.
