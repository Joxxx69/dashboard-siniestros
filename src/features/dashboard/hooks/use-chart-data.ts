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
    .map(([label, value]) => ({ label, value: Math.round(value * 10) / 10 }))
    .sort((a, b) => b.value - a.value)
}

function aggregateByYear(data: Siniestro[]): ChartPoint[] {
  const counts = data.reduce<Record<string, number>>((acc, s) => {
    const year = s.fecha.split('/')[2] ?? 'Desconocido'
    acc[year] = (acc[year] ?? 0) + 1
    return acc
  }, {})
  return Object.entries(counts)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => a.label.localeCompare(b.label))
}

function buildMonthlyTrend(data: Siniestro[]): MonthlyPoint[] {
  return MONTH_LABELS.map((month, i) => {
    const monthNum = String(i + 1).padStart(2, '0')
    const monthData = data.filter((s) => s.fecha.split('/')[1] === monthNum)
    return {
      month,
      total:         monthData.length,
      haAfectadas:   Math.round(monthData.reduce((sum, s) => sum + s.hectareasAfectadas, 0) * 10) / 10,
    }
  })
}

export const useChartData = () => {
  const { data: siniestros = [], isLoading } = useSiniestros()

  const byProvince   = useMemo(() => aggregateBy(siniestros, 'provincia'),      [siniestros])
  const byEvent      = useMemo(() => aggregateBy(siniestros, 'tipoEvento'),     [siniestros])
  const byYear       = useMemo(() => aggregateByYear(siniestros),               [siniestros])
  const byCrop       = useMemo(() => aggregateHaByKey(siniestros, 'cultivo'),   [siniestros])
  const haByEvent    = useMemo(() => aggregateHaByKey(siniestros, 'tipoEvento'), [siniestros])
  const monthlyTrend = useMemo(() => buildMonthlyTrend(siniestros),             [siniestros])

  return { byProvince, byEvent, byYear, byCrop, haByEvent, monthlyTrend, isLoading }
}
