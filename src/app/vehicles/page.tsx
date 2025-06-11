'use client'

import React from 'react'
import { DashboardLayout } from '@/components/dashboard/layout'
import { VehicleStatsDashboard } from '@/components/vehicles/vehicle-stats-dashboard'
import { LiveVehicleLog } from '@/components/vehicles/live-vehicle-log'
import { StatusAnomalyChart } from '@/components/vehicles/status-anomaly-chart'
import { VehicleSpecsReference } from '@/components/vehicles/vehicle-specs-reference'

export default function VehiclesPage() {
  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in-up">
        {/* Page Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Vehicle Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive vehicle detection, classification, and behavior analysis for traffic engineering insights.
          </p>
        </div>

        {/* Vehicle Statistics Dashboard */}
        <VehicleStatsDashboard />

        {/* Live Vehicle Log */}
        <LiveVehicleLog />

        {/* Status Anomaly Analysis */}
        <StatusAnomalyChart />

        {/* Vehicle Specifications Reference */}
        <VehicleSpecsReference />
      </div>
    </DashboardLayout>
  )
} 