'use client'

import { useEffect, useState } from 'react'
import { Responsive, WidthProvider, type Layouts } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import { RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useGridLayout } from '../../hooks/use-grid-layout'
import { useChartData } from '../../hooks/use-chart-data'
import { ChartCard } from '../molecules/chart-card'
import { ByProvinceChart } from '../charts/by-province-chart'
import { ByEventChart } from '../charts/by-event-chart'
import { MonthlyTrendChart } from '../charts/monthly-trend-chart'
import { ByCropChart } from '../charts/by-crop-chart'
import { ByYearChart } from '../charts/by-status-chart'
import { HaByEventChart } from '../charts/impact-chart'

const ResponsiveGridLayout = WidthProvider(Responsive)

const BREAKPOINTS = { lg: 1200, md: 996, sm: 640 }
const COLS = { lg: 12, md: 8, sm: 4 }

const WIDGETS = [
  { id: 'by-province',  title: 'Siniestros por Provincia',         chart: <ByProvinceChart /> },
  { id: 'by-event',     title: 'Siniestros por Causa',             chart: <ByEventChart /> },
  { id: 'monthly-trend',title: 'Evolución Mensual',                chart: <MonthlyTrendChart /> },
  { id: 'by-crop',      title: 'Ha. Afectadas por Cultivo',        chart: <ByCropChart /> },
  { id: 'by-year',      title: 'Siniestros por Año',               chart: <ByYearChart /> },
  { id: 'ha-by-event',  title: 'Ha. Afectadas por Tipo de Evento', chart: <HaByEventChart /> },
] as const

export function ChartsGrid() {
  const { layouts, setLayouts, resetLayouts } = useGridLayout()
  const { isLoading } = useChartData()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  if (!mounted) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {WIDGETS.map((w) => (
          <div key={w.id} className="h-75 rounded-xl bg-white border border-border animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-end mb-2">
        <Button variant="ghost" size="sm" onClick={resetLayouts} className="gap-1.5 text-muted-foreground text-xs">
          <RotateCcw className="h-3.5 w-3.5" />
          Restablecer layout
        </Button>
      </div>

      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        breakpoints={BREAKPOINTS}
        cols={COLS}
        rowHeight={52}
        margin={[12, 12]}
        containerPadding={[0, 0]}
        onLayoutChange={(_current: unknown, allLayouts: Layouts) => setLayouts(allLayouts)}
        draggableHandle=".drag-handle"
        resizeHandles={['se']}
      >
        {WIDGETS.map((widget) => (
          <div key={widget.id}>
            <ChartCard title={widget.title} isLoading={isLoading}>
              {widget.chart}
            </ChartCard>
          </div>
        ))}
      </ResponsiveGridLayout>
    </div>
  )
}
