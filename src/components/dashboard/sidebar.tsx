'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  BarChart3,
  Car,
  MapPin,
  Radio,
  AlertTriangle,
  Home,
  Settings,
  Activity,
  Navigation,
  TestTube,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

// Navigation items configuration
const navigationItems = [
  {
    title: 'Overview',
    url: '/',
    icon: Home,
    description: 'Dashboard overview and key metrics',
  },
  {
    title: 'Traffic Flow',
    url: '/traffic',
    icon: Activity,
    description: 'Real-time traffic monitoring',
  },
  {
    title: 'Vehicles',
    url: '/vehicles',
    icon: Car,
    description: 'Vehicle analytics and tracking',
  },
  {
    title: 'Intersections',
    url: '/intersections',
    icon: Navigation,
    description: 'Intersection coordination and management',
  },
  {
    title: 'Sensors',
    url: '/sensors',
    icon: Radio,
    description: 'Sensor health and status monitoring',
  },
  {
    title: 'Map View',
    url: '/map',
    icon: MapPin,
    description: 'Interactive traffic map',
  },
  {
    title: 'Analytics',
    url: '/analytics',
    icon: BarChart3,
    description: 'Advanced traffic analytics',
  },
  {
    title: 'Alerts',
    url: '/alerts',
    icon: AlertTriangle,
    description: 'Traffic alerts and incidents',
  },
  {
    title: 'API Testing',
    url: '/test-api',
    icon: TestTube,
    description: 'Test API endpoints and streams',
  },
]

const settingsItems = [
  {
    title: 'Settings',
    url: '/settings',
    icon: Settings,
    description: 'Application settings',
  },
]

interface AppSidebarProps {
  alertCount?: number
}

export function AppSidebar({ alertCount = 0 }: AppSidebarProps) {
  const pathname = usePathname()

  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Activity className="h-4 w-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">Traffic Monitor</span>
            <span className="truncate text-xs text-muted-foreground">
              Real-time Dashboard
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => {
                const isActive = pathname === item.url
                const Icon = item.icon
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.description}
                    >
                      <Link href={item.url} className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span>{item.title}</span>
                        {item.title === 'Alerts' && alertCount > 0 && (
                          <Badge 
                            variant="destructive" 
                            className="ml-auto h-5 w-5 rounded-full p-0 text-xs"
                          >
                            {alertCount > 99 ? '99+' : alertCount}
                          </Badge>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>System</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems.map((item) => {
                const isActive = pathname === item.url
                const Icon = item.icon
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.description}
                    >
                      <Link href={item.url} className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="p-4">
          <div className="rounded-lg bg-muted/50 p-3">
            <div className="flex items-center gap-2 text-sm">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-muted-foreground">System Online</span>
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
} 