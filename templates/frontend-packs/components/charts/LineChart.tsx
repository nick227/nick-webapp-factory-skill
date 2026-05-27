import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { CHART_COLORS, tooltipStyle, gridProps, xAxisProps, yAxisProps, legendStyle, type ChartSeries } from './chart-utils'
import { ChartContainer } from './ChartContainer'

type LineChartProps = {
  data: Record<string, unknown>[]
  xKey: string
  series: ChartSeries[]
  height?: number
  loading?: boolean
  className?: string
}

export function LineChart({
  data,
  xKey,
  series,
  height = 300,
  loading,
  className,
}: LineChartProps) {
  return (
    <ChartContainer height={height} loading={loading} className={className}>
      <RechartsLineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid {...gridProps} />
        <XAxis {...xAxisProps(xKey)} />
        <YAxis {...yAxisProps} />
        <Tooltip {...tooltipStyle} />
        {series.length > 1 && <Legend wrapperStyle={legendStyle} />}
        {series.map((s, i) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label ?? s.key}
            stroke={s.color ?? CHART_COLORS[i % CHART_COLORS.length]}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
        ))}
      </RechartsLineChart>
    </ChartContainer>
  )
}
