'use client'

import React, { useEffect, useState } from 'react'
import { Navigation, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { useTrafficData } from '@/lib/api-client'

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

  // Fetch traffic data using the working API
  const { data: trafficResponse, isLoading, error, refetch } = useTrafficData({
    intersection_id: intersectionId,
    limit: 100,
    include_enhanced: true
  })

  // Auto-refresh every 15 seconds
  useEffect(() => {
    if (!intersectionId) return

    const interval = setInterval(() => {
      refetch()
    }, 15000) // 15 seconds

    return () => clearInterval(interval)
  }, [intersectionId, refetch])

  // Process traffic data
  useEffect(() => {
    if (trafficResponse?.data && intersectionId) {
      processTrafficData(trafficResponse.data)
    }
  }, [trafficResponse, intersectionId])

  const processTrafficData = (trafficData: any[]) => {
    // Filter data for the selected intersection
    const intersectionData = trafficData.filter(item => 
      item.intersection_id === intersectionId
    )

    if (intersectionData.length === 0) {
      setDirectionalData([])
      return
    }

    // Group by direction and calculate metrics
    const directions: DirectionData[] = ['north', 'south', 'east', 'west'].map(direction => {
      const directionData = intersectionData
        .filter(item => item.sensor_direction === direction)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

      if (directionData.length === 0) {
        return null
      }

      const latestData = directionData[0]
      const previousData = directionData[1] // For trend calculation

      // Use real backend data
      const flowRate = Math.round(latestData.vehicle_flow_rate || 0)
      const vehicleCount = latestData.vehicle_number || 0
      const density = latestData.density || 0

      // Calculate trend if we have previous data
      let trend: 'up' | 'down' | 'stable' = 'stable'
      let trendValue = 0
      
      if (previousData && previousData.vehicle_flow_rate) {
        const currentFlow = latestData.vehicle_flow_rate || 0
        const previousFlow = previousData.vehicle_flow_rate || 0
        const diff = currentFlow - previousFlow
        const percentChange = previousFlow > 0 ? (diff / previousFlow) * 100 : 0
        
        if (Math.abs(percentChange) > 5) { // Only show trend if > 5% change
          trend = percentChange > 0 ? 'up' : 'down'
          trendValue = Math.round(Math.abs(percentChange))
        }
      }

      // Determine congestion level based on density
      const congestionLevel = 
        density > 70 ? 'critical' :
        density > 50 ? 'high' :
        density > 30 ? 'medium' : 'low'

      return {
        direction: direction as 'north' | 'south' | 'east' | 'west',
        label: DIRECTION_CONFIG[direction as keyof typeof DIRECTION_CONFIG].label,
        icon: DIRECTION_CONFIG[direction as keyof typeof DIRECTION_CONFIG].icon,
        flowRate,
        trend,
        trendValue,
        congestionLevel: congestionLevel as 'low' | 'medium' | 'high' | 'critical',
        lastUpdate: new Date(latestData.timestamp).toLocaleTimeString(),
        vehicleCount,
        sensorId: latestData.sensor_id
      }
    }).filter(Boolean) as DirectionData[]

    setDirectionalData(directions)
    setLastUpdateTime(new Date().toLocaleTimeString())
  }

  if (error) {
    return (
      <div className={cn("text-center py-8", className)}>
        <p className="text-destructive">Failed to load directional flow data</p>
        <button 
          onClick={() => refetch()} 
          className="mt-2 text-sm text-primary hover:underline"
        >
          Try again
        </button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", className)}>
        {Array.from({ length: 4 }).map((_, i) => (
          <DirectionalGaugeSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (!intersectionId) {
    return (
      <div className={cn("text-center py-8", className)}>
        <p className="text-muted-foreground">Select an intersection to view directional flow</p>
      </div>
    )
  }

  if (directionalData.length === 0) {
    return (
      <div className={cn("text-center py-8", className)}>
        <p className="text-muted-foreground">No directional data available for this intersection</p>
        <button 
          onClick={() => refetch()} 
          className="mt-2 text-sm text-primary hover:underline"
        >
          Refresh
        </button>
      </div>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header with status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Navigation className="h-4 w-4" />
          <span className="text-sm font-medium">Directional Flow Analysis</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="default">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse mr-2" />
            Live Data
          </Badge>
          {lastUpdateTime && (
            <span className="text-xs text-muted-foreground" suppressHydrationWarning>
              Updated: {lastUpdateTime}
            </span>
          )}
        </div>
      </div>

      {/* Directional Gauges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {directionalData.map((data) => (
          <DirectionalGauge key={data.direction} data={data} />
        ))}
      </div>

      {/* Summary Info */}
      <div className="text-center text-xs text-muted-foreground">
        <p>
          Flow rates calculated from vehicle flow rate measurements. 
          Auto-refresh every 15 seconds. Trends based on previous measurement comparison.
        </p>
      </div>
    </div>
  )
} 