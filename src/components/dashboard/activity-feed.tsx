"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useServerSentEvents } from "@/hooks/use-server-sent-events"
import { 
  isAlertData, 
  isConnectionMessage,
  type AlertStreamData,
  type SSEEvent
} from "@/types/sse-events"
import { Activity, AlertTriangle, TrendingUp, Clock } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface ActivityEvent {
  id: string
  type: 'alert_critical' | 'traffic_spike' | 'sensor_fault' | 'system_update'
  title: string
  description: string
  timestamp: string
  severity: 'info' | 'warning' | 'critical'
  location?: string
  sensor_id?: string
}

export function RealTimeActivityFeed() {
  const [activities, setActivities] = useState<ActivityEvent[]>([])
  const [lastUpdate, setLastUpdate] = useState<string>('')

  // SSE connection for real-time updates
  const { isConnected, error } = useServerSentEvents(
    'http://localhost:3001/api/alerts/stream',
    {
      autoConnect: true,
      maxEvents: 50,
      retryInterval: 5000,
      onEvent: (event: SSEEvent) => {
        try {
          // Skip connection messages
          if (isConnectionMessage(event.data)) {
            return
          }
          
          // Process alert data
          if (event.type === 'message' && isAlertData(event.data)) {
            const alertData = event.data
            
            // Transform alert to activity event
            const activityEvent = transformAlertToActivity(alertData, event.timestamp || alertData.timestamp)
            
            if (activityEvent) {
              setActivities(prev => {
                // Add new activity and keep last 20
                const newActivities = [activityEvent, ...prev.slice(0, 19)]
                return newActivities
              })
              
              setLastUpdate(alertData.timestamp)
            }
          }
        } catch (err) {
          console.error('Error processing activity feed event:', err)
        }
      }
    }
  )

  // Transform alert data into activity event
  const transformAlertToActivity = (alertData: AlertStreamData, timestamp: string): ActivityEvent | null => {
    if (!alertData) return null
    
    const activityId = `alert-${alertData.sensor_id}-${Date.now()}`
    
    // Map alert types to activity types and descriptions
    let activityType: ActivityEvent['type'] = 'alert_critical'
    let title = 'Traffic Alert'
    let description = 'Traffic alert detected'
    let severity: ActivityEvent['severity'] = 'info'
    
    switch (alertData.type) {
      case 'traffic-queue':
        activityType = 'traffic_spike'
        title = 'Traffic Queue Detected'
        description = alertData.vehicle_data 
          ? `${alertData.vehicle_data.vehicle_class} detected in queue - Speed: ${alertData.vehicle_data.speed_kmh.toFixed(1)} km/h`
          : 'Traffic queue detected at sensor location'
        severity = 'warning'
        break
        
      case 'congestion':
        activityType = 'traffic_spike'
        title = 'High Congestion'
        description = 'Traffic congestion levels elevated'
        severity = 'warning'
        break
        
      case 'accident':
        activityType = 'alert_critical'
        title = 'Incident Alert'
        description = 'Traffic incident reported'
        severity = 'critical'
        break
        
      case 'sensor_fault':
        activityType = 'sensor_fault'
        title = 'Sensor Issue'
        description = 'Sensor hardware or connectivity issue'
        severity = 'critical'
        break
        
      default:
        activityType = 'alert_critical'
        title = `${alertData.type.charAt(0).toUpperCase()}${alertData.type.slice(1)} Alert`
        description = `${alertData.type} detected by sensor ${alertData.sensor_id}`
        severity = 'warning'
    }
    
    return {
      id: activityId,
      type: activityType,
      title,
      description,
      timestamp,
      severity,
      sensor_id: alertData.sensor_id,
      location: alertData.sensor_id ? `Sensor ${alertData.sensor_id}` : undefined
    }
  }

  const getActivityIcon = (type: ActivityEvent['type']) => {
    switch (type) {
      case 'alert_critical':
        return <AlertTriangle className="h-3 w-3 text-red-500" />
      case 'traffic_spike':
        return <TrendingUp className="h-3 w-3 text-orange-500" />
      case 'sensor_fault':
        return <AlertTriangle className="h-3 w-3 text-red-500" />
      case 'system_update':
        return <Activity className="h-3 w-3 text-blue-500" />
      default:
        return <Activity className="h-3 w-3 text-muted-foreground" />
    }
  }

  const getSeverityColor = (severity: ActivityEvent['severity']) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'warning':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'info':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm font-medium">Live Activity Feed</CardTitle>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <Activity className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Status Bar */}
          <div className="flex items-center justify-between text-xs text-muted-foreground pb-2 border-b">
            <span>{activities.length} recent activities</span>
            <div className="flex items-center space-x-1">
              <Clock className="h-3 w-3" />
              <span>
                {isConnected ? 'Live' : 'Disconnected'}
                {lastUpdate && ` • ${new Date(lastUpdate).toLocaleTimeString()}`}
              </span>
            </div>
          </div>

          {/* Activity List */}
          <ScrollArea className="h-80">
            <div className="space-y-3">
              {activities.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No recent activities</p>
                  <p className="text-xs">
                    {isConnected ? 'Monitoring for new events...' : 'Connecting to activity stream...'}
                  </p>
                </div>
              ) : (
                activities.map((activity, index) => (
                  <div key={activity.id} className="flex gap-3 pb-3 border-b border-border/50 last:border-0">
                    <div className="flex-shrink-0 mt-0.5">
                      {getActivityIcon(activity.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-medium leading-tight">
                          {activity.title}
                        </h4>
                        <Badge 
                          variant="outline" 
                          className={`text-xs shrink-0 ${getSeverityColor(activity.severity)}`}
                        >
                          {activity.severity}
                        </Badge>
                      </div>
                      
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {activity.description}
                      </p>
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          {activity.location && (
                            <span className="font-medium">{activity.location} • </span>
                          )}
                          {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                        </span>
                        
                        {index === 0 && isConnected && (
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                            New
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
          
          {/* Footer Info */}
          {activities.length > 0 && (
            <div className="text-xs text-muted-foreground text-center pt-2 border-t">
              Showing {activities.length} recent activities
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 