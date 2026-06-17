# Domain & MVP Defaults

## Default App Modules

Include only modules that serve the MVP. Standard candidates:

- Auth (session-based or JWT)
- User + Profile (keep separate)
- Follow / Connection (explicit join model)
- Post / Feed (cursor-paginated)
- Comment
- Reaction / Like
- Notification (event-derived)
- Media (abstract: image/audio/video)
- Search
- Settings
- Admin (only if explicitly needed)

## Social App Defaults

When the app has social features:

- `User` and `Profile` are separate models.
- Follows/friendships are explicit join models (never just an array field).
- Feed is cursor-paginated from the start.
- Notifications are derived from events, not written ad hoc.
- Media model is abstract enough to support image, audio, and video later.

## MVP Discipline

Always separate:

- **MVP** — what ships first
- **Phase 2** — what comes next
- **Parking lot** — ideas that don't belong yet

Do not implement Phase 2 items during MVP build. Add a `## Phase 2` comment in relevant files to mark deferred work.
