import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { CHART_COLORS, tooltipStyle, gridProps, xAxisProps, yAxisProps, legendStyle, type ChartSeries } from './chart-utils'
import { ChartContainer } from './ChartContainer'

type BarChartProps = {
  data: Record<string, unknown>[]
  xKey: string
  series: ChartSeries[]
  /** Stack all series into a single bar. Default false. */
  stacked?: boolean
  height?: number
  loading?: boolean
  className?: string
}

export function BarChart({
  data,
  xKey,
  series,
  stacked = false,
  height = 300,
  loading,
  className,
}: BarChartProps) {
  return (
    <ChartContainer height={height} loading={loading} className={className}>
      <RechartsBarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid {...gridProps} />
        <XAxis {...xAxisProps(xKey)} />
        <YAxis {...yAxisProps} />
        <Tooltip {...tooltipStyle} />
        {series.length > 1 && <Legend wrapperStyle={legendStyle} />}
        {series.map((s, i) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            name={s.label ?? s.key}
            fill={s.color ?? CHART_COLORS[i % CHART_COLORS.length]}
            stackId={stacked ? 'stack' : undefined}
            radius={stacked ? [0, 0, 0, 0] : [4, 4, 0, 0]}
          />
        ))}
      </RechartsBarChart>
    </ChartContainer>
  )
}
