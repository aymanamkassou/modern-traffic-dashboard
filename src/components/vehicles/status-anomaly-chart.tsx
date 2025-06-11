'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { useVehicleStats } from '@/lib/api-client'
import { 
  AlertTriangle, 
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  Navigation,
  Users,
  Battery
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts'

// Status types with their configurations
const statusConfig = {
  hardware_fault: {
    label: 'Hardware Faults',
    description: 'Sensor hardware malfunctions detected',
    icon: AlertTriangle,
    color: '#ef4444',
    severity: 'critical'
  },
  wrong_way_driver: {
    label: 'Wrong Way Incidents',
    description: 'Vehicles detected traveling in wrong direction',
    icon: Navigation,
    color: '#dc2626',
    severity: 'critical'
  },
  queue_detected: {
    label: 'Queue Detections',
    description: 'Traffic queue formations identified',
    icon: Users,
    color: '#f59e0b',
    severity: 'warning'
  },
  low_voltage_alerts: {
    label: 'Low Voltage Alerts',
    description: 'Sensor power supply issues',
    icon: Battery,
    color: '#f97316',
    severity: 'warning'
  }
}

// Chart configuration for shadcn charts
const chartConfig = {
  hardware_fault: {
    label: 'Hardware Faults',
    color: statusConfig.hardware_fault.color,
  },
  wrong_way_driver: {
    label: 'Wrong Way Incidents',
    color: statusConfig.wrong_way_driver.color,
  },
  queue_detected: {
    label: 'Queue Detections',
    color: statusConfig.queue_detected.color,
  },
  low_voltage_alerts: {
    label: 'Low Voltage Alerts',
    color: statusConfig.low_voltage_alerts.color,
  }
}

// Status Summary Card Component
function StatusSummaryCard({ 
  type, 
  count, 
  trend, 
  trendValue 
}: { 
  type: keyof typeof statusConfig
  count: number
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string 
}) {
  const config = statusConfig[type]
  const Icon = config.icon
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Activity

  return (
    <Card className={cn(
      "transition-all duration-200 hover:shadow-md",
      config.severity === 'critical' && count > 0 && "border-red-500/50",
      config.severity === 'warning' && count > 5 && "border-orange-500/50"
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{config.label}</CardTitle>
        <Icon className={cn(
          "h-4 w-4",
          config.severity === 'critical' && count > 0 && "text-red-500",
          config.severity === 'warning' && count > 5 && "text-orange-500",
          count === 0 && "text-muted-foreground"
        )} />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-baseline gap-2">
            <div className="text-2xl font-bold">{count.toLocaleString()}</div>
            <Badge variant={
              config.severity === 'critical' && count > 0 ? "destructive" :
              config.severity === 'warning' && count > 5 ? "secondary" :
              "outline"
            }>
              {config.severity === 'critical' && count > 0 ? "Critical" :
               config.severity === 'warning' && count > 5 ? "Warning" :
               "Normal"}
            </Badge>
          </div>
          {trend && trendValue && (
            <div className="flex items-center gap-1 text-xs">
              <TrendIcon className={cn(
                "h-3 w-3",
                trend === 'up' && "text-red-500",
                trend === 'down' && "text-green-500",
                trend === 'neutral' && "text-muted-foreground"
              )} />
              <span className={cn(
                trend === 'up' && "text-red-500",
                trend === 'down' && "text-green-500",
                trend === 'neutral' && "text-muted-foreground"
              )}>
                {trendValue}
              </span>
            </div>
          )}
          <p className="text-xs text-muted-foreground">{config.description}</p>
        </div>
      </CardContent>
    </Card>
  )
}

// Status Frequency Chart Component
function StatusFrequencyChart({ data }: { data: any[] }) {
  return (
    <Card className="animate-fade-in-up">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Status Anomaly Frequency
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Frequency analysis of vehicle status alerts and system anomalies
        </p>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <XAxis 
                dataKey="type" 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => statusConfig[value as keyof typeof statusConfig]?.label || value}
              />
              <YAxis 
                label={{ value: 'Incidents', angle: -90, position: 'insideLeft' }}
              />
              <Bar 
                dataKey="count" 
                fill="#8884d8"
                radius={[4, 4, 0, 0]}
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={statusConfig[entry.type as keyof typeof statusConfig]?.color || '#8884d8'} 
                  />
                ))}
              </Bar>
              <ChartTooltip 
                content={<ChartTooltipContent />}
                formatter={(value: any, name: any) => [`${value} incidents`, 'Count']}
                labelFormatter={(label) => statusConfig[label as keyof typeof statusConfig]?.label || label}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Status Legend */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          {data.map((item) => {
            const config = statusConfig[item.type as keyof typeof statusConfig]
            if (!config) return null
            
            const Icon = config.icon
            return (
              <div key={item.type} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: config.color }}
                />
                <Icon className="h-4 w-4" style={{ color: config.color }} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{config.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {item.count.toLocaleString()} incidents
                  </div>
                </div>
                <Badge variant={
                  config.severity === 'critical' && item.count > 0 ? "destructive" :
                  config.severity === 'warning' && item.count > 5 ? "secondary" :
                  "outline"
                }>
                  {config.severity === 'critical' && item.count > 0 ? "Critical" :
                   config.severity === 'warning' && item.count > 5 ? "Warning" :
                   "Normal"}
                </Badge>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// System Health Overview Component
function SystemHealthOverview({ statusAnalysis }: { statusAnalysis: any }) {
  const totalIncidents = Object.values(statusAnalysis).reduce((sum: number, count: any) => sum + (typeof count === 'number' ? count : 0), 0)
  
  const healthScore = Math.max(0, 100 - (totalIncidents * 2)) // Simple health scoring
  
  const getHealthStatus = (score: number) => {
    if (score >= 90) return { status: 'Excellent', color: 'text-green-500', variant: 'default' as const }
    if (score >= 75) return { status: 'Good', color: 'text-blue-500', variant: 'secondary' as const }
    if (score >= 60) return { status: 'Fair', color: 'text-yellow-500', variant: 'secondary' as const }
    if (score >= 40) return { status: 'Poor', color: 'text-orange-500', variant: 'destructive' as const }
    return { status: 'Critical', color: 'text-red-500', variant: 'destructive' as const }
  }

  const health = getHealthStatus(healthScore)

  return (
    <Card className="animate-fade-in-up">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          System Health Overview
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Overall system health based on anomaly frequency
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold">{healthScore}%</div>
            <div className="text-sm text-muted-foreground">Health Score</div>
          </div>
          <Badge variant={health.variant} className="text-sm">
            {health.status}
          </Badge>
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm">Total Incidents</span>
            <span className="font-mono text-sm">{totalIncidents}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Critical Issues</span>
            <span className="font-mono text-sm text-red-500">
              {statusAnalysis.total_faults + statusAnalysis.wrong_way_incidents}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Warning Issues</span>
            <span className="font-mono text-sm text-orange-500">
              {statusAnalysis.queue_detections + statusAnalysis.low_voltage_alerts}
            </span>
          </div>
        </div>

        <div className="pt-2 border-t">
          <div className="text-xs text-muted-foreground">
            Health score calculated based on incident frequency and severity. 
            Regular monitoring helps maintain optimal system performance.
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Main Status Anomaly Chart Component
export function StatusAnomalyChart() {
  const { data: vehicleStats, isLoading, error } = useVehicleStats()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-0 pb-2">
                <div className="h-4 bg-muted rounded w-3/4" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-1/2" />
                <div className="h-4 bg-muted rounded w-3/4" />
              </CardHeader>
              <CardContent>
                <div className="h-[300px] bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-red-500/50">
        <CardHeader>
          <CardTitle className="text-red-500">Error Loading Status Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {error.message || 'Failed to load status analysis data. Please try again later.'}
          </p>
        </CardContent>
      </Card>
    )
  }

  if (!vehicleStats) {
    return (
      <Card className="border-yellow-500/50">
        <CardHeader>
          <CardTitle className="text-yellow-500">No Status Data Available</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No status analysis data is currently available. This feature requires enhanced sensor data.
          </p>
        </CardContent>
      </Card>
    )
  }

  // Create mock status analysis since it's not in the current API response
  // In a real implementation, this would come from a dedicated status analysis endpoint
  const statusAnalysis = vehicleStats.status_analysis || {
    total_faults: Math.floor(Math.random() * 5), // Random mock data for demo
    wrong_way_incidents: Math.floor(Math.random() * 3),
    queue_detections: Math.floor(Math.random() * 15) + 5,
    low_voltage_alerts: Math.floor(Math.random() * 4)
  }

  // Prepare chart data
  const chartData = [
    { type: 'hardware_fault', count: statusAnalysis.total_faults },
    { type: 'wrong_way_driver', count: statusAnalysis.wrong_way_incidents },
    { type: 'queue_detected', count: statusAnalysis.queue_detections },
    { type: 'low_voltage_alerts', count: statusAnalysis.low_voltage_alerts }
  ]

  return (
    <div className="space-y-6">
      {/* Status Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatusSummaryCard
          type="hardware_fault"
          count={statusAnalysis.total_faults}
          trend={statusAnalysis.total_faults > 10 ? "up" : statusAnalysis.total_faults > 0 ? "neutral" : "down"}
          trendValue={statusAnalysis.total_faults > 10 ? "High frequency" : statusAnalysis.total_faults > 0 ? "Monitoring" : "All clear"}
        />
        <StatusSummaryCard
          type="wrong_way_driver"
          count={statusAnalysis.wrong_way_incidents}
          trend={statusAnalysis.wrong_way_incidents > 5 ? "up" : statusAnalysis.wrong_way_incidents > 0 ? "neutral" : "down"}
          trendValue={statusAnalysis.wrong_way_incidents > 5 ? "Safety concern" : statusAnalysis.wrong_way_incidents > 0 ? "Isolated incidents" : "No incidents"}
        />
        <StatusSummaryCard
          type="queue_detected"
          count={statusAnalysis.queue_detections}
          trend="neutral"
          trendValue="Traffic pattern"
        />
        <StatusSummaryCard
          type="low_voltage_alerts"
          count={statusAnalysis.low_voltage_alerts}
          trend={statusAnalysis.low_voltage_alerts > 3 ? "up" : "neutral"}
          trendValue={statusAnalysis.low_voltage_alerts > 3 ? "Maintenance needed" : "Normal operation"}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        <StatusFrequencyChart data={chartData} />
        <SystemHealthOverview statusAnalysis={statusAnalysis} />
      </div>

      {/* Note about mock data */}
      <Card className="border-blue-500/50 bg-blue-50/50 dark:bg-blue-950/50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
            <Zap className="h-4 w-4" />
            <span className="font-medium">Demo Data Notice:</span>
            <span>Status analysis data is simulated for demonstration. Real implementation would integrate with sensor status endpoints.</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 