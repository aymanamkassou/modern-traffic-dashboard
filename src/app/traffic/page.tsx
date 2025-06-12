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
import { PageHeader } from '@/components/ui/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { PageComponentList } from '@/components/ui/animated-list'
import { LiveStatus } from '@/components/ui/status-badge'
import { Activity, TrendingUp } from 'lucide-react'

export default function TrafficFlowPage() {
  const [selectedIntersection, setSelectedIntersection] = useState<string>('')

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <PageHeader
          title="Traffic Flow"
          description="Real-time traffic dynamics and intersection performance analysis"
          icon={Activity}
        />

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
          <PageComponentList
            components={[
              {
                id: 'data-enhancement',
                component: <DataEnhancementIndicator intersectionId={selectedIntersection} />
              },
              {
                id: 'directional-flow',
                component: (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        Directional Flow Analysis
                        <LiveStatus />
                      </CardTitle>
                      <CardDescription>
                        Real-time vehicle flow rates by direction (vehicles/minute)
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <DirectionalFlowGauges intersectionId={selectedIntersection} />
                    </CardContent>
                  </Card>
                )
              },
              {
                id: 'metrics-table',
                component: (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        Real-time Traffic Metrics
                        <LiveStatus />
                      </CardTitle>
                      <CardDescription>
                        Current traffic conditions with 5-minute trend analysis
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <RealTimeMetricsTable intersectionId={selectedIntersection} />
                    </CardContent>
                  </Card>
                )
              },
              {
                id: 'historical-chart',
                component: (
                  <Card>
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
                )
              }
            ]}
          />
        )}

        {!selectedIntersection && (
          <EmptyState
            icon={Activity}
            title="Select an Intersection"
            description="Choose an intersection above to view detailed traffic flow analysis"
          />
        )}
      </div>
    </DashboardLayout>
  )
}