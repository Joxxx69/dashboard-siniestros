import { useMemo } from 'react'
import { useSiniestros } from './use-siniestros'
import type { DashboardMetrics } from '../types'

function computeMetrics(siniestros: ReturnType<typeof useSiniestros>['data']): DashboardMetrics {
  const data = siniestros ?? []
  const inspeccionados = data.filter((s) => s.estado === 'Inspeccionado').length
  const pendientes = data.filter((s) => s.estado === 'Pendiente').length
  const hectareasAfectadas = data.reduce((sum, s) => sum + s.hectareasAfectadas, 0)
  const totalProductores = new Set(data.map((s) => s.productor)).size
  const totalAseguradas = data.reduce((sum, s) => sum + s.hectareasAseguradas, 0)
  const porcentajeAfectacion =
    totalAseguradas > 0 ? Math.round((hectareasAfectadas / totalAseguradas) * 1000) / 10 : 0

  return {
    totalSiniestros: data.length,
    inspeccionados,
    pendientes,
    hectareasAfectadas: Math.round(hectareasAfectadas * 10) / 10,
    totalProductores,
    porcentajeAfectacion,
  }
}

export const useMetrics = () => {
  const { data, isLoading, isError } = useSiniestros()
  const metrics = useMemo(() => computeMetrics(data), [data])
  return { metrics, isLoading, isError }
}
