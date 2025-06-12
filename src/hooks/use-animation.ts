import { useState, useEffect, useRef } from 'react'
import { useReducedMotion } from './use-reduced-motion'

interface UseAnimationOptions {
  duration?: number
  delay?: number
  onComplete?: () => void
  onStart?: () => void
}

interface UseAnimationReturn {
  isAnimating: boolean
  shouldRender: boolean
  triggerAnimation: () => void
  resetAnimation: () => void
}

/**
 * Enhanced animation hook with accessibility support
 * Provides fine-grained control over animation states
 */
export function useAnimation(
  trigger: boolean, 
  options: UseAnimationOptions = {}
): UseAnimationReturn {
  const { 
    duration = 300, 
    delay = 0, 
    onComplete, 
    onStart 
  } = options

  const [isAnimating, setIsAnimating] = useState(false)
  const [shouldRender, setShouldRender] = useState(trigger)
  const prefersReducedMotion = useReducedMotion()
  const timeoutRef = useRef<NodeJS.Timeout>()
  const delayTimeoutRef = useRef<NodeJS.Timeout>()

  const effectiveDuration = prefersReducedMotion ? 0 : duration
  const effectiveDelay = prefersReducedMotion ? 0 : delay

  const triggerAnimation = () => {
    if (delayTimeoutRef.current) {
      clearTimeout(delayTimeoutRef.current)
    }

    if (effectiveDelay > 0) {
      delayTimeoutRef.current = setTimeout(() => {
        setIsAnimating(true)
        if (onStart) onStart()
      }, effectiveDelay)
    } else {
      setIsAnimating(true)
      if (onStart) onStart()
    }
  }

  const resetAnimation = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    if (delayTimeoutRef.current) {
      clearTimeout(delayTimeoutRef.current)
    }
    setIsAnimating(false)
    setShouldRender(false)
  }

  useEffect(() => {
    if (trigger) {
      setShouldRender(true)
      triggerAnimation()
    } else {
      setIsAnimating(false)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      timeoutRef.current = setTimeout(() => {
        setShouldRender(false)
        onComplete?.()
      }, effectiveDuration)
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (delayTimeoutRef.current) {
        clearTimeout(delayTimeoutRef.current)
      }
    }
  }, [trigger, effectiveDuration, effectiveDelay])

  return { 
    isAnimating, 
    shouldRender, 
    triggerAnimation, 
    resetAnimation 
  }
}

/**
 * Hook for staggered list animations
 */
export function useStaggeredAnimation(
  items: any[], 
  staggerDelay: number = 50
) {
  const [visibleItems, setVisibleItems] = useState<Set<number>>(new Set())
  const prefersReducedMotion = useReducedMotion()
  const effectiveDelay = prefersReducedMotion ? 0 : staggerDelay

  useEffect(() => {
    if (items.length === 0) {
      setVisibleItems(new Set())
      return
    }

    const timeouts: NodeJS.Timeout[] = []

    items.forEach((_, index) => {
      const timeout = setTimeout(() => {
        setVisibleItems(prev => new Set(prev).add(index))
      }, index * effectiveDelay)
      timeouts.push(timeout)
    })

    return () => {
      timeouts.forEach(clearTimeout)
    }
  }, [items.length, effectiveDelay])

  const getItemAnimationClass = (index: number) => {
    if (prefersReducedMotion) return ''
    return visibleItems.has(index) ? 'animate-fade-in-up' : 'opacity-0'
  }

  const getItemDelay = (index: number) => {
    if (prefersReducedMotion) return 0
    return index * staggerDelay
  }

  return {
    visibleItems,
    getItemAnimationClass,
    getItemDelay,
    isComplete: visibleItems.size === items.length
  }
}

/**
 * Hook for intersection observer animations
 */
export function useIntersectionAnimation(
  threshold: number = 0.1,
  rootMargin: string = '0px'
) {
  const [isVisible, setIsVisible] = useState(false)
  const [hasAnimated, setHasAnimated] = useState(false)
  const elementRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setIsVisible(true)
          setHasAnimated(true)
        }
      },
      { threshold, rootMargin }
    )

    observer.observe(element)

    return () => {
      observer.unobserve(element)
    }
  }, [threshold, rootMargin, hasAnimated])

  return {
    elementRef,
    isVisible,
    hasAnimated,
    reset: () => {
      setIsVisible(false)
      setHasAnimated(false)
    }
  }
} 