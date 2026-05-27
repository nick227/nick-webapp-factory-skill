import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

type PageTransitionProps = {
  children: React.ReactNode
  className?: string
}

/**
 * Wraps a page component with a subtle enter/exit animation.
 *
 * Requires AnimatePresence in App.tsx wrapping the route outlet:
 *
 *   import { AnimatePresence } from 'framer-motion'
 *   import { useLocation } from 'react-router-dom'
 *
 *   const location = useLocation()
 *   <AnimatePresence mode="wait">
 *     <Routes location={location} key={location.pathname}>
 *       ...
 *     </Routes>
 *   </AnimatePresence>
 *
 * Then wrap each page:
 *   export default function MyPage() {
 *     return <PageTransition>...</PageTransition>
 *   }
 */
export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.18, ease: 'easeInOut' }}
      className={cn('h-full', className)}
    >
      {children}
    </motion.div>
  )
}
