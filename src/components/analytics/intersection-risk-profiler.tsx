'use client'

import React, { useMemo } from 'react'
import { IntersectionSelector } from '@/components/traffic/intersection-selector'
import { useRiskAnalysis } from '@/lib/api-client'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  RadialBarChart, 
  RadialBar, 
  ResponsiveContainer, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar,
  Legend
} from 'recharts'
import { 
  Shield, 
  AlertTriangle, 
  TrendingUp, 
  Clock, 
  MapPin,
  Activity,
  Gauge
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface IntersectionRiskProfilerProps {
  selectedIntersection: string
  onIntersectionChange: (value: string) => void
  className?: string
}

// Risk level color mapping
const getRiskColor = (level: string): string => {
  const colors = {
    critical: '#dc2626',  // Red-600
    high: '#ea580c',      // Orange-600
    medium: '#ca8a04',    // Yellow-600
    low: '#16a34a'        // Green-600
  }
  return colors[level as keyof typeof colors] || '#6b7280' // Gray-500 for unknown
}

// Risk level background color mapping
const getRiskBgColor = (level: string): string => {
  const colors = {
    critical: 'bg-red-50 text-red-700 border-red-200',
    high: 'bg-orange-50 text-orange-700 border-orange-200',
    medium: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    low: 'bg-green-50 text-green-700 border-green-200'
  }
  return colors[level as keyof typeof colors] || 'bg-gray-50 text-gray-700 border-gray-200'
}

export function IntersectionRiskProfiler({ 
  selectedIntersection, 
  onIntersectionChange, 
  className 
}: IntersectionRiskProfilerProps) {
  const { 
    data: riskData, 
    isLoading, 
    error, 
    refetch 
  } = useRiskAnalysis(selectedIntersection || undefined)

  // Prepare gauge chart data
  const gaugeData = useMemo(() => {
    if (!riskData?.risk_analysis?.overall_risk) return []
    
    const { score, level } = riskData.risk_analysis.overall_risk
    
    return [{
      name: 'Risk Score',
      value: score,
      fill: getRiskColor(level)
    }]
  }, [riskData])

  // Prepare radar chart data
  const radarData = useMemo(() => {
    if (!riskData?.risk_analysis?.risk_breakdown) return []
    
    const breakdown = riskData.risk_analysis.risk_breakdown
    
    return [{
      category: 'Traffic',
      value: breakdown.traffic || 0,
      fullMark: 100
    }, {
      category: 'Intersection',
      value: breakdown.intersection || 0,
      fullMark: 100
    }, {
      category: 'Environment',
      value: breakdown.environment || 0,
      fullMark: 100
    }, {
      category: 'Incidents',
      value: breakdown.incidents || 0,
      fullMark: 100
    }]
  }, [riskData])

  // Chart configurations
  const gaugeConfig = {
    riskScore: {
      label: "Risk Score",
      color: "hsl(var(--chart-1))",
    },
  }

  const radarConfig = {
    value: {
      label: "Risk Value",
      color: "hsl(var(--chart-2))",
    },
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Intersection Selector */}
      <div className="space-y-4">
        <IntersectionSelector 
          value={selectedIntersection}
          onChange={onIntersectionChange}
        />
        
        {selectedIntersection && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>Analyzing: {selectedIntersection}</span>
            {riskData && (
              <Badge variant="outline" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                Updated {new Date(riskData.risk_analysis.overall_risk.timestamp).toLocaleTimeString()}
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Loading State */}
      {isLoading && selectedIntersection && (
        <div className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      )}

      {/* Error State */}
      {error && selectedIntersection && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to load risk analysis for {selectedIntersection}. 
            <button 
              onClick={() => refetch()} 
              className="ml-2 underline hover:no-underline"
            >
              Try again
            </button>
          </AlertDescription>
        </Alert>
      )}

      {/* No Selection State */}
      {!selectedIntersection && (
        <div className="text-center py-12 text-muted-foreground">
          <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Select an intersection to view risk analysis</p>
        </div>
      )}

      {/* Risk Analysis Display */}
      {riskData && selectedIntersection && !isLoading && (
        <div className="space-y-6">
          {/* Overall Risk Score Gauge */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gauge className="h-5 w-5" />
                Overall Risk Score
                <Badge 
                  variant="outline" 
                  className={cn("text-xs", getRiskBgColor(riskData.risk_analysis.overall_risk.level))}
                >
                  {riskData.risk_analysis.overall_risk.level.toUpperCase()}
                </Badge>
              </CardTitle>
              <CardDescription>
                Comprehensive safety assessment based on real-time traffic conditions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Gauge Chart */}
                <div className="space-y-4">
                  <ChartContainer config={gaugeConfig} className="mx-auto aspect-square max-h-[250px]">
                    <RadialBarChart
                      data={gaugeData}
                      startAngle={180}
                      endAngle={0}
                      innerRadius={60}
                      outerRadius={120}
                    >
                      <PolarGrid gridType="polygon" radialLines={false} />
                      <RadialBar 
                        dataKey="value" 
                        cornerRadius={10}
                        fill={gaugeData[0]?.fill}
                      />
                      <ChartTooltip 
                        content={<ChartTooltipContent hideLabel />}
                        formatter={(value) => [`${typeof value === 'number' ? value.toFixed(1) : value}`, "Risk Score"]}
                      />
                    </RadialBarChart>
                  </ChartContainer>
                  
                  <div className="text-center">
                    <div className="text-3xl font-bold" style={{ color: gaugeData[0]?.fill }}>
                      {riskData.risk_analysis.overall_risk.score.toFixed(1)}
                    </div>
                    <div className="text-sm text-muted-foreground">out of 100</div>
                  </div>
                </div>

                {/* Risk Level Info */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Risk Level</div>
                    <Badge 
                      className={cn("text-sm px-3 py-1", getRiskBgColor(riskData.risk_analysis.overall_risk.level))}
                    >
                      {riskData.risk_analysis.overall_risk.level.toUpperCase()}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium">Total Risk Factors</div>
                    <div className="text-2xl font-bold">
                      {riskData.risk_analysis.total_factors}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium">Last Updated</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(riskData.risk_analysis.overall_risk.timestamp).toLocaleString()}
                    </div>
                  </div>

                  {riskData.recommendations && riskData.recommendations.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Priority Action</div>
                      <Alert className="border-orange-200 bg-orange-50">
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                        <AlertDescription className="text-orange-800">
                          {riskData.recommendations[0].description}
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Risk Breakdown Radar Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Risk Breakdown Analysis
              </CardTitle>
              <CardDescription>
                Category-wise risk contribution showing traffic, intersection, environmental, and incident factors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={radarConfig} className="mx-auto aspect-square max-h-[400px]">
                <RadarChart data={radarData}>
                  <ChartTooltip 
                    content={<ChartTooltipContent />}
                    formatter={(value) => [`${typeof value === 'number' ? value.toFixed(1) : value}`, "Risk Value"]}
                  />
                  <PolarGrid />
                  <PolarAngleAxis 
                    dataKey="category" 
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <PolarRadiusAxis 
                    angle={90} 
                    domain={[0, 100]} 
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Radar
                    name="Risk Value"
                    dataKey="value"
                    stroke="hsl(var(--chart-2))"
                    fill="hsl(var(--chart-2))"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ChartContainer>

              {/* Breakdown Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                {Object.entries(riskData.risk_analysis.risk_breakdown).map(([category, value]) => (
                  <div key={category} className="text-center p-3 rounded-lg border bg-muted/20">
                    <div className="text-lg font-bold text-chart-2">
                      {value.toFixed(1)}
                    </div>
                    <div className="text-xs text-muted-foreground capitalize">
                      {category}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
} 