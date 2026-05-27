import { db } from '@project/db'
import { afterEach } from 'vitest'

// clean between tests — order matters for FK constraints
// adapt this list to match the project's actual models
afterEach(async () => {
  await db.notification.deleteMany()
  await db.reaction.deleteMany()
  await db.comment.deleteMany()
  await db.post.deleteMany()
  await db.follow.deleteMany()
  await db.session.deleteMany()
  await db.profile.deleteMany()
  await db.user.deleteMany()
})
