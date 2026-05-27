import { db } from '../src/client'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'

async function main() {
  console.log('Seeding...')

  // Demo users — adapt to your schema
  const hash = await bcrypt.hash('password123', 12)

  const alice = await db.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: {
      email: 'alice@example.com',
      passwordHash: hash,
      profile: {
        create: {
          username: 'alice',
          displayName: 'Alice',
        },
      },
      sessions: {
        create: {
          token: randomUUID(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      },
    },
    include: { profile: true },
  })

  const bob = await db.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: {
      email: 'bob@example.com',
      passwordHash: hash,
      profile: {
        create: {
          username: 'bob',
          displayName: 'Bob',
        },
      },
    },
    include: { profile: true },
  })

  console.log(`✓ Users: ${alice.profile?.username}, ${bob.profile?.username}`)

  // Add additional seed data below — posts, follows, etc.
  // TODO: seed domain-specific data

  console.log('Seeding complete.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
