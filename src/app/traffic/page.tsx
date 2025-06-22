'use client'

import React, { useState } from 'react'
import { DashboardLayout } from '@/components/dashboard/layout'
import { IntersectionSelector } from '@/components/traffic/intersection-selector'
import { DirectionalFlowGauges } from '@/components/traffic/directional-flow-gauges'
import { RealTimeMetricsTable } from '@/components/traffic/real-time-metrics-table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/ui/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { PageComponentList } from '@/components/ui/animated-list'
import { LiveStatus } from '@/components/ui/status-badge'
import { Activity, TrendingUp, Zap } from 'lucide-react'

export default function TrafficFlowPage() {
  const [selectedIntersection, setSelectedIntersection] = useState<string>('')

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <PageHeader
          title="Traffic Flow"
          description="Real-time traffic dynamics and intersection performance analysis powered by Server-Sent Events"
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
              Select an intersection to view detailed real-time traffic flow analysis with SSE data streams
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
                id: 'directional-flow',
                component: (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          Directional Flow Analysis
                          <Badge variant="outline" className="text-xs bg-green-100 text-green-800">
                            <Zap className="h-3 w-3 mr-1" />
                            SSE Enhanced
                          </Badge>
                        </div>
                        <LiveStatus />
                      </CardTitle>
                      <CardDescription>
                        Real-time vehicle flow rates by direction from live SSE traffic stream (vehicles/minute)
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
                        <div className="flex items-center gap-2">
                          Real-time Traffic Metrics
                          <Badge variant="outline" className="text-xs bg-green-100 text-green-800">
                            <Zap className="h-3 w-3 mr-1" />
                            SSE Enhanced
                          </Badge>
                        </div>
                        <LiveStatus />
                      </CardTitle>
                      <CardDescription>
                        Live traffic conditions with real-time updates via Server-Sent Events and sparkline trend analysis
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <RealTimeMetricsTable intersectionId={selectedIntersection} />
                    </CardContent>
                  </Card>
                )
              },
              
            ]}
          />
        )}

        {!selectedIntersection && (
          <EmptyState
            icon={Activity}
            title="Select an Intersection"
            description="Choose an intersection above to view detailed real-time traffic flow analysis with live SSE data streams"
          />
        )}
      </div>
    </DashboardLayout>
  )
}