'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface TabItem {
  id: string
  label: string
  icon?: LucideIcon
  badge?: string
  content: React.ReactNode
}

interface ResponsiveTabNavigationProps {
  tabs: TabItem[]
  defaultTab?: string
  className?: string
  onTabChange?: (tabId: string) => void
}

export function ResponsiveTabNavigation({ 
  tabs, 
  defaultTab,
  className,
  onTabChange
}: ResponsiveTabNavigationProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id || '')

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
    onTabChange?.(tabId)
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Desktop Tabs */}
      <div className="hidden md:block">
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <TabsTrigger 
                  key={tab.id} 
                  value={tab.id}
                  className="flex items-center gap-2"
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <Badge variant="secondary" className="text-xs">
                      {tab.badge}
                    </Badge>
                  )}
                </TabsTrigger>
              )
            })}
          </TabsList>
          
          {tabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id} className="mt-6">
              {tab.content}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Mobile Select */}
      <div className="md:hidden space-y-4">
        <Select value={activeTab} onValueChange={handleTabChange}>
          <SelectTrigger>
            <SelectValue>
              {(() => {
                const activeTabData = tabs.find(tab => tab.id === activeTab)
                const Icon = activeTabData?.icon
                return (
                  <div className="flex items-center gap-2">
                    {Icon && <Icon className="h-4 w-4" />}
                    <span>{activeTabData?.label}</span>
                    {activeTabData?.badge && (
                      <Badge variant="secondary" className="text-xs">
                        {activeTabData.badge}
                      </Badge>
                    )}
                  </div>
                )
              })()}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <SelectItem key={tab.id} value={tab.id}>
                  <div className="flex items-center gap-2">
                    {Icon && <Icon className="h-4 w-4" />}
                    <span>{tab.label}</span>
                    {tab.badge && (
                      <Badge variant="secondary" className="text-xs ml-2">
                        {tab.badge}
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
        
        <div className="animate-fade-in-up">
          {tabs.find(tab => tab.id === activeTab)?.content}
        </div>
      </div>
    </div>
  )
} 