/** CSS variable color tokens for chart series. First two inherit the project theme. */
export const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--accent))',
  'hsl(200 70% 50%)',
  'hsl(280 65% 60%)',
  'hsl(40 90% 55%)',
  'hsl(160 60% 45%)',
]

export type ChartSeries = {
  key: string
  label?: string
  color?: string
}

/** Shared Recharts tooltip style — reads CSS variables so it matches the active theme. */
export const tooltipStyle = {
  contentStyle: {
    backgroundColor: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '0.5rem',
    color: 'hsl(var(--card-foreground))',
    fontSize: 13,
  },
  itemStyle: { color: 'hsl(var(--card-foreground))' },
  cursor: { fill: 'hsl(var(--muted))' },
}

/** Shared axis tick style. */
export const tickStyle = {
  fill: 'hsl(var(--muted-foreground))',
  fontSize: 12,
}

// Shared axis/grid prop spreads — eliminates repeated config across chart types.
export const gridProps = {
  strokeDasharray: '3 3',
  stroke: 'hsl(var(--border))',
  vertical: false as const,
}

export const xAxisProps = (xKey: string) => ({
  dataKey: xKey,
  tick: tickStyle,
  axisLine: { stroke: 'hsl(var(--border))' },
  tickLine: false as const,
})

export const yAxisProps = {
  tick: tickStyle,
  axisLine: false as const,
  tickLine: false as const,
  width: 40,
}

export const legendStyle = {
  fontSize: 12,
  color: 'hsl(var(--muted-foreground))',
}
