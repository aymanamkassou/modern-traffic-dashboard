import { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
  variant?: 'default' | 'illustration'
  className?: string
}

export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action, 
  variant = 'default',
  className 
}: EmptyStateProps) {
  return (
    <Card className={cn("animate-fade-in-up", className)}>
      <CardContent className="flex items-center justify-center py-16">
        <div className="text-center space-y-4 max-w-md">
          <div className="mx-auto w-20 h-20 rounded-full bg-muted/30 flex items-center justify-center">
            <Icon className="h-10 w-10 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {description}
            </p>
          </div>
          {action && (
            <Button onClick={action.onClick} className="mt-4">
              {action.label}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 