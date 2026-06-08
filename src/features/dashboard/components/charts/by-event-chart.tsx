'use client'

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useChartData } from '../../hooks/use-chart-data'

const COLORS = ['#014d1d', '#22c55e', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6']

export function ByEventChart() {
  const { byEvent } = useChartData()

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={byEvent}
          dataKey="value"
          nameKey="label"
          cx="50%"
          cy="45%"
          outerRadius="60%"
          innerRadius="35%"
        >
          {byEvent.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v: number) => [v, 'Siniestros']} />
        <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  )
}
