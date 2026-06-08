'use client'

import { SidebarFilters } from '../organisms/sidebar-filters'
import { MetricsSection } from '../organisms/metrics-section'
import { ChartsGrid } from '../organisms/charts-grid'
import { SiniestrosTable } from '../organisms/siniestros-table'

export function DashboardTemplate() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#f5f7f5]">
      <SidebarFilters />

      <main className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          <header>
            <h1 className="text-2xl font-bold text-gray-900">
              Dashboard de Seguimiento de Siniestros Agropecuarios
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Monitorea el comportamiento de los siniestros agropecuarios en tiempo real.
            </p>
          </header>

          <MetricsSection />
          <ChartsGrid />
          <SiniestrosTable />
        </div>
      </main>
    </div>
  )
}
