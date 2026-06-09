'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts'
import { useChartData } from '../../hooks/use-chart-data'
import { CHART_COLORS } from '../../constants/filters.constants'

export function HaByEventChart() {
  const { haByEvent } = useChartData()

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={haByEvent} layout="vertical" margin={{ left: 8, right: 40, top: 4, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
        <XAxis
          type="number"
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `${v} ha`}
        />
        <YAxis
          dataKey="label"
          type="category"
          tick={{ fontSize: 11 }}
          width={120}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
          formatter={(v: number) => [`${v.toLocaleString('es-EC')} ha`, 'Ha. afectadas']}
        />
        <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={22}>
          {haByEvent.map((_, i) => (
            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
