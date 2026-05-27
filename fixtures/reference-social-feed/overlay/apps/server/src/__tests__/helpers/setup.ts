import { db } from '@project/db'
import { afterEach } from 'vitest'

afterEach(async () => {
  await db.post.deleteMany()
  await db.session.deleteMany()
  await db.profile.deleteMany()
  await db.user.deleteMany()
})
