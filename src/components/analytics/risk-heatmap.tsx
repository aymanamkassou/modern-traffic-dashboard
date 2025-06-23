'use client'

import React, { useState, useMemo } from 'react'
import { useRiskHeatmap } from '@/lib/api-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { 
  MapPin, 
  AlertTriangle, 
  Search, 
  Filter,
  TrendingUp,
  Clock,
  Car,
  Shield,
  Activity,
  BarChart3
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { RiskHeatmapLocation } from '@/types/api'

interface RiskHeatmapProps {
  className?: string
}

// Risk level color and styling mapping
const getRiskConfig = (level: string) => {
  const configs = {
    critical: {
      color: 'hsl(var(--destructive))',
      bgColor: 'bg-red-50 text-red-700 border-red-200',
      textColor: 'text-red-600',
      progressColor: 'bg-red-500'
    },
    high: {
      color: 'hsl(var(--warning))',
      bgColor: 'bg-orange-50 text-orange-700 border-orange-200',
      textColor: 'text-orange-600',
      progressColor: 'bg-orange-500'
    },
    medium: {
      color: '#ca8a04',
      bgColor: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      textColor: 'text-yellow-600',
      progressColor: 'bg-yellow-500'
    },
    low: {
      color: 'hsl(var(--success))',
      bgColor: 'bg-green-50 text-green-700 border-green-200',
      textColor: 'text-green-600',
      progressColor: 'bg-green-500'
    }
  }
  
  return configs[level as keyof typeof configs] || configs.medium
}

export function RiskHeatmap({ className }: RiskHeatmapProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [riskLevelFilter, setRiskLevelFilter] = useState<string>('all')
  
  const { 
    data: heatmapData, 
    isLoading, 
    error, 
    refetch 
  } = useRiskHeatmap()

  // Filter and search locations
  const filteredLocations = useMemo(() => {
    if (!heatmapData?.heatmap_data) return []
    
    let filtered = heatmapData.heatmap_data
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(location =>
        location.location.intersection_id.toLowerCase().includes(query) ||
        location.location.sensor_id.toLowerCase().includes(query) ||
        location.location.location_id.toLowerCase().includes(query)
      )
    }
    
    // Apply risk level filter
    if (riskLevelFilter !== 'all') {
      filtered = filtered.filter(location => location.risk_level === riskLevelFilter)
    }
    
    // Sort by risk score (highest first)
    return filtered.sort((a, b) => b.risk_score - a.risk_score)
  }, [heatmapData?.heatmap_data, searchQuery, riskLevelFilter])

  // Loading state
  if (isLoading) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className={cn("space-y-4", className)}>
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to load risk heatmap data. 
            <button 
              onClick={() => refetch()} 
              className="ml-2 underline hover:no-underline"
            >
              Try again
            </button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // No data state
  if (!heatmapData) {
    return (
      <div className={cn("text-center py-12 text-muted-foreground", className)}>
        <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No risk heatmap data available</p>
      </div>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <MapPin className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{heatmapData.summary.total_locations}</div>
                <div className="text-xs text-muted-foreground">Total Locations</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <TrendingUp className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {heatmapData.summary.average_risk_score.toFixed(1)}
                </div>
                <div className="text-xs text-muted-foreground">Avg Risk Score</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100">
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {heatmapData.summary.risk_distribution.critical + heatmapData.summary.risk_distribution.high}
                </div>
                <div className="text-xs text-muted-foreground">High Risk Sites</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <Shield className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {heatmapData.summary.risk_distribution.low}
                </div>
                <div className="text-xs text-muted-foreground">Low Risk Sites</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by intersection, sensor, or location ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={riskLevelFilter} onValueChange={setRiskLevelFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by risk level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Risk Levels</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Risk Distribution Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Risk Distribution
          </CardTitle>
          <CardDescription>
            Distribution of risk levels across all monitored locations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(heatmapData.summary.risk_distribution).map(([level, count]) => {
              const config = getRiskConfig(level)
              const percentage = (count / heatmapData.summary.total_locations) * 100
              
              return (
                <div key={level} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium capitalize">{level}</span>
                    <span className="text-sm text-muted-foreground">{count}</span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                  <div className="text-xs text-muted-foreground">
                    {percentage.toFixed(1)}%
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Locations Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Risk Locations
            <Badge variant="outline" className="text-xs">
              <Activity className="h-3 w-3 mr-1" />
              {filteredLocations.length} locations
            </Badge>
          </CardTitle>
          <CardDescription>
            Detailed risk analysis for each monitored intersection and sensor location
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredLocations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No locations match your search criteria</p>
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 pr-4">
                {filteredLocations.map((location) => (
                  <LocationCard key={`${location.location.sensor_id}-${location.location.location_id}`} location={location} />
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Footer with metadata */}
      <div className="text-xs text-muted-foreground flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-3 w-3" />
          <span>Last updated: {new Date(heatmapData.metadata.generated_at).toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-2">
          <span>Data sources: {heatmapData.metadata.data_sources.traffic_locations} traffic, {heatmapData.metadata.data_sources.intersection_locations} intersections, {heatmapData.metadata.data_sources.alert_locations} alerts</span>
        </div>
      </div>
    </div>
  )
}

// Individual Location Card Component
function LocationCard({ location }: { location: RiskHeatmapLocation }) {
  const riskConfig = getRiskConfig(location.risk_level)
  
  return (
    <Card className="hover:shadow-md transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium truncate">
            {location.location.intersection_id}
          </CardTitle>
          <Badge 
            variant="outline" 
            className={cn("text-xs", riskConfig.bgColor)}
          >
            {location.risk_level.toUpperCase()}
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" />
          <span>{location.location.sensor_id}</span>
          <span>•</span>
          <span>{location.location.location_id}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Risk Score */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Risk Score</span>
          <div className="flex items-center gap-2">
            <div className="text-lg font-bold" style={{ color: riskConfig.color }}>
              {location.risk_score.toFixed(1)}
            </div>
            <span className="text-xs text-muted-foreground">/ 100</span>
          </div>
        </div>

        {/* Risk Breakdown */}
        <div className="space-y-2">
          <div className="text-sm font-medium">Risk Breakdown</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between">
              <span>Traffic:</span>
              <span className="font-mono">{location.risk_breakdown.traffic.toFixed(1)}</span>
            </div>
            <div className="flex justify-between">
              <span>Intersection:</span>
              <span className="font-mono">{location.risk_breakdown.intersection.toFixed(1)}</span>
            </div>
            <div className="flex justify-between">
              <span>Environment:</span>
              <span className="font-mono">{location.risk_breakdown.environment.toFixed(1)}</span>
            </div>
            <div className="flex justify-between">
              <span>Incidents:</span>
              <span className="font-mono">{location.risk_breakdown.incidents.toFixed(1)}</span>
            </div>
          </div>
        </div>

        {/* Key Stats */}
        <div className="space-y-2">
          <div className="text-sm font-medium">Key Statistics</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <Car className="h-3 w-3 text-blue-500" />
                <span>Speed: {location.stats.traffic.avg_speed.toFixed(1)} km/h</span>
              </div>
              <div className="flex items-center gap-1">
                <BarChart3 className="h-3 w-3 text-purple-500" />
                <span>Density: {location.stats.traffic.avg_density.toFixed(1)}%</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 text-orange-500" />
                <span>Alerts: {location.stats.alerts.alert_count}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-green-500" />
                <span>Wait: {location.stats.intersection.avg_wait_time.toFixed(1)}s</span>
              </div>
            </div>
          </div>
        </div>

        {/* Last Updated */}
        <div className="text-xs text-muted-foreground">
          Updated: {new Date(location.last_updated).toLocaleTimeString()}
        </div>
      </CardContent>
    </Card>
  )
} 