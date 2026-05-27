import { useSizeTracking, ratioFromSize, type Size } from './smart-media-utils'
import { MediaFrame } from './MediaFrame'
import { cn } from '@/lib/utils'

interface SmartImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'onLoad'> {
  src: string
  width?: number
  height?: number
  fallbackAspectRatio?: string
  fit?: 'cover' | 'contain'
  onLoadSize?: (size: Size) => void
  frameClassName?: string
}

export function SmartImage({
  src,
  alt,
  width,
  height,
  fallbackAspectRatio = '4 / 3',
  fit = 'cover',
  onLoadSize,
  className,
  frameClassName,
  loading = 'lazy',
  decoding = 'async',
  ...props
}: SmartImageProps) {
  const { size, loaded, markLoaded } = useSizeTracking('img', src, width, height)
  const aspectRatio = ratioFromSize(size, fallbackAspectRatio)

  return (
    <MediaFrame aspectRatio={aspectRatio} loading={!loaded} className={frameClassName}>
      <img
        src={src}
        alt={alt}
        loading={loading}
        decoding={decoding}
        className={cn(
          'absolute inset-0 h-full w-full transition-opacity duration-200',
          fit === 'cover' ? 'object-cover' : 'object-contain',
          loaded ? 'opacity-100' : 'opacity-0',
          className,
        )}
        onLoad={(event) => {
          const img = event.currentTarget
          const next = markLoaded(img.naturalWidth, img.naturalHeight)
          onLoadSize?.(next)
        }}
        {...props}
      />
    </MediaFrame>
  )
}
