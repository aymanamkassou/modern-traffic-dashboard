'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useServerSentEvents } from '@/hooks/use-server-sent-events'
import { cn } from '@/lib/utils'

interface SSETestProps {
  endpoint: string
  name: string
}

function SSEStreamTest({ endpoint, name }: SSETestProps) {
  const [events, setEvents] = useState<any[]>([])
  const [isActive, setIsActive] = useState(false)
  
  const { isConnected, error: sseError, connect, disconnect } = useServerSentEvents(
    isActive ? `http://localhost:3001${endpoint}` : null,
    {
      autoConnect: false,
      maxEvents: 10,
      retryInterval: 3000,
      onEvent: (event) => {
        console.log(`[${name}] SSE Event:`, event)
        setEvents(prev => [{
          ...event,
          receivedAt: new Date().toLocaleTimeString()
        }, ...prev.slice(0, 4)]) // Keep last 5 events
      },
      onConnect: () => {
        console.log(`[${name}] Connected`)
      },
      onDisconnect: () => {
        console.log(`[${name}] Disconnected`)
      },
      onError: (err) => {
        console.error(`[${name}] Error:`, err)
      }
    }
  )
  
  const handleToggle = () => {
    if (isActive) {
      setIsActive(false)
      disconnect()
    } else {
      setIsActive(true)
      connect()
    }
  }
  
  return (
    <Card className={cn(
      "relative overflow-hidden transition-colors",
      isConnected && "border-green-500/50",
      sseError && "border-red-500/50"
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{name}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge 
              variant={isConnected ? "default" : sseError ? "destructive" : "secondary"}
              className="text-xs"
            >
              {isConnected ? "Connected" : sseError ? "Error" : "Disconnected"}
            </Badge>
            <Button
              size="sm"
              variant={isActive ? "destructive" : "default"}
              onClick={handleToggle}
              className="h-6 px-2 text-xs"
            >
              {isActive ? "Stop" : "Start"}
            </Button>
          </div>
        </div>
        <div className="text-xs text-muted-foreground font-mono">
          {endpoint}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">
            Events received: {events.length}
          </div>
          
          <ScrollArea className="h-32">
            <div className="space-y-1">
              {events.length === 0 ? (
                <div className="text-xs text-muted-foreground italic">
                  No events yet...
                </div>
              ) : (
                events.map((event, index) => (
                  <div key={index} className="text-xs p-2 bg-muted rounded border">
                    <div className="flex justify-between mb-1">
                      <span className="font-semibold">{event.type}</span>
                      <span className="text-muted-foreground">{event.receivedAt}</span>
                    </div>
                    <div className="font-mono text-xs text-muted-foreground overflow-hidden">
                      {JSON.stringify(event.data).slice(0, 100)}...
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  )
}

export function SSEDebugPanel() {
  const endpoints = [
    { endpoint: '/api/traffic/stream', name: 'Traffic Stream' },
    { endpoint: '/api/vehicles/stream', name: 'Vehicle Stream' },
    { endpoint: '/api/sensors/stream', name: 'Sensor Stream' },
    { endpoint: '/api/coordination/stream', name: 'Coordination Stream' }
  ]
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">SSE Stream Debug Panel</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {endpoints.map(({ endpoint, name }) => (
          <SSEStreamTest key={endpoint} endpoint={endpoint} name={name} />
        ))}
      </div>
    </div>
  )
} 