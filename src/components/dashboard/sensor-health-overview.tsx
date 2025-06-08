"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useServerSentEvents } from "@/hooks/use-server-sent-events"
import { 
  isSensorData, 
  isConnectionMessage,
  type SensorStreamData,
  type SSEEvent
} from "@/types/sse-events"
import { Cpu, Thermometer, Battery, Clock } from "lucide-react"

interface SensorHealthData {
  healthy_sensors: number
  warning_sensors: number
  critical_sensors: number
  offline_sensors: number
  total_sensors: number
  average_battery: number
  average_temperature: number
  last_updated: string
  recent_faults: number
  uptime_hours: number
}

export function SensorHealthOverview() {
  const [sensorHealthData, setSensorHealthData] = useState<SensorHealthData>({
    healthy_sensors: 0,
    warning_sensors: 0,
    critical_sensors: 0,
    offline_sensors: 0,
    total_sensors: 0,
    average_battery: 0,
    average_temperature: 0,
    last_updated: '',
    recent_faults: 0,
    uptime_hours: 0
  })

  const [recentSensorUpdates, setRecentSensorUpdates] = useState<SensorStreamData[]>([])
  const [lastUpdate, setLastUpdate] = useState<string>('')

  // SSE connection for real-time updates
  const { isConnected, error: sseError } = useServerSentEvents(
    'http://localhost:3001/api/sensors/stream',
    {
      autoConnect: true,
      maxEvents: 50,
      retryInterval: 3000,
      onEvent: (event: SSEEvent) => {
        // Skip connection messages
        if (isConnectionMessage(event.data)) {
          return
        }
        
        // Handle sensor data
        if (event.type === 'message' && isSensorData(event.data)) {
          const sensorData = event.data
          
          // Add to recent updates (keep last 20)
          setRecentSensorUpdates(prev => [sensorData, ...prev.slice(0, 19)])
          
          // Update aggregated health data
          setSensorHealthData(prev => {
            const newData = { ...prev }
            
            // Update timestamp
            newData.last_updated = sensorData.timestamp
            
            // Recalculate averages from recent sensor updates
            const allSensors = [sensorData, ...recentSensorUpdates.slice(0, 19)]
            
            if (allSensors.length > 0) {
              newData.average_battery = Math.round(
                allSensors.reduce((sum, s) => sum + s.battery_level, 0) / allSensors.length
              )
              
              newData.average_temperature = Math.round(
                (allSensors.reduce((sum, s) => sum + s.temperature_c, 0) / allSensors.length) * 10
              ) / 10
              
              // Calculate sensor health status
              const healthyCount = allSensors.filter(s => 
                s.battery_level > 70 && !s.hw_fault && !s.low_voltage
              ).length
              
              const warningCount = allSensors.filter(s => 
                (s.battery_level <= 70 && s.battery_level > 30) || s.low_voltage
              ).length
              
              const criticalCount = allSensors.filter(s => 
                s.battery_level <= 30 || s.hw_fault
              ).length
              
              newData.healthy_sensors = healthyCount
              newData.warning_sensors = warningCount
              newData.critical_sensors = criticalCount
              newData.total_sensors = allSensors.length
              
              // Count recent faults
              newData.recent_faults = allSensors.filter(s => s.hw_fault || s.low_voltage).length
              
              // Average uptime in hours
              newData.uptime_hours = Math.round(
                (allSensors.reduce((sum, s) => sum + s.uptime_s, 0) / allSensors.length) / 3600 * 10
              ) / 10
            }
            
            return newData
          })
          
          setLastUpdate(sensorData.timestamp)
        }
      }
    }
  )

  const healthPercentage = sensorHealthData.total_sensors > 0 
    ? Math.round((sensorHealthData.healthy_sensors / sensorHealthData.total_sensors) * 100)
    : 0

  const getHealthStatus = () => {
    if (healthPercentage >= 90) return { label: 'Excellent', color: 'text-green-600', bg: 'bg-green-100' }
    if (healthPercentage >= 75) return { label: 'Good', color: 'text-blue-600', bg: 'bg-blue-100' }
    if (healthPercentage >= 60) return { label: 'Fair', color: 'text-yellow-600', bg: 'bg-yellow-100' }
    return { label: 'Poor', color: 'text-red-600', bg: 'bg-red-100' }
  }

  const healthStatus = getHealthStatus()

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Sensor Health Overview</CardTitle>
        <div className="flex items-center space-x-1">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <Cpu className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Health */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">System Health</span>
            <Badge variant="secondary" className={`${healthStatus.bg} ${healthStatus.color}`}>
              {healthStatus.label}
            </Badge>
          </div>
          <Progress value={healthPercentage} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>{sensorHealthData.healthy_sensors} / {sensorHealthData.total_sensors} sensors healthy</span>
            <span>{healthPercentage}%</span>
          </div>
        </div>

        {/* Sensor Status Breakdown */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-green-600">Healthy</span>
            <span className="font-medium">{sensorHealthData.healthy_sensors}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-yellow-600">Warning</span>
            <span className="font-medium">{sensorHealthData.warning_sensors}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-red-600">Critical</span>
            <span className="font-medium">{sensorHealthData.critical_sensors}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Recent Faults</span>
            <span className="font-medium">{sensorHealthData.recent_faults}</span>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
          <div className="flex items-center space-x-2">
            <Battery className="h-3 w-3 text-muted-foreground" />
            <div>
              <div className="text-xs text-muted-foreground">Avg Battery</div>
              <div className="text-sm font-medium">{sensorHealthData.average_battery}%</div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Thermometer className="h-3 w-3 text-muted-foreground" />
            <div>
              <div className="text-xs text-muted-foreground">Avg Temp</div>
              <div className="text-sm font-medium">{sensorHealthData.average_temperature}°C</div>
            </div>
          </div>
        </div>

        {/* Uptime */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Avg Uptime</span>
          </div>
          <span className="text-sm font-medium">{sensorHealthData.uptime_hours}h</span>
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