import { useState, useEffect } from 'react'

/**
 * Hook to detect if user prefers reduced motion
 * Respects the prefers-reduced-motion media query for accessibility
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      return
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches)
    }

    // Use the newer addEventListener if available, fallback to addListener
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange)
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange)
    }
    
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange)
      } else {
        // Fallback for older browsers
        mediaQuery.removeListener(handleChange)
      }
    }
  }, [])

  return prefersReducedMotion
}

/**
 * Hook to conditionally apply animation classes based on user preferences
 * @param animationClass - The animation class to apply
 * @param fallbackClass - Optional fallback class for reduced motion users
 * @returns The appropriate class name
 */
export function useAnimationClass(
  animationClass: string, 
  fallbackClass: string = ''
): string {
  const prefersReducedMotion = useReducedMotion()
  return prefersReducedMotion ? fallbackClass : animationClass
}

/**
 * Hook to get animation duration based on user preferences
 * @param normalDuration - Normal animation duration in ms
 * @param reducedDuration - Reduced animation duration in ms (default: 0)
 * @returns The appropriate duration
 */
export function useAnimationDuration(
  normalDuration: number, 
  reducedDuration: number = 0
): number {
  const prefersReducedMotion = useReducedMotion()
  return prefersReducedMotion ? reducedDuration : normalDuration
} 