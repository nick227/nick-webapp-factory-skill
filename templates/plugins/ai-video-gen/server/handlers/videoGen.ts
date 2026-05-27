import type { FastifyRequest, FastifyReply } from 'fastify'
import { VideoGenService } from '../services/VideoGenService'

const svc = new VideoGenService()

export async function generateVideo(request: FastifyRequest, reply: FastifyReply) {
  const userId = (request as any).user?.id
  if (!userId) return reply.status(401).send({ error: 'Unauthorized' })

  const { prompt, duration, aspectRatio } = request.body as {
    prompt: string
    duration?: 5 | 10
    aspectRatio?: '16:9' | '9:16' | '1:1'
  }

  const record = await svc.createTask({ userId, prompt, duration, aspectRatio })
  return reply.status(202).send({ data: record })
}

export async function getVideoStatus(request: FastifyRequest, reply: FastifyReply) {
  const userId = (request as any).user?.id
  if (!userId) return reply.status(401).send({ error: 'Unauthorized' })

  const { taskId } = request.params as { taskId: string }
  const record = await svc.getStatus(taskId, userId)
  return reply.send({ data: record })
}

export async function listGeneratedVideos(request: FastifyRequest, reply: FastifyReply) {
  const userId = (request as any).user?.id
  if (!userId) return reply.status(401).send({ error: 'Unauthorized' })

  const { cursor, limit } = request.query as { cursor?: string; limit?: number }
  const result = await svc.list(userId, { cursor, limit })
  return reply.send(result)
}
