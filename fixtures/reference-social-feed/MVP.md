# MVP Definition - Reference Social Feed

**What it does:** Users sign up, log in, publish short text posts, and read a simple newest-first feed.

**Users:**
- Member: registers with email, username, and password; logs in; creates posts; reads the feed.

**In V1:**
- Email/password auth
- Current-user session
- User profile created during registration
- Create post
- Cursor-paginated feed

**Parking lot:**
- Follows
- Comments
- Reactions
- Notifications
- Media uploads
- Search
- Admin

**Stack override for fixture:** SQLite is used only to keep the factory smoke test self-contained.
