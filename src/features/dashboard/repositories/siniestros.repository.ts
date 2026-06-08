import type { DashboardFilters, Siniestro } from '../types'

export interface ISiniestrosRepository {
  getAll(filters: DashboardFilters): Promise<Siniestro[]>
}
