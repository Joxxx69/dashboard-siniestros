import * as XLSX from 'xlsx'
import type { ISiniestrosRepository } from '../repositories/siniestros.repository'
import type { DashboardFilters, Siniestro, TipoEvento } from '../types'
import { applyFilters } from '../utils/filters.util'

const PROV_CANONICAL: Record<string, string> = {
  'azuay': 'Azuay', 'bolivar': 'Bolívar', 'canar': 'Cañar', 'carchi': 'Carchi',
  'chimborazo': 'Chimborazo', 'cotopaxi': 'Cotopaxi', 'el oro': 'El Oro',
  'esmeraldas': 'Esmeraldas', 'galapagos': 'Galápagos', 'guayas': 'Guayas',
  'imbabura': 'Imbabura', 'loja': 'Loja', 'los rios': 'Los Ríos',
  'manabi': 'Manabí', 'morona santiago': 'Morona Santiago', 'napo': 'Napo',
  'orellana': 'Orellana', 'pastaza': 'Pastaza', 'pichincha': 'Pichincha',
  'santa elena': 'Santa Elena', 'sucumbios': 'Sucumbíos',
  'tungurahua': 'Tungurahua', 'zamora chinchipe': 'Zamora Chinchipe',
}

function normKey(s: string): string {
  return s.trim().toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
}

function toTitleCase(s: string): string {
  return s.trim().toLowerCase()
    .replace(/(?:^|\s)\w/g, (c) => c.toUpperCase())
    .replace(/\s+/g, ' ')
}

function normalizeProvince(raw: string): string {
  return PROV_CANONICAL[normKey(raw)] ?? toTitleCase(raw)
}

function causaToTipoEvento(raw: string): TipoEvento {
  const first = normKey(raw).split(' - ')[0].trim()
  if (first.includes('inundacion'))                           return 'Inundación'
  if (first.includes('exceso') || first.includes('humedad')) return 'Exceso de humedad'
  if (first.includes('sequia'))                              return 'Sequía'
  if (first.includes('granizada') || first.includes('granizo')) return 'Granizo'
  if (first.includes('helada') || first.includes('bajas temp')) return 'Helada'
  if (first.includes('plagas'))                              return 'Plaga'
  if (first.includes('enferm'))                              return 'Enfermedad'
  if (first.includes('vientos'))                             return 'Viento'
  if (first.includes('desliz'))                              return 'Deslizamiento'
  if (first.includes('tapon'))                               return 'Taponamiento'
  if (first.includes('incendio') || first.includes('ceniza')) return 'Incendio'
  return 'Plaga'
}

function col(row: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null) return String(row[key]).trim()
  }
  return ''
}

function parseExcelDate(serial: number): string {
  const d = XLSX.SSF.parse_date_code(serial) as { d: number; m: number; y: number }
  return `${String(d.d).padStart(2, '0')}/${String(d.m).padStart(2, '0')}/${d.y}`
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
    const id = col(row, 'NUMERO TRAMITE2', 'NUMERO TRAMITE', 'ID', 'id', 'Código')
    if (!id) return null

    const rawFecha = row['FECHA OCURRENCIA AVISO SINIESTRO'] ?? row['Fecha'] ?? row['fecha']
    const fecha = typeof rawFecha === 'number'
      ? parseExcelDate(rawFecha)
      : String(rawFecha ?? '').trim()

    const rawCausa = col(row, 'CAUSA SINIESTRO AVISO', 'CAUSA', 'Tipo Evento', 'tipoEvento')

    return {
      id,
      fecha,
      provincia:        normalizeProvince(col(row, 'PROVINCIA', 'Provincia', 'provincia')),
      canton:           toTitleCase(col(row, 'CANTON', 'Cantón', 'Canton', 'canton')),
      cultivo:          toTitleCase(col(row, 'CULTIVO', 'Cultivo', 'cultivo')),
      hectareasAfectadas: Number(col(row, 'HAS AFECTADAS AVISO SINIESTRO', 'Hectáreas Afectadas', 'hectareasAfectadas') || 0),
      valorIndemnizacion: Number(col(row, 'VALOR INDEMNIZACION', 'valorIndemnizacion') || 0),
      tipoEvento:       causaToTipoEvento(rawCausa),
      estado:           toTitleCase(col(row, 'ESTADO SINIESTRO', 'estado')),
    }
  }
}
