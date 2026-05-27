import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/utils'
import { CHART_COLORS, tooltipStyle } from './chart-utils'

type PieSlice = {
  name: string
  value: number
  color?: string
}

type PieChartProps = {
  data: PieSlice[]
  /** Inner radius as a percentage string or number. '60%' gives a donut. Default '60%'. */
  innerRadius?: string | number
  height?: number
  loading?: boolean
  className?: string
}

export function PieChart({
  data,
  innerRadius = '60%',
  height = 300,
  loading,
  className,
}: PieChartProps) {
  if (loading) {
    return <Skeleton className={cn('w-full rounded-lg', className)} style={{ height }} />
  }

  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius="80%"
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((slice, i) => (
              <Cell
                key={slice.name}
                fill={slice.color ?? CHART_COLORS[i % CHART_COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip {...tooltipStyle} />
          <Legend
            wrapperStyle={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}
            formatter={(value) => (
              <span style={{ color: 'hsl(var(--foreground))' }}>{value}</span>
            )}
          />
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  )
}
