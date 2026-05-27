import { useState } from 'react'
import { Send } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Textarea } from '@/components/ui/Textarea'

interface ActivityComposerProps {
  onSubmit: (body: string) => Promise<void> | void
  isLoading?: boolean
  placeholder?: string
}

export function ActivityComposer({
  onSubmit,
  isLoading,
  placeholder = "What's happening?",
}: ActivityComposerProps) {
  const [body, setBody] = useState('')

  async function submit() {
    const trimmed = body.trim()
    if (!trimmed || isLoading) return
    await onSubmit(trimmed)
    setBody('')
  }

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <Textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder={placeholder}
          rows={3}
          voice
        />
        <div className="flex justify-end">
          <Button onClick={submit} loading={isLoading} disabled={!body.trim()}>
            <Send size={15} />
            Post
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
