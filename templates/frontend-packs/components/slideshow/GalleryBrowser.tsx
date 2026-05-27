import { useState } from 'react'
import { cn } from '@/lib/utils'
import { SlideButtonEl, type SlideShowProps, type SlideItem } from './slide-types'

function hasContent(item: SlideItem) {
  return !!(item.heading || item.body || item.buttons?.length || item.badge)
}

export function GalleryBrowser({ items, onSelect, className }: SlideShowProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const selected = items[selectedIndex]

  const handleSelect = (i: number) => {
    setSelectedIndex(i)
    onSelect?.(items[i], i)
  }

  if (items.length === 0) return null

  return (
    <div
      className={cn('flex flex-col gap-3 md:flex-row md:gap-4', className)}
      role="region"
      aria-label="Image gallery"
    >
      {/* ── Main view ─────────────────────────────────────────────────── */}
      <div className="relative min-h-[280px] flex-1 overflow-hidden rounded-xl bg-muted">
        <img
          key={selected.id}
          src={selected.image}
          alt={selected.imageAlt ?? selected.heading ?? ''}
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-300"
        />

        {hasContent(selected) && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        )}

        {hasContent(selected) && (
          <div className="absolute bottom-0 left-0 right-0 p-5">
            {selected.badge && (
              <span className="mb-2 inline-block rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-primary-foreground">
                {selected.badge}
              </span>
            )}
            {selected.heading && (
              <h3 className="text-xl font-bold text-white sm:text-2xl">
                {selected.heading}
              </h3>
            )}
            {selected.body && (
              <p className="mt-1 text-sm text-white/80 sm:text-base">
                {selected.body}
              </p>
            )}
            {selected.buttons && selected.buttons.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {selected.buttons.map((btn, i) => (
                  <SlideButtonEl key={i} btn={btn} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Thumbnail grid sidebar ─────────────────────────────────────── */}
      {/*
        Mobile:  4-column horizontal strip below main view
        Desktop: 2-column vertical grid sidebar, scrollable
      */}
      <div
        className="grid grid-cols-4 gap-1.5 md:w-44 md:grid-cols-2 md:content-start md:overflow-y-auto lg:w-52"
        role="tablist"
        aria-label="Gallery thumbnails"
      >
        {items.map((item, i) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={i === selectedIndex}
            aria-label={item.heading ?? item.imageAlt ?? `View item ${i + 1}`}
            onClick={() => handleSelect(i)}
            className={cn(
              'group relative aspect-square overflow-hidden rounded-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
              i === selectedIndex
                ? 'ring-2 ring-primary ring-offset-1'
                : 'opacity-60 hover:opacity-100'
            )}
          >
            <img
              src={item.image}
              alt={item.imageAlt ?? item.heading ?? ''}
              className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
              draggable={false}
            />
          </button>
        ))}
      </div>
    </div>
  )
}
