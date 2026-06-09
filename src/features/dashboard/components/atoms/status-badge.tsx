import { Badge } from '@/components/ui/badge'
import type { EstadoTramite } from '../../types'

const VARIANT_MAP: Record<EstadoTramite, 'success' | 'warning' | 'info' | 'danger' | 'muted'> = {
  Ajustado:     'info',
  Cerrado:      'muted',
  Inspeccionado:'info',
  Liquidado:    'warning',
  Negado:       'danger',
  Pagado:       'success',
}

interface StatusBadgeProps {
  readonly status: string
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const variant = VARIANT_MAP[status as EstadoTramite] ?? 'muted'
  return <Badge variant={variant}>{status}</Badge>
}
