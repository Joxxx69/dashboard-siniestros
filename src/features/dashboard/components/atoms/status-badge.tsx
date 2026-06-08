import { Badge } from '@/components/ui/badge'
import type { EstadoTramite } from '../../types'

const VARIANT_MAP: Record<EstadoTramite, 'success' | 'warning' | 'info' | 'danger' | 'muted'> = {
  Inspeccionado: 'success',
  Pendiente: 'warning',
  'En proceso': 'info',
  Rechazado: 'danger',
  Aprobado: 'success',
}

interface StatusBadgeProps {
  readonly status: EstadoTramite
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return <Badge variant={VARIANT_MAP[status]}>{status}</Badge>
}
