'use client'

import { AlertTriangle, Leaf, MapPin, Map, Sprout, TrendingUp, CloudLightning } from 'lucide-react'
import { useMetrics } from '../../hooks/use-metrics'
import { MetricCard } from '../molecules/metric-card'

export function MetricsSection() {
  const { metrics, isLoading } = useMetrics()

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
      <MetricCard
        label="Total siniestros"
        value={metrics.totalSiniestros}
        icon={CloudLightning}
        iconColor="text-orange-600"
        isLoading={isLoading}
      />
      <MetricCard
        label="Ha. afectadas"
        value={metrics.totalHaAfectadas}
        decimals={1}
        icon={Leaf}
        iconColor="text-emerald-700"
        isLoading={isLoading}
      />
      <MetricCard
        label="Provincias"
        value={metrics.provinciasAfectadas}
        icon={Map}
        iconColor="text-blue-700"
        isLoading={isLoading}
      />
      <MetricCard
        label="Cantones"
        value={metrics.cantonesAfectados}
        icon={MapPin}
        iconColor="text-indigo-600"
        isLoading={isLoading}
      />
      <MetricCard
        label="Cultivos"
        value={metrics.cultivosAfectados}
        icon={Sprout}
        iconColor="text-green-700"
        isLoading={isLoading}
      />
      <MetricCard
        label="Ha. promedio afectada"
        value={metrics.haPromedioPorSiniestro}
        suffix=" ha"
        decimals={1}
        icon={TrendingUp}
        iconColor="text-teal-600"
        isLoading={isLoading}
      />
    </div>
  )
}
