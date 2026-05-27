import { OAuth2Client } from 'google-auth-library'
import { db } from '@project/db'
import { randomUUID } from 'crypto'

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000

export class GoogleAuthService {
  async authenticate(credential: string) {
    // Verify the ID token Google Sign-In sent us
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    })

    const payload = ticket.getPayload()
    if (!payload?.sub || !payload.email || !payload.email_verified) {
      throw { statusCode: 400, message: 'Invalid Google credential' }
    }

    const { sub: googleId, email, name, picture } = payload

    // Find existing user by googleId first, then fall back to email
    let user = await db.user.findFirst({
      where: { OR: [{ googleId }, { email }] },
      include: { profile: true },
    })

    if (user) {
      // Merge googleId onto an existing email/password account
      if (!user.googleId) {
        user = await db.user.update({
          where: { id: user.id },
          data: { googleId },
          include: { profile: true },
        })
      }
    } else {
      // New user — create account + profile from Google data
      const username = email.split('@')[0].replace(/[^a-z0-9_]/gi, '_').toLowerCase()
      const safeUsername = await this._uniqueUsername(username)

      user = await db.user.create({
        data: {
          email,
          googleId,
          passwordHash: '',  // no password for OAuth users
          profile: {
            create: {
              username: safeUsername,
              displayName: name ?? safeUsername,
              avatarUrl: picture ?? null,
            },
          },
        },
        include: { profile: true },
      })
    }

    if (user.suspendedAt) throw { statusCode: 403, message: 'Account suspended' }

    const session = await db.session.create({
      data: {
        userId: user.id,
        token: randomUUID(),
        expiresAt: new Date(Date.now() + SESSION_TTL_MS),
      },
    })

    return { user, token: session.token }
  }

  private async _uniqueUsername(base: string): Promise<string> {
    let username = base
    let attempt = 0
    while (await db.profile.findUnique({ where: { username } })) {
      attempt++
      username = `${base}${attempt}`
    }
    return username
  }
}
