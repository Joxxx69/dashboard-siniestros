'use client'

import { GripVertical, RotateCcw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface ChartCardProps {
  readonly title: string
  readonly isLoading?: boolean
  readonly children: React.ReactNode
  readonly className?: string
}

export function ChartCard({ title, isLoading, children, className }: ChartCardProps) {
  return (
    <Card className={cn('h-full flex flex-col overflow-hidden', className)}>
      <CardHeader className="py-3 px-4 flex-row items-center justify-between space-y-0 border-b border-border/50">
        <CardTitle className="text-sm font-semibold text-gray-700">{title}</CardTitle>
        <GripVertical className="drag-handle h-4 w-4 text-gray-400 cursor-grab active:cursor-grabbing shrink-0" />
      </CardHeader>
      <CardContent className="flex-1 p-3 min-h-0">
        {isLoading ? (
          <Skeleton className="w-full h-full" />
        ) : (
          <div className="w-full h-full">{children}</div>
        )}
      </CardContent>
    </Card>
  )
}
