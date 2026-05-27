import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { cn } from '@/lib/utils'

type StaggerListProps = {
  children: React.ReactNode
  /** Delay between each child animation in seconds. Default 0.08. */
  stagger?: number
  className?: string
}

const container = (stagger: number) => ({
  hidden: {},
  show: { transition: { staggerChildren: stagger } },
})

const item = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
  },
}

/**
 * Wraps a list and staggers each direct child's entrance animation.
 * Children animate once when the list scrolls into view.
 *
 * Usage:
 *   <StaggerList className="grid grid-cols-3 gap-4">
 *     {items.map(i => <Card key={i.id} {...i} />)}
 *   </StaggerList>
 */
export function StaggerList({ children, stagger = 0.08, className }: StaggerListProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-10% 0px' })

  return (
    <motion.div
      ref={ref}
      variants={container(stagger)}
      initial="hidden"
      animate={isInView ? 'show' : 'hidden'}
      className={className}
    >
      {Array.isArray(children)
        ? children.map((child, i) => (
            <motion.div key={i} variants={item}>
              {child}
            </motion.div>
          ))
        : <motion.div variants={item}>{children}</motion.div>
      }
    </motion.div>
  )
}
