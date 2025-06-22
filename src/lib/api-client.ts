// API Client for Traffic Monitoring Dashboard
// Using TanStack Query for efficient data fetching

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  TrafficData,
  VehicleRecord,
  IntersectionData,
  SensorStatusData,
  AlertData,
  ApiResponse,
  TrafficQueryParams,
  TrafficStats,
  VehicleStats,
  SensorMapResponse,
  StreamEvent,
  HistoricalTrafficData,
  HistoricalTrafficParams
} from '@/types/api';

// Base API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

// Generic fetch function with error handling
async function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    console.log(`🌐 API Request: ${url}`);
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    console.log(`📡 API Response: ${url} - Status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API Error:`, {
        url,
        status: response.status,
        statusText: response.statusText,
        errorText
      });
      throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`✅ API Success: ${url} - Data length:`, Array.isArray(data) ? data.length : 'Not array');
    return data;
  } catch (error) {
    console.error(`💥 API request failed for ${endpoint}:`, error);
    throw error;
  }
}

// Query key factories for consistent caching
export const queryKeys = {
  traffic: {
    all: ['traffic'] as const,
    lists: () => [...queryKeys.traffic.all, 'list'] as const,
    list: (params: TrafficQueryParams) => [...queryKeys.traffic.lists(), params] as const,
    stats: () => [...queryKeys.traffic.all, 'stats'] as const,
  },
  vehicles: {
    all: ['vehicles'] as const,
    lists: () => [...queryKeys.vehicles.all, 'list'] as const,
    list: (params: any) => [...queryKeys.vehicles.lists(), params] as const,
    stats: () => [...queryKeys.vehicles.all, 'stats'] as const,
    intersection: (id: string) => [...queryKeys.vehicles.all, 'intersection', id] as const,
  },
  intersections: {
    all: ['intersections'] as const,
    lists: () => [...queryKeys.intersections.all, 'list'] as const,
    list: (params: any) => [...queryKeys.intersections.lists(), params] as const,
    detail: (id: string) => [...queryKeys.intersections.all, 'detail', id] as const,
    coordination: (id: string) => [...queryKeys.intersections.all, 'coordination', id] as const,
  },
  sensors: {
    all: ['sensors'] as const,
    status: () => [...queryKeys.sensors.all, 'status'] as const,
    registry: () => [...queryKeys.sensors.all, 'registry'] as const,
    map: () => [...queryKeys.sensors.all, 'map'] as const,
    detail: (id: string) => [...queryKeys.sensors.all, 'detail', id] as const,
    intersection: (id: string) => [...queryKeys.sensors.all, 'intersection', id] as const,
  },
  alerts: {
    all: ['alerts'] as const,
    lists: () => [...queryKeys.alerts.all, 'list'] as const,
    list: (params: any) => [...queryKeys.alerts.lists(), params] as const,
    stats: () => [...queryKeys.alerts.all, 'stats'] as const,
    count: (params: any) => [...queryKeys.alerts.all, 'count', params] as const,
  },
  risk: {
    all: ['risk'] as const,
    analysis: () => [...queryKeys.risk.all, 'analysis'] as const,
    heatmap: () => [...queryKeys.risk.all, 'heatmap'] as const,
  },
  historical: {
    all: ['historical'] as const,
    traffic: (params: any) => [...queryKeys.historical.all, 'traffic', params] as const,
    weather: () => [...queryKeys.historical.all, 'weather'] as const,
    congestion: () => [...queryKeys.historical.all, 'congestion'] as const,
    incidents: () => [...queryKeys.historical.all, 'incidents'] as const,
  },
  coordination: {
    all: ['coordination'] as const,
    intersections: () => [...queryKeys.coordination.all, 'intersections'] as const,
    stream: () => [...queryKeys.coordination.all, 'stream'] as const,
  },
};

// Traffic Data Hooks
export function useTrafficData(params: TrafficQueryParams = {}) {
  const queryString = new URLSearchParams(
    Object.entries(params).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null) {
        acc[key] = String(value);
      }
      return acc;
    }, {} as Record<string, string>)
  ).toString();

  return useQuery({
    queryKey: queryKeys.traffic.list(params),
    queryFn: () => apiRequest<ApiResponse<TrafficData>>(`/api/traffic?${queryString}`),
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 10000, // Consider data stale after 10 seconds
  });
}

export function useTrafficStats() {
  return useQuery({
    queryKey: queryKeys.traffic.stats(),
    queryFn: () => apiRequest<TrafficStats>('/api/traffic/stats'),
    refetchInterval: 60000, // Refresh every minute
  });
}

// Vehicle Data Hooks
export function useVehicleData(params: any = {}) {
  const queryString = new URLSearchParams(
    Object.entries(params).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null) {
        acc[key] = String(value);
      }
      return acc;
    }, {} as Record<string, string>)
  ).toString();

  return useQuery({
    queryKey: queryKeys.vehicles.list(params),
    queryFn: () => apiRequest<ApiResponse<VehicleRecord>>(`/api/vehicles?${queryString}`),
    refetchInterval: 30000,
  });
}

export function useVehicleStats(intersection_id?: string) {
  const params: Record<string, string> = intersection_id ? { intersection_id } : {};
  
  return useQuery({
    queryKey: queryKeys.vehicles.stats(),
    queryFn: () => {
      const queryString = new URLSearchParams(params).toString();
      return apiRequest<VehicleStats>(`/api/vehicles/stats?${queryString}`);
    },
    refetchInterval: 60000,
  });
}

export function useIntersectionVehicles(intersectionId: string, timeWindow: number = 60) {
  return useQuery({
    queryKey: queryKeys.vehicles.intersection(intersectionId),
    queryFn: () => apiRequest(`/api/vehicles/intersection/${intersectionId}?timeWindow=${timeWindow}`),
    enabled: !!intersectionId,
    refetchInterval: 30000,
  });
}

export function useVehicleSpecifications() {
  return useQuery({
    queryKey: [...queryKeys.vehicles.all, 'specifications'],
    queryFn: () => apiRequest('/api/vehicles/specifications'),
    staleTime: 24 * 60 * 60 * 1000, // 24 hours - specifications don't change often
    gcTime: 24 * 60 * 60 * 1000,
  });
}

// Intersection Data Hooks
export function useIntersectionData(params: any = {}) {
  const queryString = new URLSearchParams(
    Object.entries(params).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null) {
        acc[key] = String(value);
      }
      return acc;
    }, {} as Record<string, string>)
  ).toString();

  return useQuery({
    queryKey: queryKeys.intersections.list(params),
    queryFn: () => apiRequest<ApiResponse<IntersectionData>>(`/api/intersections?${queryString}`),
    refetchInterval: 30000,
  });
}

export function useIntersectionCoordination(intersectionId: string) {
  return useQuery({
    queryKey: queryKeys.intersections.coordination(intersectionId),
    queryFn: () => apiRequest(`/api/intersections/${intersectionId}/coordination`),
    enabled: !!intersectionId,
    refetchInterval: 10000, // More frequent updates for real-time coordination
  });
}

// Sensor Data Hooks
export function useSensorStatus() {
  return useQuery({
    queryKey: queryKeys.sensors.status(),
    queryFn: () => apiRequest<ApiResponse<SensorStatusData>>('/api/sensors/status'),
    refetchInterval: 30000,
  });
}

export function useSensorRegistry() {
  return useQuery({
    queryKey: queryKeys.sensors.registry(),
    queryFn: () => apiRequest('/api/sensors/registry'),
    refetchInterval: 300000, // Refresh every 5 minutes
  });
}

export function useSensorMap() {
  return useQuery({
    queryKey: queryKeys.sensors.map(),
    queryFn: () => apiRequest<SensorMapResponse>('/api/sensors/map'),
    refetchInterval: 300000,
    staleTime: 60000,
  });
}

export function useSensorCapabilities(sensorId: string) {
  return useQuery({
    queryKey: queryKeys.sensors.detail(sensorId),
    queryFn: () => apiRequest(`/api/sensors/${sensorId}/capabilities`),
    enabled: !!sensorId,
    refetchInterval: 300000,
  });
}

export function useIntersectionSensors(intersectionId: string) {
  return useQuery({
    queryKey: queryKeys.sensors.intersection(intersectionId),
    queryFn: () => apiRequest(`/api/sensors/intersection/${intersectionId}`),
    enabled: !!intersectionId,
    refetchInterval: 60000,
  });
}

// Alert Data Hooks
export function useAlertData(params: any = {}) {
  const queryString = new URLSearchParams(
    Object.entries(params).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null) {
        acc[key] = String(value);
      }
      return acc;
    }, {} as Record<string, string>)
  ).toString();

  return useQuery({
    queryKey: queryKeys.alerts.list(params),
    queryFn: () => apiRequest<ApiResponse<AlertData>>(`/api/alerts?${queryString}`),
    refetchInterval: 15000, // More frequent for alerts
  });
}

export function useAlertStats() {
  return useQuery({
    queryKey: queryKeys.alerts.stats(),
    queryFn: () => apiRequest('/api/alerts/stats'),
    refetchInterval: 60000,
  });
}

export function useAlertCount(params: any = {}) {
  return useQuery({
    queryKey: queryKeys.alerts.count(params),
    queryFn: () => {
      const queryString = new URLSearchParams(params).toString();
      return apiRequest(`/api/alerts/count?${queryString}`);
    },
    refetchInterval: 30000,
  });
}

// Real-time Stream Hooks
export function useTrafficStream(intersectionId?: string) {
  const queryClient = useQueryClient();

  // This would be implemented with EventSource for SSE
  // For now, we'll simulate with polling
  return useQuery({
    queryKey: ['traffic-stream', intersectionId],
    queryFn: async () => {
      // This would connect to SSE endpoint in production
      const params = intersectionId ? `?intersection_id=${intersectionId}` : '';
      return apiRequest<StreamEvent>(`/api/traffic/stream${params}`);
    },
    refetchInterval: 5000, // Poll every 5 seconds
    enabled: false, // Start disabled, enable when needed
  });
}

// Risk Analysis Hooks
export function useRiskAnalysis() {
  return useQuery({
    queryKey: queryKeys.risk.analysis(),
    queryFn: () => apiRequest('/api/risk/analysis'),
    refetchInterval: 60000, // Refresh every minute
    staleTime: 30000,
  });
}

export function useRiskHeatmap() {
  return useQuery({
    queryKey: queryKeys.risk.heatmap(),
    queryFn: () => apiRequest('/api/risk/heatmap'),
    refetchInterval: 120000, // Refresh every 2 minutes
    staleTime: 60000,
  });
}

// Historical Data Hooks
export function useHistoricalTraffic(params: HistoricalTrafficParams = {}) {
  // Set default parameters for 24-hour window if not provided
  const defaultParams: HistoricalTrafficParams = {
    aggregation: 'hour',
    // Don't set default start/end - let the backend handle it
    ...params
  };

  return useQuery({
    queryKey: queryKeys.historical.traffic(defaultParams),
    queryFn: () => {
      const queryString = new URLSearchParams(
        Object.entries(defaultParams).reduce((acc, [key, value]) => {
          if (value !== undefined && value !== null) {
            acc[key] = String(value);
          }
          return acc;
        }, {} as Record<string, string>)
      ).toString();
      return apiRequest<HistoricalTrafficData[]>(`/api/historical/traffic?${queryString}`);
    },
    refetchInterval: 300000, // Refresh every 5 minutes
    staleTime: 120000,
    retry: 3,
    retryDelay: 1000,
  });
}

export function useHistoricalWeather() {
  return useQuery({
    queryKey: queryKeys.historical.weather(),
    queryFn: () => apiRequest('/api/historical/weather'),
    refetchInterval: 600000, // Refresh every 10 minutes
    staleTime: 300000,
  });
}

export function useHistoricalCongestion() {
  return useQuery({
    queryKey: queryKeys.historical.congestion(),
    queryFn: () => apiRequest('/api/historical/congestion'),
    refetchInterval: 300000,
    staleTime: 120000,
  });
}

export function useHistoricalIncidents() {
  return useQuery({
    queryKey: queryKeys.historical.incidents(),
    queryFn: () => apiRequest('/api/historical/incidents'),
    refetchInterval: 300000,
    staleTime: 120000,
  });
}

// Coordination Hooks
export function useCoordinationIntersections() {
  return useQuery({
    queryKey: queryKeys.coordination.intersections(),
    queryFn: () => apiRequest('/api/coordination/intersections'),
    refetchInterval: 30000,
    staleTime: 15000,
  });
}

export function useCoordinationStream() {
  return useQuery({
    queryKey: queryKeys.coordination.stream(),
    queryFn: () => apiRequest('/api/coordination/stream'),
    refetchInterval: 5000, // Very frequent for real-time coordination
    enabled: false, // Start disabled, enable when needed
  });
}

// Utility function to invalidate all queries
export function useInvalidateQueries() {
  const queryClient = useQueryClient();
  
  return {
    invalidateTraffic: () => queryClient.invalidateQueries({ queryKey: queryKeys.traffic.all }),
    invalidateVehicles: () => queryClient.invalidateQueries({ queryKey: queryKeys.vehicles.all }),
    invalidateIntersections: () => queryClient.invalidateQueries({ queryKey: queryKeys.intersections.all }),
    invalidateSensors: () => queryClient.invalidateQueries({ queryKey: queryKeys.sensors.all }),
    invalidateAlerts: () => queryClient.invalidateQueries({ queryKey: queryKeys.alerts.all }),
    invalidateAll: () => queryClient.invalidateQueries(),
  };
} 