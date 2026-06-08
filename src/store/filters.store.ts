import { create } from 'zustand'
import type { DashboardFilters } from '@/features/dashboard/types'

const DEFAULT_FILTERS: DashboardFilters = {
  provincia: '',
  canton: '',
  parroquia: '',
  cultivo: '',
  tipoEvento: '',
  anio: '',
  estado: '',
}

interface FiltersStore {
  filters: DashboardFilters
  setFilter: (key: keyof DashboardFilters, value: string) => void
  clearFilters: () => void
}

export const useFiltersStore = create<FiltersStore>((set) => ({
  filters: DEFAULT_FILTERS,
  setFilter: (key, value) =>
    set((state) => ({ filters: { ...state.filters, [key]: value } })),
  clearFilters: () => set({ filters: DEFAULT_FILTERS }),
}))
