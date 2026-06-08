import type { ISiniestrosRepository } from '../repositories/siniestros.repository'
import type { DashboardFilters, Siniestro } from '../types'
import { MOCK_SINIESTROS } from '../mocks/siniestros.mock'
import { applyFilters } from '../utils/filters.util'

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

export class MockSiniestrosAdapter implements ISiniestrosRepository {
  async getAll(filters: DashboardFilters): Promise<Siniestro[]> {
    await delay(350)
    return applyFilters(MOCK_SINIESTROS, filters)
  }
}
