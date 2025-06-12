import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status: 'success' | 'warning' | 'info' | 'error'
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'outline'
  size?: 'sm' | 'default'
}

const statusStyles = {
  success: {
    default: 'bg-success/10 text-success-foreground border-success/20',
    outline: 'border-success/30 text-success-foreground'
  },
  warning: {
    default: 'bg-warning/10 text-warning-foreground border-warning/20',
    outline: 'border-warning/30 text-warning-foreground'
  },
  info: {
    default: 'bg-info/10 text-info-foreground border-info/20',
    outline: 'border-info/30 text-info-foreground'
  },
  error: {
    default: 'bg-destructive/10 text-destructive-foreground border-destructive/20',
    outline: 'border-destructive/30 text-destructive-foreground'
  }
}

export function StatusBadge({ 
  status, 
  children, 
  className, 
  variant = 'default',
  size = 'default'
}: StatusBadgeProps) {
  const statusClass = statusStyles[status][variant]
  
  return (
    <Badge 
      variant={variant}
      className={cn(
        statusClass,
        size === 'sm' && 'text-xs',
        className
      )}
    >
      {children}
    </Badge>
  )
}

// Utility component for live status indicators
interface LiveStatusProps {
  className?: string
}

export function LiveStatus({ className }: LiveStatusProps) {
  return (
    <StatusBadge status="success" variant="outline" className={cn("animate-pulse", className)}>
      <div className="w-2 h-2 bg-success rounded-full mr-2" />
      Live
    </StatusBadge>
  )
} 