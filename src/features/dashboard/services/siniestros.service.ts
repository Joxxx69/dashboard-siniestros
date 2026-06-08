import type { ISiniestrosRepository } from '../repositories/siniestros.repository'
import type { DashboardFilters, Siniestro } from '../types'

export class SiniestrosService {
  constructor(private readonly repository: ISiniestrosRepository) {}

  getSiniestros(filters: DashboardFilters): Promise<Siniestro[]> {
    return this.repository.getAll(filters)
  }
}
