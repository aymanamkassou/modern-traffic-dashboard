"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useServerSentEvents } from "@/hooks/use-server-sent-events"
import { 
  isTrafficData, 
  isConnectionMessage,
  type TrafficStreamData,
  type SSEEvent
} from "@/types/sse-events"
import { MapPin, TrendingUp, AlertTriangle } from "lucide-react"

interface RiskLocation {
  id: string
  name: string
  coordinates: {
    lat: number
    lng: number
  }
  risk_score: number
  risk_level: 'low' | 'medium' | 'high' | 'critical'
  last_updated: string
  factors: string[]
}

export function MiniRiskHeatmap() {
  const [heatmapData, setHeatmapData] = useState<RiskLocation[]>([])
  const [lastUpdate, setLastUpdate] = useState<string>('')

  // Helper functions defined first to avoid initialization errors
  const calculateRiskFromTrafficData = (trafficData: TrafficStreamData): number => {
    let riskScore = 35 // base risk
    
    // Congestion level impact
    switch (trafficData.congestion_level) {
      case 'critical': riskScore = 85; break
      case 'high': riskScore = 70; break
      case 'medium': riskScore = 50; break
      case 'low': riskScore = 25; break
    }
    
    // Weather conditions impact
    if (trafficData.weather_conditions !== 'sunny') {
      riskScore += 10
    }
    
    // Incident detection
    if (trafficData.incident_detected) {
      riskScore += 20
    }
    
    // Near misses
    if (trafficData.near_miss_events > 0) {
      riskScore += trafficData.near_miss_events * 5
    }
    
    // Red light violations
    if (trafficData.red_light_violations > 0) {
      riskScore += trafficData.red_light_violations * 3
    }
    
    // Heavy vehicles
    if (trafficData.heavy_vehicle_count > 10) {
      riskScore += 5
    }
    
    // Cap at 100
    return Math.min(riskScore, 100)
  }

  const getRiskLevel = (score: number): RiskLocation['risk_level'] => {
    if (score >= 80) return 'critical'
    if (score >= 60) return 'high'
    if (score >= 40) return 'medium'
    return 'low'
  }

  const generateRiskFactors = (trafficData: TrafficStreamData): string[] => {
    const factors: string[] = []
    
    if (trafficData.congestion_level && trafficData.congestion_level !== 'low') {
      factors.push(`${trafficData.congestion_level} congestion`)
    }
    
    if (trafficData.weather_conditions !== 'sunny') {
      factors.push(`Weather: ${trafficData.weather_conditions}`)
    }
    
    if (trafficData.incident_detected) {
      factors.push('Incident detected')
    }
    
    if (trafficData.near_miss_events > 0) {
      factors.push(`${trafficData.near_miss_events} near misses`)
    }
    
    if (trafficData.red_light_violations > 0) {
      factors.push(`${trafficData.red_light_violations} violations`)
    }
    
    if (trafficData.heavy_vehicle_count > 10) {
      factors.push(`${trafficData.heavy_vehicle_count} heavy vehicles`)
    }
    
    return factors.slice(0, 3) // Keep top 3 factors
  }

  const getRiskColor = (level: RiskLocation['risk_level']) => {
    switch (level) {
      case 'critical': return 'text-red-600 bg-red-100 border-red-200'
      case 'high': return 'text-orange-600 bg-orange-100 border-orange-200'
      case 'medium': return 'text-yellow-600 bg-yellow-100 border-yellow-200'
      case 'low': return 'text-green-600 bg-green-100 border-green-200'
      default: return 'text-gray-600 bg-gray-100 border-gray-200'
    }
  }

  const getRiskIcon = (level: RiskLocation['risk_level']) => {
    switch (level) {
      case 'critical': return <AlertTriangle className="h-3 w-3 text-red-500" />
      case 'high': return <TrendingUp className="h-3 w-3 text-orange-500" />
      case 'medium': return <TrendingUp className="h-3 w-3 text-yellow-500" />
      case 'low': return <MapPin className="h-3 w-3 text-green-500" />
      default: return <MapPin className="h-3 w-3 text-gray-500" />
    }
  }

  // SSE connection for real-time traffic updates to calculate risk
  const { isConnected, error } = useServerSentEvents(
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
          
          if (trafficData && trafficData.location_x && trafficData.location_y) {
            const riskLocation: RiskLocation = {
              id: trafficData.sensor_id || `sensor-${Date.now()}`,
              name: `${trafficData.intersection_id || trafficData.location_id}`,
              coordinates: {
                lat: trafficData.location_y,
                lng: trafficData.location_x
              },
              risk_score: calculateRiskFromTrafficData(trafficData),
              risk_level: getRiskLevel(calculateRiskFromTrafficData(trafficData)),
              last_updated: trafficData.timestamp,
              factors: generateRiskFactors(trafficData)
            }
            
            setHeatmapData(prev => {
              const existingIndex = prev.findIndex(item => item.id === riskLocation.id)
              if (existingIndex >= 0) {
                // Update existing location
                const updated = [...prev]
                updated[existingIndex] = riskLocation
                return updated
              } else {
                // Add new location (keep last 8 for mini view)
                return [riskLocation, ...prev.slice(0, 7)]
              }
            })
            
            setLastUpdate(trafficData.timestamp)
          }
        }
      }
    }
  )

  // Calculate overall area risk
  const overallRisk = heatmapData.length > 0 
    ? Math.round(heatmapData.reduce((sum, location) => sum + location.risk_score, 0) / heatmapData.length)
    : 0

  const overallLevel = getRiskLevel(overallRisk)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Risk Heatmap</CardTitle>
        <div className="flex items-center space-x-1">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <MapPin className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Risk Summary */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-bold">{overallRisk}</div>
            <div className="text-xs text-muted-foreground">Overall Risk</div>
          </div>
          <Badge variant="outline" className={getRiskColor(overallLevel)}>
            {overallLevel.toUpperCase()}
          </Badge>
        </div>

        {/* Risk Locations */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground">
            Risk Locations ({heatmapData.length})
          </div>
          
          {heatmapData.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              <MapPin className="h-6 w-6 mx-auto mb-1 opacity-50" />
              <p className="text-xs">No risk data available</p>
              <p className="text-xs">
                {isConnected ? 'Monitoring traffic...' : 'Connecting...'}
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {heatmapData.map((location) => (
                <div key={location.id} className="flex items-center justify-between p-2 rounded border">
                  <div className="flex items-center space-x-2 min-w-0">
                    {getRiskIcon(location.risk_level)}
                    <div className="min-w-0">
                      <div className="text-xs font-medium truncate">
                        {location.name}
                      </div>
                      {location.factors.length > 0 && (
                        <div className="text-xs text-muted-foreground truncate">
                          {location.factors[0]}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <div className="text-xs font-medium text-right">
                      {location.risk_score}
                    </div>
                    <Badge variant="outline" className={`text-xs ${getRiskColor(location.risk_level)}`}>
                      {location.risk_level.charAt(0).toUpperCase()}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Last Update */}
        {lastUpdate && (
          <div className="text-xs text-muted-foreground text-center pt-2 border-t">
            Last updated: {new Date(lastUpdate).toLocaleTimeString()}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 