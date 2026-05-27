import { useRef, useEffect, useState } from 'react'
import { useChat } from '@project/sdk'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { cn } from '@/lib/utils'
import { Send, RotateCcw } from 'lucide-react'

interface Props {
  systemPrompt?: string
  placeholder?: string
  className?: string
}

export function ChatWidget({ systemPrompt, placeholder = 'Ask anything...', className }: Props) {
  const { messages, isStreaming, error, send, reset } = useChat({
    systemPrompt,
    baseUrl: import.meta.env.VITE_API_URL ?? '',
  })
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || isStreaming) return
    setInput('')
    await send(text)
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className={cn('flex flex-col h-[500px] border rounded-lg overflow-hidden bg-background', className)}>
      {/* Message list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-sm text-muted-foreground text-center mt-8">
            Start a conversation
          </p>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={cn(
              'flex',
              msg.role === 'user' ? 'justify-end' : 'justify-start',
            )}
          >
            <div
              className={cn(
                'max-w-[80%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap',
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground',
              )}
            >
              {msg.content}
              {/* Blinking cursor while streaming the last assistant message */}
              {isStreaming && i === messages.length - 1 && msg.role === 'assistant' && (
                <span className="inline-block w-1.5 h-4 ml-0.5 bg-current animate-pulse align-middle" />
              )}
            </div>
          </div>
        ))}
        {error && (
          <p className="text-xs text-destructive text-center">{error}</p>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="border-t p-3 flex gap-2 items-center">
        {messages.length > 0 && (
          <Button
            variant="ghost"
            size="icon"
            onClick={reset}
            title="Clear chat"
            className="shrink-0"
          >
            <RotateCcw size={16} />
          </Button>
        )}
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder={placeholder}
          disabled={isStreaming}
          className="flex-1"
          voice
          onVoiceResult={(t) => setInput(t)}
        />
        <Button
          size="icon"
          onClick={handleSend}
          disabled={!input.trim() || isStreaming}
          loading={isStreaming}
          className="shrink-0"
        >
          <Send size={16} />
        </Button>
      </div>
    </div>
  )
}
