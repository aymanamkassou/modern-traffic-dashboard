'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { useVehicleData } from '@/lib/api-client'
import { useServerSentEvents, SSEEvent } from '@/hooks/use-server-sent-events'
import { AnimatedList } from '@/components/ui/animated-list'
import { 
  Car, 
  Truck, 
  Bus, 
  Bike,
  Filter,
  Search,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  Gauge,
  Ruler,
  Wifi,
  WifiOff,
  Play,
  Pause,
  Activity
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { VehicleRecord } from '@/types/api'

// Vehicle class icons mapping
const vehicleIcons = {
  passenger_car: Car,
  suv: Car,
  pickup_truck: Truck,
  motorcycle: Bike,
  bus: Bus,
  semi_truck: Truck,
  delivery_van: Truck,
} as const

// Helper function to detect vehicle data
const isVehicleData = (data: any): boolean => {
  return data && (
    data.vehicle_id !== undefined || 
    data.id !== undefined ||
    data.vehicle_class !== undefined || 
    (data.speed_kmh !== undefined && data.length_dm !== undefined)
  )
}

// Vehicle data type for SSE
interface VehicleStreamData {
  id: string
  sensor_id: string
  timestamp: string
  vehicle_class: string
  speed_kmh: number
  length_dm: number
  location_id?: string
  intersection_id?: string
  sensor_direction?: string
  status?: number
  decoded_status?: {
    hardware_fault: boolean
    low_voltage: boolean
    wrong_way_driver: boolean
    queue_detected: boolean
  }
}

// Connection Status Badge
function ConnectionBadge({ isConnected, isPaused }: { isConnected: boolean; isPaused: boolean }) {
  if (isPaused) {
    return (
      <Badge variant="secondary" className="text-xs">
        <Pause className="h-3 w-3 mr-1" />
        Paused
      </Badge>
    )
  }
  
  return (
    <Badge 
      variant={isConnected ? "default" : "secondary"} 
      className={cn(
        "text-xs transition-all duration-300",
        isConnected && "animate-pulse"
      )}
    >
      {isConnected ? (
        <>
          <Wifi className="h-3 w-3 mr-1" />
          Live
        </>
      ) : (
        <>
          <WifiOff className="h-3 w-3 mr-1" />
          Offline
        </>
      )}
    </Badge>
  )
}

// Status Badge Component
function StatusBadge({ status }: { status: any }) {
  if (!status) return null

  const badges = []
  
  if (status.hardware_fault) {
    badges.push(
      <Badge key="hw" variant="destructive" className="text-xs">
        HW Fault
      </Badge>
    )
  }
  
  if (status.low_voltage) {
    badges.push(
      <Badge key="lv" variant="destructive" className="text-xs">
        Low Voltage
      </Badge>
    )
  }
  
  if (status.wrong_way_driver) {
    badges.push(
      <Badge key="ww" variant="destructive" className="text-xs">
        <AlertTriangle className="h-3 w-3 mr-1" />
        Wrong Way
      </Badge>
    )
  }
  
  if (status.queue_detected) {
    badges.push(
      <Badge key="q" variant="secondary" className="text-xs">
        Queue
      </Badge>
    )
  }
  
  if (badges.length === 0) {
    badges.push(
      <Badge key="ok" variant="outline" className="text-xs">
        <CheckCircle className="h-3 w-3 mr-1" />
        Normal
      </Badge>
    )
  }
  
  return <div className="flex flex-wrap gap-1">{badges}</div>
}

// Vehicle Row Component
function VehicleRow({ 
  vehicle, 
  isNew,
  index 
}: { 
  vehicle: VehicleRecord | VehicleStreamData
  isNew?: boolean
  index: number
}) {
  const Icon = vehicleIcons[vehicle.vehicle_class as keyof typeof vehicleIcons] || Car
  
  // Normalize vehicle data
  const vehicleData = {
    id: 'vehicle_id' in vehicle ? vehicle.vehicle_id : vehicle.id,
    sensor_id: vehicle.sensor_id,
    timestamp: vehicle.timestamp,
    vehicle_class: vehicle.vehicle_class,
    speed: 'speed_kmh' in vehicle ? vehicle.speed_kmh : 0,
    length: 'length_dm' in vehicle ? vehicle.length_dm : 0,
    location_id: 'location_id' in vehicle ? vehicle.location_id : '',
    intersection_id: 'intersection_id' in vehicle ? vehicle.intersection_id : undefined,
    sensor_direction: 'sensor_direction' in vehicle ? vehicle.sensor_direction : undefined,
    decoded_status: 'decoded_status' in vehicle ? vehicle.decoded_status : vehicle.decoded_status || {
      hardware_fault: false,
      low_voltage: false,
      wrong_way_driver: false,
      queue_detected: false,
    }
  }

  return (
    <TableRow 
      className={cn(
        "transition-all duration-500 hover:bg-muted/50",
        isNew && "bg-green-50 dark:bg-green-950/20 animate-pulse",
        "animate-fade-in-up"
      )}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <TableCell className="font-mono text-xs">
        {vehicleData.id.slice(-8)}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <div className={cn(
            "p-1 rounded",
            isNew && "bg-primary/10"
          )}>
            <Icon className="h-4 w-4" />
          </div>
          <span className="text-sm font-medium capitalize">
            {vehicleData.vehicle_class.replace(/_/g, ' ')}
          </span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Gauge className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm font-mono">{vehicleData.speed.toFixed(1)} km/h</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Ruler className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm font-mono">{vehicleData.length} dm</span>
        </div>
      </TableCell>
      <TableCell className="font-mono text-xs text-muted-foreground">
        {vehicleData.sensor_id}
      </TableCell>
      <TableCell>
        {vehicleData.intersection_id && (
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs truncate max-w-[120px]" title={vehicleData.intersection_id}>
              {vehicleData.intersection_id}
            </span>
          </div>
        )}
      </TableCell>
      <TableCell>
        {vehicleData.sensor_direction && (
          <Badge variant="outline" className="text-xs font-medium">
            {vehicleData.sensor_direction.toUpperCase()}
          </Badge>
        )}
      </TableCell>
      <TableCell>
        <StatusBadge status={vehicleData.decoded_status} />
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {new Date(vehicleData.timestamp).toLocaleTimeString()}
        </div>
      </TableCell>
    </TableRow>
  )
}

// Loading skeleton for table
function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: 9 }).map((_, j) => (
            <TableCell key={j}>
              <Skeleton className="h-4 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )
}

// Main Live Vehicle Log Component
export function LiveVehicleLog() {
  const [searchTerm, setSearchTerm] = useState('')
  const [vehicleClassFilter, setVehicleClassFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [intersectionFilter, setIntersectionFilter] = useState<string>('all')
  const [isLiveMode, setIsLiveMode] = useState(true)
  const [liveVehicles, setLiveVehicles] = useState<VehicleStreamData[]>([])
  const [newVehicleIds, setNewVehicleIds] = useState<Set<string>>(new Set())

  // Fetch initial vehicle data
  const { data: vehicleData, isLoading, error, refetch } = useVehicleData({
    limit: 50,
    page: 1
  })

  // SSE connection for real-time updates
  const { 
    isConnected, 
    error: sseError,
    events
  } = useServerSentEvents(
    isLiveMode 
      ? process.env.NEXT_PUBLIC_API_BASE_URL 
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/vehicles/stream`
        : 'http://localhost:3001/api/vehicles/stream'
      : null,
    {
      autoConnect: true,
      maxEvents: 100,
      onEvent: (event: SSEEvent) => {
        // Handle both typed events and generic 'message' events
        if (event.type === 'VEHICLE' || (event.type === 'message' && isVehicleData(event.data))) {
          console.log('🚗 Live vehicle detected:', event.data)
          
          const vehicleStreamData: VehicleStreamData = {
            id: event.data.vehicle_id || event.data.id || `vehicle-${Date.now()}`,
            sensor_id: event.data.sensor_id,
            timestamp: event.data.timestamp,
            vehicle_class: event.data.vehicle_class,
            speed_kmh: event.data.speed_kmh,
            length_dm: event.data.length_dm,
            location_id: event.data.location_id,
            intersection_id: event.data.intersection_id,
            sensor_direction: event.data.sensor_direction,
            status: event.data.status,
            decoded_status: event.data.decoded_status
          }
          
          setLiveVehicles(prev => {
            const newVehicles = [vehicleStreamData, ...prev.slice(0, 49)]
            return newVehicles
          })

          // Mark as new for animation
          const vehicleId = vehicleStreamData.id
          setNewVehicleIds(prev => new Set(prev).add(vehicleId))
          
          // Remove new status after animation
          setTimeout(() => {
            setNewVehicleIds(prev => {
              const newSet = new Set(prev)
              newSet.delete(vehicleId)
              return newSet
            })
          }, 3000)
        }
      }
    }
  )

  // Combine API data and live data
  const allVehicles = useMemo(() => {
    const apiVehicles = Array.isArray(vehicleData) ? vehicleData : (vehicleData?.data || [])
    
    if (isLiveMode && liveVehicles.length > 0) {
      // Convert live vehicles to match API format
      const convertedLiveVehicles = liveVehicles.map((lv: VehicleStreamData) => ({
        _id: lv.id,
        vehicle_id: lv.id,
        sensor_id: lv.sensor_id,
        timestamp: lv.timestamp,
        location_id: lv.location_id || '',
        location_x: 0,
        location_y: 0,
        vehicle_class: lv.vehicle_class,
        length_dm: lv.length_dm,
        speed_kmh: lv.speed_kmh,
        status: lv.status || 0,
        intersection_id: lv.intersection_id,
        sensor_direction: lv.sensor_direction,
        decoded_status: lv.decoded_status || {
          hardware_fault: false,
          low_voltage: false,
          wrong_way_driver: false,
          queue_detected: false,
        }
      }))
      
      return [...convertedLiveVehicles, ...apiVehicles]
    }
    
    return apiVehicles
  }, [vehicleData, liveVehicles, isLiveMode])

  // Filter vehicles based on search and filters
  const filteredVehicles = useMemo(() => {
    return allVehicles.filter(vehicle => {
      const matchesSearch = searchTerm === '' || 
        vehicle.vehicle_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.sensor_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.vehicle_class.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesClass = vehicleClassFilter === 'all' || 
        vehicle.vehicle_class === vehicleClassFilter

      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'normal' && !Object.values(vehicle.decoded_status || {}).some(Boolean)) ||
        (statusFilter === 'fault' && (vehicle.decoded_status?.hardware_fault || vehicle.decoded_status?.low_voltage)) ||
        (statusFilter === 'wrong_way' && vehicle.decoded_status?.wrong_way_driver) ||
        (statusFilter === 'queue' && vehicle.decoded_status?.queue_detected)

      const matchesIntersection = intersectionFilter === 'all' || 
        (vehicle.intersection_id && vehicle.intersection_id === intersectionFilter)

      return matchesSearch && matchesClass && matchesStatus && matchesIntersection
    })
  }, [allVehicles, searchTerm, vehicleClassFilter, statusFilter, intersectionFilter])

  // Get unique values for filters
  const uniqueClasses = useMemo(() => {
    const classes = new Set(allVehicles.map(v => v.vehicle_class))
    return Array.from(classes).sort()
  }, [allVehicles])

  const uniqueIntersections = useMemo(() => {
    const intersections = new Set(
      allVehicles
        .map(v => v.intersection_id)
        .filter((id): id is string => Boolean(id))
    )
    return Array.from(intersections).sort()
  }, [allVehicles])

  if (error) {
    return (
      <Card className="border-destructive/50 animate-fade-in-up">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Error Loading Vehicle Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {error.message || 'Failed to load vehicle data. Please try again later.'}
          </p>
          <Button onClick={() => refetch()} className="mt-4" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="animate-fade-in-up">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Live Vehicle Detection Log
              <ConnectionBadge isConnected={isConnected} isPaused={!isLiveMode} />
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Real-time vehicle detection events with detailed classification and anomaly detection
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={isLiveMode ? "default" : "outline"}
              size="sm"
              onClick={() => setIsLiveMode(!isLiveMode)}
              className="transition-all duration-200"
            >
              {isLiveMode ? (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Resume
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className={cn(
                "h-4 w-4",
                isLoading && "animate-spin"
              )} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search vehicles, sensors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <Select value={vehicleClassFilter} onValueChange={setVehicleClassFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Vehicle Class" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {uniqueClasses.map(cls => (
                <SelectItem key={cls} value={cls}>
                  {cls.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="fault">Hardware Fault</SelectItem>
              <SelectItem value="wrong_way">Wrong Way</SelectItem>
              <SelectItem value="queue">Queue Detected</SelectItem>
            </SelectContent>
          </Select>
          {uniqueIntersections.length > 0 && (
            <Select value={intersectionFilter} onValueChange={setIntersectionFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Intersection" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Intersections</SelectItem>
                {uniqueIntersections.map(intersection => (
                  <SelectItem key={intersection} value={intersection}>
                    {intersection}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Stats Bar */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4 text-muted-foreground">
            <span>Total: {filteredVehicles.length} vehicles</span>
            {isLiveMode && isConnected && (
              <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Receiving live updates
              </span>
            )}
          </div>
          {events.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {events.length} events received
            </Badge>
          )}
        </div>

        {/* Table */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[100px]">Vehicle ID</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Speed</TableHead>
                <TableHead>Length</TableHead>
                <TableHead>Sensor</TableHead>
                <TableHead>Intersection</TableHead>
                <TableHead>Direction</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableSkeleton />
              ) : filteredVehicles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Car className="h-8 w-8 opacity-50" />
                      <p>No vehicles found matching the current filters</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredVehicles.slice(0, 50).map((vehicle, index) => (
                  <VehicleRow 
                    key={vehicle.vehicle_id || vehicle._id} 
                    vehicle={vehicle}
                    isNew={newVehicleIds.has(vehicle.vehicle_id || vehicle._id)}
                    index={index}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {filteredVehicles.length > 50 && (
          <div className="text-center text-sm text-muted-foreground py-2">
            Showing first 50 of {filteredVehicles.length} vehicles
          </div>
        )}
      </CardContent>
    </Card>
  )
} 