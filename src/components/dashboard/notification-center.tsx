'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useNotifications, type Notification } from '@/contexts/notification-context'
import { 
  Bell, 
  BellRing, 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  CheckCircle,
  X,
  MoreHorizontal,
  Trash2,
  Check,
  CheckCheck,
  Volume2,
  VolumeX,
  Settings,
  Zap
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

export function NotificationCenter() {
  const { 
    notifications, 
    unreadCount, 
    toastEnabled,
    onlyShowCriticalToasts,
    markAsRead, 
    markAllAsRead, 
    removeNotification, 
    clearAll,
    toggleToasts,
    toggleCriticalOnly,
    showNotificationAsToast
  } = useNotifications()

  // Track notifications being removed for animation
  const [removingNotifications, setRemovingNotifications] = useState<Set<string>>(new Set())

  // Animated remove function
  const handleRemoveNotification = (id: string) => {
    setRemovingNotifications(prev => new Set(prev).add(id))
    
    // Delay actual removal to allow animation to complete
    setTimeout(() => {
      removeNotification(id)
      setRemovingNotifications(prev => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
    }, 300) // Match animation duration
  }

  // Animated clear all function
  const handleClearAll = () => {
    // Add all notification IDs to removing set
    const allIds = new Set(notifications.map(n => n.id))
    setRemovingNotifications(allIds)
    
    // Stagger the actual removal for a nice effect
    setTimeout(() => {
      clearAll()
      setRemovingNotifications(new Set())
    }, 300)
  }

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-orange-500" />
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'info':
      default:
        return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  const getNotificationColors = (type: Notification['type'], read: boolean) => {
    const baseColors = {
      critical: 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20',
      warning: 'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20',
      success: 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20',
      info: 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20',
    }

    if (read) {
      return 'border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950/20 opacity-75'
    }

    return baseColors[type]
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 relative">
          {unreadCount > 0 ? (
            <BellRing className="h-4 w-4" />
          ) : (
            <Bell className="h-4 w-4" />
          )}
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end" 
        side="bottom"
        className="w-96 p-0 max-h-[80vh] relative"
        avoidCollisions={true}
        collisionPadding={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-base">Notifications</h3>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-xs font-mono">
                {unreadCount} new
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="h-7 px-3 text-xs"
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                Mark all read
              </Button>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={toggleToasts}>
                  {toastEnabled ? (
                    <>
                      <VolumeX className="h-4 w-4 mr-2" />
                      Disable toasts
                    </>
                  ) : (
                    <>
                      <Volume2 className="h-4 w-4 mr-2" />
                      Enable toasts
                    </>
                  )}
                </DropdownMenuItem>
                {toastEnabled && (
                  <DropdownMenuItem onClick={toggleCriticalOnly}>
                    <Zap className="h-4 w-4 mr-2" />
                    {onlyShowCriticalToasts ? 'Show all toasts' : 'Critical toasts only'}
                  </DropdownMenuItem>
                )}
                {notifications.length > 0 && (
                  <>
                    <Separator />
                    <DropdownMenuItem onClick={handleClearAll} className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear all
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Toast Status Indicator */}
        {!toastEnabled && (
          <div className="px-5 py-3 bg-muted/50 border-b">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <VolumeX className="h-3 w-3" />
              <span>Toast notifications disabled</span>
            </div>
          </div>
        )}
        
        {toastEnabled && onlyShowCriticalToasts && (
          <div className="px-5 py-3 bg-orange-50 dark:bg-orange-950/20 border-b">
            <div className="flex items-center gap-2 text-xs text-orange-700 dark:text-orange-300">
              <Zap className="h-3 w-3" />
              <span>Only showing critical alerts as toasts</span>
            </div>
          </div>
        )}

        {/* Notifications List */}
        <div className="flex-1 overflow-hidden">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No notifications</p>
              <p className="text-xs">You're all caught up!</p>
            </div>
          ) : (
            <ScrollArea className="h-[50vh]">
              <div className="p-4 space-y-4">
                {notifications.map((notification) => {
                  const isRemoving = removingNotifications.has(notification.id)
                  
                  return (
                    <div
                      key={notification.id}
                      className={cn(
                        "p-5 rounded-lg border cursor-pointer group",
                        "transition-all duration-300 ease-out",
                        "hover:shadow-sm",
                        getNotificationColors(notification.type, notification.read),
                        // Animation classes
                        isRemoving 
                          ? "animate-slide-out-right" 
                          : "animate-fade-in-up"
                      )}
                      onClick={() => !notification.read && markAsRead(notification.id)}
                    >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className={cn(
                            "text-sm leading-tight",
                            !notification.read && "font-medium"
                          )}>
                            {notification.title}
                          </h4>
                          
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {!notification.read && (
                              <div className="w-2 h-2 rounded-full bg-blue-500" />
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleRemoveNotification(notification.id)
                              }}
                              className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 hover:bg-destructive/10"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                          {notification.message}
                        </p>
                        
                        <div className="mt-4 space-y-3">
                          {/* Timestamp and source info */}
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {notification.source && (
                              <>
                                <span className="font-mono">{notification.source}</span>
                                <Separator orientation="vertical" className="h-3" />
                              </>
                            )}
                            <span className="font-mono">
                              {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                            </span>
                          </div>
                          
                          {/* Action buttons */}
                          <div className="flex items-center gap-2">
                            {!toastEnabled || (onlyShowCriticalToasts && notification.type !== 'critical') ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  showNotificationAsToast(notification.id)
                                }}
                                className="h-8 px-4 text-xs flex-1"
                              >
                                <Volume2 className="h-3 w-3 mr-2" />
                                Show Toast
                              </Button>
                            ) : null}
                            
                            {notification.action && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  notification.action?.onClick()
                                }}
                                className="h-8 px-4 text-xs flex-1"
                              >
                                {notification.action.label}
                              </Button>
                            )}
                          </div>
                                                  </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Footer - Fixed at bottom */}
        {notifications.length > 0 && (
          <div className="border-t bg-background p-4">
            <p className="text-xs text-muted-foreground text-center font-mono">
              {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 