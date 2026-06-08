import { type LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { MetricValue } from '../atoms/metric-value'
import { cn } from '@/lib/utils'

interface MetricCardProps {
  readonly label: string
  readonly value: number
  readonly suffix?: string
  readonly decimals?: number
  readonly icon: LucideIcon
  readonly iconColor?: string
  readonly isLoading?: boolean
}

export function MetricCard({ label, value, suffix, decimals, icon: Icon, iconColor = 'text-green-700', isLoading }: MetricCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-5">
          <Skeleton className="h-4 w-24 mb-3" />
          <Skeleton className="h-8 w-20" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
            <MetricValue value={value} suffix={suffix} decimals={decimals} />
          </div>
          <div className={cn('p-2 rounded-lg bg-green-50', iconColor)}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
