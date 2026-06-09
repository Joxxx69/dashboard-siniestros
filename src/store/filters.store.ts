import { create } from 'zustand'
import type { DashboardFilters } from '@/features/dashboard/types'

const DEFAULT_FILTERS: DashboardFilters = {
  provincia:  '',
  canton:     '',
  cultivo:    '',
  tipoEvento: '',
  anio:       '',
}

interface FiltersStore {
  filters: DashboardFilters
  setFilter: (key: keyof DashboardFilters, value: string) => void
  setFilters: (partial: Partial<DashboardFilters>) => void
  clearFilters: () => void
}

export const useFiltersStore = create<FiltersStore>((set) => ({
  filters: DEFAULT_FILTERS,
  setFilter: (key, value) =>
    set((state) => ({ filters: { ...state.filters, [key]: value } })),
  setFilters: (partial) =>
    set((state) => ({ filters: { ...state.filters, ...partial } })),
  clearFilters: () => set({ filters: DEFAULT_FILTERS }),
}))
