'use client'

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useChartData } from '../../hooks/use-chart-data'

export function MonthlyTrendChart() {
  const { monthlyTrend } = useChartData()

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={monthlyTrend} margin={{ left: 0, right: 8, top: 4, bottom: 4 }}>
        <defs>
          <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#014d1d" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#014d1d" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="inspGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
        <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
        <Area type="monotone" dataKey="total" name="Total" stroke="#014d1d" fill="url(#totalGrad)" strokeWidth={2} />
        <Area type="monotone" dataKey="inspeccionados" name="Inspeccionados" stroke="#22c55e" fill="url(#inspGrad)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  )
}
