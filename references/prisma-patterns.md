# Prisma Patterns

## Model Conventions

- All models have `id String @id @default(cuid())`
- All models have `createdAt DateTime @default(now())`
- All models have `updatedAt DateTime @updatedAt`
- Soft deletes use `deletedAt DateTime?` — never hard-delete user content
- Suspension uses `suspendedAt DateTime?` — not a boolean; records when, reversible, queryable for duration
- Boolean flags use `is` prefix: `isActive`, `isVerified`

## User + Profile Split

Always separate `User` (auth/identity) from `Profile` (public-facing data).

```prisma
model User {
  id           String    @id @default(cuid())
  email        String    @unique
  passwordHash String
  isVerified   Boolean   @default(false)
  suspendedAt  DateTime?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  deletedAt    DateTime?

  profile      Profile?
  sessions     Session[]
}

model Profile {
  id          String   @id @default(cuid())
  userId      String   @unique
  username    String   @unique
  displayName String
  bio         String?
  avatarUrl   String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user        User     @relation(fields: [userId], references: [id])
}
```

## Follow / Social Graph

Always use an explicit join model — never an array field.

```prisma
model Follow {
  id          String   @id @default(cuid())
  followerId  String
  followingId String
  createdAt   DateTime @default(now())

  follower    User     @relation("Follower", fields: [followerId], references: [id])
  following   User     @relation("Following", fields: [followingId], references: [id])

  @@unique([followerId, followingId])
  @@index([followerId])
  @@index([followingId])
}
```

## Feed / Pagination

Use cursor-based pagination from the start. Public API cursors are opaque strings; services decode them into a stable `{ createdAt, id }` pair and sort by both fields.

```prisma
model Post {
  id        String    @id @default(cuid())
  authorId  String
  body      String    @db.Text
  mediaUrl  String?
  mediaType MediaType?
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  deletedAt DateTime?

  author    User      @relation(fields: [authorId], references: [id])
  comments  Comment[]
  reactions Reaction[]

  @@index([authorId])
  @@index([createdAt, id])
}

enum MediaType {
  IMAGE
  VIDEO
  AUDIO
}
```

## Notifications

Event-derived, typed by enum:

```prisma
model Notification {
  id        String           @id @default(cuid())
  userId    String
  type      NotificationType
  actorId   String?
  entityId  String?
  entityType String?
  isRead    Boolean          @default(false)
  createdAt DateTime         @default(now())

  user      User             @relation(fields: [userId], references: [id])

  @@index([userId, isRead])
  @@index([userId, createdAt])
}

enum NotificationType {
  NEW_FOLLOW
  NEW_COMMENT
  NEW_REACTION
  NEW_POST_FROM_FOLLOWED
  MENTION
}
```

## Session

```prisma
model Session {
  id        String   @id @default(cuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id])

  @@index([token])
  @@index([userId])
}
```

## Indexes

Always add indexes for:
- Foreign keys used in joins
- Fields used in WHERE clauses
- `createdAt` on any model that's paginated
- Composite unique constraints on join tables
