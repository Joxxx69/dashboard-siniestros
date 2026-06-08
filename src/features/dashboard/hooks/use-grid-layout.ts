import { useLayoutStore } from '@/store/layout.store'

export const useGridLayout = () => {
  const { layouts, setLayouts, resetLayouts } = useLayoutStore()
  return { layouts, setLayouts, resetLayouts }
}
