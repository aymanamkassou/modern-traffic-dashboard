import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export function PageHeaderSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse space-y-2", className)}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-muted rounded-lg" />
        <div className="space-y-2">
          <div className="h-8 bg-muted rounded w-64" />
          <div className="h-4 bg-muted rounded w-96" />
        </div>
      </div>
    </div>
  )
}

export function MetricsGridSkeleton({ count = 4, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("grid gap-6 md:grid-cols-2 lg:grid-cols-4", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardContent className="p-6">
            <div className="space-y-3">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-8 bg-muted rounded w-1/2" />
              <div className="h-3 bg-muted rounded w-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function ChartSkeleton({ height = "h-80", className }: { height?: string; className?: string }) {
  return (
    <Card className={cn("animate-pulse", className)}>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="h-4 bg-muted rounded w-1/3" />
          <div className={`bg-muted rounded ${height}`} />
        </div>
      </CardContent>
    </Card>
  )
}

export function TableSkeleton({ rows = 5, columns = 4, className }: { rows?: number; columns?: number; className?: string }) {
  return (
    <Card className={cn("animate-pulse", className)}>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {Array.from({ length: columns }).map((_, i) => (
              <div key={i} className="h-4 bg-muted rounded w-3/4" />
            ))}
          </div>
          {/* Rows */}
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <div key={rowIndex} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <div key={colIndex} className="h-3 bg-muted/60 rounded w-full" />
              ))}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export function ListSkeleton({ items = 5, className }: { items?: number; className?: string }) {
  return (
    <Card className={cn("animate-pulse", className)}>
      <CardContent className="p-6">
        <div className="space-y-4">
          {Array.from({ length: items }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-8 h-8 bg-muted rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted/60 rounded w-1/2" />
              </div>
              <div className="w-16 h-6 bg-muted rounded" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
} 