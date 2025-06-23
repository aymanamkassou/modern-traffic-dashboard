'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

import { useSensorStatus, useSensorRegistry } from '@/lib/api-client'
import { useServerSentEvents, SSEEvent } from '@/hooks/use-server-sent-events'
import { cn } from '@/lib/utils'
import { 
  Activity, 
  Battery, 
  Signal, 
  Thermometer,
  Shield,
  ShieldCheck,
  AlertTriangle,
  Wifi,
  WifiOff,
  Zap,
  Clock,
  MapPin,
  RefreshCw,
  BarChart3,
  TrendingUp
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, AreaChart, Area } from 'recharts'

// Sensor status configuration with semantic colors
const statusConfig = {
  healthy: {
    label: 'Healthy',
    color: 'border-green-500/50 bg-green-50/50 dark:bg-green-950/20',
    badgeVariant: 'default' as const,
    icon: ShieldCheck,
    iconColor: 'text-green-600'
  },
  warning: {
    label: 'Warning',
    color: 'border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-950/20',
    badgeVariant: 'secondary' as const,
    icon: AlertTriangle,
    iconColor: 'text-yellow-600'
  },
  critical: {
    label: 'Critical',
    color: 'border-red-500/50 bg-red-50/50 dark:bg-red-950/20',
    badgeVariant: 'destructive' as const,
    icon: AlertTriangle,
    iconColor: 'text-red-600'
  },
  offline: {
    label: 'Offline',
    color: 'border-gray-400/50 bg-gray-50/50 dark:bg-gray-950/20',
    badgeVariant: 'outline' as const,
    icon: WifiOff,
    iconColor: 'text-gray-500'
  }
}

// Enhanced sensor capabilities check
const hasEnhancedCapabilities = (capabilities: any) => {
  return capabilities && (
    capabilities.intersection_coordination ||
    capabilities.weather_sync ||
    capabilities.flow_rate_detection ||
    capabilities.queue_propagation ||
    capabilities.efficiency_metrics
  )
}

// Sensor Overview Content Component
function SensorOverviewContent({ sensorData, registryData }: { sensorData: any, registryData?: any }) {
  return (
    <div className="space-y-2 text-xs">
      {/* Battery Progress */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Battery Level</span>
          <span className="font-mono">{Math.round(sensorData.battery_level || 0)}%</span>
        </div>
        <Progress value={sensorData.battery_level || 0} className="h-1.5" />
      </div>

      {/* Signal Progress */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Signal Strength</span>
          <span className="font-mono">{sensorData.signal_strength || (sensorData.status === 'healthy' ? 95 : 50)}%</span>
        </div>
        <Progress value={sensorData.signal_strength || (sensorData.status === 'healthy' ? 95 : 50)} className="h-1.5" />
      </div>

      {/* Additional Details */}
      <div className="space-y-1 pt-2 border-t">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Uptime</span>
          <span className="font-mono">
            {sensorData.uptime_s ? `${Math.floor(sensorData.uptime_s / 3600)}h ${Math.floor((sensorData.uptime_s % 3600) / 60)}m` : 'N/A'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Data Points</span>
          <span className="font-mono">{registryData?.data_points?.toLocaleString() || 'N/A'}</span>
        </div>
      </div>
    </div>
  )
}

// Capability definitions for better display
const capabilityDefinitions = {
  intersection_coordination: {
    label: 'Intersection Coordination',
    description: 'Multi-sensor coordination for intersection management',
    icon: TrendingUp,
    category: 'enhanced'
  },
  weather_sync: {
    label: 'Weather Synchronization',
    description: 'Real-time weather correlation and adaptive responses',
    icon: Activity,
    category: 'enhanced'
  },
  flow_rate_detection: {
    label: 'Advanced Flow Analysis',
    description: 'Sophisticated vehicle flow pattern analysis',
    icon: BarChart3,
    category: 'enhanced'
  },
  queue_propagation: {
    label: 'Queue Propagation Analysis',
    description: 'Traffic queue formation and propagation tracking',
    icon: Clock,
    category: 'enhanced'
  },
  efficiency_metrics: {
    label: 'Efficiency Metrics',
    description: 'Advanced traffic efficiency calculations',
    icon: TrendingUp,
    category: 'enhanced'
  },
  density_detection: {
    label: 'Density Detection',
    description: 'Traffic density measurement and analysis',
    icon: Activity,
    category: 'basic'
  },
  speed_detection: {
    label: 'Speed Detection',
    description: 'Vehicle speed measurement capabilities',
    icon: Activity,
    category: 'basic'
  },
  incident_detection: {
    label: 'Incident Detection',
    description: 'Basic incident and anomaly detection',
    icon: AlertTriangle,
    category: 'basic'
  },
  weather_monitoring: {
    label: 'Weather Monitoring',
    description: 'Environmental condition tracking',
    icon: Activity,
    category: 'basic'
  }
}

// Sensor Capabilities Content Component  
function SensorCapabilitiesContent({ registryData }: { registryData?: any }) {
  if (!registryData?.capabilities) {
    return <div className="text-xs text-muted-foreground text-center py-4">No capability data available</div>
  }

  const capabilities = registryData.capabilities
  const activeCapabilities = Object.entries(capabilities).filter(([_, value]) => value)
  const enhancedCapabilities = activeCapabilities.filter(([key]) => 
    capabilityDefinitions[key as keyof typeof capabilityDefinitions]?.category === 'enhanced'
  )
  const basicCapabilities = activeCapabilities.filter(([key]) => 
    capabilityDefinitions[key as keyof typeof capabilityDefinitions]?.category === 'basic'
  )

  return (
    <div className="space-y-3">
      {/* Enhanced Capabilities */}
      {enhancedCapabilities.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Zap className="h-3 w-3 text-primary" />
            <span className="text-xs font-medium">Enhanced Capabilities</span>
            <Badge variant="default" className="text-xs px-1 py-0">
              {enhancedCapabilities.length}
            </Badge>
          </div>
          <div className="space-y-1">
            {enhancedCapabilities.slice(0, 4).map(([key, value]) => {
              const capability = capabilityDefinitions[key as keyof typeof capabilityDefinitions]
              const Icon = capability?.icon || Activity
              return (
                <div key={key} className="flex items-center gap-2 p-1.5 bg-primary/5 rounded">
                  <Icon className="h-3 w-3 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate">
                      {capability?.label || key.replace(/_/g, ' ')}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {typeof value === 'boolean' ? (value ? 'Active' : 'Inactive') : String(value).slice(0, 15)}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Basic Capabilities */}
      {basicCapabilities.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Activity className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs font-medium">Basic Capabilities</span>
            <Badge variant="outline" className="text-xs px-1 py-0">
              {basicCapabilities.length}
            </Badge>
          </div>
          <div className="grid gap-1">
            {basicCapabilities.slice(0, 4).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between text-xs p-1 bg-muted/30 rounded">
                <span className="text-muted-foreground capitalize truncate">
                  {key.replace(/_/g, ' ')}
                </span>
                <Badge variant="outline" className="text-xs px-1 py-0">
                  {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value).slice(0, 8)}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="pt-2 border-t">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="text-center">
            <div className="text-muted-foreground">Enhanced</div>
            <div className="font-mono text-primary">{enhancedCapabilities.length}</div>
          </div>
          <div className="text-center">
            <div className="text-muted-foreground">Basic</div>
            <div className="font-mono">{basicCapabilities.length}</div>
          </div>
        </div>
      </div>

      {activeCapabilities.length === 0 && (
        <div className="text-xs text-muted-foreground text-center py-4">No active capabilities</div>
      )}
    </div>
  )
}

// Mock data generator for health history
const generateMockHealthHistory = (sensorId: string) => {
  const now = Date.now()
  const hours = 12 // Reduced for card display
  
  return Array.from({ length: hours }, (_, i) => {
    const time = now - (hours - i) * 60 * 60 * 1000
    return {
      time: new Date(time).toISOString(),
      battery: Math.max(20, 100 - Math.random() * 10 - i * 0.5),
      temperature: 15 + Math.random() * 20 + Math.sin(i / 4) * 5,
      uptime: Math.random() > 0.1 ? 100 : Math.random() * 50,
      signal: 70 + Math.random() * 30
    }
  })
}

// Sensor History Content Component
function SensorHistoryContent({ sensorId }: { sensorId: string }) {
  const [healthData] = useState(() => generateMockHealthHistory(sensorId))

  return (
    <div className="space-y-3">
      {/* Battery History Chart */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Battery className="h-3 w-3 text-green-600" />
          <span className="text-xs font-medium">Battery Level (12h)</span>
        </div>
        <div className="h-20 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={healthData}>
              <defs>
                <linearGradient id={`batteryGradient-${sensorId}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="time" 
                tick={false}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                domain={[0, 100]} 
                tick={false}
                axisLine={false}
                tickLine={false}
              />
              <Area
                type="monotone"
                dataKey="battery"
                stroke="#10b981"
                fill={`url(#batteryGradient-${sensorId})`}
                strokeWidth={1.5}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Temperature History Chart */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Thermometer className="h-3 w-3 text-orange-600" />
          <span className="text-xs font-medium">Temperature (12h)</span>
        </div>
        <div className="h-20 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={healthData}>
              <XAxis 
                dataKey="time" 
                tick={false}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                tick={false}
                axisLine={false}
                tickLine={false}
              />
              <Line
                type="monotone"
                dataKey="temperature"
                stroke="#f59e0b"
                strokeWidth={1.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Combined Metrics */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-3 w-3 text-blue-600" />
          <span className="text-xs font-medium">Signal & Uptime (12h)</span>
        </div>
        <div className="h-20 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={healthData}>
              <XAxis 
                dataKey="time" 
                tick={false}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                domain={[0, 100]} 
                tick={false}
                axisLine={false}
                tickLine={false}
              />
              <Line
                type="monotone"
                dataKey="uptime"
                stroke="#3b82f6"
                strokeWidth={1.5}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="signal"
                stroke="#8b5cf6"
                strokeWidth={1.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {/* Legend */}
        <div className="flex items-center justify-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-2 h-0.5 bg-blue-500"></div>
            <span className="text-muted-foreground">Uptime</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-0.5 bg-purple-500"></div>
            <span className="text-muted-foreground">Signal</span>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t">
        <div className="text-center">
          <div className="text-xs text-muted-foreground">Avg Battery</div>
          <div className="text-sm font-mono text-green-600">
            {Math.round(healthData.reduce((acc, d) => acc + d.battery, 0) / healthData.length)}%
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-muted-foreground">Avg Temp</div>
          <div className="text-sm font-mono text-orange-600">
            {Math.round(healthData.reduce((acc, d) => acc + d.temperature, 0) / healthData.length)}°C
          </div>
        </div>
      </div>
    </div>
  )
}

// Sensor Card Component
function SensorCard({ 
  sensorData, 
  registryData, 
  isLive
}: { 
  sensorData: any
  registryData?: any
  isLive: boolean
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  
  const status = sensorData.status || 'offline'
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.offline
  const StatusIcon = config.icon
  const isEnhanced = registryData && hasEnhancedCapabilities(registryData.capabilities)

  return (
    <Card className={cn(
      "group cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.01]",
      config.color,
      "h-full flex flex-col"
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className={cn(
              "p-1.5 rounded-lg flex-shrink-0",
              status === 'healthy' && "bg-green-100 dark:bg-green-900/30",
              status === 'warning' && "bg-yellow-100 dark:bg-yellow-900/30",
              status === 'critical' && "bg-red-100 dark:bg-red-900/30",
              status === 'offline' && "bg-gray-100 dark:bg-gray-900/30"
            )}>
              <StatusIcon className={cn("h-3 w-3", config.iconColor)} />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-sm font-medium truncate">
                {sensorData.sensor_id}
              </CardTitle>
              <div className="flex items-center gap-1 mt-0.5">
                <Badge variant={config.badgeVariant} className="text-xs px-1.5 py-0">
                  {config.label}
                </Badge>
                {isEnhanced && (
                  <Badge variant="outline" className="text-xs px-1.5 py-0 border-primary/30 text-primary">
                    <Zap className="h-2.5 w-2.5 mr-0.5" />
                    Enhanced
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <div className={cn(
              "w-1.5 h-1.5 rounded-full",
              isLive ? "bg-green-500 animate-pulse" : "bg-gray-400"
            )} />
            {isLive ? (
              <Wifi className="h-3 w-3 text-green-600" />
            ) : (
              <WifiOff className="h-3 w-3 text-gray-500" />
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-2 flex-1 flex flex-col">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 gap-1.5 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Battery className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Battery</span>
            </div>
            <span className={cn(
              "font-mono text-xs",
              sensorData.battery_level > 70 ? "text-green-600" :
              sensorData.battery_level > 30 ? "text-yellow-600" : "text-red-600"
            )}>
              {Math.round(sensorData.battery_level || 0)}%
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Signal className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Signal</span>
            </div>
            <span className="font-mono text-xs text-green-600">
              {sensorData.signal_strength || (sensorData.status === 'healthy' ? '95' : '50')}%
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Thermometer className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Temp</span>
            </div>
            <span className="font-mono text-xs">
              {sensorData.temperature_c ? `${Math.round(sensorData.temperature_c)}°C` : 'N/A'}
            </span>
          </div>
        </div>

        {/* Location Info */}
        {registryData?.intersection_id && (
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span className="truncate">Intersection</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs font-mono truncate max-w-20">{registryData.intersection_id}</span>
              {registryData.sensor_direction && (
                <Badge variant="outline" className="text-xs px-1 py-0 capitalize">
                  {registryData.sensor_direction.charAt(0)}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Issues Indicator */}
        {sensorData.issues && sensorData.issues.length > 0 && (
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 text-yellow-600">
              <AlertTriangle className="h-3 w-3" />
              <span>Issues</span>
            </div>
            <Badge variant="outline" className="text-xs px-1.5 py-0 border-yellow-600 text-yellow-600">
              {sensorData.issues.length}
            </Badge>
          </div>
        )}

        {/* Last Seen */}
        <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>Last seen</span>
          </div>
          <span className="font-mono text-xs">
            {new Date(sensorData.timestamp).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </span>
        </div>

        {/* Expand/Collapse Button */}
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full h-8 text-xs group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
            >
              {isExpanded ? 'Hide Details' : 'Show Details'}
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="mt-3">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 h-8">
                <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
                <TabsTrigger value="capabilities" className="text-xs">Capabilities</TabsTrigger>
                <TabsTrigger value="history" className="text-xs">History</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-3 space-y-3">
                <SensorOverviewContent sensorData={sensorData} registryData={registryData} />
              </TabsContent>

              <TabsContent value="capabilities" className="mt-3">
                <SensorCapabilitiesContent registryData={registryData} />
              </TabsContent>

              <TabsContent value="history" className="mt-3">
                <SensorHistoryContent sensorId={sensorData.sensor_id} />
              </TabsContent>
            </Tabs>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  )
}

// Loading Skeleton
function SensorCardSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          <Skeleton className="h-4 w-4 rounded-full" />
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-6 w-full" />
          ))}
        </div>
        <Skeleton className="h-8 w-full" />
      </CardContent>
    </Card>
  )
}

// Main Component
interface SensorStatusGridProps {}

export function SensorStatusGrid({}: SensorStatusGridProps = {}) {
  const { data: sensorStatus, isLoading: statusLoading, error: statusError, refetch } = useSensorStatus()
  const { data: sensorRegistry, isLoading: registryLoading } = useSensorRegistry()
  const [realtimeUpdates, setRealtimeUpdates] = useState<Map<string, any>>(new Map())

  // SSE Connection for real-time sensor updates
  const { 
    isConnected, 
    events,
    error: sseError 
  } = useServerSentEvents(
    process.env.NEXT_PUBLIC_API_BASE_URL 
      ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/sensors/stream` 
      : 'http://localhost:3001/api/sensors/stream',
    {
      autoConnect: true,
      onEvent: (event: SSEEvent) => {
        if (event.type === 'SENSOR' || (event.type === 'message' && event.data.sensor_id)) {
          console.log('🔧 Sensor update:', event.data)
          setRealtimeUpdates(prev => {
            const newMap = new Map(prev)
            newMap.set(event.data.sensor_id, event.data)
            return newMap
          })
        }
      }
    }
  )

  // Merge real-time updates with API data
  const getMergedSensorData = () => {
    // Handle both wrapped ({ data: [] }) and direct array responses
    const sensors = sensorStatus?.data || sensorStatus || []
    if (!Array.isArray(sensors)) return []
    
    return sensors.map(sensor => {
      const realtimeUpdate = realtimeUpdates.get(sensor.sensor_id)
      return realtimeUpdate ? { ...sensor, ...realtimeUpdate } : sensor
    })
  }

  // Create registry lookup map
  const registryMap = new Map()
  if (sensorRegistry && Array.isArray((sensorRegistry as any)?.sensors)) {
    (sensorRegistry as any).sensors.forEach((sensor: any) => {
      registryMap.set(sensor.sensor_id, sensor)
    })
  }

  const mergedSensorData = getMergedSensorData()

  if (statusError) {
    return (
      <Card className="border-red-500/50 animate-fade-in-up">
        <CardHeader>
          <CardTitle className="text-red-600 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Error Loading Sensor Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            {statusError.message || 'Failed to load sensor status data. Please try again later.'}
          </p>
          <Button onClick={() => refetch()} size="sm" variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (statusLoading || registryLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-8 w-24" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <SensorCardSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  // Calculate health stats
  const healthStats = mergedSensorData.reduce((acc, sensor) => {
    acc[sensor.status || 'offline'] = (acc[sensor.status || 'offline'] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-lg sm:text-xl font-semibold">Network Overview</h2>
          <p className="text-sm text-muted-foreground">
            {mergedSensorData.length} sensors across the network
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm">
            <div className={cn(
              "w-2 h-2 rounded-full",
              isConnected ? "bg-green-500 animate-pulse" : "bg-gray-400"
            )} />
            <span className="text-muted-foreground">
              {isConnected ? 'Live Updates' : 'Offline'}
            </span>
          </div>
          {sseError && (
            <Badge variant="destructive" className="text-xs">
              Connection Error
            </Badge>
          )}
        </div>
      </div>

      {/* Health Summary */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        {Object.entries(statusConfig).map(([status, config]) => {
          const count = healthStats[status] || 0
          const StatusIcon = config.icon
          return (
            <Card key={status} className="animate-fade-in-up">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "p-1.5 rounded-lg",
                    status === 'healthy' && "bg-green-100 dark:bg-green-900/30",
                    status === 'warning' && "bg-yellow-100 dark:bg-yellow-900/30",
                    status === 'critical' && "bg-red-100 dark:bg-red-900/30",
                    status === 'offline' && "bg-gray-100 dark:bg-gray-900/30"
                  )}>
                    <StatusIcon className={cn("h-3 w-3", config.iconColor)} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xl font-bold">{count}</div>
                    <div className="text-xs text-muted-foreground capitalize truncate">{status}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Sensor Grid */}
      {mergedSensorData.length > 0 ? (
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {mergedSensorData.map((sensor, index) => (
            <div 
              key={sensor.sensor_id}
              className="animate-fade-in-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <SensorCard
                sensorData={sensor}
                registryData={registryMap.get(sensor.sensor_id)}
                isLive={isConnected && events.some(e => e.data?.sensor_id === sensor.sensor_id)}
              />
            </div>
          ))}
        </div>
      ) : (
        <Card className="animate-fade-in-up">
          <CardContent className="flex items-center justify-center py-16">
            <div className="text-center space-y-4 max-w-md">
              <div className="mx-auto w-20 h-20 rounded-full bg-muted/30 flex items-center justify-center">
                <Activity className="h-10 w-10 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">No Sensors Found</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  No sensor data is currently available. Check your network connection and try again.
                </p>
              </div>
              <Button onClick={() => refetch()} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 