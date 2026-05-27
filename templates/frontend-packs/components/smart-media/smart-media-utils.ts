import { useMemo, useState } from 'react'

export type Size = {
  width: number
  height: number
}

// Keyed by `${type}:${src}` to avoid collisions between image and video caches.
const globalSizeCache = new Map<string, Size>()

export function ratioFromSize(size?: Size, fallback = '4 / 3') {
  return size?.width && size.height ? `${size.width} / ${size.height}` : fallback
}

export function useSizeTracking(
  type: 'img' | 'video',
  src: string,
  width?: number,
  height?: number,
) {
  const key = `${type}:${src}`
  const initialSize = useMemo(() => {
    if (width && height) return { width, height }
    return globalSizeCache.get(key)
  }, [height, key, width])
  const [size, setSize] = useState<Size | undefined>(initialSize)
  const [loaded, setLoaded] = useState(Boolean(initialSize))

  function markLoaded(w: number, h: number): Size {
    const next: Size = { width: w, height: h }
    globalSizeCache.set(key, next)
    setSize(next)
    setLoaded(true)
    return next
  }

  return { size, loaded, markLoaded }
}
