import { useState } from 'react'
import { useGenerateVideo } from '@project/sdk'

type Duration = 5 | 10
type AspectRatio = '16:9' | '9:16' | '1:1'

const DURATIONS: Duration[] = [5, 10]
const RATIOS: { label: string; value: AspectRatio }[] = [
  { label: '16:9', value: '16:9' },
  { label: '9:16', value: '9:16' },
  { label: '1:1', value: '1:1' },
]

const RATIO_CSS: Record<AspectRatio, string> = {
  '16:9': '56.25%',
  '9:16': '177.78%',
  '1:1': '100%',
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Queued…',
  processing: 'Generating video…',
  completed: 'Done',
  failed: 'Failed',
}

export function VideoGenWidget() {
  const [prompt, setPrompt] = useState('')
  const [duration, setDuration] = useState<Duration>(5)
  const [ratio, setRatio] = useState<AspectRatio>('16:9')

  const { submit, status, resetTask } = useGenerateVideo()

  const videoData = status.data?.data
  const isWorking =
    submit.isPending ||
    videoData?.status === 'pending' ||
    videoData?.status === 'processing'

  function handleSubmit() {
    const trimmed = prompt.trim()
    if (!trimmed || isWorking) return
    submit.mutate({ prompt: trimmed, duration, aspectRatio: ratio })
  }

  function handleReset() {
    resetTask()
    submit.reset()
    setPrompt('')
  }

  const errorMsg =
    videoData?.status === 'failed'
      ? videoData.errorMsg ?? 'Generation failed'
      : submit.error instanceof Error
        ? submit.error.message
        : (submit.error as any)?.message ?? null

  return (
    <div className="flex flex-col gap-4 w-full max-w-lg">
      {/* Controls */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex gap-1">
          {DURATIONS.map(d => (
            <button
              key={d}
              type="button"
              disabled={isWorking}
              onClick={() => setDuration(d)}
              className={[
                'px-3 py-1 rounded-md text-sm border transition-colors disabled:opacity-50',
                d === duration
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-input hover:bg-accent',
              ].join(' ')}
            >
              {d}s
            </button>
          ))}
        </div>

        <div className="flex gap-1">
          {RATIOS.map(r => (
            <button
              key={r.value}
              type="button"
              disabled={isWorking}
              onClick={() => setRatio(r.value)}
              className={[
                'px-3 py-1 rounded-md text-sm border transition-colors disabled:opacity-50',
                r.value === ratio
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-input hover:bg-accent',
              ].join(' ')}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <textarea
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
        disabled={isWorking}
        placeholder="Describe the video you want to generate…"
        rows={3}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
      />

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isWorking || !prompt.trim()}
          className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-opacity"
        >
          {submit.isPending ? 'Submitting…' : 'Generate Video'}
        </button>

        {(videoData || submit.isSuccess) && (
          <button
            type="button"
            onClick={handleReset}
            className="rounded-md border border-input px-4 py-2 text-sm hover:bg-accent transition-colors"
          >
            New
          </button>
        )}
      </div>

      {errorMsg && (
        <p className="text-sm text-destructive">{errorMsg}</p>
      )}

      {/* Status + result */}
      {videoData && (
        <div className="rounded-lg border border-border overflow-hidden">
          {videoData.status === 'completed' && videoData.mediaUrl ? (
            <video
              src={videoData.mediaUrl}
              poster={videoData.thumbnailUrl ?? undefined}
              controls
              className="w-full h-auto"
              style={{ aspectRatio: ratio.replace(':', '/') }}
            />
          ) : (
            <div
              className="relative bg-muted flex items-center justify-center"
              style={{ paddingBottom: RATIO_CSS[ratio] }}
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                {isWorking && (
                  <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                )}
                <span className="text-sm text-muted-foreground">
                  {STATUS_LABEL[videoData.status] ?? videoData.status}
                </span>
                {isWorking && (
                  <span className="text-xs text-muted-foreground">
                    Video generation takes 1–3 minutes
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
