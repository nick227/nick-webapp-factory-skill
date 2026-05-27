import { ChatService } from '../services/ChatService'

const chatService = new ChatService()

export async function chat(request: any, reply: any) {
  const { messages, systemPrompt } = request.body

  // SSE headers — bypass Fastify's response serialization
  reply.raw.setHeader('Content-Type', 'text/event-stream')
  reply.raw.setHeader('Cache-Control', 'no-cache')
  reply.raw.setHeader('Connection', 'keep-alive')
  reply.raw.setHeader('X-Accel-Buffering', 'no')  // disable nginx buffering if proxied
  reply.raw.flushHeaders()

  try {
    for await (const text of chatService.stream(messages, systemPrompt)) {
      reply.raw.write(`data: ${JSON.stringify({ text })}\n\n`)
    }
    reply.raw.write('data: [DONE]\n\n')
  } catch (err: any) {
    reply.raw.write(`data: ${JSON.stringify({ error: err.message ?? 'Stream failed' })}\n\n`)
  } finally {
    reply.raw.end()
  }
}
