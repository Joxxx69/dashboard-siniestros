'use client'

import { AlertTriangle, CheckCircle, Clock, Leaf, Users, TrendingUp } from 'lucide-react'
import { useMetrics } from '../../hooks/use-metrics'
import { MetricCard } from '../molecules/metric-card'

export function MetricsSection() {
  const { metrics, isLoading } = useMetrics()

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
      <MetricCard
        label="Total siniestros"
        value={metrics.totalSiniestros}
        icon={AlertTriangle}
        iconColor="text-orange-600"
        isLoading={isLoading}
      />
      <MetricCard
        label="Inspeccionados"
        value={metrics.inspeccionados}
        icon={CheckCircle}
        iconColor="text-green-700"
        isLoading={isLoading}
      />
      <MetricCard
        label="Pendientes"
        value={metrics.pendientes}
        icon={Clock}
        iconColor="text-yellow-600"
        isLoading={isLoading}
      />
      <MetricCard
        label="Ha. afectadas"
        value={metrics.hectareasAfectadas}
        decimals={1}
        icon={Leaf}
        iconColor="text-emerald-700"
        isLoading={isLoading}
      />
      <MetricCard
        label="Productores"
        value={metrics.totalProductores}
        icon={Users}
        iconColor="text-blue-700"
        isLoading={isLoading}
      />
      <MetricCard
        label="% Afectación"
        value={metrics.porcentajeAfectacion}
        suffix="%"
        decimals={1}
        icon={TrendingUp}
        iconColor="text-red-600"
        isLoading={isLoading}
      />
    </div>
  )
}
