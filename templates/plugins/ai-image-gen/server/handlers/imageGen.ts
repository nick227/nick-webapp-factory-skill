import type { FastifyRequest, FastifyReply } from 'fastify'
import { ImageGenService } from '../services/ImageGenService'

const svc = new ImageGenService()

export async function generateImage(request: FastifyRequest, reply: FastifyReply) {
  const userId = (request as any).user?.id
  if (!userId) return reply.status(401).send({ error: 'Unauthorized' })

  const { prompt, width, height } = request.body as {
    prompt: string
    width?: number
    height?: number
  }

  const result = await svc.generate({ userId, prompt, width, height })
  return reply.status(201).send({ data: result })
}

export async function listGeneratedImages(request: FastifyRequest, reply: FastifyReply) {
  const userId = (request as any).user?.id
  if (!userId) return reply.status(401).send({ error: 'Unauthorized' })

  const { cursor, limit } = request.query as { cursor?: string; limit?: number }
  const result = await svc.list(userId, { cursor, limit })
  return reply.send(result)
}
