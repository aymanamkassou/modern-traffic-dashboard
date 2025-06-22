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
  RefreshCw,
  AlertTriangle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ChartSkeleton } from '@/components/ui/loading-skeletons'

// Transform API data for chart display with proper hourly aggregation
const transformHistoricalData = (data: any[]) => {
  if (!data || data.length === 0) return [];
  
  // Group data by hour
  const hourlyGroups = new Map<number, any[]>();
  
  data.forEach((item) => {
    const timestamp = new Date(item.timestamp);
    const hour = timestamp.getHours();
    
    if (!hourlyGroups.has(hour)) {
      hourlyGroups.set(hour, []);
    }
    hourlyGroups.get(hour)!.push(item);
  });
  
  // Aggregate each hour's data
  const aggregatedData = Array.from(hourlyGroups.entries()).map(([hour, items]) => {
    const hourLabel = `${hour.toString().padStart(2, '0')}:00`;
    
    // Calculate aggregated values
    const avgSpeed = items.reduce((sum, item) => sum + (item.speed || 0), 0) / items.length;
    const avgDensity = items.reduce((sum, item) => sum + (item.density || 0), 0) / items.length;
    const totalVolume = items.reduce((sum, item) => sum + (item.volume || item.vehicle_number || 0), 0);
    
    // Use the most recent timestamp for this hour
    const latestItem = items.reduce((latest, item) => 
      new Date(item.timestamp) > new Date(latest.timestamp) ? item : latest
    );
    
    // Calculate efficiency based on aggregated speed and density
    const efficiency = avgSpeed && avgDensity 
      ? Math.round(Math.min(100, (avgSpeed / Math.max(1, avgDensity)) * 10))
      : 0;
    
    return {
      volume: Math.round(totalVolume),
      speed: Math.round(avgSpeed * 10) / 10, // Round to 1 decimal
      density: Math.round(avgDensity * 10) / 10, // Round to 1 decimal
      hourLabel,
      hour,
      efficiency,
      originalTimestamp: latestItem.timestamp,
      sensor_id: latestItem.sensor_id,
      location_id: latestItem.location_id,
      // Additional metadata
      dataPointsCount: items.length // Show how many records were aggregated
    };
  });
  
  // Sort by hour
  return aggregatedData.sort((a, b) => a.hour - b.hour);
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
            <span className="font-mono">{(data.volume || 0).toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-green-500">Avg Speed:</span>
            <span className="font-mono">{(data.speed || 0).toFixed(1)} km/h</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Density:</span>
            <span className="font-mono">{(data.density || 0).toFixed(1)}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Efficiency:</span>
            <span className="font-mono">{(data.efficiency || 0)}%</span>
          </div>
          {data.originalTimestamp && (
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Time:</span>
              <span className="font-mono text-xs">
                {new Date(data.originalTimestamp).toLocaleString()}
              </span>
            </div>
          )}
          {data.sensor_id && (
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Sensor:</span>
              <span className="font-mono text-xs">{data.sensor_id}</span>
            </div>
          )}
          {data.location_id && (
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Location:</span>
              <span className="font-mono text-xs">{data.location_id}</span>
            </div>
          )}
          {data.dataPointsCount && data.dataPointsCount > 1 && (
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Data Points:</span>
              <span className="font-mono text-xs">{data.dataPointsCount} aggregated</span>
            </div>
          )}
        </div>
      </div>
    )
  }
  
  return null
}

// Main 24-Hour Trend Chart Component
export function TwentyFourHourTrendChart() {
  const { data: historicalData, isLoading, error, refetch, isFetching } = useHistoricalTraffic({ 
    aggregation: 'hour' 
  })
  
  // Debug logging
  React.useEffect(() => {
    console.log('🔍 Trend Chart Debug:', {
      isLoading,
      isFetching,
      error: error?.message,
      dataLength: historicalData?.length,
      sampleData: historicalData?.slice(0, 2)
    });
  }, [isLoading, isFetching, error, historicalData]);
  
  // Transform API data for chart display
  const chartData = transformHistoricalData(historicalData || [])
  
  // Show loading state
  if (isLoading) {
    return <ChartSkeleton height="h-96" />
  }

  // Show error state
  if (error) {
    return (
      <Card className="relative overflow-hidden">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <AlertTriangle className="h-8 w-8 text-destructive mx-auto" />
            <div>
              <h3 className="font-medium">Failed to load historical traffic data</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {error.message || 'An unexpected error occurred'}
              </p>
            </div>
            <Button onClick={() => refetch()} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  // Show empty state if no data
  if (!chartData || chartData.length === 0) {
    return (
      <Card className="relative overflow-hidden">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <BarChart3 className="h-8 w-8 text-muted-foreground mx-auto" />
            <div>
              <h3 className="font-medium">No historical data available</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Historical traffic data will appear here once available
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }
  
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
  const totalVolume = chartData.reduce((sum: number, item: any) => sum + (item.volume || 0), 0)
  const avgSpeed = chartData.length > 0 
    ? chartData.reduce((sum: number, item: any) => sum + (item.speed || 0), 0) / chartData.length 
    : 0
  const peakHour = chartData.length > 0 
    ? chartData.reduce((max: any, item: any) => 
        (item.volume || 0) > (max.volume || 0) ? item : max, chartData[0]
    )
    : null

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-sm font-medium">24-Hour Traffic Trends</CardTitle>
          <p className="text-xs text-muted-foreground">
            Vehicle volume and average speed over time • {chartData.length} data points
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
              <div className="font-mono font-medium">
                {peakHour?.hourLabel || 'N/A'}
              </div>
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
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>Last 24 hours</span>
              </div>
              {chartData.length > 0 && (
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  <span>Live data from {chartData.length} sensors</span>
                </div>
              )}
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