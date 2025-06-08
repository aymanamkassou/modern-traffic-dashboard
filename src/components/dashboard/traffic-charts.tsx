'use client'

import React from 'react'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useTrafficData, useVehicleStats } from '@/lib/api-client'
import { format } from 'date-fns'

// Sample data for charts (this would come from your API)
const trafficFlowData = [
  { time: '00:00', speed: 45, density: 20, vehicles: 120 },
  { time: '04:00', speed: 52, density: 15, vehicles: 85 },
  { time: '08:00', speed: 28, density: 75, vehicles: 320 },
  { time: '12:00', speed: 35, density: 60, vehicles: 280 },
  { time: '16:00', speed: 22, density: 85, vehicles: 380 },
  { time: '20:00', speed: 40, density: 45, vehicles: 220 },
  { time: '23:59', speed: 48, density: 25, vehicles: 150 },
]

const vehicleTypeData = [
  { name: 'Passenger Cars', value: 65, count: 2340, color: '#0088FE' },
  { name: 'SUVs', value: 20, count: 720, color: '#00C49F' },
  { name: 'Trucks', value: 8, count: 288, color: '#FFBB28' },
  { name: 'Motorcycles', value: 4, count: 144, color: '#FF8042' },
  { name: 'Buses', value: 3, count: 108, color: '#8884D8' },
]

const intersectionData = [
  { name: 'Bd Anfa / Bd Zerktouni', efficiency: 85, volume: 450, wait_time: 45 },
  { name: 'Av Hassan II / Rue Sebta', efficiency: 72, volume: 380, wait_time: 68 },
  { name: 'Place Mohammed V', efficiency: 90, volume: 520, wait_time: 32 },
  { name: 'Av des FAR / Bd Massira', efficiency: 78, volume: 410, wait_time: 55 },
  { name: 'Rond-point Racine', efficiency: 68, volume: 340, wait_time: 72 },
]

interface ChartProps {
  className?: string
}

export function TrafficFlowChart({ className }: ChartProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Traffic Flow Overview
          <Badge variant="outline">Real-time</Badge>
        </CardTitle>
        <CardDescription>
          Speed, density, and vehicle count throughout the day
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trafficFlowData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip 
              labelFormatter={(value) => `Time: ${value}`}
              formatter={(value, name) => [
                `${value}${name === 'speed' ? ' km/h' : name === 'density' ? '%' : ''}`,
                name === 'speed' ? 'Speed' : name === 'density' ? 'Density' : 'Vehicles'
              ]}
            />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="speed" 
              stroke="#8884d8" 
              strokeWidth={2}
              name="speed"
            />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="density" 
              stroke="#82ca9d" 
              strokeWidth={2}
              name="density"
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="vehicles" 
              stroke="#ffc658" 
              strokeWidth={2}
              name="vehicles"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

export function VehicleTypeChart({ className }: ChartProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Vehicle Distribution</CardTitle>
        <CardDescription>
          Current vehicle types on roads
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={vehicleTypeData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${name}: ${value}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {vehicleTypeData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value, name, props) => [
                `${value}% (${props.payload.count} vehicles)`, 
                'Distribution'
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap gap-2 mt-4">
          {vehicleTypeData.map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm text-muted-foreground">
                {item.name}: {item.count}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export function IntersectionEfficiencyChart({ className }: ChartProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Intersection Performance</CardTitle>
        <CardDescription>
          Efficiency and wait times at major intersections
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={intersectionData} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" domain={[0, 100]} />
            <YAxis dataKey="name" type="category" width={150} />
            <Tooltip 
              formatter={(value, name) => [
                `${value}${name === 'efficiency' ? '%' : name === 'wait_time' ? 's' : ''}`,
                name === 'efficiency' ? 'Efficiency' : name === 'wait_time' ? 'Wait Time' : 'Volume'
              ]}
            />
            <Bar dataKey="efficiency" fill="#8884d8" name="efficiency" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

export function RealTimeTrafficChart({ className }: ChartProps) {
  const { data: trafficData, isLoading } = useTrafficData({ 
    limit: 20, 
    include_enhanced: true 
  })

  // Process real traffic data for chart
  const chartData = React.useMemo(() => {
    if (!trafficData?.data) return []
    
    return trafficData.data.slice(0, 10).map((item) => ({
      time: format(new Date(item.timestamp), 'HH:mm'),
      speed: item.speed,
      density: item.density,
      congestion: item.congestion_level,
      sensor: item.sensor_id,
    }))
  }, [trafficData])

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Real-time Traffic Data</CardTitle>
          <CardDescription>Loading latest traffic measurements...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Real-time Traffic Data
          <Badge variant="secondary">Live</Badge>
        </CardTitle>
        <CardDescription>
          Latest measurements from traffic sensors
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorSpeed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorDensity" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="time" />
            <YAxis />
            <CartesianGrid strokeDasharray="3 3" />
            <Tooltip 
              labelFormatter={(value) => `Time: ${value}`}
              formatter={(value, name) => [
                `${value}${name === 'speed' ? ' km/h' : '%'}`,
                name === 'speed' ? 'Speed' : 'Density'
              ]}
            />
            <Area 
              type="monotone" 
              dataKey="speed" 
              stroke="#8884d8" 
              fillOpacity={1} 
              fill="url(#colorSpeed)" 
            />
            <Area 
              type="monotone" 
              dataKey="density" 
              stroke="#82ca9d" 
              fillOpacity={1} 
              fill="url(#colorDensity)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
} 