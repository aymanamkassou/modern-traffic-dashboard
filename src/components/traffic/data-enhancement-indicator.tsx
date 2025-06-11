 'use client'

import React from 'react'
import { Shield, Zap, Database, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { useTrafficData } from '@/lib/api-client'

interface DataEnhancementIndicatorProps {
  intersectionId: string
  className?: string
}

export function DataEnhancementIndicator({ intersectionId, className }: DataEnhancementIndicatorProps) {
  const { data: trafficResponse, isLoading, error } = useTrafficData({
    intersection_id: intersectionId,
    limit: 100,
    include_enhanced: true
  })

  if (isLoading) {
    return (
      <Card className={cn("animate-fade-in-up", className)}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Skeleton className="w-5 h-5" />
            <Skeleton className="h-5 w-32" />
          </div>
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-2 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={cn("border-destructive/20", className)}>
        <CardContent className="p-6">
          <div className="text-center text-destructive">
            <Database className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">Failed to load data enhancement information</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const enhancementInfo = trafficResponse?.enhancement_info
  const enhancementRate = enhancementInfo?.enhancement_rate || 0
  const enhancedRecords = enhancementInfo?.enhanced_records || 0
  const legacyRecords = enhancementInfo?.legacy_records || 0
  const totalRecords = enhancedRecords + legacyRecords

  // Determine enhancement level
  const getEnhancementLevel = (rate: number) => {
    if (rate >= 80) return { level: 'excellent', color: 'text-green-600', bgColor: 'bg-green-100', borderColor: 'border-green-200' }
    if (rate >= 60) return { level: 'good', color: 'text-blue-600', bgColor: 'bg-blue-100', borderColor: 'border-blue-200' }
    if (rate >= 40) return { level: 'moderate', color: 'text-yellow-600', bgColor: 'bg-yellow-100', borderColor: 'border-yellow-200' }
    return { level: 'basic', color: 'text-orange-600', bgColor: 'bg-orange-100', borderColor: 'border-orange-200' }
  }

  const enhancement = getEnhancementLevel(enhancementRate)

  return (
    <Card className={cn("animate-fade-in-up", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Data Enhancement Status
        </CardTitle>
        <CardDescription>
          Quality and source breakdown of traffic data for this intersection
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Main Enhancement Rate */}
          <div className="text-center space-y-3">
            <div className="relative">
              <div className="mx-auto w-32 h-32 relative">
                {/* Background Circle */}
                <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-muted/20"
                  />
                  {/* Progress Circle */}
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${(enhancementRate / 100) * 314} 314`}
                    strokeLinecap="round"
                    className={cn("transition-all duration-1000 ease-out", enhancement.color)}
                  />
                </svg>
                
                {/* Center Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold">{Math.round(enhancementRate)}%</span>
                  <span className="text-xs text-muted-foreground">Enhanced</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Badge 
                variant="outline" 
                className={cn("text-sm", enhancement.bgColor, enhancement.color, enhancement.borderColor)}
              >
                <Zap className="h-3 w-3 mr-1" />
                {enhancement.level.charAt(0).toUpperCase() + enhancement.level.slice(1)} Enhancement
              </Badge>
              
              <p className="text-sm text-muted-foreground">
                {enhancementRate >= 80 && "Excellent data quality with comprehensive sensor coverage"}
                {enhancementRate >= 60 && enhancementRate < 80 && "Good data quality with enhanced sensor capabilities"}
                {enhancementRate >= 40 && enhancementRate < 60 && "Moderate enhancement with mixed sensor types"}
                {enhancementRate < 40 && "Basic data collection with legacy sensor infrastructure"}
              </p>
            </div>
          </div>

          {/* Data Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Enhanced Records */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full" />
                <span className="text-sm font-medium">Enhanced Data</span>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold font-mono">{enhancedRecords.toLocaleString()}</div>
                <Progress value={(enhancedRecords / totalRecords) * 100} className="h-2" />
                <div className="text-xs text-muted-foreground">
                  {totalRecords > 0 ? Math.round((enhancedRecords / totalRecords) * 100) : 0}% of total records
                </div>
              </div>
            </div>

            {/* Legacy Records */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full" />
                <span className="text-sm font-medium">Legacy Data</span>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold font-mono">{legacyRecords.toLocaleString()}</div>
                <Progress value={(legacyRecords / totalRecords) * 100} className="h-2" />
                <div className="text-xs text-muted-foreground">
                  {totalRecords > 0 ? Math.round((legacyRecords / totalRecords) * 100) : 0}% of total records
                </div>
              </div>
            </div>

            {/* Total Records */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Database className="w-3 h-3 text-primary" />
                <span className="text-sm font-medium">Total Records</span>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold font-mono">{totalRecords.toLocaleString()}</div>
                <div className="h-2 bg-muted rounded-full">
                  <div className="h-full bg-primary rounded-full w-full" />
                </div>
                <div className="text-xs text-muted-foreground">
                  Last 100 data points
                </div>
              </div>
            </div>
          </div>

          {/* Enhancement Features */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Enhanced Capabilities Available
            </h4>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { name: 'Weather Sync', available: enhancementRate > 60 },
                { name: 'Flow Tracking', available: enhancementRate > 40 },
                { name: 'Light Coordination', available: enhancementRate > 70 },
                { name: 'Queue Detection', available: enhancementRate > 50 },
              ].map((feature) => (
                <div key={feature.name} className="flex items-center gap-2">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    feature.available ? "bg-green-500" : "bg-muted-foreground"
                  )} />
                  <span className={cn(
                    "text-xs",
                    feature.available ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {feature.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}