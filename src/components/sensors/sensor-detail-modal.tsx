'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { useSensorRegistry } from '@/lib/api-client'
import { AnimatedList } from '@/components/ui/animated-list'
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
  Settings,
  BarChart3,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  X,
  Wrench,
  Router,
  Eye,
  Cloud,
  Navigation,
  Users,
  Timer,
  Gauge
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, AreaChart, Area } from 'recharts'

// Mock data for health history (since API endpoint doesn't exist yet)
const generateMockHealthHistory = (sensorId: string) => {
  const now = Date.now()
  const hours = 24
  
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

// Capability definitions
const capabilityDefinitions = {
  // Basic capabilities
  traffic_flow: {
    label: 'Traffic Flow Detection',
    description: 'Basic vehicle count and flow rate monitoring',
    icon: Activity,
    category: 'basic'
  },
  density_detection: {
    label: 'Density Detection',
    description: 'Traffic density measurement and analysis',
    icon: Users,
    category: 'basic'
  },
  speed_detection: {
    label: 'Speed Detection',
    description: 'Vehicle speed measurement capabilities',
    icon: Gauge,
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
    icon: Cloud,
    category: 'basic'
  },
  
  // Enhanced capabilities
  intersection_coordination: {
    label: 'Intersection Coordination',
    description: 'Multi-sensor coordination for intersection management',
    icon: Navigation,
    category: 'enhanced'
  },
  weather_sync: {
    label: 'Weather Synchronization',
    description: 'Real-time weather correlation and adaptive responses',
    icon: Cloud,
    category: 'enhanced'
  },
  flow_rate_detection: {
    label: 'Advanced Flow Analysis',
    description: 'Sophisticated vehicle flow pattern analysis',
    icon: TrendingUp,
    category: 'enhanced'
  },
  queue_propagation: {
    label: 'Queue Propagation Analysis',
    description: 'Traffic queue formation and propagation tracking',
    icon: Timer,
    category: 'enhanced'
  },
  efficiency_metrics: {
    label: 'Efficiency Metrics',
    description: 'Advanced traffic efficiency calculations and optimization',
    icon: BarChart3,
    category: 'enhanced'
  }
}

// Sensor Overview Tab
function SensorOverviewTab({ sensorData, registryData }: { sensorData?: any, registryData?: any }) {
  if (!sensorData || !registryData) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const status = sensorData.status || 'offline'
  const statusConfig = {
    healthy: { color: 'text-green-600', bg: 'bg-green-100', icon: ShieldCheck },
    warning: { color: 'text-yellow-600', bg: 'bg-yellow-100', icon: AlertTriangle },
    critical: { color: 'text-red-600', bg: 'bg-red-100', icon: AlertTriangle },
    offline: { color: 'text-gray-600', bg: 'bg-gray-100', icon: WifiOff }
  }

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.offline
  const StatusIcon = config.icon

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <Card className="animate-fade-in-up">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <StatusIcon className={cn("h-5 w-5", config.color)} />
            Sensor Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Current Status:</span>
            <Badge variant={status === 'healthy' ? 'default' : status === 'critical' ? 'destructive' : 'secondary'}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Battery className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Battery Level</span>
              </div>
              <div className="flex items-center gap-2">
                <Progress 
                  value={sensorData.battery_level || 0} 
                  className="flex-1 h-2"
                />
                <span className="text-sm font-mono">
                  {sensorData.battery_level || 0}%
                </span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Signal className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Signal Strength</span>
              </div>
              <div className="flex items-center gap-2">
                <Progress 
                  value={sensorData.signal_strength || (sensorData.status === 'healthy' ? 95 : 50)} 
                  className="flex-1 h-2"
                />
                <span className="text-sm font-mono">
                  {sensorData.signal_strength || (sensorData.status === 'healthy' ? 95 : 50)}%
                </span>
              </div>
            </div>
          </div>

          {sensorData.temperature_c && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Thermometer className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Temperature:</span>
              </div>
              <span className="text-sm font-mono">{sensorData.temperature_c}°C</span>
            </div>
          )}

          {sensorData.uptime_s && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Uptime:</span>
              </div>
              <span className="text-sm font-mono">
                {Math.floor(sensorData.uptime_s / 3600)}h {Math.floor((sensorData.uptime_s % 3600) / 60)}m
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Location & Registry Info */}
      <Card className="animate-fade-in-up">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Location & Registry
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Sensor ID:</span>
            <span className="font-mono text-sm">{registryData.sensor_id}</span>
          </div>
          
          {registryData.intersection_id && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Intersection:</span>
              <span className="text-sm">{registryData.intersection_id}</span>
            </div>
          )}
          
          {registryData.sensor_direction && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Direction:</span>
              <Badge variant="outline" className="capitalize">
                {registryData.sensor_direction}
              </Badge>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Type:</span>
            <span className="text-sm">{registryData.type || 'Standard'}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Enhanced Features:</span>
            <Badge variant={registryData.enhanced_features ? 'default' : 'outline'}>
              {registryData.enhanced_features ? 'Yes' : 'No'}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Data Points:</span>
            <span className="font-mono text-sm">{registryData.data_points?.toLocaleString() || 0}</span>
          </div>
        </CardContent>
      </Card>

      {/* Issues */}
      {sensorData.issues && sensorData.issues.length > 0 && (
        <Card className="animate-fade-in-up border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-700">
              <AlertTriangle className="h-5 w-5" />
              Active Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {sensorData.issues.map((issue: string, index: number) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0" />
                  <span className="text-sm">{issue}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Capabilities Tab
function CapabilitiesTab({ registryData }: { registryData?: any }) {
  if (!registryData?.capabilities) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  const capabilities = registryData.capabilities
  const basicCapabilities = Object.entries(capabilities).filter(([key, value]) => 
    value && capabilityDefinitions[key as keyof typeof capabilityDefinitions]?.category === 'basic'
  )
  
  const enhancedCapabilities = Object.entries(capabilities).filter(([key, value]) => 
    value && capabilityDefinitions[key as keyof typeof capabilityDefinitions]?.category === 'enhanced'
  )

  const CapabilityCard = ({ capKey }: { capKey: string }) => {
    const capability = capabilityDefinitions[capKey as keyof typeof capabilityDefinitions]
    if (!capability) return null
    
    const Icon = capability.icon
    const isEnhanced = capability.category === 'enhanced'
    
    return (
      <Card className={cn(
        "animate-fade-in-up",
        isEnhanced && "border-primary/30 bg-primary/5"
      )}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className={cn(
              "p-2 rounded-lg",
              isEnhanced 
                ? "bg-primary/10 text-primary" 
                : "bg-muted text-muted-foreground"
            )}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium text-sm">{capability.label}</h3>
                {isEnhanced && (
                  <Badge variant="outline" className="text-xs border-primary/30">
                    <Zap className="h-3 w-3 mr-1" />
                    Enhanced
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {capability.description}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Capabilities */}
      {enhancedCapabilities.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Enhanced Capabilities</h3>
            <Badge variant="default" className="text-xs">
              {enhancedCapabilities.length} Active
            </Badge>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {enhancedCapabilities.map(([key]) => (
              <CapabilityCard key={key} capKey={key} />
            ))}
          </div>
        </div>
      )}

      {/* Basic Capabilities */}
      {basicCapabilities.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Basic Capabilities</h3>
            <Badge variant="outline" className="text-xs">
              {basicCapabilities.length} Active
            </Badge>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {basicCapabilities.map(([key]) => (
              <CapabilityCard key={key} capKey={key} />
            ))}
          </div>
        </div>
      )}

      {basicCapabilities.length === 0 && enhancedCapabilities.length === 0 && (
        <Card className="animate-fade-in-up">
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-3">
              <Settings className="h-12 w-12 text-muted-foreground mx-auto" />
              <div>
                <h3 className="font-medium">No Active Capabilities</h3>
                <p className="text-sm text-muted-foreground">
                  This sensor doesn't have any active capabilities configured
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Health History Tab
function HealthHistoryTab({ sensorId }: { sensorId: string }) {
  const [healthData] = useState(() => generateMockHealthHistory(sensorId))

  const chartConfig = {
    battery: { label: 'Battery %', color: '#10b981' },
    temperature: { label: 'Temperature °C', color: '#f59e0b' },
    uptime: { label: 'Uptime %', color: '#3b82f6' },
    signal: { label: 'Signal %', color: '#8b5cf6' }
  }

  return (
    <div className="space-y-6">
      {/* Battery History */}
      <Card className="animate-fade-in-up">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Battery className="h-5 w-5 text-green-600" />
            Battery Level History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={healthData}>
                <defs>
                  <linearGradient id="batteryGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="time" 
                  tick={{ fontSize: 10 }}
                  tickFormatter={(value) => new Date(value).toLocaleTimeString([], { hour: '2-digit' })}
                />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="battery"
                  stroke="#10b981"
                  fill="url(#batteryGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Temperature History */}
      <Card className="animate-fade-in-up">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Thermometer className="h-5 w-5 text-orange-600" />
            Temperature History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={healthData}>
                <XAxis 
                  dataKey="time" 
                  tick={{ fontSize: 10 }}
                  tickFormatter={(value) => new Date(value).toLocaleTimeString([], { hour: '2-digit' })}
                />
                <YAxis tick={{ fontSize: 10 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="temperature"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Combined Metrics */}
      <Card className="animate-fade-in-up">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Combined Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={healthData}>
                <XAxis 
                  dataKey="time" 
                  tick={{ fontSize: 10 }}
                  tickFormatter={(value) => new Date(value).toLocaleTimeString([], { hour: '2-digit' })}
                />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="uptime"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="signal"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}

// Main Modal Component
interface SensorDetailModalProps {
  sensorId: string | null
  isOpen: boolean
  onClose: () => void
}

export function SensorDetailModal({ sensorId, isOpen, onClose }: SensorDetailModalProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const { data: sensorRegistry, isLoading } = useSensorRegistry()

  // Find sensor data
  const sensorData = sensorRegistry?.sensors?.find(s => s.sensor_id === sensorId)

  // Reset tab when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setActiveTab('overview')
    }
  }, [isOpen, sensorId])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Sensor Details
            {sensorId && (
              <Badge variant="outline" className="font-mono">
                {sensorId}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Detailed sensor information, capabilities, and health monitoring
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : sensorData ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="capabilities" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Capabilities
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Health History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <SensorOverviewTab sensorData={sensorData} registryData={sensorData} />
            </TabsContent>

            <TabsContent value="capabilities" className="mt-6">
              <CapabilitiesTab registryData={sensorData} />
            </TabsContent>

            <TabsContent value="history" className="mt-6">
              {sensorId && <HealthHistoryTab sensorId={sensorId} />}
            </TabsContent>
          </Tabs>
        ) : (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center space-y-3">
                <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto" />
                <div>
                  <h3 className="font-medium">Sensor Not Found</h3>
                  <p className="text-sm text-muted-foreground">
                    The requested sensor data could not be found in the registry
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </DialogContent>
    </Dialog>
  )
} 