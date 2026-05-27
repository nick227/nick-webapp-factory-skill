import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { CHART_COLORS, tooltipStyle, gridProps, xAxisProps, yAxisProps, legendStyle, type ChartSeries } from './chart-utils'
import { ChartContainer } from './ChartContainer'

type AreaChartProps = {
  data: Record<string, unknown>[]
  xKey: string
  series: ChartSeries[]
  /** Stack areas. Default false. */
  stacked?: boolean
  /** Fill opacity for the gradient. Default 0.15. */
  fillOpacity?: number
  height?: number
  loading?: boolean
  className?: string
}

export function AreaChart({
  data,
  xKey,
  series,
  stacked = false,
  fillOpacity = 0.15,
  height = 300,
  loading,
  className,
}: AreaChartProps) {
  return (
    <ChartContainer height={height} loading={loading} className={className}>
      <RechartsAreaChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <defs>
          {series.map((s, i) => {
            const color = s.color ?? CHART_COLORS[i % CHART_COLORS.length]
            return (
              <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={fillOpacity * 4} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            )
          })}
        </defs>
        <CartesianGrid {...gridProps} />
        <XAxis {...xAxisProps(xKey)} />
        <YAxis {...yAxisProps} />
        <Tooltip {...tooltipStyle} />
        {series.length > 1 && <Legend wrapperStyle={legendStyle} />}
        {series.map((s, i) => {
          const color = s.color ?? CHART_COLORS[i % CHART_COLORS.length]
          return (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label ?? s.key}
              stroke={color}
              strokeWidth={2}
              fill={`url(#grad-${s.key})`}
              stackId={stacked ? 'stack' : undefined}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          )
        })}
      </RechartsAreaChart>
    </ChartContainer>
  )
}
