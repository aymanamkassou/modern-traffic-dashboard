"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { useServerSentEvents } from "@/hooks/use-server-sent-events"
import { 
  isConnectionMessage,
  type AlertStreamData,
  type SSEEvent,
  type StreamData
} from "@/types/sse-events"
import { 
  Activity, 
  AlertTriangle, 
  TrendingUp, 
  Clock, 
  MapPin, 
  Zap,
  Shield,
  Signal,
  Eye,
  Wifi,
  WifiOff,
  Filter
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"
import { useNotifications } from "@/contexts/notification-context"

interface ActivityEvent {
  id: string
  type: 'alert_critical' | 'traffic_spike' | 'sensor_fault' | 'system_update'
  title: string
  description: string
  timestamp: string
  severity: 'info' | 'warning' | 'critical'
  location?: string
  sensor_id?: string
  impact?: 'low' | 'medium' | 'high'
  duration?: number
}

interface ActivityStats {
  total: number
  critical: number
  warning: number
  info: number
  lastHour: number
  mostActiveSensor: string
  averageResponseTime: number
}

export function RealTimeActivityFeed() {
  const [activities, setActivities] = useState<ActivityEvent[]>([])
  const [lastUpdate, setLastUpdate] = useState<string>('')
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all')
  const { showToast } = useNotifications()

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

  // Calculate activity statistics
  const stats: ActivityStats = useMemo(() => {
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    
    const lastHourActivities = activities.filter(
      activity => new Date(activity.timestamp) > oneHourAgo
    )
    
    const sensorCounts = activities.reduce((acc, activity) => {
      if (activity.sensor_id) {
        acc[activity.sensor_id] = (acc[activity.sensor_id] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)
    
    const mostActiveSensor = Object.entries(sensorCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'

    return {
      total: activities.length,
      critical: activities.filter(a => a.severity === 'critical').length,
      warning: activities.filter(a => a.severity === 'warning').length,
      info: activities.filter(a => a.severity === 'info').length,
      lastHour: lastHourActivities.length,
      mostActiveSensor,
      averageResponseTime: 1.2 // Mock data - could be calculated from actual response times
    }
  }, [activities])

  // Filter activities based on selected filter
  const filteredActivities = useMemo(() => {
    if (filter === 'all') return activities
    return activities.filter(activity => activity.severity === filter)
  }, [activities, filter])

  // SSE connection for real-time updates
  const { isConnected, error } = useServerSentEvents(
    'http://localhost:3001/api/alerts/stream',
    {
      autoConnect: true,
      maxEvents: 100,
      retryInterval: 5000,
      onEvent: (event: SSEEvent) => {
        try {
          // Skip connection messages
          if (isConnectionMessage(event.data)) {
            console.log('Alert stream connected:', event.data.message)
            return
          }
          
          // Process alert data - check if it's the correct alert stream data
          if ((event.type === 'message' || event.type === 'traffic-queue' || event.type === 'wrong-way-driver' || event.type === 'congestion' || event.type === 'accident' || event.type === 'sensor_fault') && isAlertStreamData(event.data)) {
            const alertData = event.data
            console.log('✅ Processing valid alert data:', alertData)
            
            // Transform alert to activity event
            const activityEvent = transformAlertToActivity(alertData, event.timestamp || alertData.timestamp)
            
            if (activityEvent) {
              console.log('🎯 Created activity event:', activityEvent)
              setActivities(prev => {
                // Add new activity and keep last 50
                const newActivities = [activityEvent, ...prev.slice(0, 49)]
                return newActivities
              })
              
              setLastUpdate(alertData.timestamp)
              
              // Show toast notification based on user preferences
              // Always show toasts for wrong-way drivers (critical safety issue)
              const isWrongWayDriver = alertData.type === 'wrong-way-driver'
              const shouldShowToast = activityEvent.severity === 'critical' || isWrongWayDriver
              
              if (shouldShowToast) {
                showToast({
                  type: activityEvent.severity as 'critical' | 'warning' | 'info',
                  title: activityEvent.title,
                  message: activityEvent.description,
                  source: `Sensor ${alertData.sensor_id}`,
                  persistent: isWrongWayDriver, // Wrong-way driver alerts are persistent
                  action: {
                    label: 'View Details',
                    onClick: () => {
                      // Could navigate to sensor details or show more info
                      console.log('Navigate to sensor details:', alertData.sensor_id)
                    }
                  }
                }, isWrongWayDriver) // Force show for wrong-way drivers
              }
            }
          } else {
            console.log('❌ Received non-alert event:', event.type, event.data)
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
    let impact: ActivityEvent['impact'] = 'low'
    
    switch (alertData.type) {
      case 'traffic-queue':
        activityType = 'traffic_spike'
        title = 'Traffic Queue Detected'
        description = alertData.vehicle_data 
          ? `${alertData.vehicle_data.vehicle_class} detected in queue - Speed: ${alertData.vehicle_data.speed_kmh.toFixed(1)} km/h`
          : 'Traffic queue detected at sensor location'
        severity = 'warning'
        impact = 'medium'
        break
        
      case 'congestion':
        activityType = 'traffic_spike'
        title = 'High Congestion'
        description = 'Traffic congestion levels elevated'
        severity = 'warning'
        impact = 'high'
        break
        
      case 'accident':
        activityType = 'alert_critical'
        title = 'Incident Alert'
        description = 'Traffic incident reported'
        severity = 'critical'
        impact = 'high'
        break
        
      case 'sensor_fault':
        activityType = 'sensor_fault'
        title = 'Sensor Issue'
        description = 'Sensor hardware or connectivity issue'
        severity = 'critical'
        impact = 'medium'
        break
        
      case 'wrong-way-driver':
        activityType = 'alert_critical'
        title = 'Wrong-Way Driver Alert'
        description = 'Critical safety alert: Vehicle detected traveling in wrong direction'
        severity = 'critical'
        impact = 'high'
        break
        
      default:
        activityType = 'alert_critical'
        title = `${alertData.type.charAt(0).toUpperCase()}${alertData.type.slice(1)} Alert`
        description = `${alertData.type} detected by sensor ${alertData.sensor_id}`
        severity = 'warning'
        impact = 'low'
    }
    
    return {
      id: activityId,
      type: activityType,
      title,
      description,
      timestamp,
      severity,
      sensor_id: alertData.sensor_id,
      location: alertData.sensor_id ? `Sensor ${alertData.sensor_id}` : undefined,
      impact,
      duration: Math.floor(Math.random() * 300) + 60 // Mock duration in seconds
    }
  }

  const getActivityIcon = (type: ActivityEvent['type']) => {
    switch (type) {
      case 'alert_critical':
        return AlertTriangle
      case 'traffic_spike':
        return TrendingUp
      case 'sensor_fault':
        return Shield
      case 'system_update':
        return Activity
      default:
        return Activity
    }
  }

  const getSeverityConfig = (severity: ActivityEvent['severity']) => {
    switch (severity) {
      case 'critical':
        return {
          color: 'text-red-600',
          bg: 'bg-red-50 dark:bg-red-950/20',
          border: 'border-red-200 dark:border-red-800',
          iconBg: 'bg-red-100 dark:bg-red-900/30',
          badge: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300'
        }
      case 'warning':
        return {
          color: 'text-orange-600',
          bg: 'bg-orange-50 dark:bg-orange-950/20',
          border: 'border-orange-200 dark:border-orange-800',
          iconBg: 'bg-orange-100 dark:bg-orange-900/30',
          badge: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300'
        }
      case 'info':
        return {
          color: 'text-blue-600',
          bg: 'bg-blue-50 dark:bg-blue-950/20',
          border: 'border-blue-200 dark:border-blue-800',
          iconBg: 'bg-blue-100 dark:bg-blue-900/30',
          badge: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300'
        }
      default:
        return {
          color: 'text-gray-600',
          bg: 'bg-gray-50 dark:bg-gray-950/20',
          border: 'border-gray-200 dark:border-gray-800',
          iconBg: 'bg-gray-100 dark:bg-gray-900/30',
          badge: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/30 dark:text-gray-300'
        }
    }
  }

  const getImpactIcon = (impact?: ActivityEvent['impact']) => {
    switch (impact) {
      case 'high':
        return <Zap className="h-3 w-3 text-red-500" />
      case 'medium':
        return <Signal className="h-3 w-3 text-orange-500" />
      case 'low':
        return <Eye className="h-3 w-3 text-blue-500" />
      default:
        return null
    }
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg font-semibold">Live Activity Feed</CardTitle>
            <div className="flex items-center gap-1">
              {isConnected ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-500" />
              )}
              <div className={cn(
                "w-2 h-2 rounded-full",
                isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
              )} />
            </div>
          </div>
          <Badge variant="outline" className="text-xs">
            {isConnected ? 'Live' : 'Offline'}
          </Badge>
        </div>
        
        {/* Activity Statistics - Simplified */}
        <div className="grid grid-cols-4 gap-4 mt-4">
          <div className="text-center">
            <div className="text-lg font-semibold font-mono">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-red-600 font-mono">{stats.critical}</div>
            <div className="text-xs text-muted-foreground">Critical</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-orange-600 font-mono">{stats.warning}</div>
            <div className="text-xs text-muted-foreground">Warning</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-blue-600 font-mono">{stats.lastHour}</div>
            <div className="text-xs text-muted-foreground">Last Hour</div>
          </div>
        </div>

        {/* Filter Controls - Simplified */}
        <div className="flex gap-2 mt-4">
          {(['all', 'critical', 'warning', 'info'] as const).map((filterType) => (
            <Button
              key={filterType}
              variant={filter === filterType ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(filterType)}
              className="text-xs capitalize flex-1"
            >
              {filterType}
              {filterType !== 'all' && (
                <span className="ml-1 font-mono">
                  {filterType === 'critical' ? stats.critical : 
                   filterType === 'warning' ? stats.warning : stats.info}
                </span>
              )}
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Status Information - Simplified */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pb-4 border-b">
          <span className="font-mono">{filteredActivities.length} events</span>
          <span className="font-mono">
            {lastUpdate ? `Updated ${formatDistanceToNow(new Date(lastUpdate), { addSuffix: true })}` : 'No recent updates'}
          </span>
        </div>

        {/* Activity List - Redesigned */}
        <ScrollArea className="h-[500px] mt-4">
          <div className="space-y-3">
            {filteredActivities.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="font-medium mb-2">No activities found</h3>
                <p className="text-sm">
                  {filter === 'all' 
                    ? (isConnected ? 'Monitoring for new events...' : 'Connecting to activity stream...') 
                    : `No ${filter} activities to display`}
                </p>
                {error && (
                  <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                    <p className="text-xs text-red-600 dark:text-red-400">
                      Connection Error: {error}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              filteredActivities.map((activity, index) => {
                const config = getSeverityConfig(activity.severity)
                const IconComponent = getActivityIcon(activity.type)
                
                return (
                  <div 
                    key={activity.id} 
                    className={cn(
                      "p-4 rounded-lg border transition-all duration-200 hover:shadow-sm",
                      config.bg,
                      config.border
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon - Properly centered */}
                      <div className={cn(
                        "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center",
                        config.iconBg
                      )}>
                        <IconComponent className={cn("h-4 w-4", config.color)} />
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className="font-medium text-sm leading-tight">
                            {activity.title}
                          </h4>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {activity.impact && getImpactIcon(activity.impact)}
                            <Badge 
                              variant="outline" 
                              className={cn("text-xs", config.badge)}
                            >
                              {activity.severity}
                            </Badge>
                            {index === 0 && isConnected && (
                              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700">
                                New
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                          {activity.description}
                        </p>
                        
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-3 text-muted-foreground">
                            {activity.location && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                <span className="font-mono">{activity.location}</span>
                              </div>
                            )}
                            {activity.duration && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span className="font-mono">{Math.floor(activity.duration / 60)}m {activity.duration % 60}s</span>
                              </div>
                            )}
                          </div>
                          
                          <span className="text-muted-foreground font-mono">
                            {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </ScrollArea>
        
        {/* Footer Summary - Simplified */}
        {filteredActivities.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-mono">
                Showing {filteredActivities.length} of {stats.total} total events
              </span>
              <div className="flex items-center gap-1">
                <Activity className="h-3 w-3" />
                <span className="font-mono">Avg response: {stats.averageResponseTime}s</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 