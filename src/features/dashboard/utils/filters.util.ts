import type { DashboardFilters, Siniestro } from '../types'

export function applyFilters(data: Siniestro[], filters: DashboardFilters): Siniestro[] {
  return data.filter((s) => {
    if (filters.provincia  && s.provincia  !== filters.provincia)  return false
    if (filters.canton     && s.canton     !== filters.canton)     return false
    if (filters.cultivo    && s.cultivo    !== filters.cultivo)    return false
    if (filters.tipoEvento && s.tipoEvento !== filters.tipoEvento) return false
    if (filters.anio       && !s.fecha.endsWith(filters.anio))     return false
    return true
  })
}
