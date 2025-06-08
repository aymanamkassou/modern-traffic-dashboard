'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useHistoricalTraffic } from '@/lib/api-client'
import { 
  ComposedChart, 
  Bar, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer
} from 'recharts'
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Clock,
  RefreshCw
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format, subHours } from 'date-fns'

// Generate mock 24-hour data (in real app, this would come from API)
const generateMock24HourData = () => {
  const data = []
  const now = new Date()
  
  for (let i = 23; i >= 0; i--) {
    const hour = subHours(now, i)
    const hourValue = hour.getHours()
    
    // Simulate traffic patterns (higher during rush hours)
    let baseVolume = 200
    if (hourValue >= 7 && hourValue <= 9) baseVolume = 800 // Morning rush
    else if (hourValue >= 17 && hourValue <= 19) baseVolume = 900 // Evening rush
    else if (hourValue >= 12 && hourValue <= 14) baseVolume = 600 // Lunch time
    else if (hourValue >= 22 || hourValue <= 5) baseVolume = 100 // Night time
    
    // Add some randomness
    const volume = Math.floor(baseVolume + (Math.random() - 0.5) * 200)
    
    // Speed inversely related to volume (more congestion = slower speed)
    const baseSpeed = 45
    const speedReduction = (volume / 1000) * 20
    const speed = Math.max(15, baseSpeed - speedReduction + (Math.random() - 0.5) * 10)
    
    data.push({
      hour: format(hour, 'HH:mm'),
      hourLabel: format(hour, 'ha'),
      volume,
      speed: Math.round(speed * 10) / 10,
      timestamp: hour.toISOString(),
      // Additional metrics for tooltip
      density: Math.round((volume / 100) * 10) / 10,
      efficiency: Math.round((speed / 45) * 100)
    })
  }
  
  return data
}

// Custom Tooltip Component
function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    
    return (
      <div className="bg-popover text-popover-foreground p-3 rounded-lg shadow-lg border">
        <p className="font-medium mb-2">{label}</p>
        <div className="space-y-1 text-sm">
          <div className="flex items-center justify-between gap-4">
            <span className="text-blue-500">Vehicle Volume:</span>
            <span className="font-mono">{data.volume.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-green-500">Avg Speed:</span>
            <span className="font-mono">{data.speed} km/h</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Density:</span>
            <span className="font-mono">{data.density}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Efficiency:</span>
            <span className="font-mono">{data.efficiency}%</span>
          </div>
        </div>
      </div>
    )
  }
  
  return null
}

// Main 24-Hour Trend Chart Component
export function TwentyFourHourTrendChart() {
  const { data: historicalData, isLoading, refetch } = useHistoricalTraffic({ 
    aggregation: 'hour' 
  })
  
  // Use mock data for now (in real app, use historicalData)
  const chartData = generateMock24HourData()
  
  // Calculate trend statistics
  const currentHour = chartData[chartData.length - 1]
  const previousHour = chartData[chartData.length - 2]
  const volumeTrend = currentHour && previousHour 
    ? ((currentHour.volume - previousHour.volume) / previousHour.volume) * 100
    : 0
  const speedTrend = currentHour && previousHour
    ? ((currentHour.speed - previousHour.speed) / previousHour.speed) * 100
    : 0
  
  // Calculate daily totals
  const totalVolume = chartData.reduce((sum, item) => sum + item.volume, 0)
  const avgSpeed = chartData.reduce((sum, item) => sum + item.speed, 0) / chartData.length
  const peakHour = chartData.reduce((max, item) => 
    item.volume > max.volume ? item : max, chartData[0]
  )

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-sm font-medium">24-Hour Traffic Trends</CardTitle>
          <p className="text-xs text-muted-foreground">
            Vehicle volume and average speed over time
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            className="h-6 w-6 p-0"
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-3 w-3", isLoading && "animate-spin")} />
          </Button>
          <BarChart3 className="h-4 w-4 text-indigo-500" />
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Total Volume</div>
              <div className="font-mono font-medium">{totalVolume.toLocaleString()}</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Avg Speed</div>
              <div className="font-mono font-medium">{avgSpeed.toFixed(1)} km/h</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Peak Hour</div>
              <div className="font-mono font-medium">{peakHour.hourLabel}</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Current Trend</div>
              <div className="flex items-center gap-1">
                {volumeTrend > 0 ? (
                  <TrendingUp className="h-3 w-3 text-green-500" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500" />
                )}
                <span className={cn(
                  "font-mono text-xs",
                  volumeTrend > 0 ? "text-green-500" : "text-red-500"
                )}>
                  {Math.abs(volumeTrend).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="hourLabel" 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  yAxisId="volume"
                  orientation="left"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  yAxisId="speed"
                  orientation="right"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="rect"
                />
                
                {/* Volume bars */}
                <Bar 
                  yAxisId="volume"
                  dataKey="volume" 
                  fill="hsl(var(--primary))"
                  fillOpacity={0.6}
                  name="Vehicle Volume"
                  radius={[2, 2, 0, 0]}
                />
                
                {/* Speed line */}
                <Line 
                  yAxisId="speed"
                  type="monotone" 
                  dataKey="speed" 
                  stroke="hsl(var(--chart-2))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--chart-2))", strokeWidth: 2, r: 3 }}
                  activeDot={{ r: 5, stroke: "hsl(var(--chart-2))", strokeWidth: 2 }}
                  name="Avg Speed (km/h)"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Time Range Info */}
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>Last 24 hours</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded bg-primary opacity-60" />
                <span>Volume</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded bg-chart-2" />
                <span>Speed</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 