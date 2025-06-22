'use client'

import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { Navigation, TrendingUp, TrendingDown, Minus, Wifi, WifiOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { useServerSentEvents } from '@/hooks/use-server-sent-events'
import { TrafficStreamEvent, isTrafficData } from '@/types/sse-events'

interface DirectionalFlowGaugesProps {
  intersectionId: string
  className?: string
}

interface DirectionData {
  direction: 'north' | 'south' | 'east' | 'west'
  label: string
  icon: string
  flowRate: number
  trend: 'up' | 'down' | 'stable'
  trendValue: number
  congestionLevel: 'low' | 'medium' | 'high' | 'critical'
  lastUpdate: string
  vehicleCount: number
  sensorId: string
  history: number[] // For trend calculation
}

const DIRECTION_CONFIG = {
  north: { label: 'North', icon: '↑', color: 'text-blue-500', bgColor: 'bg-blue-500' },
  south: { label: 'South', icon: '↓', color: 'text-green-500', bgColor: 'bg-green-500' },
  east: { label: 'East', icon: '→', color: 'text-purple-500', bgColor: 'bg-purple-500' },
  west: { label: 'West', icon: '←', color: 'text-orange-500', bgColor: 'bg-orange-500' },
}

const CONGESTION_COLORS = {
  low: 'text-green-600',
  medium: 'text-yellow-600',
  high: 'text-orange-600',
  critical: 'text-red-600',
}

function DirectionalGauge({ data }: { data: DirectionData }) {
  const config = DIRECTION_CONFIG[data.direction]
  const maxFlowRate = 50 // vehicles per flow measurement
  const progressValue = Math.min((data.flowRate / maxFlowRate) * 100, 100)
  
  return (
    <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-md">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Direction Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full text-white text-lg font-bold",
                config.bgColor
              )}>
                {config.icon}
              </div>
              <div>
                <h3 className="font-semibold">{config.label}</h3>
                <p className="text-xs text-muted-foreground">Direction</p>
              </div>
            </div>
            
            <Badge 
              variant="outline" 
              className={cn("text-xs", CONGESTION_COLORS[data.congestionLevel])}
            >
              {data.congestionLevel}
            </Badge>
          </div>

          {/* Circular Progress Gauge */}
          <div className="relative flex items-center justify-center">
            <div className="relative w-32 h-32">
              {/* Background Circle */}
              <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-muted/20"
                />
                {/* Progress Circle */}
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${(progressValue / 100) * 314} 314`}
                  strokeLinecap="round"
                  className={cn("transition-all duration-1000 ease-out", config.color)}
                />
              </svg>
              
              {/* Center Content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold">{data.flowRate}</span>
                <span className="text-xs text-muted-foreground">flow rate</span>
              </div>
            </div>
          </div>

          {/* Flow Rate Details */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Flow Rate</span>
              <div className="flex items-center gap-1">
                {data.trend === 'up' && <TrendingUp className="h-3 w-3 text-green-500" />}
                {data.trend === 'down' && <TrendingDown className="h-3 w-3 text-red-500" />}
                {data.trend === 'stable' && <Minus className="h-3 w-3 text-muted-foreground" />}
                <span className={cn(
                  "font-mono text-xs",
                  data.trend === 'up' && "text-green-500",
                  data.trend === 'down' && "text-red-500",
                  data.trend === 'stable' && "text-muted-foreground"
                )}>
                  {data.trend === 'stable' ? '0' : `${data.trendValue > 0 ? '+' : ''}${data.trendValue}`}%
                </span>
              </div>
            </div>
            
            {/* Vehicle Count */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Vehicles</span>
              <span className="font-mono font-semibold">{data.vehicleCount}</span>
            </div>
            
            {/* Progress Bar */}
            <div className="space-y-1">
              <Progress 
                value={progressValue} 
                className="h-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0</span>
                <span>{maxFlowRate} max</span>
              </div>
            </div>
          </div>

          {/* Sensor Info */}
          <div className="text-xs text-muted-foreground text-center space-y-1">
            <div>Sensor: {data.sensorId}</div>
            <div suppressHydrationWarning>Updated {data.lastUpdate}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function DirectionalGaugeSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="w-8 h-8 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-3 w-12" />
              </div>
            </div>
            <Skeleton className="h-5 w-12" />
          </div>
          
          <div className="flex justify-center">
            <Skeleton className="w-32 h-32 rounded-full" />
          </div>
          
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-2 w-full" />
            <Skeleton className="h-3 w-24 mx-auto" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function DirectionalFlowGauges({ intersectionId, className }: DirectionalFlowGaugesProps) {
  const [directionalData, setDirectionalData] = useState<DirectionData[]>([])
  const [lastUpdateTime, setLastUpdateTime] = useState<string>('')

  // SSE connection for real-time traffic data
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
          processRealTimeTrafficData(trafficData)
        }
      }
    }, [intersectionId])
  })

  // Process incoming real-time traffic data
  const processRealTimeTrafficData = useCallback((trafficData: any) => {
    if (!trafficData.sensor_direction) return

    const direction = trafficData.sensor_direction as 'north' | 'south' | 'east' | 'west'
    
    setDirectionalData(prev => {
      const existing = prev.find(d => d.direction === direction)
      const flowRate = Math.round(trafficData.vehicle_flow_rate || 0)
      const vehicleCount = trafficData.vehicle_number || 0
      const density = trafficData.density || 0
      
      // Calculate trend from history
      let trend: 'up' | 'down' | 'stable' = 'stable'
      let trendValue = 0
      
      if (existing && existing.history.length > 0) {
        const avgHistory = existing.history.reduce((sum, val) => sum + val, 0) / existing.history.length
        if (avgHistory > 0) {
          const percentChange = ((flowRate - avgHistory) / avgHistory) * 100
          if (Math.abs(percentChange) > 5) {
            trend = percentChange > 0 ? 'up' : 'down'
            trendValue = Math.round(Math.abs(percentChange))
          }
        }
      }

      // Determine congestion level
      const congestionLevel = 
        density > 70 ? 'critical' :
        density > 50 ? 'high' :
        density > 30 ? 'medium' : 'low'

      const newData: DirectionData = {
        direction,
        label: DIRECTION_CONFIG[direction].label,
        icon: DIRECTION_CONFIG[direction].icon,
        flowRate,
        trend,
        trendValue,
        congestionLevel: congestionLevel as 'low' | 'medium' | 'high' | 'critical',
        lastUpdate: new Date().toLocaleTimeString(),
        vehicleCount,
        sensorId: trafficData.sensor_id,
        history: existing ? [...existing.history.slice(-9), flowRate] : [flowRate]
      }

      const otherDirections = prev.filter(d => d.direction !== direction)
      return [...otherDirections, newData].sort((a, b) => {
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
        <p className="text-muted-foreground">Select an intersection to view directional flow</p>
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
    return (
      <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", className)}>
        {Array.from({ length: 4 }).map((_, i) => (
          <DirectionalGaugeSkeleton key={i} />
        ))}
      </div>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header with SSE status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Navigation className="h-4 w-4" />
          <span className="text-sm font-medium">Directional Flow Analysis</span>
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

      {/* Directional Gauges Grid */}
      {directionalData.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            Waiting for traffic data from intersection {intersectionId}...
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {directionalData.map((data) => (
            <DirectionalGauge key={data.direction} data={data} />
          ))}
        </div>
      )}
    </div>
  )
} 