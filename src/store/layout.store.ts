import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Layouts } from 'react-grid-layout'

export const DEFAULT_LAYOUTS: Layouts = {
  lg: [
    { i: 'by-province',  x: 0, y: 0, w: 4, h: 6, minW: 3, minH: 4 },
    { i: 'by-event',     x: 4, y: 0, w: 4, h: 6, minW: 3, minH: 4 },
    { i: 'monthly-trend',x: 8, y: 0, w: 4, h: 6, minW: 3, minH: 4 },
    { i: 'by-crop',      x: 0, y: 6, w: 4, h: 6, minW: 3, minH: 4 },
    { i: 'by-year',      x: 4, y: 6, w: 4, h: 6, minW: 3, minH: 4 },
    { i: 'ha-by-event',  x: 8, y: 6, w: 4, h: 6, minW: 3, minH: 4 },
  ],
  md: [
    { i: 'by-province',  x: 0, y: 0,  w: 4, h: 6 },
    { i: 'by-event',     x: 4, y: 0,  w: 4, h: 6 },
    { i: 'monthly-trend',x: 0, y: 6,  w: 4, h: 6 },
    { i: 'by-crop',      x: 4, y: 6,  w: 4, h: 6 },
    { i: 'by-year',      x: 0, y: 12, w: 4, h: 6 },
    { i: 'ha-by-event',  x: 4, y: 12, w: 4, h: 6 },
  ],
  sm: [
    { i: 'by-province',  x: 0, y: 0,  w: 4, h: 6 },
    { i: 'by-event',     x: 0, y: 6,  w: 4, h: 6 },
    { i: 'monthly-trend',x: 0, y: 12, w: 4, h: 6 },
    { i: 'by-crop',      x: 0, y: 18, w: 4, h: 6 },
    { i: 'by-year',      x: 0, y: 24, w: 4, h: 6 },
    { i: 'ha-by-event',  x: 0, y: 30, w: 4, h: 6 },
  ],
}

interface LayoutStore {
  layouts: Layouts
  setLayouts: (layouts: Layouts) => void
  resetLayouts: () => void
}

export const useLayoutStore = create<LayoutStore>()(
  persist(
    (set) => ({
      layouts: DEFAULT_LAYOUTS,
      setLayouts: (layouts) => set({ layouts }),
      resetLayouts: () => set({ layouts: DEFAULT_LAYOUTS }),
    }),
    { name: 'siniestros-dashboard-layout-v2' }
  )
)
