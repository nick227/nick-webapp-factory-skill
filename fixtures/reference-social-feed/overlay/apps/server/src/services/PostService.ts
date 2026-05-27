import { db } from '@project/db'
import { decodeCursor, encodeCursor, normalizeLimit } from '../lib/pagination'

export class PostService {
  async getFeed(opts: { cursor?: string; limit?: number }) {
    const cursor = decodeCursor(opts.cursor)
    const limit = normalizeLimit(opts.limit, 50, 20)

    const posts = await db.post.findMany({
      where: {
        deletedAt: null,
        ...(cursor
          ? {
              OR: [
                { createdAt: { lt: new Date(cursor.createdAt) } },
                { createdAt: new Date(cursor.createdAt), id: { lt: cursor.id } },
              ],
            }
          : {}),
      },
      include: {
        author: {
          include: { profile: true },
        },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
    })

    const page = posts.slice(0, limit)
    const last = page.at(-1)

    return {
      data: page,
      meta: {
        hasMore: posts.length > limit,
        nextCursor: posts.length > limit && last
          ? encodeCursor({ createdAt: last.createdAt.toISOString(), id: last.id })
          : null,
      },
    }
  }

  async create(authorId: string, data: { body: string }) {
    return db.post.create({
      data: {
        authorId,
        body: data.body,
      },
      include: {
        author: {
          include: { profile: true },
        },
      },
    })
  }
}
