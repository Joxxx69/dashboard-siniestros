import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useFiltersStore } from '@/store/filters.store'
import { createSiniestrosService } from '../lib/siniestros.factory'
import { applyFilters } from '../utils/filters.util'
import type { DashboardFilters } from '../types'

const service = createSiniestrosService()

const EMPTY_FILTERS: DashboardFilters = {
  provincia: '', canton: '', cultivo: '', tipoEvento: '', anio: '', estado: '',
}

export const useSiniestros = () => {
  const filters = useFiltersStore((s) => s.filters)

  const query = useQuery({
    queryKey:  ['siniestros'],
    queryFn:   () => service.getSiniestros(EMPTY_FILTERS),
    staleTime: Infinity,
  })

  const data = useMemo(
    () => query.data ? applyFilters(query.data, filters) : query.data,
    [query.data, filters],
  )

  return { ...query, data }
}
