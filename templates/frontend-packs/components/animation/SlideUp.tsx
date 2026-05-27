import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { cn } from '@/lib/utils'

type SlideUpProps = {
  children: React.ReactNode
  delay?: number
  duration?: number
  /** Pixels to travel upward from initial position. Default 24. */
  distance?: number
  className?: string
}

/** Slides up and fades in once when the element scrolls into view. */
export function SlideUp({
  children,
  delay = 0,
  duration = 0.5,
  distance = 24,
  className,
}: SlideUpProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-10% 0px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: distance }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: distance }}
      transition={{
        duration,
        delay,
        // Spring-like custom easing — snappy entry, soft landing
        ease: [0.16, 1, 0.3, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
