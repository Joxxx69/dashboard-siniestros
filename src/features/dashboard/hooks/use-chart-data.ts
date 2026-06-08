import { useMemo } from 'react'
import { useSiniestros } from './use-siniestros'
import type { ChartPoint, MonthlyPoint, Siniestro } from '../types'

const MONTH_LABELS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

function aggregateBy(data: Siniestro[], key: keyof Siniestro): ChartPoint[] {
  const counts = data.reduce<Record<string, number>>((acc, s) => {
    const k = String(s[key])
    acc[k] = (acc[k] ?? 0) + 1
    return acc
  }, {})
  return Object.entries(counts)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
}

function aggregateHaByKey(data: Siniestro[], key: keyof Siniestro): ChartPoint[] {
  const totals = data.reduce<Record<string, number>>((acc, s) => {
    const k = String(s[key])
    acc[k] = (acc[k] ?? 0) + s.hectareasAfectadas
    return acc
  }, {})
  return Object.entries(totals)
    .map(([label, value]) => ({ label, value: Math.round(value) }))
    .sort((a, b) => b.value - a.value)
}

function aggregateAvgPctByKey(data: Siniestro[], key: keyof Siniestro): ChartPoint[] {
  const groups = data.reduce<Record<string, { total: number; count: number }>>((acc, s) => {
    const k = String(s[key])
    if (!acc[k]) acc[k] = { total: 0, count: 0 }
    acc[k].total += s.porcentajeAfectacion
    acc[k].count += 1
    return acc
  }, {})
  return Object.entries(groups).map(([label, { total, count }]) => ({
    label,
    value: Math.round(total / count),
  }))
}

function buildMonthlyTrend(data: Siniestro[]): MonthlyPoint[] {
  return MONTH_LABELS.map((month, i) => {
    const monthNum = String(i + 1).padStart(2, '0')
    const monthData = data.filter((s) => s.fecha.split('/')[1] === monthNum)
    return {
      month,
      total: monthData.length,
      inspeccionados: monthData.filter((s) => s.estado === 'Inspeccionado').length,
    }
  })
}

export const useChartData = () => {
  const { data: siniestros = [], isLoading } = useSiniestros()

  const byProvince = useMemo(() => aggregateBy(siniestros, 'provincia'), [siniestros])
  const byEvent = useMemo(() => aggregateBy(siniestros, 'tipoEvento'), [siniestros])
  const byStatus = useMemo(() => aggregateBy(siniestros, 'estado'), [siniestros])
  const byCrop = useMemo(() => aggregateHaByKey(siniestros, 'cultivo'), [siniestros])
  const byImpact = useMemo(() => aggregateAvgPctByKey(siniestros, 'tipoEvento'), [siniestros])
  const monthlyTrend = useMemo(() => buildMonthlyTrend(siniestros), [siniestros])

  return { byProvince, byEvent, byStatus, byCrop, byImpact, monthlyTrend, isLoading }
}
