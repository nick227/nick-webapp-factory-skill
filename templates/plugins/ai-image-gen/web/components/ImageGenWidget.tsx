import { useState } from 'react'
import { useGenerateImage } from '@project/sdk'

type AspectRatio = { label: string; width: number; height: number }

const ASPECT_RATIOS: AspectRatio[] = [
  { label: 'Square', width: 512, height: 512 },
  { label: 'Landscape', width: 896, height: 512 },
  { label: 'Portrait', width: 512, height: 896 },
]

export function ImageGenWidget() {
  const [prompt, setPrompt] = useState('')
  const [ratio, setRatio] = useState<AspectRatio>(ASPECT_RATIOS[0])
  const { mutate, isPending, data, error } = useGenerateImage()

  function handleGenerate() {
    const trimmed = prompt.trim()
    if (!trimmed) return
    mutate({ prompt: trimmed, width: ratio.width, height: ratio.height })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleGenerate()
  }

  const errorMsg =
    error instanceof Error
      ? error.message
      : (error as any)?.message ?? 'Generation failed'

  return (
    <div className="flex flex-col gap-4 w-full max-w-lg">
      <div className="flex gap-2">
        {ASPECT_RATIOS.map(r => (
          <button
            key={r.label}
            type="button"
            onClick={() => setRatio(r)}
            className={[
              'px-3 py-1 rounded-md text-sm border transition-colors',
              r.label === ratio.label
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-input hover:bg-accent',
            ].join(' ')}
          >
            {r.label}
          </button>
        ))}
      </div>

      <textarea
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Describe the image you want to generate… (Ctrl+Enter to generate)"
        rows={3}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
      />

      <button
        type="button"
        onClick={handleGenerate}
        disabled={isPending || !prompt.trim()}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-opacity"
      >
        {isPending ? 'Generating…' : 'Generate Image'}
      </button>

      {error && (
        <p className="text-sm text-destructive">{errorMsg}</p>
      )}

      {isPending && (
        <div
          className="w-full rounded-lg bg-muted animate-pulse"
          style={{ aspectRatio: `${ratio.width}/${ratio.height}` }}
        />
      )}

      {data?.data && !isPending && (
        <div className="relative rounded-lg overflow-hidden border border-border">
          <img
            src={data.data.url}
            alt={data.data.prompt}
            className="w-full h-auto"
            style={{ aspectRatio: `${data.data.width}/${data.data.height}` }}
          />
          <a
            href={data.data.url}
            download
            className="absolute bottom-2 right-2 rounded-md bg-background/80 backdrop-blur px-3 py-1 text-xs hover:bg-background transition-colors"
          >
            Download
          </a>
        </div>
      )}
    </div>
  )
}
