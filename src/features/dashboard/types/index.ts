export type EstadoTramite =
  | 'Ajustado'
  | 'Cerrado'
  | 'Desiste'
  | 'Inspeccionado'
  | 'Liquidado'
  | 'Negado'
  | 'Pagado'

export type TipoEvento =
  | 'Inundación'
  | 'Exceso de humedad'
  | 'Sequía'
  | 'Granizo'
  | 'Helada'
  | 'Plaga'
  | 'Enfermedad'
  | 'Viento'
  | 'Deslizamiento'
  | 'Taponamiento'
  | 'Incendio'
  | string

export interface Siniestro {
  readonly id: string
  readonly fecha: string
  readonly provincia: string
  readonly canton: string
  readonly cultivo: string
  readonly hectareasAfectadas: number
  readonly valorIndemnizacion: number
  readonly tipoEvento: string
  readonly estado: string
}

export interface DashboardFilters {
  provincia: string
  canton: string
  cultivo: string
  tipoEvento: string
  anio: string
  estado: string
}

export interface DashboardMetrics {
  readonly totalSiniestros: number
  readonly totalHaAfectadas: number
  readonly provinciasAfectadas: number
  readonly cantonesAfectados: number
  readonly cultivosAfectados: number
  readonly haPromedioPorSiniestro: number
}

export interface ChartPoint {
  readonly label: string
  readonly value: number
}

export interface MonthlyPoint {
  readonly month: string
  readonly total: number
  readonly haAfectadas: number
}
