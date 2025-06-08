import { Suspense } from 'react'
import { DashboardLayout } from '@/components/dashboard/layout'
import { KPIGrid } from '@/components/dashboard/kpi-grid'
import { MiniRiskHeatmap } from '@/components/dashboard/mini-risk-heatmap'
import { RealTimeActivityFeed } from '@/components/dashboard/activity-feed'
import { TwentyFourHourTrendChart } from '@/components/dashboard/trend-chart'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Monitor, 
  Activity, 
  MapPin, 
  TrendingUp,
  AlertTriangle,
  Shield,
  Zap,
  ExternalLink
} from 'lucide-react'
import Link from 'next/link'
import { SSEDebugPanel } from '@/components/dashboard/sse-debug'
import Image from "next/image"
import { Progress } from "@/components/ui/progress"
import { SensorHealthOverview } from "@/components/dashboard/sensor-health-overview"

// Loading skeleton components
function KPIGridSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardContent className="p-6">
            <div className="space-y-3">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-8 bg-muted rounded w-1/2" />
              <div className="h-3 bg-muted rounded w-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function ComponentSkeleton({ height = "h-80" }: { height?: string }) {
  return (
    <Card className="animate-pulse">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="h-4 bg-muted rounded w-1/3" />
          <div className={`bg-muted rounded ${height}`} />
        </div>
      </CardContent>
    </Card>
  )
}

// Quick Action Cards
function QuickActions() {
  const actions = [
    {
      title: 'View Full Map',
      description: 'Interactive traffic monitoring',
      icon: MapPin,
      href: '/map',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    },
    {
      title: 'Traffic Analysis',
      description: 'Detailed flow metrics',
      icon: TrendingUp,
      href: '/traffic',
      color: 'text-green-500',
      bgColor: 'bg-green-500/10'
    },
    {
      title: 'Alert Management',
      description: 'Critical system alerts',
      icon: AlertTriangle,
      href: '/alerts',
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10'
    },
    {
      title: 'System Health',
      description: 'Sensor status & diagnostics',
      icon: Shield,
      href: '/sensors',
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10'
    }
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {actions.map((action) => {
        const Icon = action.icon
        return (
          <Link key={action.href} href={action.href}>
            <Card className="group hover:shadow-md transition-all duration-200 cursor-pointer border-muted hover:border-border">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${action.bgColor} group-hover:scale-110 transition-transform`}>
                    <Icon className={`h-4 w-4 ${action.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm group-hover:text-primary transition-colors">
                      {action.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {action.description}
                    </p>
                  </div>
                  <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </CardContent>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}

// System Status Banner
function SystemStatusBanner() {
  return (
    <Card className="border-green-500/20 bg-green-500/5">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm font-medium">System Operational</span>
            </div>
            <Badge variant="outline" className="text-xs border-green-500/30 text-green-700">
              All Services Online
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Monitor className="h-3 w-3" />
              <span>98.7% Uptime</span>
            </div>
            <div className="flex items-center gap-1">
              <Zap className="h-3 w-3" />
              <span>142ms Avg Response</span>
            </div>
            <div className="flex items-center gap-1">
              <Activity className="h-3 w-3" />
              <span>Real-time Data</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Main Overview Page
export default function OverviewPage() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Traffic Control Center</h1>
              <p className="text-muted-foreground mt-1">
                Real-time monitoring and intelligent traffic management system
              </p>
            </div>
            <Badge variant="outline" className="text-xs">
              Live Dashboard
            </Badge>
          </div>
          
          {/* System Status Banner */}
          <SystemStatusBanner />
        </div>

        {/* KPI Grid - Primary Metrics */}
        <section className="space-y-6">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">System Overview</h2>
            <Badge variant="secondary" className="text-xs">Real-time</Badge>
          </div>
          
          <Suspense fallback={<KPIGridSkeleton />}>
            <KPIGrid />
          </Suspense>
        </section>

        {/* Main Content Grid */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column - Charts and Analysis */}
          <div className="lg:col-span-2 space-y-8">
            {/* 24-Hour Trend Chart */}
            <section className="space-y-6">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold">Traffic Trends</h2>
                <Badge variant="outline" className="text-xs">24 Hours</Badge>
              </div>
              
              <Suspense fallback={<ComponentSkeleton height="h-96" />}>
                <TwentyFourHourTrendChart />
              </Suspense>
            </section>

            {/* Mini Risk Heatmap */}
            <section className="space-y-6">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold">Risk Assessment</h2>
                <Badge variant="outline" className="text-xs">Geographic View</Badge>
              </div>
              
              <Suspense fallback={<ComponentSkeleton height="h-80" />}>
                <MiniRiskHeatmap />
              </Suspense>
            </section>
          </div>

          {/* Right Column - Activity Feed */}
          <div className="space-y-8">
            <section className="space-y-6">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold">Live Activity</h2>
                <Badge variant="outline" className="text-xs">Real-time Events</Badge>
              </div>
              
              <Suspense fallback={<ComponentSkeleton height="h-96" />}>
                <RealTimeActivityFeed />
              </Suspense>
            </section>
          </div>
        </div>

        {/* System Health Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
          <SensorHealthOverview />
        </div>

        {/* Quick Actions Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">Quick Actions</h2>
            <Badge variant="outline" className="text-xs">Navigation</Badge>
          </div>
          
          <QuickActions />
        </section>

        {/* Footer Information */}
        <div className="pt-8 border-t">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <span>Last updated: {new Date().toLocaleTimeString()}</span>
              <span>•</span>
              <span>Data refresh: Every 30 seconds</span>
            </div>
            <div className="flex items-center gap-1">
              <Activity className="h-3 w-3" />
              <span>Connected to traffic monitoring network</span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
