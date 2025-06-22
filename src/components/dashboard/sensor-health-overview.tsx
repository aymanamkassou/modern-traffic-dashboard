"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useServerSentEvents } from "@/hooks/use-server-sent-events"
import { 
  isConnectionMessage,
  type SensorStreamData,
  type SSEEvent,
  type StreamData
} from "@/types/sse-events"
import { Cpu, Thermometer, Battery, Clock, Activity, AlertTriangle, CheckCircle, XCircle } from "lucide-react"

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

  // Track unique sensors by sensor_id with their latest data
  const [uniqueSensors, setUniqueSensors] = useState<Map<string, SensorStreamData>>(new Map())
  const [lastUpdate, setLastUpdate] = useState<string>('')

  // Helper function to check if data is SensorStreamData
  const isSensorStreamData = (data: StreamData): data is SensorStreamData => {
    return data && 
           typeof data === 'object' && 
           'stream_type' in data && 
           data.stream_type === 'SENSOR' && 
           'sensor_id' in data && 
           'battery_level' in data &&
           'timestamp' in data
  }

  // SSE connection for real-time updates
  const { isConnected, error: sseError } = useServerSentEvents(
    'http://localhost:3001/api/sensors/stream',
    {
      autoConnect: true,
      maxEvents: 50,
      retryInterval: 3000,
      onEvent: (event: SSEEvent) => {
        try {
          // Skip connection messages
          if (isConnectionMessage(event.data)) {
            return
          }
          
          // Handle sensor data - check if it's the correct sensor stream data
          if (event.type === 'message' && isSensorStreamData(event.data)) {
            const sensorData = event.data
            
            // Update unique sensors map with latest data for this sensor_id
            setUniqueSensors(prev => {
              const newMap = new Map(prev)
              newMap.set(sensorData.sensor_id, sensorData)
              return newMap
            })
            
            // Update aggregated health data based on all unique sensors
            setUniqueSensors(currentSensors => {
              const updatedSensors = new Map(currentSensors)
              updatedSensors.set(sensorData.sensor_id, sensorData)
              
              setSensorHealthData(prev => {
                const newData = { ...prev }
                
                // Update timestamp
                newData.last_updated = sensorData.timestamp
                
                // Get all unique sensor data as array
                const allSensors = Array.from(updatedSensors.values())
                
                if (allSensors.length > 0) {
                  newData.average_battery = Math.round(
                    allSensors.reduce((sum, s) => sum + s.battery_level, 0) / allSensors.length
                  )
                  
                  newData.average_temperature = Math.round(
                    (allSensors.reduce((sum, s) => sum + s.temperature_c, 0) / allSensors.length) * 10
                  ) / 10
                  
                  // Calculate sensor health status based on unique sensors
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
              
              return updatedSensors
            })
            
            setLastUpdate(sensorData.timestamp)
          }
        } catch (err) {
          console.error('Error processing sensor health event:', err)
        }
      }
    }
  )

  const healthPercentage = sensorHealthData.total_sensors > 0 
    ? Math.round((sensorHealthData.healthy_sensors / sensorHealthData.total_sensors) * 100)
    : 0

  const getHealthStatus = () => {
    if (healthPercentage >= 90) return { 
      label: 'Excellent', 
      variant: 'default' as const, 
      className: 'bg-success/10 text-success border-success/20' 
    }
    if (healthPercentage >= 75) return { 
      label: 'Good', 
      variant: 'default' as const, 
      className: 'bg-primary/10 text-primary border-primary/20' 
    }
    if (healthPercentage >= 60) return { 
      label: 'Fair', 
      variant: 'default' as const, 
      className: 'bg-warning/10 text-warning border-warning/20' 
    }
    return { 
      label: 'Poor', 
      variant: 'destructive' as const, 
      className: 'bg-destructive/10 text-destructive border-destructive/20' 
    }
  }

  const healthStatus = getHealthStatus()

  return (
    <Card className="animate-fade-in-up transition-all duration-300 hover:shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
              <Cpu className="h-4 w-4 text-primary" />
            </div>
            Sensor Health Overview
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
              isConnected ? 'bg-success animate-pulse' : 'bg-destructive'
            }`} />
            <span className="text-xs text-muted-foreground">
              {isConnected ? 'Live' : 'Offline'}
            </span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {sensorHealthData.total_sensors > 0 ? (
          <>
            {/* Overall Health Status */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-foreground">System Health</h3>
                <Badge className={healthStatus.className}>
                  {healthStatus.label}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <Progress 
                  value={healthPercentage} 
                  className="h-3 transition-all duration-500" 
                />
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span>{sensorHealthData.healthy_sensors} of {sensorHealthData.total_sensors} sensors healthy</span>
                  <span className="font-medium">{healthPercentage}%</span>
                </div>
              </div>
            </div>

            {/* Status Breakdown */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-foreground">Status Distribution</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-success/5 border border-success/10 transition-all duration-200 hover:bg-success/10">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span className="text-sm text-success font-medium">Healthy</span>
                  </div>
                  <span className="text-sm font-semibold text-success">{sensorHealthData.healthy_sensors}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-warning/5 border border-warning/10 transition-all duration-200 hover:bg-warning/10">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                    <span className="text-sm text-warning font-medium">Warning</span>
                  </div>
                  <span className="text-sm font-semibold text-warning">{sensorHealthData.warning_sensors}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-destructive/5 border border-destructive/10 transition-all duration-200 hover:bg-destructive/10">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-destructive" />
                    <span className="text-sm text-destructive font-medium">Critical</span>
                  </div>
                  <span className="text-sm font-semibold text-destructive">{sensorHealthData.critical_sensors}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-muted/20 transition-all duration-200 hover:bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground font-medium">Faults</span>
                  </div>
                  <span className="text-sm font-semibold text-muted-foreground">{sensorHealthData.recent_faults}</span>
                </div>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-foreground">Key Metrics</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border/50 transition-all duration-200 hover:border-border">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                    <Battery className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Average Battery</p>
                    <p className="text-sm font-semibold text-foreground">{sensorHealthData.average_battery}%</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border/50 transition-all duration-200 hover:border-border">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-orange-500/10">
                    <Thermometer className="h-4 w-4 text-orange-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Average Temp</p>
                    <p className="text-sm font-semibold text-foreground">{sensorHealthData.average_temperature}°C</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Uptime */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-muted/30">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Average Uptime</span>
              </div>
              <span className="text-sm font-semibold text-foreground">{sensorHealthData.uptime_hours}h</span>
            </div>

            {/* Last Update */}
            {lastUpdate && (
              <div className="pt-2 border-t border-border/50">
                <p className="text-xs text-muted-foreground text-center">
                  Last updated: {new Date(lastUpdate).toLocaleTimeString()}
                </p>
              </div>
            )}
          </>
        ) : (
          /* Enhanced Empty State */
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center">
              <Cpu className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold text-foreground">No Sensor Data Available</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                {isConnected 
                  ? 'Waiting for sensor updates from the monitoring system...' 
                  : 'Connecting to sensor monitoring stream...'
                }
              </p>
              {sseError && (
                <p className="text-xs text-destructive mt-2">
                  Connection Error: {sseError}
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 