import { randomUUID } from 'crypto'
import { PrismaClient } from '@prisma/client'
import { createImageGenProvider } from '../providers/imagegen'
// createStorageProvider is installed by the file-upload plugin prerequisite
import { createStorageProvider } from '../providers/storage'
import { decodeCursor, encodeCursor, normalizeLimit } from '../lib/pagination'

const prisma = new PrismaClient()
const imageProvider = createImageGenProvider()
const storageProvider = createStorageProvider()

const MAX_PROMPT_LENGTH = 1000
const MAX_DIM = 1536
const MIN_DIM = 256
const PAGE_SIZE = 20

const RPM = Number(process.env.IMAGE_GEN_RATE_LIMIT_RPM ?? 10)

class RateLimiter {
  private readonly windows = new Map<string, number[]>()

  check(userId: string): void {
    const now = Date.now()
    const timestamps = (this.windows.get(userId) ?? []).filter(t => now - t < 60_000)
    if (timestamps.length >= RPM) {
      const retryAfterSec = Math.ceil((60_000 - (now - timestamps[0])) / 1000)
      throw {
        statusCode: 429,
        message: `Rate limit: ${RPM} image${RPM === 1 ? '' : 's'}/min per user. Retry in ${retryAfterSec}s.`,
      }
    }
    timestamps.push(now)
    this.windows.set(userId, timestamps)
  }
}

const rateLimiter = new RateLimiter()

export interface ImageGenInput {
  userId: string
  prompt: string
  width?: number
  height?: number
}

export class ImageGenService {
  async generate(input: ImageGenInput) {
    const { userId, prompt } = input
    const width = Math.min(Math.max(input.width ?? 512, MIN_DIM), MAX_DIM)
    const height = Math.min(Math.max(input.height ?? 512, MIN_DIM), MAX_DIM)

    if (!prompt.trim()) {
      throw { statusCode: 400, message: 'Prompt is required' }
    }
    if (prompt.length > MAX_PROMPT_LENGTH) {
      throw { statusCode: 400, message: `Prompt must be ${MAX_PROMPT_LENGTH} characters or fewer` }
    }

    rateLimiter.check(userId)

    const { buffer, mimeType } = await imageProvider.generate({ prompt, width, height })

    const stored = await storageProvider.upload({
      buffer,
      originalName: `${randomUUID()}.png`,
      mimeType,
    })

    const provider = process.env.IMAGE_GEN_PROVIDER ?? 'dezgo'

    const record = await prisma.generatedImage.create({
      data: {
        userId,
        prompt,
        provider,
        mediaKey: stored.key,
        mediaUrl: stored.url,
        width,
        height,
      },
    })

    return {
      id: record.id,
      url: stored.url,
      key: stored.key,
      prompt,
      provider,
      width,
      height,
      createdAt: record.createdAt,
    }
  }

  async list(userId: string, opts: { cursor?: string; limit?: number } = {}) {
    const limit = normalizeLimit(opts.limit, 100, PAGE_SIZE)
    const decoded = decodeCursor(opts.cursor)
    const items = await prisma.generatedImage.findMany({
      where: {
        userId,
        ...(decoded
          ? {
              OR: [
                { createdAt: { lt: new Date(decoded.createdAt) } },
                { createdAt: new Date(decoded.createdAt), id: { lt: decoded.id } },
              ],
            }
          : {}),
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
    })

    const hasMore = items.length > limit
    const page = hasMore ? items.slice(0, limit) : items
    const last = page[page.length - 1]

    return {
      data: page.map(r => ({
        id: r.id,
        url: r.mediaUrl,
        key: r.mediaKey,
        prompt: r.prompt,
        provider: r.provider,
        width: r.width,
        height: r.height,
        createdAt: r.createdAt,
      })),
      meta: {
        hasMore,
        nextCursor: hasMore
          ? encodeCursor({ createdAt: last.createdAt.toISOString(), id: last.id })
          : null,
      },
    }
  }
}
