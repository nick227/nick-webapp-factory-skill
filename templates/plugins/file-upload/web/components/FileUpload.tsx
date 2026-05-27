import { useRef, useState, useCallback } from 'react'
import { useUpload } from '@project/sdk'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { Upload, X, FileImage, FileVideo, FileAudio, File } from 'lucide-react'

interface UploadedFile {
  url: string
  key: string
  mimeType: string
  name: string
}

interface Props {
  onUpload?: (file: UploadedFile) => void
  accept?: string         // MIME type filter, e.g. "image/*"
  maxSizeMb?: number      // client-side hint (server enforces authoritatively)
  className?: string
}

function fileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return FileImage
  if (mimeType.startsWith('video/')) return FileVideo
  if (mimeType.startsWith('audio/')) return FileAudio
  return File
}

export function FileUpload({ onUpload, accept, maxSizeMb = 10, className }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [uploaded, setUploaded] = useState<UploadedFile | null>(null)
  const [clientError, setClientError] = useState<string | null>(null)
  const mutation = useUpload()

  const handleFile = useCallback(
    async (file: File) => {
      setClientError(null)

      // Client-side size hint — server enforces authoritatively
      if (file.size > maxSizeMb * 1024 * 1024) {
        setClientError(`File is larger than ${maxSizeMb}MB`)
        return
      }

      try {
        const result = await mutation.mutateAsync(file)
        const uploaded = { ...result.data, name: file.name }
        setUploaded(uploaded)
        onUpload?.(uploaded)
      } catch (err: any) {
        setClientError(err.message ?? 'Upload failed')
      }
    },
    [maxSizeMb, mutation, onUpload],
  )

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''  // allow re-selecting the same file
  }

  const clear = () => {
    setUploaded(null)
    setClientError(null)
    mutation.reset()
  }

  const error = clientError ?? (mutation.isError ? (mutation.error as Error).message : null)
  const isLoading = mutation.isPending

  // Show the uploaded file card
  if (uploaded) {
    const Icon = fileIcon(uploaded.mimeType)
    return (
      <div className={cn('flex items-center gap-3 p-3 border rounded-lg bg-muted/40', className)}>
        {uploaded.mimeType.startsWith('image/') ? (
          <img
            src={uploaded.url}
            alt={uploaded.name}
            className="h-12 w-12 rounded object-cover shrink-0"
          />
        ) : (
          <Icon size={32} className="shrink-0 text-muted-foreground" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{uploaded.name}</p>
          <p className="text-xs text-muted-foreground truncate">{uploaded.url}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={clear} title="Remove">
          <X size={16} />
        </Button>
      </div>
    )
  }

  return (
    <div className={className}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          'flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg p-8 cursor-pointer transition-colors',
          dragOver
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50 hover:bg-muted/30',
          isLoading && 'opacity-50 pointer-events-none',
        )}
      >
        <Upload size={24} className="text-muted-foreground" />
        <div className="text-center">
          <p className="text-sm font-medium">
            {isLoading ? 'Uploading...' : 'Drop a file or click to browse'}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Max {maxSizeMb}MB
            {accept ? ` · ${accept}` : ''}
          </p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="sr-only"
      />

      {error && (
        <p className="mt-2 text-xs text-destructive">{error}</p>
      )}
    </div>
  )
}
