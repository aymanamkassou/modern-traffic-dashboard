import React from 'react'
import { cn } from '@/lib/utils'

interface AnimatedListProps<T> {
  items: T[]
  renderItem: (item: T, index: number) => React.ReactNode
  keyExtractor: (item: T) => string
  staggerDelay?: number
  className?: string
}

export function AnimatedList<T>({ 
  items, 
  renderItem, 
  keyExtractor,
  staggerDelay = 50,
  className
}: AnimatedListProps<T>) {
  return (
    <div className={cn("space-y-2", className)}>
      {items.map((item, index) => (
        <div
          key={keyExtractor(item)}
          className="animate-fade-in-up"
          style={{ animationDelay: `${index * staggerDelay}ms` }}
        >
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  )
}

// Utility component for simple page component lists
interface PageComponentItem {
  id: string
  component: React.ReactNode
}

interface PageComponentListProps {
  components: PageComponentItem[]
  staggerDelay?: number
  className?: string
}

export function PageComponentList({ 
  components, 
  staggerDelay = 100,
  className 
}: PageComponentListProps) {
  return (
    <AnimatedList
      items={components}
      renderItem={(item) => item.component}
      keyExtractor={(item) => item.id}
      staggerDelay={staggerDelay}
      className={className}
    />
  )
} 