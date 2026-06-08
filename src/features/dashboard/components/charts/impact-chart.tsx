'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid, ReferenceLine } from 'recharts'
import { useChartData } from '../../hooks/use-chart-data'

const COLORS = ['#014d1d', '#006b28', '#15803d', '#16a34a', '#22c55e', '#4ade80']

export function ImpactChart() {
  const { byImpact } = useChartData()

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={byImpact} margin={{ left: 0, right: 8, top: 4, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
        <YAxis
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          domain={[0, 100]}
          tickFormatter={(v) => `${v}%`}
        />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
          formatter={(v: number) => [`${v}%`, '% Afectación promedio']}
        />
        <ReferenceLine y={50} stroke="#e5e7eb" strokeDasharray="4 4" />
        <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={40}>
          {byImpact.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
