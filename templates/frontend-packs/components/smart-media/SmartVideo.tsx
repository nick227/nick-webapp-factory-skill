import { useSizeTracking, ratioFromSize, type Size } from './smart-media-utils'
import { MediaFrame } from './MediaFrame'
import { cn } from '@/lib/utils'

interface SmartVideoProps extends Omit<React.VideoHTMLAttributes<HTMLVideoElement>, 'onLoadedMetadata'> {
  src: string
  width?: number
  height?: number
  fallbackAspectRatio?: string
  fit?: 'cover' | 'contain'
  onLoadSize?: (size: Size) => void
  frameClassName?: string
}

export function SmartVideo({
  src,
  width,
  height,
  fallbackAspectRatio = '16 / 9',
  fit = 'cover',
  onLoadSize,
  className,
  frameClassName,
  preload = 'metadata',
  controls = true,
  ...props
}: SmartVideoProps) {
  const { size, loaded, markLoaded } = useSizeTracking('video', src, width, height)
  const aspectRatio = ratioFromSize(size, fallbackAspectRatio)

  return (
    <MediaFrame aspectRatio={aspectRatio} loading={!loaded} className={frameClassName}>
      <video
        src={src}
        preload={preload}
        controls={controls}
        className={cn(
          'absolute inset-0 h-full w-full transition-opacity duration-200',
          fit === 'cover' ? 'object-cover' : 'object-contain',
          loaded ? 'opacity-100' : 'opacity-0',
          className,
        )}
        onLoadedMetadata={(event) => {
          const video = event.currentTarget
          const next = markLoaded(video.videoWidth, video.videoHeight)
          onLoadSize?.(next)
        }}
        {...props}
      />
    </MediaFrame>
  )
}
