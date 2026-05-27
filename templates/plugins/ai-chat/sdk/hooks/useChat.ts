import { useState, useCallback } from 'react'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface UseChatOptions {
  systemPrompt?: string
  baseUrl?: string
}

function joinUrl(baseUrl: string | undefined, path: string) {
  const base = (baseUrl ?? '').replace(/\/$/, '')
  return `${base}${path}`
}

// This hook calls fetch() directly because openapi-fetch does not support SSE streaming.
// Pass baseUrl from the app unless the app proxies /chat to the API server.
export function useChat(options: UseChatOptions = {}) {
  const { systemPrompt, baseUrl } = options
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const send = useCallback(
    async (userContent: string) => {
      const userMessage: ChatMessage = { role: 'user', content: userContent }
      const nextMessages = [...messages, userMessage]
      setMessages([...nextMessages, { role: 'assistant', content: '' }])
      setIsStreaming(true)
      setError(null)

      let assistantText = ''

      try {
        const response = await fetch(joinUrl(baseUrl, '/chat'), {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: nextMessages, systemPrompt }),
        })

        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`)
        }

        if (!response.body) {
          throw new Error('Streaming response was empty')
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffered = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffered += decoder.decode(value, { stream: true })
          const lines = buffered.split('\n')
          buffered = lines.pop() ?? ''

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            const payload = line.slice(6)
            if (payload === '[DONE]') break

            const parsed = JSON.parse(payload)
            if (parsed.error) throw new Error(parsed.error)
            assistantText += parsed.text ?? ''

            setMessages([
              ...nextMessages,
              { role: 'assistant', content: assistantText },
            ])
          }
        }
      } catch (err: any) {
        setError(err.message ?? 'Chat failed')
        setMessages(nextMessages)  // roll back the empty assistant message
      } finally {
        setIsStreaming(false)
      }
    },
    [baseUrl, messages, systemPrompt],
  )

  const reset = useCallback(() => {
    setMessages([])
    setError(null)
  }, [])

  return { messages, isStreaming, error, send, reset }
}
