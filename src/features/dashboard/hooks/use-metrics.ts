import { useMemo } from 'react'
import { useSiniestros } from './use-siniestros'
import type { DashboardMetrics } from '../types'

function computeMetrics(data: ReturnType<typeof useSiniestros>['data']): DashboardMetrics {
  const rows = data ?? []
  const totalHaAfectadas = rows.reduce((sum, s) => sum + s.hectareasAfectadas, 0)

  return {
    totalSiniestros:        rows.length,
    totalHaAfectadas:       Math.round(totalHaAfectadas * 10) / 10,
    provinciasAfectadas:    new Set(rows.map((s) => s.provincia)).size,
    cantonesAfectados:      new Set(rows.map((s) => s.canton)).size,
    cultivosAfectados:      new Set(rows.map((s) => s.cultivo)).size,
    haPromedioPorSiniestro: rows.length > 0
      ? Math.round((totalHaAfectadas / rows.length) * 10) / 10
      : 0,
  }
}

export const useMetrics = () => {
  const { data, isLoading, isError } = useSiniestros()
  const metrics = useMemo(() => computeMetrics(data), [data])
  return { metrics, isLoading, isError }
}
