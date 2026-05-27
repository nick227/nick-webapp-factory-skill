# Social Modules

Reusable building blocks for apps with social network behavior.

---

## Auth Module

Routes: `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`

operationIds: `register`, `login`, `logout`, `getCurrentUser`

Auth uses httpOnly session cookies -- token is set via `Set-Cookie`, never returned in the body. Response body is `{ data: User }`.

Service responsibilities:
- Hash password with bcrypt (12 rounds)
- Create session record with `randomUUID()` token, 30-day expiry
- Set httpOnly cookie on login/register; clear it on logout
- Reject suspended users (`suspendedAt !== null`) with 403

Pages: `/login`, `/register`

---

## User + Profile Module

Routes:
- `GET /users/:username` -- public profile
- `PUT /users/me` -- update own profile
- `GET /users/search?q=` -- search by username/name

Service responsibilities:
- Username uniqueness validation
- Avatar upload handling (return URL, don't store file in DB)

Pages: `/profile/:username`, `/settings`

---

## Follow Module

Routes:
- `POST /follows/:userId` -- follow
- `DELETE /follows/:userId` -- unfollow
- `GET /users/:userId/followers` -- paginated followers list
- `GET /users/:userId/following` -- paginated following list

Service responsibilities:
- Prevent self-follow
- Return updated follower count
- Optionally trigger notification on follow

Key query pattern:

```typescript
// Check if current user follows another
const follow = await db.follow.findUnique({
  where: { followerId_followingId: { followerId: currentUserId, followingId: targetUserId } }
})
const isFollowing = !!follow
```

---

## Post / Feed Module

Routes:
- `POST /posts` -- create post
- `DELETE /posts/:id` -- soft delete own post
- `GET /posts/feed` -- cursor-paginated feed from follows
- `GET /users/:userId/posts` -- profile post list

Feed algorithm (MVP): posts from followed users + own posts, sorted by `createdAt DESC`, cursor-paginated.

Phase 2: ranked/relevance feed, scheduled posts, reposts.

---

## Comment Module

Routes:
- `POST /posts/:postId/comments`
- `DELETE /comments/:id`
- `GET /posts/:postId/comments` -- paginated

---

## Reaction Module

Routes:
- `POST /posts/:postId/reactions` -- toggle reaction (like/unlike)
- `GET /posts/:postId/reactions/count`

Store reaction type as enum for future emoji reactions.

---

## Notification Module

Routes:
- `GET /notifications` -- paginated unread-first
- `POST /notifications/read-all`

Notifications are created in service layer, never in route handlers. Always pass through a `NotificationService.create()` method.

```typescript
// Trigger notification from follow service
await notificationService.create({
  userId: targetUserId,
  type: 'NEW_FOLLOW',
  actorId: followerId
})
```

---

## Media Module

Keep media abstract. Store URL only in DB. Uploads go to S3/R2/Cloudflare or local disk in dev.

```typescript
// Generic media reference
mediaUrl?: string
mediaType?: 'IMAGE' | 'VIDEO' | 'AUDIO'
```

Phase 2: dedicated `Media` model with width/height/duration/thumbnailUrl.

---

## Search Module

MVP: simple MySQL `LIKE` queries on username and displayName.

Phase 2: Meilisearch or Algolia integration.

Routes:
- `GET /search?q=&type=users|posts`
