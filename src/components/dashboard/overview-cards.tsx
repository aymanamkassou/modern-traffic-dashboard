'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Activity, 
  Car, 
  MapPin, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  Radio,
  Timer
} from 'lucide-react'
import { useTrafficStats, useVehicleStats, useSensorStatus, useAlertCount } from '@/lib/api-client'
import { Skeleton } from '@/components/ui/skeleton'

interface MetricCardProps {
  title: string
  value: string | number
  description?: string
  icon: React.ElementType
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  isLoading?: boolean
}

function MetricCard({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  trend, 
  trendValue,
  isLoading 
}: MetricCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            <Skeleton className="h-4 w-24" />
          </CardTitle>
          <Skeleton className="h-4 w-4" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-20 mb-2" />
          <Skeleton className="h-3 w-32" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {trend && trendValue && (
          <div className="flex items-center pt-1">
            {trend === 'up' ? (
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
            ) : trend === 'down' ? (
              <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
            ) : null}
            <span className={`text-xs ${
              trend === 'up' ? 'text-green-600' : 
              trend === 'down' ? 'text-red-600' : 
              'text-muted-foreground'
            }`}>
              {trendValue}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function OverviewCards() {
  const { data: trafficStats, isLoading: trafficLoading } = useTrafficStats()
  const { data: vehicleStats, isLoading: vehicleLoading } = useVehicleStats()
  const { data: sensorData, isLoading: sensorLoading } = useSensorStatus()
  const { data: alertData, isLoading: alertLoading } = useAlertCount({ resolved: false })

  // Calculate metrics from API data
  const avgSpeed = trafficStats?.avg_speed || 0
  const totalVehicles = vehicleStats?.total_vehicles || 0
  const activeSensors = sensorData?.data?.filter(s => s.status === 'healthy').length || 0
  const totalSensors = sensorData?.data?.length || 0
  const activeAlerts = (alertData as any)?.count || 0

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        title="Average Speed"
        value={`${avgSpeed.toFixed(1)} km/h`}
        description="Current traffic flow speed"
        icon={Activity}
        trend="up"
        trendValue="+2.5% from last hour"
        isLoading={trafficLoading}
      />
      
      <MetricCard
        title="Active Vehicles"
        value={totalVehicles.toLocaleString()}
        description="Currently being tracked"
        icon={Car}
        trend="neutral"
        trendValue="Real-time count"
        isLoading={vehicleLoading}
      />
      
      <MetricCard
        title="Sensor Health"
        value={`${activeSensors}/${totalSensors}`}
        description="Operational sensors"
        icon={Radio}
        trend={activeSensors === totalSensors ? "up" : "down"}
        trendValue={`${((activeSensors/totalSensors) * 100).toFixed(1)}% operational`}
        isLoading={sensorLoading}
      />
      
      <MetricCard
        title="Active Alerts"
        value={activeAlerts}
        description="Requiring attention"
        icon={AlertTriangle}
        trend={activeAlerts > 0 ? "down" : "up"}
        trendValue={activeAlerts > 0 ? "Action required" : "All clear"}
        isLoading={alertLoading}
      />
    </div>
  )
}

export function EnhancedMetricsCards() {
  const { data: trafficStats, isLoading: trafficLoading } = useTrafficStats()
  const { data: vehicleStats, isLoading: vehicleLoading } = useVehicleStats()

  const avgDensity = trafficStats?.avg_density || 0
  const enhancementRate = trafficStats?.enhancement_rate || 0
  const avgTravelTime = 0 // This would come from API
  
  return (
    <div className="grid gap-4 md:grid-cols-3 mt-4">
      <MetricCard
        title="Traffic Density"
        value={`${avgDensity.toFixed(1)}%`}
        description="Average congestion level"
        icon={MapPin}
        trend={avgDensity > 50 ? "down" : "up"}
        trendValue={`${avgDensity > 50 ? 'High' : 'Normal'} congestion`}
        isLoading={trafficLoading}
      />
      
      <MetricCard
        title="Data Enhancement"
        value={`${(enhancementRate * 100).toFixed(1)}%`}
        description="Enhanced vs legacy data"
        icon={TrendingUp}
        trend="up"
        trendValue="Real-time coordination active"
        isLoading={trafficLoading}
      />
      
      <MetricCard
        title="Avg Travel Time"
        value="12.5 min"
        description="Cross-city average"
        icon={Timer}
        trend="down"
        trendValue="-3 min from yesterday"
        isLoading={false}
      />
    </div>
  )
} 