import { cn } from '@/lib/utils'

interface MediaFrameProps {
  aspectRatio?: string
  loading?: boolean
  className?: string
  children: React.ReactNode
}

export function MediaFrame({
  aspectRatio = '4 / 3',
  loading,
  className,
  children,
}: MediaFrameProps) {
  return (
    <div
      className={cn('relative overflow-hidden rounded border bg-muted', className)}
      style={{ aspectRatio }}
    >
      {loading && <div className="absolute inset-0 animate-pulse bg-muted" />}
      {children}
    </div>
  )
}
