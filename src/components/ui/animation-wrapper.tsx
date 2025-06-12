import React, { forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { useReducedMotion } from '@/hooks/use-reduced-motion'

interface AnimationWrapperProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  animation?: 'fade-in-up' | 'slide-in-left' | 'scale-in' | 'bounce-subtle' | 'none'
  delay?: number
  duration?: 'fast' | 'normal' | 'slow'
  easing?: 'smooth' | 'bounce' | 'spring' | 'expo' | 'quart'
  hover?: 'lift' | 'scale' | 'glow' | 'none'
  stagger?: number
  trigger?: boolean
}

const durationClasses = {
  fast: 'duration-150',
  normal: 'duration-300',
  slow: 'duration-500'
}

const easingStyles = {
  smooth: 'var(--ease-smooth)',
  bounce: 'var(--ease-out-back)',
  spring: 'var(--ease-spring)',
  expo: 'var(--ease-out-expo)',
  quart: 'var(--ease-out-quart)'
}

const hoverClasses = {
  lift: 'hover-lift',
  scale: 'hover-scale',
  glow: 'hover-glow',
  none: ''
}

/**
 * AnimationWrapper - A comprehensive animation component for consistent, smooth animations
 * 
 * Features:
 * - GPU-accelerated animations with advanced easing curves
 * - Accessibility support with prefers-reduced-motion
 * - Consistent hover states and micro-interactions
 * - Stagger animation support for lists
 * - Performance optimized with will-change management
 */
export const AnimationWrapper = forwardRef<HTMLDivElement, AnimationWrapperProps>(
  ({
    children,
    className,
    animation = 'fade-in-up',
    delay = 0,
    duration = 'normal',
    easing = 'quart',
    hover = 'none',
    stagger = 0,
    trigger = true,
    style,
    ...props
  }, ref) => {
    const prefersReducedMotion = useReducedMotion()

    const animationClass = prefersReducedMotion ? '' : `animate-${animation}`
    const hoverClass = prefersReducedMotion ? '' : hoverClasses[hover]
    const durationClass = durationClasses[duration]

    const combinedStyle = {
      ...style,
      animationDelay: prefersReducedMotion ? '0ms' : `${delay + stagger}ms`,
      transitionTimingFunction: easingStyles[easing],
      ...(animation !== 'none' && !prefersReducedMotion && {
        animationTimingFunction: easingStyles[easing]
      })
    }

    return (
      <div
        ref={ref}
        className={cn(
          'gpu-accelerated',
          animationClass,
          hoverClass,
          durationClass,
          'focus-ring',
          className
        )}
        style={combinedStyle}
        {...props}
      >
        {children}
      </div>
    )
  }
)

AnimationWrapper.displayName = 'AnimationWrapper'

/**
 * StaggeredList - Animated list with stagger effects
 */
interface StaggeredListProps<T> {
  items: T[]
  renderItem: (item: T, index: number) => React.ReactNode
  keyExtractor: (item: T, index: number) => string
  staggerDelay?: number
  animation?: AnimationWrapperProps['animation']
  className?: string
  itemClassName?: string
}

export function StaggeredList<T>({
  items,
  renderItem,
  keyExtractor,
  staggerDelay = 50,
  animation = 'fade-in-up',
  className,
  itemClassName
}: StaggeredListProps<T>) {
  return (
    <div className={cn('space-y-2', className)}>
      {items.map((item, index) => (
        <AnimationWrapper
          key={keyExtractor(item, index)}
          animation={animation}
          stagger={index * staggerDelay}
          className={itemClassName}
        >
          {renderItem(item, index)}
        </AnimationWrapper>
      ))}
    </div>
  )
}

/**
 * AnimatedCard - Pre-configured card with smooth animations
 */
interface AnimatedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  hover?: AnimationWrapperProps['hover']
  delay?: number
}

export function AnimatedCard({ 
  children, 
  className, 
  hover = 'lift',
  delay = 0,
  ...props 
}: AnimatedCardProps) {
  return (
    <AnimationWrapper
      animation="fade-in-up"
      hover={hover}
      delay={delay}
      easing="quart"
      className={cn('rounded-lg border bg-card text-card-foreground shadow-sm', className)}
      {...props}
    >
      {children}
    </AnimationWrapper>
  )
}

/**
 * AnimatedButton - Enhanced button with micro-interactions
 */
interface AnimatedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  loading?: boolean
}

export function AnimatedButton({
  children,
  className,
  variant = 'default',
  size = 'default',
  loading = false,
  disabled,
  ...props
}: AnimatedButtonProps) {
  const prefersReducedMotion = useReducedMotion()

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium',
        'transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
        'disabled:pointer-events-none disabled:opacity-50',
        !prefersReducedMotion && 'hover-scale active:scale-95',
        {
          'bg-primary text-primary-foreground shadow hover:bg-primary/90': variant === 'default',
          'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90': variant === 'destructive',
          'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground': variant === 'outline',
          'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80': variant === 'secondary',
          'hover:bg-accent hover:text-accent-foreground': variant === 'ghost',
          'text-primary underline-offset-4 hover:underline': variant === 'link',
          'h-9 px-4 py-2': size === 'default',
          'h-8 rounded-md px-3 text-xs': size === 'sm',
          'h-10 rounded-md px-8': size === 'lg',
          'h-9 w-9': size === 'icon'
        },
        className
      )}
      disabled={disabled || loading}
      style={{
        transitionTimingFunction: 'var(--ease-out-back)'
      }}
      {...props}
    >
      {loading && (
        <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
      )}
      {children}
    </button>
  )
}

export default AnimationWrapper 