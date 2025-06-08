'use client'

import React, { useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin, Radio, Activity, AlertTriangle } from 'lucide-react'
import { useSensorMap, useTrafficData } from '@/lib/api-client'
import type { SensorMapFeature, TrafficData } from '@/types/api'

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
)

const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
)

const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
)

const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
)

const CircleMarker = dynamic(
  () => import('react-leaflet').then((mod) => mod.CircleMarker),
  { ssr: false }
)

interface TrafficMapProps {
  className?: string
  height?: number
}

// Custom marker component for sensors
function SensorMarker({ sensor, trafficData }: { 
  sensor: SensorMapFeature
  trafficData?: { data: TrafficData[] }
}) {
  const { sensor_id, intersection_id, sensor_direction, last_seen } = sensor.properties
  
  // Find latest traffic data for this sensor
  const sensorTraffic = trafficData?.data?.find(
    (traffic: TrafficData) => traffic.sensor_id === sensor_id
  )

  const getMarkerColor = () => {
    if (!sensorTraffic) return '#gray'
    
    const density = sensorTraffic.density
    if (density < 30) return '#22c55e' // Green - low traffic
    if (density < 60) return '#f59e0b' // Yellow - medium traffic
    if (density < 80) return '#f97316' // Orange - high traffic
    return '#ef4444' // Red - very high traffic
  }

  const getStatusIcon = () => {
    const hoursSinceUpdate = Math.floor(
      (Date.now() - new Date(last_seen).getTime()) / (1000 * 60 * 60)
    )
    
    if (hoursSinceUpdate > 24) return <AlertTriangle className="h-3 w-3 text-red-500" />
    if (hoursSinceUpdate > 1) return <Radio className="h-3 w-3 text-yellow-500" />
    return <Radio className="h-3 w-3 text-green-500" />
  }

  return (
    <CircleMarker
      center={[sensor.geometry.coordinates[1], sensor.geometry.coordinates[0]]}
      radius={8}
      pathOptions={{
        color: getMarkerColor(),
        fillColor: getMarkerColor(),
        fillOpacity: 0.8,
        weight: 2,
      }}
    >
      <Popup>
        <div className="min-w-[200px] p-2">
          <div className="flex items-center gap-2 mb-2">
            {getStatusIcon()}
            <h3 className="font-semibold text-sm">{sensor_id}</h3>
          </div>
          
          {intersection_id && (
            <p className="text-xs text-gray-600 mb-1">
              Intersection: {intersection_id}
            </p>
          )}
          
          {sensor_direction && (
            <p className="text-xs text-gray-600 mb-1">
              Direction: {sensor_direction}
            </p>
          )}
          
          {sensorTraffic && (
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-xs">
                <span>Speed:</span>
                <span className="font-medium">{sensorTraffic.speed} km/h</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Density:</span>
                <span className="font-medium">{sensorTraffic.density}%</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Vehicles:</span>
                <span className="font-medium">{sensorTraffic.vehicle_number}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Congestion:</span>
                <Badge 
                  variant={sensorTraffic.congestion_level === 'low' ? 'default' : 
                          sensorTraffic.congestion_level === 'medium' ? 'secondary' : 'destructive'}
                  className="text-xs h-5"
                >
                  {sensorTraffic.congestion_level}
                </Badge>
              </div>
            </div>
          )}
          
          <p className="text-xs text-gray-500 mt-2">
            Last update: {new Date(last_seen).toLocaleTimeString()}
          </p>
        </div>
      </Popup>
    </CircleMarker>
  )
}

// Loading component for the map
function MapLoading() {
  return (
    <div className="h-full flex items-center justify-center bg-muted/20">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
        <p className="text-sm text-muted-foreground">Loading map...</p>
      </div>
    </div>
  )
}

// Error component for the map
function MapError({ error }: { error: string }) {
  return (
    <div className="h-full flex items-center justify-center bg-muted/20">
      <div className="text-center">
        <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button variant="outline" size="sm" className="mt-2" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    </div>
  )
}

export function TrafficMap({ className, height = 500 }: TrafficMapProps) {
  const { data: sensorMapData, isLoading: sensorsLoading, error: sensorsError } = useSensorMap()
  const { data: trafficData, isLoading: trafficLoading } = useTrafficData({ 
    limit: 100, 
    include_enhanced: true 
  })

  // Casablanca center coordinates
  const center: [number, number] = [33.5912, -7.6356]

  if (sensorsLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Traffic Map
          </CardTitle>
          <CardDescription>Interactive map showing sensor locations and traffic data</CardDescription>
        </CardHeader>
        <CardContent>
          <div style={{ height }}>
            <MapLoading />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (sensorsError) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Traffic Map
          </CardTitle>
          <CardDescription>Interactive map showing sensor locations and traffic data</CardDescription>
        </CardHeader>
        <CardContent>
          <div style={{ height }}>
            <MapError error="Failed to load sensor data" />
          </div>
        </CardContent>
      </Card>
    )
  }

  const sensors = sensorMapData?.features || []

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Traffic Map
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {sensors.length} sensors
            </Badge>
            {trafficLoading && (
              <Badge variant="secondary" className="text-xs">
                Updating...
              </Badge>
            )}
          </div>
        </CardTitle>
        <CardDescription>
          Interactive map showing sensor locations and real-time traffic data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div style={{ height }} className="rounded-lg overflow-hidden border">
          <MapContainer
            center={center}
            zoom={12}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {sensors.map((sensor: SensorMapFeature, index: number) => (
              <SensorMarker
                key={sensor.properties.sensor_id || index}
                sensor={sensor}
                trafficData={trafficData}
              />
            ))}
          </MapContainer>
        </div>
        
        {/* Map Legend */}
        <div className="mt-4 flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>Low traffic (&lt;30%)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span>Medium traffic (30-60%)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span>High traffic (60-80%)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span>Very high traffic (&gt;80%)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 