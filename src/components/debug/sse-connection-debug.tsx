'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, Wifi, WifiOff, AlertCircle, CheckCircle } from 'lucide-react'
import { sseManager } from '@/lib/sse-connection-manager'

interface ConnectionStatus {
  activeConnections: number
  totalSubscribers: number
  connections: Array<{
    url: string
    subscribers: number
    state: number
    lastActivity: string
    retryCount: number
  }>
}

export function SSEConnectionDebug() {
  const [status, setStatus] = useState<ConnectionStatus | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  const refreshStatus = () => {
    if (typeof window !== 'undefined') {
      const connectionStatus = sseManager.getConnectionStatus()
      setStatus(connectionStatus)
    }
  }

  useEffect(() => {
    refreshStatus()
    const interval = setInterval(refreshStatus, 2000) // Update every 2 seconds
    return () => clearInterval(interval)
  }, [])

  const getStateLabel = (state: number) => {
    switch (state) {
      case 0: return { label: 'CONNECTING', color: 'bg-yellow-500' }
      case 1: return { label: 'OPEN', color: 'bg-green-500' }
      case 2: return { label: 'CLOSED', color: 'bg-red-500' }
      default: return { label: 'UNKNOWN', color: 'bg-gray-500' }
    }
  }

  const getStateIcon = (state: number) => {
    switch (state) {
      case 0: return <RefreshCw className="h-3 w-3 animate-spin" />
      case 1: return <CheckCircle className="h-3 w-3" />
      case 2: return <AlertCircle className="h-3 w-3" />
      default: return <WifiOff className="h-3 w-3" />
    }
  }

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsVisible(true)}
          variant="outline"
          size="sm"
          className="bg-background/80 backdrop-blur-sm"
        >
          <Wifi className="h-4 w-4 mr-2" />
          SSE Debug
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96">
      <Card className="bg-background/95 backdrop-blur-sm border-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">SSE Connection Monitor</CardTitle>
            <div className="flex items-center gap-2">
              <Button onClick={refreshStatus} variant="ghost" size="sm">
                <RefreshCw className="h-3 w-3" />
              </Button>
              <Button onClick={() => setIsVisible(false)} variant="ghost" size="sm">
                ×
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <div className="text-muted-foreground">Active Connections</div>
              <div className="font-mono text-lg">{status?.activeConnections || 0}</div>
            </div>
            <div className="space-y-1">
              <div className="text-muted-foreground">Total Subscribers</div>
              <div className="font-mono text-lg">{status?.totalSubscribers || 0}</div>
            </div>
          </div>

          {/* Connection Details */}
          <div className="space-y-2">
            <div className="text-sm font-medium">Connections</div>
            {status?.connections && status.connections.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {status.connections.map((conn, index) => {
                  const stateInfo = getStateLabel(conn.state)
                  return (
                    <div key={index} className="p-2 border rounded-md space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-mono truncate flex-1 mr-2">
                          {conn.url.replace('http://localhost:3001', '')}
                        </div>
                        <div className="flex items-center gap-1">
                          {getStateIcon(conn.state)}
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${stateInfo.color} text-white border-0`}
                          >
                            {stateInfo.label}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                        <div>
                          <div>Subscribers</div>
                          <div className="font-mono">{conn.subscribers}</div>
                        </div>
                        <div>
                          <div>Retries</div>
                          <div className="font-mono">{conn.retryCount}</div>
                        </div>
                        <div>
                          <div>Last Activity</div>
                          <div className="font-mono">
                            {new Date(conn.lastActivity).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground text-center py-4">
                No active connections
              </div>
            )}
          </div>

          {/* Debug Actions */}
          <div className="pt-2 border-t">
            <div className="text-xs text-muted-foreground">
              Debug: Open browser console for detailed SSE logs
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 