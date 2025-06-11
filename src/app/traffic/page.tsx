 'use client'

import React, { useState } from 'react'
import { DashboardLayout } from '@/components/dashboard/layout'
import { IntersectionSelector } from '@/components/traffic/intersection-selector'
import { DirectionalFlowGauges } from '@/components/traffic/directional-flow-gauges'
import { RealTimeMetricsTable } from '@/components/traffic/real-time-metrics-table'
import { DataEnhancementIndicator } from '@/components/traffic/data-enhancement-indicator'
import { HistoricalComparisonChart } from '@/components/traffic/historical-comparison-chart'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Activity, TrendingUp } from 'lucide-react'

export default function TrafficFlowPage() {
  const [selectedIntersection, setSelectedIntersection] = useState<string>('')

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-500/10">
              <Activity className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Traffic Flow</h1>
              <p className="text-muted-foreground">
                Real-time traffic dynamics and intersection performance analysis
              </p>
            </div>
          </div>
        </div>

        {/* Intersection Selector */}
        <Card className="animate-fade-in-up">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Intersection Selection
            </CardTitle>
            <CardDescription>
              Select an intersection to view detailed traffic flow analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <IntersectionSelector 
              value={selectedIntersection}
              onChange={setSelectedIntersection}
            />
          </CardContent>
        </Card>

        {selectedIntersection && (
          <>
            {/* Data Enhancement Indicator */}
            <div className="animate-fade-in-up animate-stagger-1">
              <DataEnhancementIndicator intersectionId={selectedIntersection} />
            </div>

            {/* Directional Flow Gauges */}
            <Card className="animate-fade-in-up animate-stagger-2">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Directional Flow Analysis
                  <Badge variant="outline" className="animate-pulse">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                    Live
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Real-time vehicle flow rates by direction (vehicles/minute)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DirectionalFlowGauges intersectionId={selectedIntersection} />
              </CardContent>
            </Card>

            {/* Real-time Metrics Table */}
            <Card className="animate-fade-in-up animate-stagger-3">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Real-time Traffic Metrics
                  <Badge variant="outline" className="animate-pulse">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                    Live
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Current traffic conditions with 5-minute trend analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RealTimeMetricsTable intersectionId={selectedIntersection} />
              </CardContent>
            </Card>

            {/* Historical Comparison Chart */}
            <Card className="animate-fade-in-up animate-stagger-4">
              <CardHeader>
                <CardTitle>Historical Performance Analysis</CardTitle>
                <CardDescription>
                  Speed vs. density correlation over selected time period
                </CardDescription>
              </CardHeader>
              <CardContent>
                <HistoricalComparisonChart intersectionId={selectedIntersection} />
              </CardContent>
            </Card>
          </>
        )}

        {!selectedIntersection && (
          <Card className="animate-fade-in-up">
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center space-y-3">
                <Activity className="h-12 w-12 text-muted-foreground mx-auto" />
                <div>
                  <h3 className="font-medium">Select an Intersection</h3>
                  <p className="text-sm text-muted-foreground">
                    Choose an intersection above to view detailed traffic flow analysis
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}