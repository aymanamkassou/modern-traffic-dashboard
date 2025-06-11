'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useVehicleData } from '@/lib/api-client'
import { useServerSentEvents } from '@/hooks/use-server-sent-events'
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
  Pause
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { isVehicleData, type VehicleStreamData } from '@/types/sse-events'
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

// Status badge variants
const getStatusBadgeVariant = (status: any) => {
  if (status.hardware_fault || status.low_voltage) return 'destructive'
  if (status.wrong_way_driver) return 'destructive'
  if (status.queue_detected) return 'secondary'
  return 'outline'
}

// Connection Status Indicator
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

// Vehicle Row Component
function VehicleRow({ vehicle, isNew }: { vehicle: VehicleRecord | VehicleStreamData; isNew?: boolean }) {
  const Icon = vehicleIcons[vehicle.vehicle_class as keyof typeof vehicleIcons] || Car
  
  // Handle both API response format and SSE stream format
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
    decoded_status: 'decoded_status' in vehicle ? vehicle.decoded_status : {
      hardware_fault: false,
      low_voltage: false,
      wrong_way_driver: false,
      queue_detected: false,
    }
  }

  return (
    <TableRow className={cn(
      "transition-all duration-300",
      isNew && "bg-green-50 dark:bg-green-950/20 animate-fade-in-up"
    )}>
      <TableCell className="font-mono text-xs">
        {vehicleData.id.slice(-8)}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4" />
          <span className="text-sm capitalize">
            {vehicleData.vehicle_class.replace('_', ' ')}
          </span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Gauge className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">{vehicleData.speed.toFixed(1)} km/h</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Ruler className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">{vehicleData.length} dm</span>
        </div>
      </TableCell>
      <TableCell className="font-mono text-xs">
        {vehicleData.sensor_id}
      </TableCell>
      <TableCell>
        {vehicleData.intersection_id && (
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs">{vehicleData.intersection_id}</span>
          </div>
        )}
      </TableCell>
      <TableCell>
        {vehicleData.sensor_direction && (
          <Badge variant="outline" className="text-xs">
            {vehicleData.sensor_direction.toUpperCase()}
          </Badge>
        )}
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1">
          {vehicleData.decoded_status.hardware_fault && (
            <Badge variant="destructive" className="text-xs">
              HW Fault
            </Badge>
          )}
          {vehicleData.decoded_status.low_voltage && (
            <Badge variant="destructive" className="text-xs">
              Low Voltage
            </Badge>
          )}
          {vehicleData.decoded_status.wrong_way_driver && (
            <Badge variant="destructive" className="text-xs">
              Wrong Way
            </Badge>
          )}
          {vehicleData.decoded_status.queue_detected && (
            <Badge variant="secondary" className="text-xs">
              Queue
            </Badge>
          )}
          {!Object.values(vehicleData.decoded_status).some(Boolean) && (
            <Badge variant="outline" className="text-xs">
              Normal
            </Badge>
          )}
        </div>
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
  const { isConnected, error: sseError } = useServerSentEvents(
    isLiveMode ? 'http://localhost:3001/api/vehicles/stream' : null,
    {
      autoConnect: true,
      maxEvents: 100,
      onEvent: (event) => {
        if (event.type === 'message' && isVehicleData(event.data)) {
          const vehicleStreamData = event.data
          
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
    const apiVehicles = vehicleData?.data || []
    
    if (isLiveMode && liveVehicles.length > 0) {
      // Convert live vehicles to match API format and combine
      const convertedLiveVehicles = liveVehicles.map(lv => ({
        _id: lv.id,
        vehicle_id: lv.id,
        sensor_id: lv.sensor_id,
        timestamp: lv.timestamp,
        location_id: '',
        location_x: 0,
        location_y: 0,
        vehicle_class: lv.vehicle_class,
        length_dm: lv.length_dm,
        speed_kmh: lv.speed_kmh,
        status: 0,
        intersection_id: undefined,
        sensor_direction: undefined,
        decoded_status: {
          hardware_fault: false,
          low_voltage: false,
          wrong_way_driver: false,
          queue_detected: false,
        }
      }))
      
      return [...convertedLiveVehicles, ...apiVehicles]
    }
    
    return apiVehicles
  }, [vehicleData?.data, liveVehicles, isLiveMode])

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
    const intersections = new Set(allVehicles.map(v => v.intersection_id).filter((id): id is string => Boolean(id)))
    return Array.from(intersections).sort()
  }, [allVehicles])

  if (error) {
    return (
      <Card className="border-red-500/50">
        <CardHeader>
          <CardTitle className="text-red-500">Error Loading Vehicle Data</CardTitle>
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
          <div>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Live Vehicle Detection Log
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Real-time vehicle detection events with detailed classification and status information
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ConnectionIndicator isConnected={isConnected} error={sseError} />
            <Button
              variant={isLiveMode ? "default" : "outline"}
              size="sm"
              onClick={() => setIsLiveMode(!isLiveMode)}
            >
              {isLiveMode ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
              {isLiveMode ? 'Pause Live' : 'Resume Live'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search vehicles, sensors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
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
                  {cls.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
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

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>Total: {filteredVehicles.length} vehicles</span>
          {isLiveMode && (
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Live updates enabled
            </span>
          )}
        </div>

        {/* Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
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
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 9 }).map((_, j) => (
                      <TableCell key={j}>
                        <div className="h-4 bg-muted rounded animate-pulse" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filteredVehicles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    No vehicles found matching the current filters
                  </TableCell>
                </TableRow>
              ) : (
                filteredVehicles.slice(0, 50).map((vehicle) => (
                  <VehicleRow 
                    key={vehicle.vehicle_id || vehicle._id} 
                    vehicle={vehicle}
                    isNew={newVehicleIds.has(vehicle.vehicle_id || vehicle._id)}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {filteredVehicles.length > 50 && (
          <div className="text-center text-sm text-muted-foreground">
            Showing first 50 of {filteredVehicles.length} vehicles
          </div>
        )}
      </CardContent>
    </Card>
  )
} 