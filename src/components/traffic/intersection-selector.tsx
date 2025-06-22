'use client'

import React, { useState, useMemo } from 'react'
import { Check, ChevronsUpDown, MapPin, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useIntersectionData } from '@/lib/api-client'

interface IntersectionSelectorProps {
  value: string
  onChange: (value: string) => void
  className?: string
}

export function IntersectionSelector({ value, onChange, className }: IntersectionSelectorProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  
  const { data: intersectionResponse, isLoading, error } = useIntersectionData({
    limit: 100,
    include_sensors: true
  })

  // Deduplicate intersections and aggregate data
  const uniqueIntersections = useMemo(() => {
    if (!intersectionResponse?.data) return []
    
    const intersectionMap = new Map()
    
    intersectionResponse.data.forEach((record) => {
      const id = record.intersection_id
      if (!intersectionMap.has(id)) {
        intersectionMap.set(id, {
          intersection_id: id,
          coordinated_light_status: record.coordinated_light_status,
          total_intersection_vehicles: record.total_intersection_vehicles || 0,
          average_wait_time: record.average_wait_time || 0,
          intersection_efficiency: record.intersection_efficiency || 0,
          record_count: 1,
          latest_timestamp: record.timestamp
        })
      } else {
        // Update with latest data if this record is newer
        const existing = intersectionMap.get(id)
        if (new Date(record.timestamp) > new Date(existing.latest_timestamp)) {
          intersectionMap.set(id, {
            ...existing,
            coordinated_light_status: record.coordinated_light_status || existing.coordinated_light_status,
            total_intersection_vehicles: record.total_intersection_vehicles || existing.total_intersection_vehicles,
            average_wait_time: record.average_wait_time || existing.average_wait_time,
            intersection_efficiency: record.intersection_efficiency || existing.intersection_efficiency,
            latest_timestamp: record.timestamp
          })
        }
        existing.record_count++
      }
    })
    
    return Array.from(intersectionMap.values())
  }, [intersectionResponse?.data])

  // Filter intersections based on search query
  const filteredIntersections = useMemo(() => {
    if (!searchQuery.trim()) return uniqueIntersections
    
    return uniqueIntersections.filter(intersection =>
      intersection.intersection_id.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [uniqueIntersections, searchQuery])

  // Get selected intersection details
  const selectedIntersection = uniqueIntersections.find(
    (intersection: any) => intersection.intersection_id === value
  )

  const handleSelect = (intersectionId: string) => {
    onChange(intersectionId)
    setOpen(false)
    setSearchQuery('')
  }

  if (error) {
    return (
      <div className={cn("space-y-2", className)}>
        <Label htmlFor="intersection-selector">Intersection</Label>
        <div className="p-4 border border-destructive/20 bg-destructive/5 rounded-lg">
          <p className="text-sm text-destructive">
            Failed to load intersections. Please try again.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor="intersection-selector">Intersection</Label>
      
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <Button
            id="intersection-selector"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-mono"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-muted border-t-foreground rounded-full animate-spin" />
                Loading intersections...
              </div>
            ) : selectedIntersection ? (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-500" />
                <span className="truncate">{selectedIntersection.intersection_id}</span>
                {selectedIntersection.coordinated_light_status && (
                  <Badge variant="secondary" className="text-xs">
                    Enhanced
                  </Badge>
                )}
              </div>
            ) : (
              <span className="text-muted-foreground">Select intersection...</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search intersections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 font-mono"
            />
          </div>
          
          <div className="max-h-60 overflow-y-auto border rounded-lg">
            {isLoading ? (
              <div className="p-2 space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : filteredIntersections.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                {searchQuery ? 'No intersections found.' : 'No intersections available.'}
              </div>
            ) : (
              <div className="p-1">
                {filteredIntersections.map((intersection) => (
                  <Button
                    key={intersection.intersection_id}
                    variant="ghost"
                    className="w-full justify-start font-mono text-left h-auto p-3"
                    onClick={() => handleSelect(intersection.intersection_id)}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <MapPin className="h-4 w-4 text-blue-500 shrink-0" />
                        <span className="truncate">{intersection.intersection_id}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 shrink-0">
                        {intersection.coordinated_light_status && (
                          <Badge variant="secondary" className="text-xs">
                            Enhanced
                          </Badge>
                        )}
                        
                        {intersection.total_intersection_vehicles !== undefined && (
                          <Badge variant="outline" className="text-xs">
                            {intersection.total_intersection_vehicles} vehicles
                          </Badge>
                        )}
                        
                        {value === intersection.intersection_id && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
} 