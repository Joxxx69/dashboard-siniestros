import { cn, formatNumber } from '@/lib/utils'

interface MetricValueProps {
  readonly value: number
  readonly suffix?: string
  readonly decimals?: number
  readonly className?: string
}

export function MetricValue({ value, suffix = '', decimals = 0, className }: MetricValueProps) {
  return (
    <span className={cn('text-3xl font-bold text-gray-900 tabular-nums', className)}>
      {formatNumber(value, decimals)}
      {suffix}
    </span>
  )
}
