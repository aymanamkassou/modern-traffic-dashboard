# TanStack Query Implementation Guide

This document outlines how TanStack Query (React Query) is implemented in the Modern Traffic Dashboard for efficient data fetching, caching, and state management.

## Overview

TanStack Query is used throughout the application to:
- Manage server state and API calls
- Provide automatic caching and background refetching
- Handle loading and error states
- Optimize performance with intelligent data synchronization
- Enable real-time data updates

## Setup and Configuration

### Provider Setup

The QueryClient is configured in `src/components/providers.tsx`:

```typescript
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000, // 30 seconds
        gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
        retry: 3,
        refetchOnWindowFocus: false,
        refetchOnMount: true,
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
```

### Configuration Options Explained

- **staleTime**: Data is considered fresh for 30 seconds
- **gcTime**: Cached data is garbage collected after 5 minutes of being unused
- **retry**: Failed requests are retried up to 3 times
- **refetchOnWindowFocus**: Disabled to prevent unnecessary refetches
- **refetchOnMount**: Enabled to ensure fresh data on component mount

## API Client Structure

The API client (`src/lib/api-client.ts`) provides a centralized approach to data fetching with consistent query keys and error handling.

### Query Key Factory

```typescript
// Hierarchical query keys for efficient cache management
export const queryKeys = {
  traffic: {
    all: ['traffic'] as const,
    lists: () => [...queryKeys.traffic.all, 'list'] as const,
    list: (params: TrafficQueryParams) => [...queryKeys.traffic.lists(), params] as const,
    details: () => [...queryKeys.traffic.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.traffic.details(), id] as const,
    stats: () => [...queryKeys.traffic.all, 'stats'] as const,
    stream: () => [...queryKeys.traffic.all, 'stream'] as const,
  },
  vehicles: {
    all: ['vehicles'] as const,
    lists: () => [...queryKeys.vehicles.all, 'list'] as const,
    list: (params?: any) => [...queryKeys.vehicles.lists(), params] as const,
    stats: () => [...queryKeys.vehicles.all, 'stats'] as const,
    intersection: (id: string) => [...queryKeys.vehicles.all, 'intersection', id] as const,
  },
  // ... other entities
}
```

### Custom Hooks

Each API endpoint has a corresponding custom hook:

```typescript
// Traffic Data Hook
export function useTrafficData(params?: TrafficQueryParams) {
  return useQuery({
    queryKey: queryKeys.traffic.list(params || {}),
    queryFn: () => apiRequest<ApiResponse<TrafficData[]>>('/api/traffic', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    }),
    staleTime: 30 * 1000, // 30 seconds for real-time data
    select: (data) => data.data, // Extract data from API response wrapper
  })
}

// Vehicle Statistics Hook
export function useVehicleStats() {
  return useQuery({
    queryKey: queryKeys.vehicles.stats(),
    queryFn: () => apiRequest<VehicleStats>('/api/vehicles/stats'),
    staleTime: 60 * 1000, // 1 minute for stats
  })
}

// Risk Analysis Hook (with parameters)
export function useRiskAnalysis(intersectionId?: string) {
  return useQuery({
    queryKey: ['risk', 'analysis', intersectionId],
    queryFn: () => apiRequest<any>(`/api/risk/analysis${intersectionId ? `?intersection=${intersectionId}` : ''}`),
    enabled: true, // Always enabled, but could be conditional
    staleTime: 2 * 60 * 1000, // 2 minutes for risk data
  })
}
```

## Usage Patterns

### Basic Data Fetching

```typescript
function TrafficComponent() {
  const { data, isLoading, error, refetch } = useTrafficData()
  
  if (isLoading) return <LoadingSkeleton />
  if (error) return <ErrorMessage error={error} />
  
  return (
    <div>
      {data?.map(item => (
        <TrafficItem key={item.id} data={item} />
      ))}
      <button onClick={() => refetch()}>Refresh</button>
    </div>
  )
}
```

### Conditional Queries

```typescript
function IntersectionDetails({ intersectionId }: { intersectionId?: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['intersection', intersectionId],
    queryFn: () => fetchIntersectionData(intersectionId!),
    enabled: !!intersectionId, // Only run when intersectionId exists
  })
  
  // Component logic...
}
```

### Mutations for Data Updates

```typescript
function useUpdateIntersection() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: IntersectionUpdate) => 
      apiRequest('/api/intersections', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: (data, variables) => {
      // Invalidate and refetch intersection data
      queryClient.invalidateQueries({ queryKey: ['intersections'] })
      
      // Or update specific cache entry
      queryClient.setQueryData(['intersection', variables.id], data)
    },
    onError: (error) => {
      console.error('Failed to update intersection:', error)
    },
  })
}
```

### Real-time Data with Polling

```typescript
function useRealTimeTraffic() {
  return useQuery({
    queryKey: queryKeys.traffic.stream(),
    queryFn: () => apiRequest<TrafficData[]>('/api/traffic/stream'),
    refetchInterval: 5000, // Poll every 5 seconds
    refetchIntervalInBackground: true, // Continue polling when tab is not active
  })
}
```

## Component Integration Examples

### KPI Grid Component

```typescript
export function KPIGrid() {
  const { data: vehicleStats, isLoading: vehicleLoading } = useVehicleStats()
  const { data: riskData, isLoading: riskLoading } = useRiskAnalysis()
  const { data: alertData, isLoading: alertLoading } = useAlertCount({ 
    resolved: false, 
    severity: 'high,critical' 
  })
  
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <VehicleCountCard data={vehicleStats} isLoading={vehicleLoading} />
      <RiskScoreCard data={riskData} isLoading={riskLoading} />
      <AlertCard data={alertData} isLoading={alertLoading} />
    </div>
  )
}
```

### Error Handling

```typescript
function TrafficChart() {
  const { data, error, isLoading, refetch } = useHistoricalTraffic({ 
    aggregation: 'hour' 
  })
  
  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <AlertTriangle className="h-8 w-8 text-destructive mx-auto" />
            <div>
              <h3 className="font-medium">Failed to load traffic data</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {error.message || 'An unexpected error occurred'}
              </p>
            </div>
            <Button onClick={() => refetch()} variant="outline" size="sm">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  // Rest of component...
}
```

## Performance Optimizations

### Data Transformation with `select`

```typescript
function useProcessedTrafficData() {
  return useQuery({
    queryKey: ['traffic', 'processed'],
    queryFn: () => apiRequest<TrafficData[]>('/api/traffic'),
    select: (data) => {
      // Transform data on the client side
      return data.data.map(item => ({
        ...item,
        efficiency: calculateEfficiency(item),
        riskLevel: calculateRisk(item),
      }))
    },
  })
}
```

### Prefetching

```typescript
function useIntersectionPrefetch() {
  const queryClient = useQueryClient()
  
  const prefetchIntersection = (id: string) => {
    queryClient.prefetchQuery({
      queryKey: ['intersection', id],
      queryFn: () => fetchIntersectionData(id),
      staleTime: 60 * 1000,
    })
  }
  
  return { prefetchIntersection }
}
```

### Background Updates

```typescript
// Automatically sync data in the background
function useBackgroundSync() {
  const queryClient = useQueryClient()
  
  useEffect(() => {
    const interval = setInterval(() => {
      // Refetch critical data in background
      queryClient.invalidateQueries({ 
        queryKey: ['traffic'], 
        refetchType: 'active' 
      })
    }, 30000) // Every 30 seconds
    
    return () => clearInterval(interval)
  }, [queryClient])
}
```

## Best Practices

### 1. Query Key Consistency
- Use the query key factory pattern
- Keep keys hierarchical and predictable
- Include all parameters that affect the query result

### 2. Error Boundaries
```typescript
function QueryErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallback={<ErrorFallback />}
      onError={(error) => {
        console.error('Query error:', error)
        // Log to monitoring service
      }}
    >
      {children}
    </ErrorBoundary>
  )
}
```

### 3. Loading States
- Use skeleton components for better UX
- Implement progressive loading for complex data
- Show meaningful loading indicators

### 4. Cache Management
```typescript
// Invalidate related queries after mutations
const updateIntersection = useMutation({
  mutationFn: updateIntersectionAPI,
  onSuccess: (data, variables) => {
    // Invalidate all intersection-related queries
    queryClient.invalidateQueries({ queryKey: ['intersections'] })
    queryClient.invalidateQueries({ queryKey: ['traffic'] })
    queryClient.invalidateQueries({ queryKey: ['risk'] })
  },
})
```

### 5. TypeScript Integration
```typescript
// Strongly typed query hooks
export function useTypedTrafficData(): UseQueryResult<TrafficData[], Error> {
  return useQuery({
    queryKey: queryKeys.traffic.lists(),
    queryFn: () => apiRequest<ApiResponse<TrafficData[]>>('/api/traffic'),
    select: (response) => response.data,
  })
}
```

## Debugging and Development

### React Query Devtools
The devtools are enabled in development mode and provide:
- Query cache inspection
- Query invalidation controls
- Performance monitoring
- Network request tracking

### Logging
```typescript
const queryClient = new QueryClient({
  logger: {
    log: console.log,
    warn: console.warn,
    error: console.error,
  },
  defaultOptions: {
    queries: {
      onError: (error) => {
        console.error('Query error:', error)
      },
    },
  },
})
```

## Migration Notes

When migrating from other state management solutions:
1. Replace Redux/Zustand for server state with TanStack Query
2. Keep client-only state in local component state or Zustand
3. Use query invalidation instead of manual cache updates
4. Leverage automatic background refetching instead of manual polling

This implementation provides a robust, performant, and developer-friendly approach to managing server state in the Modern Traffic Dashboard. 