import { PrismaClient } from '@prisma/client'
import { createVideoGenProvider } from '../providers/videogen'
// createStorageProvider is installed by the file-upload plugin prerequisite
import { createStorageProvider } from '../providers/storage'
import { decodeCursor, encodeCursor, normalizeLimit } from '../lib/pagination'

const prisma = new PrismaClient()
const videoProvider = createVideoGenProvider()
const storageProvider = createStorageProvider()

const MAX_PROMPT_LENGTH = 2500
const PAGE_SIZE = 20

const RPH = Number(process.env.VIDEO_GEN_RATE_LIMIT_RPH ?? 5)

class RateLimiter {
  private readonly windows = new Map<string, number[]>()

  check(userId: string): void {
    const now = Date.now()
    const timestamps = (this.windows.get(userId) ?? []).filter(t => now - t < 3_600_000)
    if (timestamps.length >= RPH) {
      const retryAfterMin = Math.ceil((3_600_000 - (now - timestamps[0])) / 60_000)
      throw {
        statusCode: 429,
        message: `Rate limit: ${RPH} video${RPH === 1 ? '' : 's'}/hour per user. Retry in ${retryAfterMin} min.`,
      }
    }
    timestamps.push(now)
    this.windows.set(userId, timestamps)
  }
}

const rateLimiter = new RateLimiter()

export interface VideoGenInput {
  userId: string
  prompt: string
  duration?: 5 | 10
  aspectRatio?: '16:9' | '9:16' | '1:1'
}

export class VideoGenService {
  async createTask(input: VideoGenInput) {
    const { userId, prompt } = input
    const duration = input.duration ?? 5
    const aspectRatio = input.aspectRatio ?? '16:9'

    if (!prompt.trim()) throw { statusCode: 400, message: 'Prompt is required' }
    if (prompt.length > MAX_PROMPT_LENGTH) {
      throw { statusCode: 400, message: `Prompt must be ${MAX_PROMPT_LENGTH} characters or fewer` }
    }

    rateLimiter.check(userId)

    const record = await prisma.generatedVideo.create({
      data: { userId, prompt, provider: 'kling', duration, aspectRatio, status: 'pending' },
    })

    // Submit to Kling — update with providerTaskId or mark failed
    try {
      const { providerTaskId } = await videoProvider.submit({ prompt, duration, aspectRatio })
      return prisma.generatedVideo.update({
        where: { id: record.id },
        data: { providerTaskId, status: 'processing' },
      })
    } catch (err) {
      await prisma.generatedVideo.update({
        where: { id: record.id },
        data: { status: 'failed', errorMsg: (err as any)?.message ?? 'Submit failed' },
      })
      throw err
    }
  }

  async getStatus(id: string, userId: string) {
    const record = await prisma.generatedVideo.findUnique({ where: { id } })
    if (!record || record.userId !== userId) {
      throw { statusCode: 404, message: 'Task not found' }
    }

    // Return cached result for terminal states
    if (record.status === 'completed' || record.status === 'failed') {
      return record
    }
    if (!record.providerTaskId) return record

    // Poll provider for latest status
    const task = await videoProvider.poll(record.providerTaskId).catch(() => null)
    if (!task) return record

    if (task.status === 'completed' && task.videoUrl) {
      // Fetch the video and store it via StorageProvider
      const videoRes = await fetch(task.videoUrl).catch(() => null)
      if (videoRes?.ok) {
        const buffer = Buffer.from(await videoRes.arrayBuffer())
        const stored = await storageProvider.upload({
          buffer,
          originalName: `${record.id}.mp4`,
          mimeType: 'video/mp4',
        }).catch(() => null)

        if (stored) {
          return prisma.generatedVideo.update({
            where: { id },
            data: {
              status: 'completed',
              mediaKey: stored.key,
              mediaUrl: stored.url,
              thumbnailUrl: task.thumbnailUrl,
            },
          })
        }
      }
      // If storage fails, still surface the direct Kling URL
      return prisma.generatedVideo.update({
        where: { id },
        data: { status: 'completed', mediaUrl: task.videoUrl, thumbnailUrl: task.thumbnailUrl },
      })
    }

    if (task.status === 'failed') {
      return prisma.generatedVideo.update({
        where: { id },
        data: { status: 'failed', errorMsg: task.errorMsg },
      })
    }

    // Still in progress — update status if changed
    if (task.status !== record.status) {
      return prisma.generatedVideo.update({
        where: { id },
        data: { status: task.status },
      })
    }

    return record
  }

  async list(userId: string, opts: { cursor?: string; limit?: number } = {}) {
    const limit = normalizeLimit(opts.limit, 100, PAGE_SIZE)
    const decoded = decodeCursor(opts.cursor)
    const items = await prisma.generatedVideo.findMany({
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
      data: page,
      meta: {
        hasMore,
        nextCursor: hasMore
          ? encodeCursor({ createdAt: last.createdAt.toISOString(), id: last.id })
          : null,
      },
    }
  }
}
