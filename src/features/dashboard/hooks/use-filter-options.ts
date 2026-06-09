import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { normalizeCausa } from '../utils/causa.util'

export interface ProvinciaOption {
  readonly value: string
  readonly label: string
  readonly cantones: readonly string[]
}

export interface FilterOptions {
  readonly provinciasData: readonly ProvinciaOption[]
  readonly cultivos: readonly string[]
  readonly causas: readonly string[]
  readonly anios: readonly string[]
  readonly estados: readonly string[]
}

type RawProvincia   = { id: number; nombre: string }
type RawCanton      = { id: number; nombre: string; provincia_id: number }
type RawCultivo     = { nombre: string }
type RawCausa       = { descripcion: string }
type RawAnio        = { anio_siniestro: number }
type RawEstado      = { nombre: string }

async function fetchFilterOptions(): Promise<FilterOptions> {
  const [provinciasRes, cantonesRes, cultivosRes, causasRes, aniosRes, estadosRes] = await Promise.all([
    supabase.from('provincias').select('id, nombre').order('nombre'),
    supabase.from('cantones').select('id, nombre, provincia_id').order('nombre'),
    supabase.from('cultivos').select('nombre').order('nombre'),
    supabase.from('causas_siniestro').select('descripcion').order('descripcion'),
    supabase.from('vw_siniestros_por_anio').select('anio_siniestro').order('anio_siniestro'),
    supabase.from('estados_siniestro').select('nombre').order('nombre'),
  ])

  const provincias = (provinciasRes.data ?? []) as RawProvincia[]
  const cantones   = (cantonesRes.data   ?? []) as RawCanton[]
  const cultivosRaw = (cultivosRes.data  ?? []) as RawCultivo[]
  const causasRaw  = (causasRes.data     ?? []) as RawCausa[]
  const aniosRaw   = (aniosRes.data      ?? []) as RawAnio[]
  const estadosRaw = (estadosRes.data    ?? []) as RawEstado[]

  const provinciasData: ProvinciaOption[] = provincias.map((p) => ({
    value:    p.nombre,
    label:    p.nombre,
    cantones: cantones.filter((c) => c.provincia_id === p.id).map((c) => c.nombre),
  }))

  const cultivos = cultivosRaw.map((c) => c.nombre)

  const causas = [
    ...new Set(causasRaw.map((c) => normalizeCausa(c.descripcion))),
  ].sort()

  const anios = aniosRaw.map((r) => String(r.anio_siniestro))
  const estados = estadosRaw.map((e) => e.nombre).filter((e) => e !== 'Desiste')

  return { provinciasData, cultivos, causas, anios, estados }
}

const FALLBACK: FilterOptions = {
  provinciasData: [],
  cultivos: [],
  causas: [],
  anios: [],
  estados: [],
}

export function useFilterOptions(): FilterOptions & { isLoading: boolean } {
  const { data, isLoading } = useQuery({
    queryKey: ['filter-options'],
    queryFn:  fetchFilterOptions,
    staleTime: Infinity,
  })

  return { ...(data ?? FALLBACK), isLoading }
}
