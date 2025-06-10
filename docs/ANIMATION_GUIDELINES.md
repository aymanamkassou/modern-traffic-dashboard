# Animation Guidelines & Standards

This document establishes the animation principles, patterns, and implementation standards for the Modern Traffic Dashboard to ensure a cohesive, polished, and professional user experience.

## Core Animation Principles

### 1. **Purposeful Motion**
- Every animation should serve a purpose: provide feedback, guide attention, or communicate state changes
- Avoid gratuitous animations that don't enhance usability
- Animations should feel natural and intuitive

### 2. **Performance First**
- Prioritize CSS animations over JavaScript for better performance
- Use `transform` and `opacity` properties for smooth 60fps animations
- Avoid animating layout properties (`width`, `height`, `top`, `left`)
- Leverage GPU acceleration with `transform3d()` when needed

### 3. **Accessibility & Respect**
- Respect `prefers-reduced-motion` user preferences
- Provide instant alternatives for users who prefer reduced motion
- Ensure animations don't trigger vestibular disorders

### 4. **Consistency**
- Use standardized timing, easing, and patterns across the application
- Maintain visual hierarchy through animation priority

---

## Animation Timing Standards

### Duration Guidelines

| Animation Type | Duration | Use Case | Example |
|----------------|----------|----------|---------|
| **Micro-interactions** | 100-200ms | Button hovers, focus states | `duration-150` |
| **State transitions** | 200-300ms | Loading states, form validation | `duration-300` |
| **Layout changes** | 300-500ms | Adding/removing items, expanding | `duration-500` |
| **Page transitions** | 400-600ms | Route changes, modal appearances | `duration-500` |
| **Complex sequences** | 600ms+ | Multi-step processes, onboarding | Custom timing |

### Easing Functions

```css
/* Standard easing curves */
--ease-out: cubic-bezier(0.25, 0.46, 0.45, 0.94);     /* Natural deceleration */
--ease-in: cubic-bezier(0.55, 0.055, 0.675, 0.19);    /* Gentle acceleration */
--ease-in-out: cubic-bezier(0.645, 0.045, 0.355, 1);  /* Smooth both ends */
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55); /* Playful bounce */
```

**Tailwind CSS Classes:**
- `ease-out` - Default for most animations
- `ease-in` - For elements leaving the screen
- `ease-in-out` - For reversible animations
- Custom easing via CSS variables

---

## Animation Categories & Patterns

### 1. **Micro-interactions**

#### Button Interactions
```tsx
// Standard button hover
<Button className="transition-all duration-150 ease-out hover:scale-105 hover:shadow-md">
  Click me
</Button>

// Loading state
<Button disabled className="animate-pulse">
  <Loader2 className="h-4 w-4 animate-spin mr-2" />
  Loading...
</Button>
```

#### Form Feedback
```tsx
// Success state
<Input className="transition-colors duration-200 border-green-500 focus:ring-green-500" />

// Error state with shake
<Input className="transition-all duration-200 border-red-500 animate-shake" />
```

### 2. **State Transitions**

#### Loading States
```tsx
// Skeleton loading
<div className="animate-pulse">
  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
</div>

// Progressive loading
<div className="animate-fade-in-up">
  {data.map((item, index) => (
    <div 
      key={item.id} 
      className={`animate-fade-in-up animate-stagger-${index % 5 + 1}`}
    >
      {item.content}
    </div>
  ))}
</div>
```

#### Success/Error Feedback
```tsx
// Success notification
<div className="animate-scale-in bg-green-50 border-green-200">
  <CheckCircle className="h-5 w-5 text-green-500" />
  Success message
</div>

// Error notification
<div className="animate-shake bg-red-50 border-red-200">
  <AlertCircle className="h-5 w-5 text-red-500" />
  Error message
</div>
```

### 3. **Layout Animations**

#### Adding/Removing Items
```tsx
// Notification removal (implemented example)
const [removingItems, setRemovingItems] = useState<Set<string>>(new Set())

const handleRemove = (id: string) => {
  setRemovingItems(prev => new Set(prev).add(id))
  setTimeout(() => {
    removeItem(id)
    setRemovingItems(prev => {
      const newSet = new Set(prev)
      newSet.delete(id)
      return newSet
    })
  }, 300)
}

// Render with animation
<div className={cn(
  "transition-all duration-300 ease-out",
  removingItems.has(item.id) 
    ? "animate-slide-out-right" 
    : "animate-fade-in-up"
)}>
  {item.content}
</div>
```

#### Expanding/Collapsing
```tsx
// Accordion animation
<div className={cn(
  "overflow-hidden transition-all duration-300 ease-out",
  isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
)}>
  <div className="p-4">
    {content}
  </div>
</div>
```

### 4. **Navigation Animations**

#### Modal Appearances
```tsx
// Modal backdrop
<div className="fixed inset-0 bg-black/50 animate-fade-in" />

// Modal content
<div className="animate-scale-in bg-white rounded-lg shadow-xl">
  {modalContent}
</div>
```

#### Page Transitions
```tsx
// Route transition wrapper
<div className="animate-fade-in-up">
  {children}
</div>
```

---

## Custom Animation Classes

### Core Animations (in `globals.css`)

```css
/* Slide animations */
.animate-slide-out-right {
  animation: slide-out-right 0.3s ease-out forwards;
}

.animate-slide-in-left {
  animation: slide-in-left 0.3s ease-out;
}

/* Fade animations */
.animate-fade-in-up {
  animation: fade-in-up 0.3s ease-out;
}

.animate-fade-out-down {
  animation: fade-out-down 0.3s ease-out forwards;
}

/* Scale animations */
.animate-scale-in {
  animation: scale-in 0.2s ease-out;
}

.animate-scale-out {
  animation: scale-out 0.2s ease-out forwards;
}

/* Utility animations */
.animate-shake {
  animation: shake 0.5s ease-in-out;
}

.animate-bounce-subtle {
  animation: bounce-subtle 0.6s ease-out;
}
```

### Stagger Delays
```css
/* For sequential animations */
.animate-stagger-1 { animation-delay: 0.05s; }
.animate-stagger-2 { animation-delay: 0.1s; }
.animate-stagger-3 { animation-delay: 0.15s; }
.animate-stagger-4 { animation-delay: 0.2s; }
.animate-stagger-5 { animation-delay: 0.25s; }
```

---

## Implementation Patterns

### 1. **React Component Animation Hook**

```tsx
// useAnimation.ts
import { useState, useEffect } from 'react'

export function useAnimation(trigger: boolean, duration: number = 300) {
  const [isAnimating, setIsAnimating] = useState(false)
  const [shouldRender, setShouldRender] = useState(trigger)

  useEffect(() => {
    if (trigger) {
      setShouldRender(true)
      setIsAnimating(true)
    } else {
      setIsAnimating(false)
      const timer = setTimeout(() => setShouldRender(false), duration)
      return () => clearTimeout(timer)
    }
  }, [trigger, duration])

  return { isAnimating, shouldRender }
}

// Usage
function AnimatedComponent({ show }: { show: boolean }) {
  const { isAnimating, shouldRender } = useAnimation(show)
  
  if (!shouldRender) return null
  
  return (
    <div className={cn(
      "transition-all duration-300",
      isAnimating ? "animate-fade-in-up" : "animate-fade-out-down"
    )}>
      Content
    </div>
  )
}
```

### 2. **List Animation Pattern**

```tsx
// AnimatedList.tsx
interface AnimatedListProps<T> {
  items: T[]
  renderItem: (item: T, index: number) => React.ReactNode
  keyExtractor: (item: T) => string
  staggerDelay?: number
}

export function AnimatedList<T>({ 
  items, 
  renderItem, 
  keyExtractor,
  staggerDelay = 50 
}: AnimatedListProps<T>) {
  return (
    <div className="space-y-2">
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
```

### 3. **Loading State Pattern**

```tsx
// LoadingState.tsx
interface LoadingStateProps {
  isLoading: boolean
  children: React.ReactNode
  skeleton?: React.ReactNode
}

export function LoadingState({ isLoading, children, skeleton }: LoadingStateProps) {
  if (isLoading) {
    return (
      <div className="animate-pulse">
        {skeleton || <DefaultSkeleton />}
      </div>
    )
  }

  return (
    <div className="animate-fade-in-up">
      {children}
    </div>
  )
}
```

---

## Accessibility Considerations

### Reduced Motion Support

```css
/* Respect user preferences */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

### React Implementation

```tsx
// useReducedMotion.ts
import { useEffect, useState } from 'react'

export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handleChange = () => setPrefersReducedMotion(mediaQuery.matches)
    mediaQuery.addEventListener('change', handleChange)
    
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return prefersReducedMotion
}

// Usage in components
function AnimatedComponent() {
  const prefersReducedMotion = useReducedMotion()
  
  return (
    <div className={cn(
      "transition-all",
      prefersReducedMotion ? "duration-0" : "duration-300 animate-fade-in-up"
    )}>
      Content
    </div>
  )
}
```

---

## Performance Best Practices

### 1. **GPU Acceleration**
```css
/* Force GPU acceleration for smooth animations */
.gpu-accelerated {
  transform: translateZ(0);
  will-change: transform, opacity;
}

/* Clean up after animation */
.animation-complete {
  will-change: auto;
}
```

### 2. **Animation Cleanup**
```tsx
// Clean up will-change after animation
useEffect(() => {
  const element = ref.current
  if (!element) return

  const handleAnimationEnd = () => {
    element.style.willChange = 'auto'
  }

  element.addEventListener('animationend', handleAnimationEnd)
  return () => element.removeEventListener('animationend', handleAnimationEnd)
}, [])
```

### 3. **Conditional Animations**
```tsx
// Only animate when necessary
const shouldAnimate = !prefersReducedMotion && isVisible && !isFirstRender

return (
  <div className={cn(
    shouldAnimate && "animate-fade-in-up"
  )}>
    Content
  </div>
)
```

---

## Testing Animations

### 1. **Visual Testing**
- Test animations at different screen sizes
- Verify smooth 60fps performance
- Check animation timing feels natural
- Test with reduced motion preferences

### 2. **Performance Testing**
```tsx
// Monitor animation performance
useEffect(() => {
  const observer = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
      if (entry.entryType === 'measure') {
        console.log(`Animation ${entry.name}: ${entry.duration}ms`)
      }
    })
  })
  
  observer.observe({ entryTypes: ['measure'] })
  
  return () => observer.disconnect()
}, [])
```

### 3. **Accessibility Testing**
- Test with screen readers
- Verify reduced motion compliance
- Check keyboard navigation during animations

---

## Future Enhancements

### Planned Animation Features

1. **Framer Motion Integration**
   - Advanced physics-based animations
   - Gesture-based interactions
   - Complex animation sequences

2. **Intersection Observer Animations**
   - Scroll-triggered animations
   - Progressive disclosure
   - Performance-optimized viewport animations

3. **Theme-Aware Animations**
   - Different animation styles for light/dark themes
   - Seasonal animation variations
   - User preference-based animation intensity

4. **Advanced Micro-interactions**
   - Haptic feedback integration
   - Sound-synchronized animations
   - Context-aware animation responses

---

## Related Documentation

- [Design Philosophy](./DESIGN_PHILOSOPHY.md) - Overall design principles
- [Component Guidelines](./COMPONENTS_AND_PAGES.md) - Component-specific patterns
- [Notification System](./NOTIFICATION_SYSTEM.md) - Notification animation examples

---

*Last Updated: January 2024*  
*Version: 1.0.0* 