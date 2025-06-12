import { useEffect, useRef, useCallback, useState } from 'react'
import { useReducedMotion } from './use-reduced-motion'

interface PerformanceAnimationOptions {
  duration?: number
  delay?: number
  easing?: string
  onStart?: () => void
  onComplete?: () => void
  onFrame?: (progress: number) => void
}

interface AnimationState {
  isAnimating: boolean
  progress: number
  startTime: number | null
}

/**
 * High-performance animation hook with GPU acceleration and proper cleanup
 * 
 * Features:
 * - 60fps animations using requestAnimationFrame
 * - Automatic GPU acceleration management
 * - will-change property optimization
 * - Memory leak prevention with proper cleanup
 * - Accessibility support with reduced motion
 */
export function usePerformanceAnimation(
  trigger: boolean,
  options: PerformanceAnimationOptions = {}
) {
  const {
    duration = 300,
    delay = 0,
    easing = 'ease-out',
    onStart,
    onComplete,
    onFrame
  } = options

  const prefersReducedMotion = useReducedMotion()
  const [state, setState] = useState<AnimationState>({
    isAnimating: false,
    progress: 0,
    startTime: null
  })

  const rafRef = useRef<number>(0)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const elementRef = useRef<HTMLElement | null>(null)

  // Easing functions for smooth animations
  const easingFunctions = {
    'ease-out': (t: number) => 1 - Math.pow(1 - t, 3),
    'ease-in': (t: number) => t * t * t,
    'ease-in-out': (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
    'ease-back': (t: number) => 2.7 * t * t * t - 1.7 * t * t,
    'ease-bounce': (t: number) => {
      const n1 = 7.5625
      const d1 = 2.75
      if (t < 1 / d1) {
        return n1 * t * t
      } else if (t < 2 / d1) {
        return n1 * (t -= 1.5 / d1) * t + 0.75
      } else if (t < 2.5 / d1) {
        return n1 * (t -= 2.25 / d1) * t + 0.9375
      } else {
        return n1 * (t -= 2.625 / d1) * t + 0.984375
      }
    }
  }

  const easingFunction = easingFunctions[easing as keyof typeof easingFunctions] || easingFunctions['ease-out']

  // Animation frame handler
  const animate = useCallback((timestamp: number) => {
    if (!state.startTime) {
      setState(prev => ({ ...prev, startTime: timestamp }))
      onStart?.()
    }

    const elapsed = timestamp - (state.startTime || timestamp)
    const progress = Math.min(elapsed / duration, 1)
    const easedProgress = easingFunction(progress)

    setState(prev => ({ ...prev, progress: easedProgress }))
    onFrame?.(easedProgress)

    if (progress < 1) {
      rafRef.current = requestAnimationFrame(animate)
    } else {
      // Animation complete
      setState(prev => ({ ...prev, isAnimating: false }))
      onComplete?.()
      
      // Clean up GPU acceleration
      if (elementRef.current) {
        elementRef.current.style.willChange = 'auto'
      }
    }
  }, [state.startTime, duration, easingFunction, onStart, onFrame, onComplete])

  // Start animation
  const startAnimation = useCallback(() => {
    if (prefersReducedMotion) {
      // Skip animation for reduced motion
      setState({ isAnimating: false, progress: 1, startTime: null })
      onStart?.()
      onComplete?.()
      return
    }

    // Set up GPU acceleration
    if (elementRef.current) {
      elementRef.current.style.willChange = 'transform, opacity'
    }

    setState({ isAnimating: true, progress: 0, startTime: null })

    if (delay > 0) {
      timeoutRef.current = setTimeout(() => {
        rafRef.current = requestAnimationFrame(animate)
      }, delay)
    } else {
      rafRef.current = requestAnimationFrame(animate)
    }
  }, [prefersReducedMotion, delay, animate, onStart, onComplete])

  // Stop animation
  const stopAnimation = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    setState({ isAnimating: false, progress: 0, startTime: null })
    
    // Clean up GPU acceleration
    if (elementRef.current) {
      elementRef.current.style.willChange = 'auto'
    }
  }, [])

  // Effect to handle trigger changes
  useEffect(() => {
    if (trigger) {
      startAnimation()
    } else {
      stopAnimation()
    }

    return () => {
      stopAnimation()
    }
  }, [trigger, startAnimation, stopAnimation])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return {
    ...state,
    elementRef,
    startAnimation,
    stopAnimation
  }
}

/**
 * Hook for managing multiple staggered animations with performance optimization
 */
export function useStaggeredPerformanceAnimation(
  items: any[],
  staggerDelay: number = 50,
  animationOptions: PerformanceAnimationOptions = {}
) {
  const [activeAnimations, setActiveAnimations] = useState<Set<number>>(new Set())
  const [completedAnimations, setCompletedAnimations] = useState<Set<number>>(new Set())
  const prefersReducedMotion = useReducedMotion()

  const startStaggeredAnimations = useCallback(() => {
    if (prefersReducedMotion) {
      // Complete all animations immediately for reduced motion
      setActiveAnimations(new Set(items.map((_, index) => index)))
      setCompletedAnimations(new Set(items.map((_, index) => index)))
      return
    }

    setActiveAnimations(new Set())
    setCompletedAnimations(new Set())

    items.forEach((_, index) => {
      setTimeout(() => {
        setActiveAnimations(prev => new Set(prev).add(index))
        
        // Mark as completed after animation duration
        setTimeout(() => {
          setCompletedAnimations(prev => new Set(prev).add(index))
        }, animationOptions.duration || 300)
      }, index * staggerDelay)
    })
  }, [items, staggerDelay, animationOptions.duration, prefersReducedMotion])

  const resetAnimations = useCallback(() => {
    setActiveAnimations(new Set())
    setCompletedAnimations(new Set())
  }, [])

  return {
    activeAnimations,
    completedAnimations,
    startStaggeredAnimations,
    resetAnimations,
    isComplete: completedAnimations.size === items.length
  }
}

/**
 * Hook for intersection observer based animations with performance optimization
 */
export function useIntersectionPerformanceAnimation(
  options: IntersectionObserverInit & PerformanceAnimationOptions = {}
) {
  const [isVisible, setIsVisible] = useState(false)
  const [hasTriggered, setHasTriggered] = useState(false)
  const elementRef = useRef<HTMLElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  const {
    threshold = 0.1,
    rootMargin = '0px',
    root = null,
    ...animationOptions
  } = options

  const animation = usePerformanceAnimation(isVisible && !hasTriggered, animationOptions)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasTriggered) {
          setIsVisible(true)
          setHasTriggered(true)
        }
      },
      { threshold, rootMargin, root }
    )

    observerRef.current.observe(element)

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [threshold, rootMargin, root, hasTriggered])

  const reset = useCallback(() => {
    setIsVisible(false)
    setHasTriggered(false)
  }, [])

  return {
    elementRef,
    isVisible,
    hasTriggered,
    animation,
    reset
  }
} 