'use client'

import React, { useState, useMemo } from 'react'
import { BarChart3, Calendar, Clock, TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useTrafficData } from '@/lib/api-client'

interface HistoricalComparisonChartProps {
  intersectionId: string
  className?: string
}

interface ChartDataPoint {
  timestamp: string
  speed: number
  density: number
  hour: number
  correlation: number
}

const TIME_RANGES = [
  { value: '50', label: 'Latest 50 Records', limit: 50 },
  { value: '100', label: 'Latest 100 Records', limit: 100 },
  { value: '200', label: 'Latest 200 Records', limit: 200 },
  { value: '500', label: 'Latest 500 Records', limit: 500 },
]

function ScatterPlot({ 
  data, 
  width = 400, 
  height = 300, 
  className 
}: { 
  data: ChartDataPoint[]
  width?: number
  height?: number
  className?: string
}) {
  if (data.length === 0) {
    return (
      <div className={cn("flex items-center justify-center border rounded-lg", className)} style={{ width, height }}>
        <div className="text-center text-muted-foreground">
          <BarChart3 className="h-8 w-8 mx-auto mb-2" />
          <p className="text-sm">No data available</p>
        </div>
      </div>
    )
  }

  const margin = { top: 20, right: 20, bottom: 40, left: 50 }
  const chartWidth = width - margin.left - margin.right
  const chartHeight = height - margin.top - margin.bottom

  const maxSpeed = Math.max(...data.map(d => d.speed))
  const minSpeed = Math.min(...data.map(d => d.speed))
  const maxDensity = Math.max(...data.map(d => d.density))
  const minDensity = Math.min(...data.map(d => d.density))

  const speedRange = maxSpeed - minSpeed || 1
  const densityRange = maxDensity - minDensity || 1

  const gridLines = {
    vertical: Array.from({ length: 6 }, (_, i) => (i * chartWidth) / 5),
    horizontal: Array.from({ length: 6 }, (_, i) => (i * chartHeight) / 5),
  }

  return (
    <div className={className}>
      <svg width={width} height={height} className="border rounded-lg bg-background">
        <g className="opacity-20">
          {gridLines.vertical.map((x, i) => (
            <line
              key={`v-${i}`}
              x1={margin.left + x}
              y1={margin.top}
              x2={margin.left + x}
              y2={height - margin.bottom}
              stroke="currentColor"
              strokeWidth="1"
            />
          ))}
          {gridLines.horizontal.map((y, i) => (
            <line
              key={`h-${i}`}
              x1={margin.left}
              y1={margin.top + y}
              x2={width - margin.right}
              y2={margin.top + y}
              stroke="currentColor"
              strokeWidth="1"
            />
          ))}
        </g>

        <g>
          {data.map((point, i) => {
            const x = margin.left + ((point.density - minDensity) / densityRange) * chartWidth
            const y = height - margin.bottom - ((point.speed - minSpeed) / speedRange) * chartHeight
            
            const isRushHour = (point.hour >= 7 && point.hour <= 9) || (point.hour >= 17 && point.hour <= 19)
            const color = isRushHour ? 'hsl(var(--destructive))' : 'hsl(var(--primary))'
            
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r="3"
                fill={color}
                fillOpacity="0.7"
                stroke={color}
                strokeWidth="1"
                className="transition-all duration-200 hover:r-4 hover:fill-opacity-100"
              >
                <title>
                  {`Speed: ${point.speed} km/h, Density: ${point.density}%, Time: ${new Date(point.timestamp).toLocaleTimeString()}`}
                </title>
              </circle>
            )
          })}
        </g>

        <g className="text-xs fill-current text-muted-foreground">
          <line
            x1={margin.left}
            y1={height - margin.bottom}
            x2={width - margin.right}
            y2={height - margin.bottom}
            stroke="currentColor"
            strokeWidth="1"
          />
          
          <line
            x1={margin.left}
            y1={margin.top}
            x2={margin.left}
            y2={height - margin.bottom}
            stroke="currentColor"
            strokeWidth="1"
          />
          
          {Array.from({ length: 6 }, (_, i) => {
            const value = minDensity + (i * densityRange) / 5
            const x = margin.left + (i * chartWidth) / 5
            return (
              <text
                key={i}
                x={x}
                y={height - margin.bottom + 15}
                textAnchor="middle"
                className="text-xs"
              >
                {Math.round(value)}%
              </text>
            )
          })}
          
          {Array.from({ length: 6 }, (_, i) => {
            const value = minSpeed + (i * speedRange) / 5
            const y = height - margin.bottom - (i * chartHeight) / 5
            return (
              <text
                key={i}
                x={margin.left - 10}
                y={y + 3}
                textAnchor="end"
                className="text-xs"
              >
                {Math.round(value)}
              </text>
            )
          })}
          
          <text
            x={width / 2}
            y={height - 5}
            textAnchor="middle"
            className="text-xs font-medium"
          >
            Traffic Density (%)
          </text>
          
          <text
            x={15}
            y={height / 2}
            textAnchor="middle"
            transform={`rotate(-90, 15, ${height / 2})`}
            className="text-xs font-medium"
          >
            Speed (km/h)
          </text>
        </g>
      </svg>
    </div>
  )
}

export function HistoricalComparisonChart({ intersectionId, className }: HistoricalComparisonChartProps) {
  const [selectedRange, setSelectedRange] = useState('100')
  
  const selectedTimeRange = TIME_RANGES.find(range => range.value === selectedRange)
  
  // Use the working traffic API instead of broken historical API
  const { data: trafficResponse, isLoading, error, refetch } = useTrafficData({
    intersection_id: intersectionId,
    limit: selectedTimeRange?.limit || 100,
    include_enhanced: true
  })

  const chartData = useMemo(() => {
    if (!trafficResponse?.data || !intersectionId) return []
    
    // Filter and process real backend data
    const intersectionData = trafficResponse.data
      .filter(item => item.intersection_id === intersectionId)
      .filter(item => item.speed && item.density) // Only include records with valid speed/density
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, selectedTimeRange?.limit || 100)

    return intersectionData.map(item => ({
      timestamp: item.timestamp,
      speed: item.speed || 0,
      density: item.density || 0,
      hour: new Date(item.timestamp).getHours(),
      correlation: 0 // Will be calculated separately
    }))
  }, [trafficResponse?.data, intersectionId, selectedTimeRange])

  const correlation = useMemo(() => {
    if (chartData.length < 2) return 0
    
    const n = chartData.length
    const sumX = chartData.reduce((sum: number, d: ChartDataPoint) => sum + d.density, 0)
    const sumY = chartData.reduce((sum: number, d: ChartDataPoint) => sum + d.speed, 0)
    const sumXY = chartData.reduce((sum: number, d: ChartDataPoint) => sum + d.density * d.speed, 0)
    const sumXX = chartData.reduce((sum: number, d: ChartDataPoint) => sum + d.density * d.density, 0)
    const sumYY = chartData.reduce((sum: number, d: ChartDataPoint) => sum + d.speed * d.speed, 0)
    
    const numerator = n * sumXY - sumX * sumY
    const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY))
    
    return denominator === 0 ? 0 : numerator / denominator
  }, [chartData])

  if (error) {
    return (
      <div className={cn("text-center py-8", className)}>
        <p className="text-destructive">Failed to load traffic data</p>
        <button 
          onClick={() => refetch()} 
          className="mt-2 text-sm text-primary hover:underline"
        >
          Try again
        </button>
      </div>
    )
  }

  if (!intersectionId) {
    return (
      <div className={cn("text-center py-8", className)}>
        <p className="text-muted-foreground">Select an intersection to view historical analysis</p>
      </div>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          <span className="text-sm font-medium">Speed vs Density Analysis</span>
          <Badge variant="outline" className="text-xs">
            Real Data
          </Badge>
        </div>
        
        <Select value={selectedRange} onValueChange={setSelectedRange}>
          <SelectTrigger className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIME_RANGES.map((range) => (
              <SelectItem key={range.value} value={range.value}>
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3" />
                  {range.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Correlation</span>
              </div>
              <div className="text-lg font-bold font-mono">
                {isLoading ? (
                  <Skeleton className="h-6 w-12" />
                ) : (
                  correlation.toFixed(3)
                )}
              </div>
              <Badge 
                variant="outline" 
                className={cn(
                  "text-xs",
                  Math.abs(correlation) > 0.7 ? "text-green-600" :
                  Math.abs(correlation) > 0.3 ? "text-yellow-600" : "text-red-600"
                )}
              >
                {Math.abs(correlation) > 0.7 ? "Strong" :
                 Math.abs(correlation) > 0.3 ? "Moderate" : "Weak"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Data Points</span>
              </div>
              <div className="text-lg font-bold font-mono">
                {isLoading ? (
                  <Skeleton className="h-6 w-12" />
                ) : (
                  chartData.length
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                {selectedTimeRange?.label}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Avg Speed</span>
              </div>
              <div className="text-lg font-bold font-mono">
                {isLoading ? (
                  <Skeleton className="h-6 w-12" />
                ) : (
                  chartData.length > 0 ? 
                    Math.round(chartData.reduce((sum, d) => sum + d.speed, 0) / chartData.length) : 0
                )}
                <span className="text-xs text-muted-foreground ml-1">km/h</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Avg Density</span>
              </div>
              <div className="text-lg font-bold font-mono">
                {isLoading ? (
                  <Skeleton className="h-6 w-12" />
                ) : (
                  chartData.length > 0 ? 
                    Math.round(chartData.reduce((sum, d) => sum + d.density, 0) / chartData.length) : 0
                )}
                <span className="text-xs text-muted-foreground ml-1">%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-80">
              <div className="space-y-4 text-center">
                <div className="w-8 h-8 border-2 border-muted border-t-foreground rounded-full animate-spin mx-auto" />
                <p className="text-sm text-muted-foreground">Loading traffic data...</p>
              </div>
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex items-center justify-center h-80">
              <div className="text-center space-y-3">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto" />
                <div>
                  <h3 className="font-medium">No Data Available</h3>
                  <p className="text-sm text-muted-foreground">
                    No traffic data found for this intersection
                  </p>
                </div>
                <button 
                  onClick={() => refetch()} 
                  className="text-sm text-primary hover:underline"
                >
                  Refresh Data
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Speed vs Density Correlation</h3>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-primary" />
                    <span>Normal Hours</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-destructive" />
                    <span>Rush Hours (7-9 AM, 5-7 PM)</span>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-center">
                <ScatterPlot data={chartData} width={500} height={350} />
              </div>
              
              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  Each point represents a traffic measurement. 
                  {correlation < -0.5 && " Strong negative correlation indicates good traffic flow management."}
                  {correlation > 0.5 && " Strong positive correlation may indicate congestion issues."}
                  {Math.abs(correlation) < 0.3 && " Weak correlation suggests varied traffic conditions."}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 