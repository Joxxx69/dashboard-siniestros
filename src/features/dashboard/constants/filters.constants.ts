import type { EstadoTramite, TipoEvento } from '../types'

export const CHART_COLORS = [
  '#014d1d', '#006b28', '#22c55e', '#86efac',
  '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6',
  '#ec4899', '#14b8a6',
]

export const ESTADO_COLORS: Record<EstadoTramite, string> = {
  Ajustado:     '#3b82f6',
  Cerrado:      '#6b7280',
  Inspeccionado:'#06b6d4',
  Liquidado:    '#f97316',
  Negado:       '#ef4444',
  Pagado:       '#22c55e',
}

export const TIPO_EVENTO_LABELS: Record<TipoEvento, string> = {
  'Inundación':        'Inundación',
  'Exceso de humedad': 'Exceso humedad',
  'Sequía':            'Sequía',
  'Granizo':           'Granizo',
  'Helada':            'Helada',
  'Plaga':             'Plaga',
  'Enfermedad':        'Enfermedad',
  'Viento':            'Viento',
  'Deslizamiento':     'Deslizamiento',
  'Taponamiento':      'Taponamiento',
  'Incendio':          'Incendio',
}
