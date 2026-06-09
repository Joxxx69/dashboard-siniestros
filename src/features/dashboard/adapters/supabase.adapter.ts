import { supabase } from '@/lib/supabase'
import type { ISiniestrosRepository } from '../repositories/siniestros.repository'
import type { DashboardFilters, Siniestro } from '../types'
import { applyFilters } from '../utils/filters.util'
import { normalizeCausa } from '../utils/causa.util'

const PAGE_SIZE = 1000

const SELECT = `
  id,
  numero_tramite,
  has_afectadas,
  valor_indemnizacion,
  fecha_ocurrencia,
  cultivos ( nombre ),
  cantones ( nombre, provincias ( nombre ) ),
  causas_siniestro ( descripcion ),
  estados_siniestro ( nombre )
` as const

type DbRow = {
  id: number
  numero_tramite: string
  has_afectadas: number
  valor_indemnizacion: number | null
  fecha_ocurrencia: string
  cultivos: { nombre: string } | null
  cantones: { nombre: string; provincias: { nombre: string } | null } | null
  causas_siniestro: { descripcion: string } | null
  estados_siniestro: { nombre: string } | null
}

function isoToLocal(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function toSiniestro(row: DbRow): Siniestro {
  return {
    id:                  row.numero_tramite,
    fecha:               isoToLocal(row.fecha_ocurrencia),
    provincia:           row.cantones?.provincias?.nombre ?? '',
    canton:              row.cantones?.nombre ?? '',
    cultivo:             row.cultivos?.nombre ?? '',
    hectareasAfectadas:  row.has_afectadas,
    valorIndemnizacion:  row.valor_indemnizacion ?? 0,
    tipoEvento:          normalizeCausa(row.causas_siniestro?.descripcion ?? ''),
    estado:              row.estados_siniestro?.nombre ?? '',
  }
}

export class SupabaseSiniestrosAdapter implements ISiniestrosRepository {
  async getAll(filters: DashboardFilters): Promise<Siniestro[]> {
    const all: DbRow[] = []
    let from = 0

    while (true) {
      const { data, error } = await supabase
        .from('siniestros')
        .select(SELECT)
        .range(from, from + PAGE_SIZE - 1)

      if (error) throw new Error(`Supabase error: ${error.message}`)
      if (!data || data.length === 0) break

      all.push(...(data as unknown as DbRow[]))
      if (data.length < PAGE_SIZE) break
      from += PAGE_SIZE
    }

    return applyFilters(all.map(toSiniestro), filters)
  }
}
