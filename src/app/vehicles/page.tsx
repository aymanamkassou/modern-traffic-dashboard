'use client'

import React from 'react'
import { DashboardLayout } from '@/components/dashboard/layout'
import { VehicleStatsDashboard } from '@/components/vehicles/vehicle-stats-dashboard'
import { LiveVehicleLog } from '@/components/vehicles/live-vehicle-log'
import { StatusAnomalyChart } from '@/components/vehicles/status-anomaly-chart'
import { VehicleSpecsReference } from '@/components/vehicles/vehicle-specs-reference'
import { PageHeader } from '@/components/ui/page-header'
import { PageComponentList } from '@/components/ui/animated-list'
import { Car } from 'lucide-react'

export default function VehiclesPage() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <PageHeader
          title="Vehicle Analytics"
          description="Comprehensive vehicle detection, classification, and behavior analysis for traffic engineering insights."
          icon={Car}
          badge="Real-time Data"
        />

        {/* Vehicle Components */}
        <PageComponentList
          components={[
            {
              id: 'vehicle-stats',
              component: <VehicleStatsDashboard />
            },
            {
              id: 'live-log',
              component: <LiveVehicleLog />
            },
            {
              id: 'anomaly-chart',
              component: <StatusAnomalyChart />
            },
            {
              id: 'specs-reference',
              component: <VehicleSpecsReference />
            }
          ]}
        />
      </div>
    </DashboardLayout>
  )
} 