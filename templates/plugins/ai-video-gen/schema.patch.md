# Schema additions for ai-video-gen

```prisma
model GeneratedVideo {
  id             String   @id @default(cuid())
  userId         String
  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  prompt         String   @db.Text
  provider       String   @default("kling")
  providerTaskId String?                         // Kling's internal task ID for polling
  status         String   @default("pending")    // pending | processing | completed | failed
  mediaKey       String?                         // set when completed — storage key for deletion
  mediaUrl       String?                         // set when completed — public video URL
  thumbnailUrl   String?                         // optional poster frame
  duration       Int      @default(5)            // seconds requested
  aspectRatio    String   @default("16:9")
  errorMsg       String?                         // set when failed
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@index([userId])
  @@index([providerTaskId])
}

// Add to User model:
model User {
  // ... existing fields ...
  generatedVideos GeneratedVideo[]
}
```

After editing `schema.prisma`, run:

```bash
pnpm db:push
```
