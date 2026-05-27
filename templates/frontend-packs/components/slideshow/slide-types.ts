import { cn } from '@/lib/utils'

export type SlideButton = {
  label: string
  variant?: 'primary' | 'secondary' | 'ghost'
  href?: string
  onClick?: () => void
}

export type SlideItem = {
  id: string
  image: string
  imageAlt?: string
  badge?: string
  heading?: string
  body?: string
  buttons?: SlideButton[]
}

export type SlideShowProps = {
  items: SlideItem[]
  mode?: 'hero' | 'gallery'
  /** Hero mode only. Interval in ms. Off by default — CTAs need time to read. */
  autoPlay?: number
  /** Fires when the active slide changes (hero) or a thumbnail is selected (gallery). */
  onSelect?: (item: SlideItem, index: number) => void
  className?: string
}

/** Renders a button or anchor depending on whether href is provided. */
export function SlideButtonEl({ btn }: { btn: SlideButton }) {
  const base =
    'inline-flex items-center justify-center rounded-md px-5 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
  const variants: Record<NonNullable<SlideButton['variant']>, string> = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
    secondary:
      'border border-white/30 bg-white/20 text-white backdrop-blur-sm hover:bg-white/30',
    ghost: 'text-white underline-offset-4 hover:underline',
  }
  const cls = cn(base, variants[btn.variant ?? 'primary'])

  if (btn.href) {
    return (
      <a href={btn.href} className={cls}>
        {btn.label}
      </a>
    )
  }
  return (
    <button type="button" onClick={btn.onClick} className={cls}>
      {btn.label}
    </button>
  )
}
