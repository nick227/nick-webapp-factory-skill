import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const DEFAULT_SYSTEM = 'You are a helpful assistant.'
const DEFAULT_MODEL = 'claude-sonnet-4-6'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export class ChatService {
  async *stream(messages: ChatMessage[], systemPrompt?: string): AsyncGenerator<string> {
    const stream = anthropic.messages.stream({
      model: process.env.ANTHROPIC_MODEL ?? DEFAULT_MODEL,
      max_tokens: 1024,
      system: systemPrompt ?? DEFAULT_SYSTEM,
      messages,
    })

    for await (const chunk of stream) {
      if (
        chunk.type === 'content_block_delta' &&
        chunk.delta.type === 'text_delta'
      ) {
        yield chunk.delta.text
      }
    }
  }
}
