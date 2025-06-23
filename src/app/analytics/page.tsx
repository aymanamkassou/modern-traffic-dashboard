'use client'

import React, { useState } from 'react'
import { DashboardLayout } from '@/components/dashboard/layout'
import { PageHeader } from '@/components/ui/page-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { IntersectionRiskProfiler } from '@/components/analytics/intersection-risk-profiler'
import { TopRiskFactors } from '@/components/analytics/top-risk-factors'
import { RiskHeatmap } from '@/components/analytics/risk-heatmap'
import { CongestionHotspotHeatmap } from '@/components/analytics/congestion-hotspot-heatmap'
import { 
  TrendingUp, 
  Shield, 
  AlertTriangle, 
  BarChart3, 
  CloudRain, 
  MapPin,
  Activity,
  Calendar
} from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function AnalyticsPage() {
  const [selectedIntersection, setSelectedIntersection] = useState<string>('')

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <PageHeader
          title="Analytics & Intelligence"
          description="Deep-dive analysis of traffic patterns, risk assessment, and historical trends powered by advanced analytics"
          icon={BarChart3}
        />

        {/* Analytics Tabs */}
        <Tabs defaultValue="risk-analysis" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="risk-analysis" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Risk Analysis
            </TabsTrigger>
            <TabsTrigger value="risk-heatmap" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Risk Heatmap
            </TabsTrigger>
            <TabsTrigger value="incidents-congestion" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Incidents & Congestion
            </TabsTrigger>
          </TabsList>

          {/* Risk Analysis Tab */}
          <TabsContent value="risk-analysis" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Intersection Risk Profiler */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-red-500" />
                    Intersection Risk Profiler
                    <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                      <Activity className="h-3 w-3 mr-1" />
                      Real-time
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Select an intersection to view comprehensive risk analysis with real-time scoring and breakdown
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <IntersectionRiskProfiler 
                    selectedIntersection={selectedIntersection}
                    onIntersectionChange={setSelectedIntersection}
                  />
                </CardContent>
              </Card>

              {/* Top Risk Factors */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    Top Risk Factors
                    <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                      <Activity className="h-3 w-3 mr-1" />
                      Live Analysis
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Prioritized list of risk factors contributing to the overall safety assessment
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <TopRiskFactors selectedIntersection={selectedIntersection} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Risk Heatmap Tab */}
          <TabsContent value="risk-heatmap" className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Geographic Risk Heatmap */}
              <Card className="xl:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-blue-500" />
                    Geographic Risk Distribution
                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                      <Activity className="h-3 w-3 mr-1" />
                      Real-time
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Location-based risk analysis with detailed intersection and sensor data
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RiskHeatmap />
                </CardContent>
              </Card>

              {/* Congestion Hotspot Heatmap */}
              <Card className="xl:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-purple-500" />
                    Congestion Hotspot Analysis
                    <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                      <BarChart3 className="h-3 w-3 mr-1" />
                      Historical
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Weekly congestion patterns by day and hour for traffic planning optimization
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CongestionHotspotHeatmap />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Incidents & Congestion Tab - Placeholder */}
          <TabsContent value="incidents-congestion" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  Incidents & Congestion Analysis
                  <Badge variant="secondary">Coming Soon</Badge>
                </CardTitle>
                <CardDescription>
                  Congestion hotspots and incident pattern analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Incident and congestion analysis components will be implemented next</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
} 