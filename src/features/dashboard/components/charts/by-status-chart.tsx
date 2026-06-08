'use client'

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useChartData } from '../../hooks/use-chart-data'

const STATUS_COLORS: Record<string, string> = {
  Inspeccionado: '#22c55e',
  Pendiente: '#f59e0b',
  'En proceso': '#3b82f6',
  Rechazado: '#ef4444',
  Aprobado: '#014d1d',
}

export function ByStatusChart() {
  const { byStatus } = useChartData()

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={byStatus}
          dataKey="value"
          nameKey="label"
          cx="50%"
          cy="45%"
          outerRadius="65%"
        >
          {byStatus.map((entry, i) => (
            <Cell key={i} fill={STATUS_COLORS[entry.label] ?? '#94a3b8'} />
          ))}
        </Pie>
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v: number) => [v, 'Siniestros']} />
        <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  )
}
