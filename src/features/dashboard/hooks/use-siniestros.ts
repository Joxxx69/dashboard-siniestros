import { useQuery } from '@tanstack/react-query'
import { useFiltersStore } from '@/store/filters.store'
import { createSiniestrosService } from '../lib/siniestros.factory'

const service = createSiniestrosService()

export const useSiniestros = () => {
  const filters = useFiltersStore((s) => s.filters)

  return useQuery({
    queryKey: ['siniestros', filters],
    queryFn:  () => service.getSiniestros(filters),
  })
}
