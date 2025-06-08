import { DashboardLayout } from '@/components/dashboard/layout'
import { OverviewCards, EnhancedMetricsCards } from '@/components/dashboard/overview-cards'
import { 
  TrafficFlowChart, 
  VehicleTypeChart, 
  IntersectionEfficiencyChart,
  RealTimeTrafficChart 
} from '@/components/dashboard/traffic-charts'
import { TrafficMap } from '@/components/maps/traffic-map'

export default function Home() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
            <p className="text-muted-foreground">
              Real-time traffic monitoring and analytics dashboard
            </p>
          </div>
        </div>

        {/* Main Metrics Cards */}
        <OverviewCards />
        
        {/* Enhanced Metrics */}
        <EnhancedMetricsCards />

        {/* Charts Section */}
        <div className="grid gap-6 lg:grid-cols-2">
          <TrafficFlowChart />
          <VehicleTypeChart />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <RealTimeTrafficChart />
          <IntersectionEfficiencyChart />
        </div>

        {/* Interactive Map */}
        <TrafficMap height={600} />
      </div>
    </DashboardLayout>
  )
}
