import type { ReactElement } from 'react'
import { ResponsiveContainer } from 'recharts'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/utils'

interface ChartContainerProps {
  height?: number
  loading?: boolean
  className?: string
  children: ReactElement
}

export function ChartContainer({ height = 300, loading, className, children }: ChartContainerProps) {
  if (loading) {
    return <Skeleton className={cn('w-full rounded-lg', className)} style={{ height }} />
  }
  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  )
}
