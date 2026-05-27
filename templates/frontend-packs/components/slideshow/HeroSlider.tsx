import { useCallback, useEffect, useMemo, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SlideButtonEl, type SlideShowProps, type SlideItem } from './slide-types'

function hasContent(item: SlideItem) {
  return !!(item.heading || item.body || item.buttons?.length || item.badge)
}

export function HeroSlider({ items, autoPlay, onSelect, className }: SlideShowProps) {
  const plugins = useMemo(
    () => (autoPlay ? [Autoplay({ delay: autoPlay, stopOnInteraction: true })] : []),
    // plugins are read once at init — autoPlay changing after mount has no effect
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, plugins)
  const [selectedIndex, setSelectedIndex] = useState(0)

  const onSlideChange = useCallback(() => {
    if (!emblaApi) return
    const idx = emblaApi.selectedScrollSnap()
    setSelectedIndex(idx)
    onSelect?.(items[idx], idx)
  }, [emblaApi, items, onSelect])

  useEffect(() => {
    if (!emblaApi) return
    emblaApi.on('select', onSlideChange)
    emblaApi.on('reInit', onSlideChange)
    return () => {
      emblaApi.off('select', onSlideChange)
      emblaApi.off('reInit', onSlideChange)
    }
  }, [emblaApi, onSlideChange])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') emblaApi?.scrollPrev()
      if (e.key === 'ArrowRight') emblaApi?.scrollNext()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [emblaApi])

  const scrollPrev = () => emblaApi?.scrollPrev()
  const scrollNext = () => emblaApi?.scrollNext()
  const scrollTo = (i: number) => emblaApi?.scrollTo(i)

  return (
    <div
      className={cn('relative overflow-hidden bg-black', className)}
      role="region"
      aria-roledescription="carousel"
      aria-label="Image slideshow"
    >
      {/* Embla viewport */}
      <div ref={emblaRef} className="h-full">
        <div className="flex h-full touch-pan-y select-none">
          {items.map((item, i) => (
            <div
              key={item.id}
              className="relative min-w-0 flex-[0_0_100%]"
              role="group"
              aria-roledescription="slide"
              aria-label={`Slide ${i + 1} of ${items.length}`}
            >
              <img
                src={item.image}
                alt={item.imageAlt ?? item.heading ?? ''}
                className="absolute inset-0 h-full w-full object-cover"
                draggable={false}
              />

              {/* Gradient only when content overlay is shown */}
              {hasContent(item) && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              )}

              {hasContent(item) && (
                <div className="absolute bottom-0 left-0 right-0 p-8 pb-24 max-w-3xl">
                  {item.badge && (
                    <span className="mb-3 inline-block rounded-full bg-primary px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary-foreground">
                      {item.badge}
                    </span>
                  )}
                  {item.heading && (
                    <h2 className="text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
                      {item.heading}
                    </h2>
                  )}
                  {item.body && (
                    <p className="mt-3 max-w-xl text-base text-white/80 sm:text-lg">
                      {item.body}
                    </p>
                  )}
                  {item.buttons && item.buttons.length > 0 && (
                    <div className="mt-6 flex flex-wrap gap-3">
                      {item.buttons.map((btn, j) => (
                        <SlideButtonEl key={j} btn={btn} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Prev / Next arrows */}
      {items.length > 1 && (
        <>
          <button
            type="button"
            onClick={scrollPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition-colors hover:bg-black/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={scrollNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition-colors hover:bg-black/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            aria-label="Next slide"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {/* Dot indicators */}
      {items.length > 1 && (
        <div
          className="absolute bottom-8 left-1/2 flex -translate-x-1/2 gap-2"
          role="tablist"
          aria-label="Slides"
        >
          {items.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === selectedIndex}
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => scrollTo(i)}
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                i === selectedIndex
                  ? 'w-6 bg-white'
                  : 'w-2 bg-white/40 hover:bg-white/70'
              )}
            />
          ))}
        </div>
      )}
    </div>
  )
}
