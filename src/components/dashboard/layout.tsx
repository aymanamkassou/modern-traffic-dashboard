'use client'

import React from 'react'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from './sidebar'
import { Button } from '@/components/ui/button'
import { useAlertCount } from '@/lib/api-client'
import { Separator } from '@/components/ui/separator'
import { NotificationCenter } from './notification-center'
import { Menu, Search, User } from 'lucide-react'
import { ThemeToggle } from '../ui/theme-toggle'
import { useRouter } from 'next/navigation'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  // Get alert count for sidebar badge
  const { data: alertData } = useAlertCount({ resolved: false })
  const alertCount = (alertData as any)?.count || 0
  const route = useRouter()
  return (
    <SidebarProvider>
      <AppSidebar alertCount={alertCount} />
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-14 items-center">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <Separator orientation="vertical" className="h-6" />
            </div>
            
            <div className="flex flex-1 items-center justify-between">
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold">Traffic Monitoring Dashboard</h1>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Search Button */}
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Search className="h-4 w-4" />
                </Button>
                
                {/* Notifications */}
                <NotificationCenter />
                <ThemeToggle />
                {/* User Menu */}
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <User className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className={`flex-1 p-6`}>
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t py-4">
          <div className="container flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <span>© 2024 Traffic Monitoring System</span>
              <Separator orientation="vertical" className="h-4" />
              <span>Real-time Dashboard v2.0</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span>System Operational</span>
            </div>
          </div>
        </footer>
      </div>
    </SidebarProvider>
  )
} 