'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useChartData } from '../../hooks/use-chart-data'
import { CHART_COLORS } from '../../constants/filters.constants'

export function ByProvinceChart() {
  const { byProvince } = useChartData()

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={byProvince} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
        <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
        <YAxis dataKey="label" type="category" tick={{ fontSize: 11 }} width={75} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
          formatter={(v: number) => [v, 'Siniestros']}
        />
        <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={20}>
          {byProvince.map((_, i) => (
            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
