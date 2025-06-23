'use client'

import React, { useMemo } from 'react'
import { useHistoricalCongestion } from '@/lib/api-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { 
  Calendar, 
  Clock, 
  AlertTriangle, 
  TrendingUp,
  Activity,
  BarChart3
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CongestionHeatmapData } from '@/types/api'

interface CongestionHotspotHeatmapProps {
  className?: string
}

// Day order for proper display
const DAYS_ORDER = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

// Generate hours array (0-23)
const HOURS = Array.from({ length: 24 }, (_, i) => i.toString())

// Get congestion color based on value
const getCongestionColor = (value: number, maxValue: number) => {
  if (maxValue === 0) return 'bg-gray-100' // Handle all-zero case
  
  const intensity = value / maxValue
  
  if (intensity === 0) return 'bg-gray-100'
  if (intensity <= 0.2) return 'bg-green-200'
  if (intensity <= 0.4) return 'bg-yellow-200'
  if (intensity <= 0.6) return 'bg-orange-200'
  if (intensity <= 0.8) return 'bg-red-200'
  return 'bg-red-400'
}

// Get congestion level text
const getCongestionLevel = (value: number, maxValue: number) => {
  if (maxValue === 0) return 'No Data'
  
  const intensity = value / maxValue
  
  if (intensity === 0) return 'Clear'
  if (intensity <= 0.2) return 'Light'
  if (intensity <= 0.4) return 'Moderate'
  if (intensity <= 0.6) return 'Heavy'
  if (intensity <= 0.8) return 'Severe'
  return 'Critical'
}

export function CongestionHotspotHeatmap({ className }: CongestionHotspotHeatmapProps) {
  const { 
    data: congestionData, 
    isLoading, 
    error, 
    refetch 
  } = useHistoricalCongestion()

  // Process data for visualization
  const processedData = useMemo(() => {
    if (!congestionData || congestionData.length === 0) return null

    // Create a map for quick lookup
    const dataMap = new Map()
    congestionData.forEach(day => {
      dataMap.set(day.id, day.data)
    })

    // Find max value for color scaling
    const allValues = congestionData.flatMap(day => day.data.map(hour => hour.y))
    const maxValue = Math.max(...allValues)

    // Calculate statistics
    const totalDataPoints = allValues.length
    const averageValue = allValues.reduce((sum, val) => sum + val, 0) / totalDataPoints
    const peakValue = maxValue
    const peakHours = []
    
    // Find peak hours across all days
    for (let hour = 0; hour < 24; hour++) {
      const hourValues = congestionData.map(day => {
        const hourData = day.data.find(h => h.x === hour.toString())
        return hourData ? hourData.y : 0
      })
      const hourAverage = hourValues.reduce((sum, val) => sum + val, 0) / hourValues.length
      if (hourAverage === maxValue) {
        peakHours.push(hour)
      }
    }

    return {
      dataMap,
      maxValue,
      statistics: {
        totalDataPoints,
        averageValue,
        peakValue,
        peakHours: peakHours.length > 0 ? peakHours : [0] // Default to hour 0 if no peaks
      }
    }
  }, [congestionData])

  // Loading state
  if (isLoading) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className={cn("space-y-4", className)}>
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to load congestion heatmap data. 
            <button 
              onClick={() => refetch()} 
              className="ml-2 underline hover:no-underline"
            >
              Try again
            </button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // No data state
  if (!processedData) {
    return (
      <div className={cn("text-center py-12 text-muted-foreground", className)}>
        <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No congestion data available</p>
      </div>
    )
  }

  const { dataMap, maxValue, statistics } = processedData

  return (
    <div className={cn("space-y-6", className)}>
      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{statistics.averageValue.toFixed(1)}</div>
                <div className="text-xs text-muted-foreground">Average Congestion</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100">
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{statistics.peakValue.toFixed(1)}</div>
                <div className="text-xs text-muted-foreground">Peak Congestion</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <Clock className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {statistics.peakHours.length > 1 
                    ? `${statistics.peakHours[0]}-${statistics.peakHours[statistics.peakHours.length - 1]}`
                    : statistics.peakHours[0]
                  }:00
                </div>
                <div className="text-xs text-muted-foreground">Peak Hours</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Congestion Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Weekly Congestion Heatmap
            <Badge variant="outline" className="text-xs">
              <Activity className="h-3 w-3 mr-1" />
              7 days × 24 hours
            </Badge>
          </CardTitle>
          <CardDescription>
            Congestion patterns by day of week and hour of day. Darker colors indicate higher congestion levels.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TooltipProvider>
            <div className="space-y-4">
              {/* Legend */}
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Congestion Level:</span>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-gray-100 rounded"></div>
                    <span className="text-xs">Clear</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-green-200 rounded"></div>
                    <span className="text-xs">Light</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-yellow-200 rounded"></div>
                    <span className="text-xs">Moderate</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-orange-200 rounded"></div>
                    <span className="text-xs">Heavy</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-red-200 rounded"></div>
                    <span className="text-xs">Severe</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-red-400 rounded"></div>
                    <span className="text-xs">Critical</span>
                  </div>
                </div>
              </div>

              {/* Heatmap Grid */}
              <div className="overflow-x-auto">
                <div className="min-w-[800px]">
                  {/* Hour headers */}
                  <div className="grid gap-1 mb-2" style={{ gridTemplateColumns: 'auto repeat(24, 1fr)' }}>
                    <div className="text-xs font-medium text-center py-1"></div>
                    {HOURS.map(hour => (
                      <div key={hour} className="text-xs font-medium text-center py-1">
                        {hour}
                      </div>
                    ))}
                  </div>

                  {/* Day rows */}
                  {DAYS_ORDER.map(day => {
                    const dayData = dataMap.get(day) || []
                    
                    return (
                      <div key={day} className="grid gap-1 mb-1" style={{ gridTemplateColumns: 'auto repeat(24, 1fr)' }}>
                        {/* Day label */}
                        <div className="text-xs font-medium text-right py-2 pr-2 flex items-center justify-end">
                          {day.slice(0, 3)}
                        </div>
                        
                        {/* Hour cells */}
                        {HOURS.map(hour => {
                          const hourData = dayData.find(h => h.x === hour)
                          const value = hourData ? hourData.y : 0
                          const colorClass = getCongestionColor(value, maxValue)
                          const level = getCongestionLevel(value, maxValue)
                          
                          return (
                            <Tooltip key={`${day}-${hour}`}>
                              <TooltipTrigger asChild>
                                <div
                                  className={cn(
                                    "h-8 rounded border border-gray-200 cursor-pointer transition-all duration-200 hover:scale-110 hover:z-10 relative",
                                    colorClass
                                  )}
                                />
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="text-xs space-y-1">
                                  <div className="font-medium">{day}, {hour}:00</div>
                                  <div>Congestion: {level}</div>
                                  <div>Value: {value.toFixed(1)}</div>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          )
                        })}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Data Status Notice */}
              {maxValue === 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Currently showing sample data structure. All congestion values are zero in the current dataset.
                    The heatmap will display actual patterns when congestion data is available.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </TooltipProvider>
        </CardContent>
      </Card>

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Congestion Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Peak Congestion Periods</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                {maxValue === 0 ? (
                  <p>No congestion patterns detected in current data</p>
                ) : (
                  <>
                    <div>• Peak hours: {statistics.peakHours.map(h => `${h}:00`).join(', ')}</div>
                    <div>• Maximum congestion level: {statistics.peakValue.toFixed(1)}</div>
                    <div>• Average daily congestion: {statistics.averageValue.toFixed(1)}</div>
                  </>
                )}
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Usage Recommendations</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                {maxValue === 0 ? (
                  <p>Recommendations will appear when congestion data is available</p>
                ) : (
                  <>
                    <div>• Avoid travel during peak hours if possible</div>
                    <div>• Consider alternative routes during high congestion periods</div>
                    <div>• Monitor real-time conditions for optimal timing</div>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 