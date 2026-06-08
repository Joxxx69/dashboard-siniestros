import * as XLSX from 'xlsx'
import type { ISiniestrosRepository } from '../repositories/siniestros.repository'
import type { DashboardFilters, EstadoTramite, Siniestro, TipoEvento } from '../types'
import { applyFilters } from '../utils/filters.util'

const TIPOS_EVENTO_VALIDOS: TipoEvento[] = ['Inundación', 'Sequía', 'Granizo', 'Helada', 'Plaga', 'Viento']
const ESTADOS_VALIDOS: EstadoTramite[] = ['Inspeccionado', 'Pendiente', 'En proceso', 'Rechazado', 'Aprobado']

function col(row: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null) return String(row[key]).trim()
  }
  return ''
}

function toTipoEvento(raw: unknown): TipoEvento {
  const val = String(raw ?? '').trim() as TipoEvento
  return TIPOS_EVENTO_VALIDOS.includes(val) ? val : 'Plaga'
}

function toEstado(raw: unknown): EstadoTramite {
  const val = String(raw ?? '').trim() as EstadoTramite
  return ESTADOS_VALIDOS.includes(val) ? val : 'Pendiente'
}

export class ExcelSiniestrosAdapter implements ISiniestrosRepository {
  constructor(private readonly url: string) {}

  async getAll(filters: DashboardFilters): Promise<Siniestro[]> {
    const response = await fetch(this.url)
    if (!response.ok) throw new Error(`No se pudo cargar el archivo: ${this.url}`)

    const buffer = await response.arrayBuffer()
    const workbook = XLSX.read(buffer)
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet)

    const siniestros = rows
      .map(this.toSiniestro)
      .filter((s): s is Siniestro => s !== null)

    return applyFilters(siniestros, filters)
  }

  private readonly toSiniestro = (row: Record<string, unknown>): Siniestro | null => {
    const id = col(row, 'ID', 'id', 'Código', 'Codigo')
    if (!id) return null

    return {
      id,
      fecha:                col(row, 'Fecha', 'fecha'),
      provincia:            col(row, 'Provincia', 'provincia'),
      canton:               col(row, 'Cantón', 'Canton', 'canton'),
      parroquia:            col(row, 'Parroquia', 'parroquia'),
      cultivo:              col(row, 'Cultivo', 'cultivo'),
      productor:            col(row, 'Productor', 'productor'),
      hectareasAseguradas:  Number(col(row, 'Hectáreas Aseguradas', 'hectareasAseguradas', 'ha_aseguradas') || 0),
      hectareasAfectadas:   Number(col(row, 'Hectáreas Afectadas', 'hectareasAfectadas', 'ha_afectadas') || 0),
      porcentajeAfectacion: Number(col(row, '% Afectación', 'porcentajeAfectacion', 'pct_afectacion') || 0),
      tipoEvento:           toTipoEvento(col(row, 'Tipo Evento', 'tipoEvento', 'tipo_evento')),
      estado:               toEstado(col(row, 'Estado', 'estado')),
      tecnico:              col(row, 'Técnico', 'Tecnico', 'tecnico'),
    }
  }
}
