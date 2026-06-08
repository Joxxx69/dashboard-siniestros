export type EstadoTramite =
  | 'Inspeccionado'
  | 'Pendiente'
  | 'En proceso'
  | 'Rechazado'
  | 'Aprobado'

export type TipoEvento =
  | 'Inundación'
  | 'Sequía'
  | 'Granizo'
  | 'Helada'
  | 'Plaga'
  | 'Viento'

export interface Siniestro {
  readonly id: string
  readonly fecha: string
  readonly provincia: string
  readonly canton: string
  readonly parroquia: string
  readonly cultivo: string
  readonly productor: string
  readonly hectareasAseguradas: number
  readonly hectareasAfectadas: number
  readonly porcentajeAfectacion: number
  readonly tipoEvento: TipoEvento
  readonly estado: EstadoTramite
  readonly tecnico: string
}

export interface DashboardFilters {
  provincia: string
  canton: string
  parroquia: string
  cultivo: string
  tipoEvento: string
  anio: string
  estado: string
}

export interface DashboardMetrics {
  readonly totalSiniestros: number
  readonly inspeccionados: number
  readonly pendientes: number
  readonly hectareasAfectadas: number
  readonly totalProductores: number
  readonly porcentajeAfectacion: number
}

export interface ChartPoint {
  readonly label: string
  readonly value: number
}

export interface MonthlyPoint {
  readonly month: string
  readonly total: number
  readonly inspeccionados: number
}
