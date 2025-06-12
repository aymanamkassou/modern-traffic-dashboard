import { LucideIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  description: string
  icon: LucideIcon
  badge?: string
  actions?: React.ReactNode
  variant?: 'default' | 'card'
  className?: string
}

export function PageHeader({ 
  title, 
  description, 
  icon: Icon, 
  badge, 
  actions,
  variant = 'default',
  className
}: PageHeaderProps) {
  const content = (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            {badge && (
              <Badge variant="outline" className="text-xs">
                {badge}
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-1">{description}</p>
        </div>
      </div>
      {actions && <div>{actions}</div>}
    </div>
  )

  if (variant === 'card') {
    return (
      <Card className={cn("animate-fade-in-up", className)}>
        <CardHeader>
          {content}
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className={cn("space-y-2 animate-fade-in-up", className)}>
      {content}
    </div>
  )
} 