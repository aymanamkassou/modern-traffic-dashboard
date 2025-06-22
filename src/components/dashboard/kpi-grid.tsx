'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  useRiskAnalysis, 
  useVehicleStats, 
  useAlertCount,
  useTrafficStats
} from '@/lib/api-client'
import { useServerSentEvents } from '@/hooks/use-server-sent-events'
import { SensorHealthOverview } from './sensor-health-overview'
import { 
  AlertTriangle, 
  Car, 
  Shield,
  TrendingUp,
  TrendingDown,
  Minus,
  Wifi,
  WifiOff,
  Activity
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { 
  isVehicleData, 
  isTrafficData, 
  isConnectionMessage,
  type VehicleStreamData,
  type TrafficStreamData,
  type AlertStreamData,
  type SSEEvent,
  type StreamData
} from "@/types/sse-events"

// Connection Status Indicator Component
function ConnectionIndicator({ isConnected, error }: { isConnected: boolean; error: string | null }) {
  if (error) {
    return (
      <div className="flex items-center gap-1 text-xs text-red-500">
        <WifiOff className="h-3 w-3" />
        <span>Offline</span>
      </div>
    )
  }
  
  if (isConnected) {
    return (
      <div className="flex items-center gap-1 text-xs text-green-500">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span>Live</span>
      </div>
    )
  }
  
  return (
    <div className="flex items-center gap-1 text-xs text-yellow-500">
      <Wifi className="h-3 w-3" />
      <span>Connecting...</span>
    </div>
  )
}

// Risk Score Gauge Component
function RiskScoreGauge({ score, className }: { score: number; className?: string }) {
  const getRiskLevel = (score: number) => {
    if (score >= 80) return { level: 'Critical', color: 'text-red-500', bgColor: 'bg-red-500' }
    if (score >= 60) return { level: 'High', color: 'text-orange-500', bgColor: 'bg-orange-500' }
    if (score >= 40) return { level: 'Medium', color: 'text-yellow-500', bgColor: 'bg-yellow-500' }
    if (score >= 20) return { level: 'Low', color: 'text-blue-500', bgColor: 'bg-blue-500' }
    return { level: 'Minimal', color: 'text-green-500', bgColor: 'bg-green-500' }
  }

  const risk = getRiskLevel(score)
  const circumference = 2 * Math.PI * 45
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (score / 100) * circumference

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className="relative w-32 h-32">
        <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-muted-foreground/20"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className={risk.color}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold">{score}</span>
          <span className="text-xs text-muted-foreground">{risk.level}</span>
        </div>
      </div>
    </div>
  )
}

// Enhanced Vehicle Count Card with SSE
function LiveVehicleCountCard() {
  const { data: vehicleStats, isLoading, error } = useVehicleStats()
  const [liveVehicleCount, setLiveVehicleCount] = useState<number>(0)
  const [recentVehicles, setRecentVehicles] = useState<VehicleStreamData[]>([])
  const [lastUpdate, setLastUpdate] = useState<string>('')
  
  // SSE connection for real-time vehicle updates
  const { isConnected, error: sseError } = useServerSentEvents(
    'http://localhost:3001/api/vehicles/stream',
    {
      autoConnect: true,
      maxEvents: 100,
      retryInterval: 3000,
      onEvent: (event: SSEEvent) => {
        // Skip connection messages
        if (isConnectionMessage(event.data)) {
          return
        }
        
        // Process vehicle data
        if (event.type === 'message' && isVehicleData(event.data)) {
          const vehicleData = event.data
          
          // Add to recent vehicles (keep last 10)
          setRecentVehicles(prev => [vehicleData, ...prev.slice(0, 9)])
          
          // Update live count
          setLiveVehicleCount(prev => prev + 1)
          
          // Update timestamp
          setLastUpdate(vehicleData.timestamp)
        }
      }
    }
  )

  // Calculate average speed from recent vehicles
  const avgSpeed = recentVehicles.length > 0 
    ? Math.round(recentVehicles.reduce((sum, v) => sum + v.speed_kmh, 0) / recentVehicles.length)
    : 0

  const displayCount = vehicleStats?.overall_stats?.total_vehicles || liveVehicleCount

  if (error) {
    return (
      <Card className="relative overflow-hidden border-red-500/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Live Vehicle Count</CardTitle>
          <Car className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-sm text-red-500">
            API Error: {error.message || 'Failed to load vehicle data'}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn(
      "relative overflow-hidden transition-colors",
      isConnected && recentVehicles.length > 0 && "border-green-500/50 bg-green-500/5"
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm font-medium">Live Vehicle Count</CardTitle>
          <ConnectionIndicator isConnected={isConnected} error={sseError} />
        </div>
        <Car className={cn(
          "h-4 w-4",
          isConnected ? "text-green-500" : "text-muted-foreground"
        )} />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-baseline gap-2">
            <div className="text-2xl font-bold">{isLoading ? '...' : displayCount.toLocaleString()}</div>
            <div className="flex items-center gap-1 text-xs">
              {avgSpeed > 0 && (
                <span className="text-xs text-muted-foreground">
                  Avg Speed: {avgSpeed} km/h
                </span>
              )}
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">
                {isConnected ? `Recent activity (${recentVehicles.length})` : 'Enhanced Data'}
              </span>
              <span className="font-mono">
                {isConnected ? lastUpdate : ''}
              </span>
            </div>
            <Progress 
              value={isConnected ? (recentVehicles.length / 10) * 100 : 0} 
              className="h-1" 
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {isConnected ? 'Real-time vehicle detections' : 'Vehicles detected in last 5 minutes'}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

// Enhanced Risk Score Card with SSE
function LiveRiskScoreCard() {
  const { data: riskData, isLoading, error } = useRiskAnalysis()
  const [liveRiskScore, setLiveRiskScore] = useState<number>(35)
  const [riskFactors, setRiskFactors] = useState<string[]>([])
  const [lastUpdate, setLastUpdate] = useState<string>('')
  
  // SSE connection for real-time traffic updates to calculate risk
  const { isConnected } = useServerSentEvents(
    'http://localhost:3001/api/traffic/stream',
    {
      autoConnect: true,
      maxEvents: 50,
      retryInterval: 3000,
      onEvent: (event: SSEEvent) => {
        // Skip connection messages
        if (isConnectionMessage(event.data)) {
          return
        }
        
        // Process traffic data for risk calculation
        if (event.type === 'message' && isTrafficData(event.data)) {
          const trafficData = event.data
          
          // Calculate risk score from traffic data
          let riskScore = 35 // base risk
          const factors: string[] = []
          
          // Congestion level impact
          switch (trafficData.congestion_level) {
            case 'critical':
              riskScore = 85
              factors.push('Critical congestion')
              break
            case 'high':
              riskScore = 70
              factors.push('High congestion')
              break
            case 'medium':
              riskScore = 50
              factors.push('Medium congestion')
              break
            case 'low':
              riskScore = 25
              factors.push('Low congestion')
              break
          }
          
          // Weather conditions impact
          if (trafficData.weather_conditions !== 'sunny') {
            riskScore += 10
            factors.push(`Weather: ${trafficData.weather_conditions}`)
          }
          
          // Incident detection
          if (trafficData.incident_detected) {
            riskScore += 20
            factors.push('Incident detected')
          }
          
          // Near misses
          if (trafficData.near_miss_events > 0) {
            riskScore += trafficData.near_miss_events * 5
            factors.push(`${trafficData.near_miss_events} near misses`)
          }
          
          // Red light violations
          if (trafficData.red_light_violations > 0) {
            riskScore += trafficData.red_light_violations * 3
            factors.push(`${trafficData.red_light_violations} violations`)
          }
          
          // Heavy vehicles
          if (trafficData.heavy_vehicle_count > 10) {
            riskScore += 5
            factors.push(`${trafficData.heavy_vehicle_count} heavy vehicles`)
          }
          
          // Cap at 100
          riskScore = Math.min(riskScore, 100)
          
          setLiveRiskScore(riskScore)
          setRiskFactors(factors.slice(0, 3)) // Keep top 3 factors
          setLastUpdate(trafficData.timestamp)
        }
      }
    }
  )

  const displayScore = (riskData as any)?.risk_analysis?.overall_risk?.score || liveRiskScore
  const riskLevel = displayScore >= 80 ? 'critical' : 
                   displayScore >= 60 ? 'high' : 
                   displayScore >= 40 ? 'medium' : 'low'
  
  const riskColor = {
    critical: 'text-red-600',
    high: 'text-orange-600', 
    medium: 'text-yellow-600',
    low: 'text-green-600'
  }[riskLevel]

  const bgColor = {
    critical: 'bg-red-100',
    high: 'bg-orange-100',
    medium: 'bg-yellow-100', 
    low: 'bg-green-100'
  }[riskLevel]

  if (error) {
    return (
      <Card className="relative overflow-hidden border-red-500/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Overall Risk Score</CardTitle>
          <Shield className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-sm text-red-500">
            API Error: {error.message || 'Failed to load risk data'}
          </div>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <Card className={cn(
      "relative overflow-hidden transition-colors",
      isConnected && liveRiskScore !== null && "border-yellow-500/50 bg-yellow-500/5"
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm font-medium">Overall Risk Score</CardTitle>
          <ConnectionIndicator isConnected={isConnected} error={error} />
        </div>
        <Shield className={cn(
          "h-4 w-4",
          isConnected ? "text-yellow-500" : "text-muted-foreground"
        )} />
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center space-y-2">
          {isLoading ? (
            <div className="w-32 h-32 flex items-center justify-center">
              <div className="text-muted-foreground">Loading...</div>
            </div>
          ) : (
            <RiskScoreGauge score={displayScore} />
          )}
          <div className="text-center">
            {isConnected && lastUpdate && (
              <div className="text-xs text-green-500 mb-1">
                Live • Updated {new Date(lastUpdate).toLocaleTimeString()}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              {isConnected ? 'Live risk assessment from traffic data' : 'System-wide average risk assessment'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Enhanced Alert Count Card with SSE  
function LiveAlertCountCard() {
  const { data: alertData, isLoading, error } = useAlertCount()
  const [liveAlertCount, setLiveAlertCount] = useState<number>(0)
  const [recentAlerts, setRecentAlerts] = useState<AlertStreamData[]>([])
  const [lastUpdate, setLastUpdate] = useState<string>('')
  
  // Helper function to check if data is AlertStreamData
  const isAlertStreamData = (data: StreamData): data is AlertStreamData => {
    return data && 
           typeof data === 'object' && 
           'sensor_id' in data && 
           'type' in data &&
           'timestamp' in data &&
           // Check for common alert types
           (data.type === 'traffic-queue' || 
            data.type === 'congestion' || 
            data.type === 'accident' || 
            data.type === 'sensor_fault' ||
            typeof data.type === 'string')
  }
  
  // SSE connection for real-time alert updates
  const { isConnected } = useServerSentEvents(
    'http://localhost:3001/api/alerts/stream',
    {
      autoConnect: true,
      maxEvents: 50,
      retryInterval: 3000,
      onEvent: (event: SSEEvent) => {
        // Skip connection messages
        if (isConnectionMessage(event.data)) {
          return
        }
        
        // Process alert data
        if ((event.type === 'message' || event.type === 'traffic-queue' || event.type === 'wrong-way-driver' || event.type === 'congestion' || event.type === 'accident' || event.type === 'sensor_fault') && isAlertStreamData(event.data)) {
          const alertStreamData = event.data
          console.log('✅ KPI Alert: Processing valid alert data:', alertStreamData)
          
          // Add to recent alerts (keep last 10)
          setRecentAlerts(prev => [alertStreamData, ...prev.slice(0, 9)])
          
          // Update live count
          setLiveAlertCount(prev => prev + 1)
          
          // Update timestamp
          setLastUpdate(alertStreamData.timestamp)
        } else {
          console.log('❌ KPI Alert: Received non-alert event:', event.type, event.data)
        }
      }
    }
  )

  const displayCount =  liveAlertCount || (alertData as any)?.count 
  const criticalAlerts = recentAlerts.filter(alert => 
    alert.type === 'traffic-queue' || alert.type === 'congestion'
  ).length

  if (error) {
    return (
      <Card className="relative overflow-hidden border-red-500/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Critical Alerts</CardTitle>
          <AlertTriangle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-sm text-red-500">
            API Error: {error.message || 'Failed to load alert data'}
          </div>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <Card className={cn(
      "relative overflow-hidden transition-colors",
      isConnected && recentAlerts.length > 0 && "border-orange-500/50 bg-orange-500/5"
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm font-medium">Active Critical Alerts</CardTitle>
          <ConnectionIndicator isConnected={isConnected} error={error} />
        </div>
        <AlertTriangle className={cn(
          "h-4 w-4",
          isConnected ? "text-orange-500" : "text-muted-foreground"
        )} />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-baseline gap-2">
            <div className={cn(
              "text-2xl font-bold",
              isConnected ? "text-orange-500" : "text-foreground"
            )}>
              {isLoading ? '...' : displayCount}
            </div>
            {criticalAlerts > 0 && (
              <Badge variant="destructive" className="text-xs">
                High
              </Badge>
            )}
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">
                {isConnected ? `Live alerts (${recentAlerts.length})` : 'Unresolved'}
              </span>
              <span className="font-mono text-muted-foreground">
                {isConnected && lastUpdate ? lastUpdate : 'Last 24h'}
              </span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {isConnected ? 'Real-time critical alerts' : 'High and critical severity alerts requiring attention'}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

// Traffic Flow Card (using traffic data)
function LiveTrafficFlowCard() {
  const { data: trafficStats, isLoading, error } = useTrafficStats()
  const [avgFlow, setAvgFlow] = useState<number>(0)
  const [peakFlow, setPeakFlow] = useState<number>(0)
  const [lastUpdate, setLastUpdate] = useState<string>('')
  
  // SSE connection for real-time traffic flow
  const { isConnected } = useServerSentEvents(
    'http://localhost:3001/api/traffic/stream',
    {
      autoConnect: true,
      maxEvents: 50,
      retryInterval: 3000,
      onEvent: (event: SSEEvent) => {
        // Skip connection messages
        if (isConnectionMessage(event.data)) {
          return
        }
        
        // Process traffic data
        if (event.type === 'message' && isTrafficData(event.data)) {
          const trafficData = event.data
          
          if (trafficData.vehicle_flow_rate) {
            // Update average flow (simple moving average)
            setAvgFlow(prev => {
              const newAvg = (prev + trafficData.vehicle_flow_rate!) / 2
              return Math.round(newAvg * 10) / 10
            })
            
            // Update peak flow
            setPeakFlow(prev => Math.max(prev, trafficData.vehicle_flow_rate!))
            
            setLastUpdate(trafficData.timestamp)
          }
        }
      }
    }
  )

  const displayFlow = (trafficStats as any)?.traffic_patterns?.[0]?.metrics?.total_vehicles || avgFlow

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Traffic Flow Rate</CardTitle>
        <Activity className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{displayFlow}</div>
        <div className="space-y-1 mt-2">
          <p className="text-xs text-muted-foreground">
            Peak: {peakFlow.toFixed(1)} veh/min
          </p>
          <p className="text-xs text-muted-foreground">
            Current: {avgFlow.toFixed(1)} veh/min
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-xs text-muted-foreground">
                {isConnected ? 'Live' : 'Disconnected'}
              </span>
            </div>
            {lastUpdate && (
              <p className="text-xs text-muted-foreground">
                {new Date(lastUpdate).toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Main KPI Grid Component
export function KPIGrid() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <LiveVehicleCountCard />
      <LiveRiskScoreCard />
      <LiveAlertCountCard />
      <LiveTrafficFlowCard />
    </div>
  )
} 