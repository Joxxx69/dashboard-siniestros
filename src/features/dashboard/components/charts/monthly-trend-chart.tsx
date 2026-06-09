'use client'

import {
  ComposedChart, Bar, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { useChartData } from '../../hooks/use-chart-data'

export function MonthlyTrendChart() {
  const { monthlyTrend } = useChartData()

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={monthlyTrend} margin={{ left: 0, right: 32, top: 4, bottom: 4 }}>
        <defs>
          <linearGradient id="haGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
        <YAxis
          yAxisId="left"
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `${v} ha`}
        />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
          formatter={(v: number, name: string) =>
            name === 'Ha. afectadas' ? [`${v.toLocaleString('es-EC')} ha`, name] : [v, name]
          }
        />
        <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
        <Bar
          yAxisId="right"
          dataKey="haAfectadas"
          name="Ha. afectadas"
          fill="#22c55e"
          fillOpacity={0.6}
          radius={[2, 2, 0, 0]}
          maxBarSize={24}
        />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="total"
          name="Siniestros"
          stroke="#014d1d"
          strokeWidth={2}
          dot={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
