import './helpers/setup'
import { describe, it, expect } from 'vitest'
import { buildTestApp, asAuth, validateResponse, testUserId } from './helpers'
import { db } from '@project/db'
import bcrypt from 'bcryptjs'

const app = buildTestApp()

describe('register', () => {
  it('POST /auth/register', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: {
        email: 'new@test.local',
        username: 'newuser',
        password: 'password123',
      },
    })

    expect(res.statusCode).toBe(201)
    await validateResponse('register', 201, res.json())
  })
})

describe('login', () => {
  it('POST /auth/login', async () => {
    await db.user.update({
      where: { id: testUserId },
      data: { passwordHash: await bcrypt.hash('password123', 12) },
    })

    const res = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        email: 'alice@test.local',
        password: 'password123',
      },
    })

    expect(res.statusCode).toBe(200)
    await validateResponse('login', 200, res.json())
  })
})

describe('logout', () => {
  it('requires auth', async () => {
    const res = await app.inject({ method: 'POST', url: '/auth/logout' })
    expect(res.statusCode).toBe(401)
  })

  it('POST /auth/logout', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/logout',
      headers: asAuth(testUserId),
    })

    expect(res.statusCode).toBe(200)
    await validateResponse('logout', 200, res.json())
  })
})

describe('getCurrentUser', () => {
  it('requires auth', async () => {
    const res = await app.inject({ method: 'GET', url: '/auth/me' })
    expect(res.statusCode).toBe(401)
  })

  it('GET /auth/me', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/auth/me',
      headers: asAuth(testUserId),
    })

    expect(res.statusCode).toBe(200)
    await validateResponse('getCurrentUser', 200, res.json())
  })
})
