'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { toast } from 'sonner'

export interface Notification {
  id: string
  type: 'critical' | 'warning' | 'info' | 'success'
  title: string
  message: string
  timestamp: string
  read: boolean
  persistent?: boolean
  source?: string
  action?: {
    label: string
    onClick: () => void
  }
}

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  toastEnabled: boolean
  onlyShowCriticalToasts: boolean
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void
  removeNotification: (id: string) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  clearAll: () => void
  showToast: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>, forceShow?: boolean) => void
  toggleToasts: () => void
  toggleCriticalOnly: () => void
  showNotificationAsToast: (notificationId: string) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

const STORAGE_KEY = 'traffic-dashboard-notifications'
const TOAST_SETTINGS_KEY = 'traffic-dashboard-toast-settings'
const MAX_NOTIFICATIONS = 100

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [toastEnabled, setToastEnabled] = useState<boolean>(true)
  const [onlyShowCriticalToasts, setOnlyShowCriticalToasts] = useState<boolean>(true)

  // Load notifications and toast settings from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsedNotifications = JSON.parse(stored)
        setNotifications(parsedNotifications.slice(0, MAX_NOTIFICATIONS))
      }
      
      const toastSettings = localStorage.getItem(TOAST_SETTINGS_KEY)
      if (toastSettings) {
        const settings = JSON.parse(toastSettings)
        setToastEnabled(settings.toastEnabled ?? true)
        setOnlyShowCriticalToasts(settings.onlyShowCriticalToasts ?? true)
      }
    } catch (error) {
      console.error('Failed to load settings from storage:', error)
    }
  }, [])

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications))
    } catch (error) {
      console.error('Failed to save notifications to storage:', error)
    }
  }, [notifications])

  const addNotification = useCallback((notificationData: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const notification: Notification = {
      ...notificationData,
      id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      read: false,
    }

    setNotifications(prev => {
      const newNotifications = [notification, ...prev]
      // Keep only the latest MAX_NOTIFICATIONS
      return newNotifications.slice(0, MAX_NOTIFICATIONS)
    })

    return notification
  }, [])

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }, [])

  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  const toggleToasts = useCallback(() => {
    const newValue = !toastEnabled
    setToastEnabled(newValue)
    try {
      const settings = { toastEnabled: newValue, onlyShowCriticalToasts }
      localStorage.setItem(TOAST_SETTINGS_KEY, JSON.stringify(settings))
    } catch (error) {
      console.error('Failed to save toast settings:', error)
    }
  }, [toastEnabled, onlyShowCriticalToasts])

  const toggleCriticalOnly = useCallback(() => {
    const newValue = !onlyShowCriticalToasts
    setOnlyShowCriticalToasts(newValue)
    try {
      const settings = { toastEnabled, onlyShowCriticalToasts: newValue }
      localStorage.setItem(TOAST_SETTINGS_KEY, JSON.stringify(settings))
    } catch (error) {
      console.error('Failed to save toast settings:', error)
    }
  }, [toastEnabled, onlyShowCriticalToasts])

  const showNotificationAsToast = useCallback((notificationId: string) => {
    const notification = notifications.find(n => n.id === notificationId)
    if (notification) {
      showToastInternal(notification, true)
    }
  }, [notifications])

  const showToastInternal = useCallback((notificationData: Notification | Omit<Notification, 'id' | 'timestamp' | 'read'>, forceShow = false) => {
    // Check if toasts are enabled or if this is a forced show
    if (!forceShow && (!toastEnabled || (onlyShowCriticalToasts && notificationData.type !== 'critical'))) {
      return
    }

    // Show toast based on type
    const toastOptions = {
      description: notificationData.message,
      action: notificationData.action ? {
        label: notificationData.action.label,
        onClick: notificationData.action.onClick,
      } : undefined,
    }

    switch (notificationData.type) {
      case 'critical':
        toast.error(notificationData.title, {
          ...toastOptions,
          duration: notificationData.persistent ? Infinity : 10000, // 10 seconds for critical
        })
        break
      case 'warning':
        toast.warning(notificationData.title, {
          ...toastOptions,
          duration: 6000, // 6 seconds for warnings
        })
        break
      case 'success':
        toast.success(notificationData.title, {
          ...toastOptions,
          duration: 4000, // 4 seconds for success
        })
        break
      case 'info':
      default:
        toast.info(notificationData.title, {
          ...toastOptions,
          duration: 4000, // 4 seconds for info
        })
        break
    }
  }, [toastEnabled, onlyShowCriticalToasts])

  const showToast = useCallback((notificationData: Omit<Notification, 'id' | 'timestamp' | 'read'>, forceShow = false) => {
    // Add to notification history
    const notification = addNotification(notificationData)

    // Show toast if enabled or forced
    showToastInternal(notification, forceShow)

    return notification
  }, [addNotification, showToastInternal])

  const unreadCount = notifications.filter(n => !n.read).length

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    toastEnabled,
    onlyShowCriticalToasts,
    addNotification,
    removeNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
    showToast,
    toggleToasts,
    toggleCriticalOnly,
    showNotificationAsToast,
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
} 