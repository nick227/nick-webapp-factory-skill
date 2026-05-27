import { db } from '../src/client'
import bcrypt from 'bcryptjs'

async function main() {
  const passwordHash = await bcrypt.hash('password123', 12)

  await db.post.deleteMany()
  await db.session.deleteMany()
  await db.profile.deleteMany()
  await db.user.deleteMany()

  const alice = await db.user.create({
    data: {
      email: 'alice@example.com',
      passwordHash,
      profile: {
        create: {
          username: 'alice',
          displayName: 'Alice',
        },
      },
    },
  })

  const bob = await db.user.create({
    data: {
      email: 'bob@example.com',
      passwordHash,
      profile: {
        create: {
          username: 'bob',
          displayName: 'Bob',
        },
      },
    },
  })

  await db.post.createMany({
    data: [
      { authorId: alice.id, body: 'Hello from the reference app.' },
      { authorId: bob.id, body: 'A tiny feed is enough to prove the factory.' },
    ],
  })
}

main()
  .finally(async () => {
    await db.$disconnect()
  })
