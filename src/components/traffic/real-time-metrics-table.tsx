'use client'

import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { Activity, Clock, Gauge, Users, Zap, Wifi, WifiOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { useServerSentEvents } from '@/hooks/use-server-sent-events'
import { TrafficStreamEvent, isTrafficData } from '@/types/sse-events'

interface RealTimeMetricsTableProps {
  intersectionId: string
  className?: string
}

interface DirectionMetrics {
  direction: 'north' | 'south' | 'east' | 'west'
  speed: number
  density: number
  travelTime: number
  congestionLevel: 'low' | 'medium' | 'high' | 'critical'
  trafficLightPhase: 'green' | 'yellow' | 'red'
  speedHistory: number[]
  densityHistory: number[]
  lastUpdate: string
  vehicleCount: number
  sensorId: string
}

interface SparklineProps {
  data: number[]
  width?: number
  height?: number
  color?: string
  className?: string
}

function Sparkline({ data, width = 60, height = 20, color = 'currentColor', className }: SparklineProps) {
  if (data.length < 2) {
    return <div className={cn("flex items-center justify-center", className)} style={{ width, height }}>
      <div className="w-1 h-1 bg-muted-foreground rounded-full" />
    </div>
  }

  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width
    const y = height - ((value - min) / range) * height
    return `${x},${y}`
  }).join(' ')

  return (
    <div className={className} style={{ width, height }}>
      <svg width={width} height={height} className="overflow-visible">
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-all duration-300"
        />
        {/* Last point indicator */}
        {data.length > 0 && (
          <circle
            cx={(data.length - 1) / (data.length - 1) * width}
            cy={height - ((data[data.length - 1] - min) / range) * height}
            r="1.5"
            fill={color}
            className="animate-pulse"
          />
        )}
      </svg>
    </div>
  )
}

const DIRECTION_CONFIG = {
  north: { label: 'North', icon: '↑', color: 'text-blue-500' },
  south: { label: 'South', icon: '↓', color: 'text-green-500' },
  east: { label: 'East', icon: '→', color: 'text-purple-500' },
  west: { label: 'West', icon: '←', color: 'text-orange-500' },
}

const CONGESTION_COLORS = {
  low: 'bg-green-100 text-green-800 border-green-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  critical: 'bg-red-100 text-red-800 border-red-200',
}

const LIGHT_COLORS = {
  green: 'bg-green-500',
  yellow: 'bg-yellow-500',
  red: 'bg-red-500',
}

function MetricsTableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="w-16 h-5" />
        </div>
      ))}
    </div>
  )
}

export function RealTimeMetricsTable({ intersectionId, className }: RealTimeMetricsTableProps) {
  const [metricsData, setMetricsData] = useState<DirectionMetrics[]>([])
  const [lastUpdateTime, setLastUpdateTime] = useState<string>('')

  // SSE connection for real-time traffic metrics
  const sseUrl = intersectionId ? `http://localhost:3001/api/traffic/stream` : null
  
  const {
    isConnected,
    events,
    error: sseError,
    connect,
    disconnect
  } = useServerSentEvents(sseUrl, {
    maxEvents: 200,
    autoConnect: true,
    onEvent: useCallback((event) => {
      // Process incoming traffic events in real-time
      if (event.data && isTrafficData(event.data)) {
        const trafficData = event.data
        
        // Only process data for the selected intersection
        if (trafficData.intersection_id === intersectionId) {
          processRealTimeMetrics(trafficData)
        }
      }
    }, [intersectionId])
  })

  // Process incoming real-time traffic metrics
  const processRealTimeMetrics = useCallback((trafficData: any) => {
    if (!trafficData.sensor_direction) return

    const direction = trafficData.sensor_direction as 'north' | 'south' | 'east' | 'west'
    
    setMetricsData(prev => {
      const existing = prev.find(d => d.direction === direction)
      
      // Extract metrics from real-time data
      const speed = trafficData.speed || 0
      const density = trafficData.density || 0
      const travelTime = trafficData.travel_time || 0
      const vehicleCount = trafficData.vehicle_number || 0
      
      // Determine congestion level
      const congestionLevel = 
        density > 70 ? 'critical' :
        density > 50 ? 'high' :
        density > 30 ? 'medium' : 'low'

      // Get traffic light phase
      const trafficLightPhase = trafficData.traffic_light_phase || 'red'

      // Update history arrays (keep last 10 values for sparklines)
      const speedHistory = existing 
        ? [...existing.speedHistory.slice(-9), speed]
        : [speed]
      
      const densityHistory = existing
        ? [...existing.densityHistory.slice(-9), density]
        : [density]

      const newMetrics: DirectionMetrics = {
        direction,
        speed,
        density,
        travelTime,
        vehicleCount,
        congestionLevel: congestionLevel as 'low' | 'medium' | 'high' | 'critical',
        trafficLightPhase: trafficLightPhase as 'green' | 'yellow' | 'red',
        speedHistory,
        densityHistory,
        lastUpdate: new Date().toLocaleTimeString(),
        sensorId: trafficData.sensor_id
      }

      const otherDirections = prev.filter(d => d.direction !== direction)
      return [...otherDirections, newMetrics].sort((a, b) => {
        const order = ['north', 'east', 'south', 'west']
        return order.indexOf(a.direction) - order.indexOf(b.direction)
      })
    })

    setLastUpdateTime(new Date().toLocaleTimeString())
  }, [])

  // Filter relevant events from SSE buffer
  const relevantEvents = useMemo(() => {
    return events
      .filter(event => event.data && isTrafficData(event.data))
      .filter(event => event.data.intersection_id === intersectionId)
      .slice(-20) // Keep last 20 relevant events
  }, [events, intersectionId])

  // Connection status
  const connectionStatus = useMemo(() => {
    if (!intersectionId) return 'inactive'
    if (sseError) return 'error'
    if (isConnected) return 'connected'
    return 'connecting'
  }, [intersectionId, sseError, isConnected])

  if (!intersectionId) {
    return (
      <div className={cn("text-center py-8", className)}>
        <p className="text-muted-foreground">Select an intersection to view metrics</p>
      </div>
    )
  }

  if (sseError) {
    return (
      <div className={cn("text-center py-8", className)}>
        <p className="text-destructive">Failed to connect to traffic stream: {sseError}</p>
        <button 
          onClick={() => connect()} 
          className="mt-2 text-sm text-primary hover:underline"
        >
          Try reconnecting
        </button>
      </div>
    )
  }

  if (!isConnected) {
    return <MetricsTableSkeleton />
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Connection Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4" />
          <span className="text-sm font-medium">Real-time Traffic Metrics</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant={connectionStatus === 'connected' ? 'default' : 'secondary'}>
            {connectionStatus === 'connected' && (
              <>
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse mr-2" />
                <Wifi className="h-3 w-3 mr-1" />
                Live SSE
              </>
            )}
            {connectionStatus === 'connecting' && (
              <>
                <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse mr-2" />
                Connecting...
              </>
            )}
            {connectionStatus === 'error' && (
              <>
                <WifiOff className="h-3 w-3 mr-1" />
                Offline
              </>
            )}
          </Badge>
          
          {lastUpdateTime && (
            <span className="text-xs text-muted-foreground" suppressHydrationWarning>
              Updated: {lastUpdateTime}
            </span>
          )}
        </div>
      </div>

      {/* Metrics Table */}
      {metricsData.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            Waiting for traffic metrics from intersection {intersectionId}...
          </p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-24">Direction</TableHead>
                <TableHead className="text-center">Speed (km/h)</TableHead>
                <TableHead className="text-center">Density (%)</TableHead>
                <TableHead className="text-center">Travel Time (s)</TableHead>
                <TableHead className="text-center">Vehicles</TableHead>
                <TableHead className="text-center">Congestion</TableHead>
                <TableHead className="text-center">Light Phase</TableHead>
                <TableHead className="text-center">Sensor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {metricsData.map((metrics) => {
                const config = DIRECTION_CONFIG[metrics.direction]
                return (
                  <TableRow key={metrics.direction} className="animate-fade-in-up">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "flex items-center justify-center w-6 h-6 rounded-full text-white text-sm font-bold",
                          config.color.replace('text-', 'bg-')
                        )}>
                          {config.icon}
                        </div>
                        <span className="font-medium">{config.label}</span>
                      </div>
                    </TableCell>
                    
                    <TableCell className="text-center">
                      <div className="space-y-1">
                        <div className="font-mono text-lg font-semibold">
                          {metrics.speed}
                        </div>
                        <Sparkline 
                          data={metrics.speedHistory} 
                          color="hsl(var(--primary))"
                          className="mx-auto"
                        />
                      </div>
                    </TableCell>
                    
                    <TableCell className="text-center">
                      <div className="space-y-2">
                        <div className="font-mono text-lg font-semibold">
                          {metrics.density}%
                        </div>
                        <div className="space-y-1">
                          <Progress value={metrics.density} className="h-1" />
                          <Sparkline 
                            data={metrics.densityHistory} 
                            color="hsl(var(--muted-foreground))"
                            className="mx-auto"
                          />
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="font-mono text-sm" suppressHydrationWarning>
                          {metrics.travelTime}s
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        <span className="font-mono text-sm font-semibold">
                          {metrics.vehicleCount}
                        </span>
                      </div>
                    </TableCell>
                    
                    <TableCell className="text-center">
                      <Badge 
                        variant="outline" 
                        className={cn("text-xs", CONGESTION_COLORS[metrics.congestionLevel])}
                      >
                        {metrics.congestionLevel}
                      </Badge>
                    </TableCell>
                    
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className={cn(
                          "w-3 h-3 rounded-full",
                          LIGHT_COLORS[metrics.trafficLightPhase]
                        )} />
                        <span className="text-xs font-medium capitalize">
                          {metrics.trafficLightPhase}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="text-center">
                      <span className="text-xs text-muted-foreground font-mono">
                        {metrics.sensorId}
                      </span>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
} 