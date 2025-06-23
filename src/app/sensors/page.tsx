'use client'

import React from 'react'
import { DashboardLayout } from '@/components/dashboard/layout'
import { SensorStatusGrid } from '@/components/sensors/sensor-status-grid'
import { PageHeader } from '@/components/ui/page-header'
import { Activity, Shield } from 'lucide-react'

export default function SensorsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <PageHeader
          title="Sensor Network"
          description="Monitor sensor health, status, and capabilities across the traffic monitoring network with real-time diagnostics."
          icon={Activity}
          badge="Live Monitoring"
          actions={
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4" />
              <span>Network Health</span>
            </div>
          }
        />

        {/* Sensor Grid */}
        <div className="animate-fade-in-up">
          <SensorStatusGrid />
        </div>
      </div>
    </DashboardLayout>
  )
} 