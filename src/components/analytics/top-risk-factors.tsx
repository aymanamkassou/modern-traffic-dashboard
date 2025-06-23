'use client'

import React, { useMemo } from 'react'
import { useRiskAnalysis } from '@/lib/api-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  CheckCircle2,
  TrendingUp,
  Clock,
  Activity,
  Car,
  MapPin,
  Cloud,
  Shield
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface TopRiskFactorsProps {
  selectedIntersection: string
  className?: string
}

// Risk factor icon mapping
const getRiskFactorIcon = (category: string, factor: string) => {
  const iconMap: Record<string, React.ComponentType<any>> = {
    // Traffic factors
    traffic: Car,
    // Intersection factors  
    intersection: MapPin,
    // Environment factors
    environment: Cloud,
    // Incident factors
    incidents: Shield
  }
  
  return iconMap[category] || AlertTriangle
}

// Severity color and styling mapping
const getSeverityConfig = (severity: string) => {
  const configs = {
    critical: {
      color: '#dc2626',
      bgColor: 'bg-red-50 text-red-700 border-red-200',
      icon: AlertCircle,
      textColor: 'text-red-600',
      progressColor: 'bg-red-500'
    },
    high: {
      color: '#ea580c',
      bgColor: 'bg-orange-50 text-orange-700 border-orange-200',
      icon: AlertTriangle,
      textColor: 'text-orange-600',
      progressColor: 'bg-orange-500'
    },
    medium: {
      color: '#ca8a04',
      bgColor: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      icon: Info,
      textColor: 'text-yellow-600',
      progressColor: 'bg-yellow-500'
    },
    low: {
      color: '#16a34a',
      bgColor: 'bg-green-50 text-green-700 border-green-200',
      icon: CheckCircle2,
      textColor: 'text-green-600',
      progressColor: 'bg-green-500'
    }
  }
  
  return configs[severity as keyof typeof configs] || configs.medium
}

// Category display names and colors
const getCategoryConfig = (category: string) => {
  const configs = {
    traffic: {
      name: 'Traffic',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    intersection: {
      name: 'Intersection',
      color: 'text-purple-600', 
      bgColor: 'bg-purple-100'
    },
    environment: {
      name: 'Environment',
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    incidents: {
      name: 'Incidents',
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    }
  }
  
  return configs[category as keyof typeof configs] || {
    name: category,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100'
  }
}

export function TopRiskFactors({ selectedIntersection, className }: TopRiskFactorsProps) {
  const { 
    data: riskData, 
    isLoading, 
    error, 
    refetch 
  } = useRiskAnalysis(selectedIntersection || undefined)

  // Sort and process risk factors
  const processedRiskFactors = useMemo(() => {
    if (!riskData?.risk_analysis?.risk_factors) return []
    
    const factors = riskData.risk_analysis.risk_factors
    
    // Sort by severity priority and then by category
    const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
    
    return factors
      .sort((a, b) => {
        const severityA = severityOrder[a.severity as keyof typeof severityOrder] || 0
        const severityB = severityOrder[b.severity as keyof typeof severityOrder] || 0
        
        if (severityA !== severityB) {
          return severityB - severityA // Higher severity first
        }
        
        // If same severity, sort by category
        return a.category.localeCompare(b.category)
      })
      .map((factor, index) => ({
        ...factor,
        rank: index + 1,
        severityConfig: getSeverityConfig(factor.severity),
        categoryConfig: getCategoryConfig(factor.category),
        FactorIcon: getRiskFactorIcon(factor.category, factor.factor)
      }))
  }, [riskData])

  // Group factors by category for summary
  const factorsByCategory = useMemo(() => {
    if (!processedRiskFactors.length) return {}
    
    return processedRiskFactors.reduce((acc, factor) => {
      const category = factor.category
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(factor)
      return acc
    }, {} as Record<string, typeof processedRiskFactors>)
  }, [processedRiskFactors])

  // No intersection selected
  if (!selectedIntersection) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="text-center py-12 text-muted-foreground">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Select an intersection to view risk factors</p>
        </div>
      </div>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-2 w-full" />
              <Skeleton className="h-3 w-1/2" />
            </div>
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
            Failed to load risk factors for {selectedIntersection}. 
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

  // No risk factors found
  if (!processedRiskFactors.length) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="text-center py-8 text-muted-foreground">
          <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
          <p>No significant risk factors detected</p>
          <p className="text-xs">This intersection appears to be operating safely</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.entries(factorsByCategory).map(([category, factors]) => {
          const categoryConfig = getCategoryConfig(category)
          const criticalCount = factors.filter(f => f.severity === 'critical').length
          const highCount = factors.filter(f => f.severity === 'high').length
          
          return (
            <div key={category} className="text-center p-3 rounded-lg border bg-muted/20">
              <div className={cn("text-lg font-bold", categoryConfig.color)}>
                {factors.length}
              </div>
              <div className="text-xs text-muted-foreground capitalize">
                {categoryConfig.name}
              </div>
              {(criticalCount > 0 || highCount > 0) && (
                <div className="text-xs mt-1">
                  {criticalCount > 0 && (
                    <Badge variant="destructive" className="text-xs mr-1">
                      {criticalCount} Critical
                    </Badge>
                  )}
                  {highCount > 0 && (
                    <Badge className="text-xs bg-orange-500">
                      {highCount} High
                    </Badge>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Risk Factors List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Risk Factors Analysis
            <Badge variant="outline" className="text-xs">
              <Activity className="h-3 w-3 mr-1" />
              {processedRiskFactors.length} factors
            </Badge>
          </CardTitle>
          <CardDescription>
            Prioritized list of factors contributing to the overall risk assessment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {processedRiskFactors.map((factor, index) => {
                const SeverityIcon = factor.severityConfig.icon
                const FactorIcon = factor.FactorIcon
                
                return (
                  <div key={`${factor.category}-${factor.factor}-${index}`} className="space-y-3">
                    <div className="flex items-start gap-3 p-4 rounded-lg border bg-card">
                      {/* Rank and Category Icon */}
                      <div className="flex flex-col items-center gap-2 min-w-[60px]">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold">
                          #{factor.rank}
                        </div>
                        <div className={cn("p-1 rounded", factor.categoryConfig.bgColor)}>
                          <FactorIcon className={cn("h-4 w-4", factor.categoryConfig.color)} />
                        </div>
                      </div>

                      {/* Factor Details */}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge 
                            variant="outline" 
                            className={cn("text-xs", factor.severityConfig.bgColor)}
                          >
                            <SeverityIcon className="h-3 w-3 mr-1" />
                            {factor.severity.toUpperCase()}
                          </Badge>
                          
                          <Badge variant="secondary" className="text-xs capitalize">
                            {factor.categoryConfig.name}
                          </Badge>
                          
                          {typeof factor.value === 'number' && (
                            <Badge variant="outline" className="text-xs font-mono">
                              Value: {factor.value}
                            </Badge>
                          )}
                        </div>

                        <div className="space-y-1">
                          <div className="font-medium text-sm">
                            {factor.factor.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {factor.description}
                          </div>
                        </div>

                        {/* Risk Impact Visualization */}
                        {typeof factor.value === 'number' && (
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span>Impact Level</span>
                              <span className={factor.severityConfig.textColor}>
                                {factor.severity}
                              </span>
                            </div>
                            <Progress 
                              value={Math.min((factor.value / 100) * 100, 100)} 
                              className="h-2"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {index < processedRiskFactors.length - 1 && (
                      <Separator className="my-2" />
                    )}
                  </div>
                )
              })}
            </div>
          </ScrollArea>

          {/* Footer with last update time */}
          {riskData && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3" />
                  <span>
                    Last updated: {new Date(riskData.risk_analysis.overall_risk.timestamp).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-3 w-3" />
                  <span>{selectedIntersection}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 