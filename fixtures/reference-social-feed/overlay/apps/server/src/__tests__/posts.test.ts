import './helpers/setup'
import { describe, it, expect } from 'vitest'
import { buildTestApp, asAuth, validateResponse, testUserId } from './helpers'
import { db } from '@project/db'

const app = buildTestApp()

describe('getFeed', () => {
  it('requires auth', async () => {
    const res = await app.inject({ method: 'GET', url: '/posts/feed' })
    expect(res.statusCode).toBe(401)
  })

  it('GET /posts/feed', async () => {
    await db.post.create({
      data: {
        authorId: testUserId,
        body: 'Seeded test post',
      },
    })

    const res = await app.inject({
      method: 'GET',
      url: '/posts/feed',
      headers: asAuth(testUserId),
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().data).toHaveLength(1)
    await validateResponse('getFeed', 200, res.json())
  })
})

describe('createPost', () => {
  it('requires auth', async () => {
    const res = await app.inject({ method: 'POST', url: '/posts' })
    expect(res.statusCode).toBe(401)
  })

  it('POST /posts', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/posts',
      headers: asAuth(testUserId),
      payload: { body: 'Created through integration test' },
    })

    expect(res.statusCode).toBe(201)
    await validateResponse('createPost', 201, res.json())
  })
})
