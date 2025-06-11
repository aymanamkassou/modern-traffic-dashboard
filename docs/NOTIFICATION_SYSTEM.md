# Notification System Documentation

## Overview

The Modern Traffic Dashboard features a comprehensive notification system designed to provide real-time alerts while maintaining user control and preventing notification fatigue. The system combines toast notifications for immediate attention with a persistent notification center for historical tracking.

## Architecture

### Core Components

1. **NotificationProvider** (`/contexts/notification-context.tsx`)
   - Global state management for notifications
   - Toast preferences and settings
   - Persistent storage integration

2. **NotificationCenter** (`/components/dashboard/notification-center.tsx`)
   - Dropdown interface in the navbar
   - Notification history and management
   - User preference controls

3. **Toast Integration** (Sonner)
   - Real-time toast notifications
   - Configurable duration and behavior
   - Type-based styling and actions

### Data Flow

```
SSE Event → Activity Feed → Notification Context → Toast + Notification Center
```

## Features

### 🎬 Smooth Animations

- **Removal Animation**: Notifications slide out smoothly when removed
- **Entrance Animation**: New notifications fade in from below
- **Staggered Clearing**: Multiple notifications animate out with slight delays
- **Performance Optimized**: CSS-based animations for 60fps performance

### 🎯 Smart Notification Filtering

- **Critical Only Mode**: Show only critical alerts as toasts (default)
- **All Notifications Mode**: Show all notification types as toasts
- **Disabled Mode**: No toast notifications, only notification center

### 🔔 Toast Notification Types

| Type | Duration | Use Case | Color |
|------|----------|----------|-------|
| `critical` | 10s (persistent for wrong-way drivers) | Safety alerts, system failures | Red |
| `warning` | 6s | Traffic congestion, sensor issues | Orange |
| `info` | 4s | General updates, status changes | Blue |
| `success` | 4s | System recovery, successful actions | Green |

### 📱 Notification Center Features

- **Persistent History**: Up to 100 notifications stored locally
- **Read/Unread Status**: Visual indicators and management
- **Manual Toast Trigger**: "Show as Toast" button for missed notifications
- **Bulk Actions**: Mark all as read, clear all notifications
- **Search and Filter**: Filter by notification type
- **Responsive Design**: Works on mobile and desktop

### ⚙️ User Controls

#### Toast Settings
- **Enable/Disable Toasts**: Complete control over toast notifications
- **Critical Only Mode**: Show only critical safety alerts
- **Manual Toast Trigger**: Show any notification as toast on demand

#### Notification Management
- **Mark as Read/Unread**: Individual notification management
- **Remove Notifications**: Delete specific notifications
- **Clear All**: Bulk removal of all notifications
- **Persistent Storage**: Settings saved across sessions

## Usage Examples

### Basic Notification Creation

```typescript
import { useNotifications } from '@/contexts/notification-context'

function MyComponent() {
  const { showToast, addNotification } = useNotifications()
  
  // Show a toast notification
  const handleCriticalAlert = () => {
    showToast({
      type: 'critical',
      title: 'Wrong-Way Driver Alert',
      message: 'Vehicle detected traveling in wrong direction',
      source: 'Sensor 006',
      persistent: true,
      action: {
        label: 'View Details',
        onClick: () => navigateToSensorDetails('006')
      }
    })
  }
  
  // Add notification without toast
  const handleBackgroundUpdate = () => {
    addNotification({
      type: 'info',
      title: 'System Update',
      message: 'Traffic data synchronized successfully'
    })
  }
}
```

### Accessing User Preferences

```typescript
function NotificationSettings() {
  const { 
    toastEnabled, 
    onlyShowCriticalToasts,
    toggleToasts,
    toggleCriticalOnly 
  } = useNotifications()
  
  return (
    <div>
      <button onClick={toggleToasts}>
        {toastEnabled ? 'Disable' : 'Enable'} Toast Notifications
      </button>
      
      {toastEnabled && (
        <button onClick={toggleCriticalOnly}>
          {onlyShowCriticalToasts ? 'Show All' : 'Critical Only'} Toasts
        </button>
      )}
    </div>
  )
}
```

### Manual Toast Trigger

```typescript
function NotificationItem({ notification }) {
  const { showNotificationAsToast } = useNotifications()
  
  return (
    <div>
      <h4>{notification.title}</h4>
      <p>{notification.message}</p>
      <button onClick={() => showNotificationAsToast(notification.id)}>
        Show as Toast
      </button>
    </div>
  )
}
```

### Animated Notification Removal

```typescript
function NotificationCenter() {
  const [removingNotifications, setRemovingNotifications] = useState<Set<string>>(new Set())
  
  const handleRemoveNotification = (id: string) => {
    // Start animation
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

  return (
    <div>
      {notifications.map((notification) => {
        const isRemoving = removingNotifications.has(notification.id)
        
        return (
          <div
            key={notification.id}
            className={cn(
              "transition-all duration-300 ease-out",
              isRemoving 
                ? "animate-slide-out-right" 
                : "animate-fade-in-up"
            )}
          >
            {/* Notification content */}
          </div>
        )
      })}
    </div>
  )
}
```

## Integration with SSE Events

The notification system automatically processes Server-Sent Events from the traffic monitoring system:

### Critical Safety Alerts

```typescript
// Wrong-way driver detection
{
  type: 'wrong-way-driver',
  sensor_id: 'sensor-006',
  timestamp: '2024-01-15T10:30:00Z',
  vehicle_data: { ... }
}
// → Generates critical notification with persistent toast
```

### Traffic Conditions

```typescript
// Traffic congestion
{
  type: 'congestion',
  sensor_id: 'sensor-003',
  timestamp: '2024-01-15T10:30:00Z',
  congestion_level: 'high'
}
// → Generates warning notification (toast if enabled)
```

## Configuration

### Default Settings

```typescript
const DEFAULT_SETTINGS = {
  toastEnabled: true,
  onlyShowCriticalToasts: true,
  maxNotifications: 100,
  persistentStorage: true
}
```

### Toast Durations

```typescript
const TOAST_DURATIONS = {
  critical: 10000,    // 10 seconds
  warning: 6000,      // 6 seconds
  info: 4000,         // 4 seconds
  success: 4000       // 4 seconds
}
```

### Storage Keys

```typescript
const STORAGE_KEYS = {
  notifications: 'traffic-dashboard-notifications',
  toastSettings: 'traffic-dashboard-toast-settings'
}
```

## Best Practices

### 🎯 Notification Design

1. **Clear Titles**: Use descriptive, action-oriented titles
2. **Concise Messages**: Keep descriptions brief but informative
3. **Actionable Content**: Include relevant actions when possible
4. **Source Attribution**: Always specify the data source

### 🔔 Toast Usage

1. **Reserve for Important Events**: Don't overwhelm users
2. **Respect User Preferences**: Honor toast settings
3. **Provide Alternatives**: Always add to notification center
4. **Use Appropriate Types**: Match severity to notification type

### 📱 User Experience

1. **Progressive Disclosure**: Start with critical-only mode
2. **Easy Access**: Keep notification center easily accessible
3. **Clear Feedback**: Show current settings and status
4. **Graceful Degradation**: Work without toasts if disabled

## Accessibility

### Screen Reader Support

- Proper ARIA labels on all interactive elements
- Semantic HTML structure for notifications
- Keyboard navigation support

### Visual Indicators

- High contrast colors for notification types
- Clear read/unread visual states
- Consistent iconography

### Keyboard Navigation

- Tab navigation through notification center
- Enter/Space activation for buttons
- Escape to close dropdowns

## Performance Considerations

### Memory Management

- Automatic cleanup of old notifications (100 max)
- Efficient React re-rendering with proper memoization
- LocalStorage optimization for settings

### Network Efficiency

- Client-side notification processing
- Minimal API calls for notification management
- Efficient SSE event handling

## Troubleshooting

### Common Issues

1. **Notifications Not Appearing**
   - Check if toasts are enabled in settings
   - Verify notification type matches filter settings
   - Check browser notification permissions

2. **Storage Issues**
   - Clear localStorage if corrupted
   - Check available storage space
   - Verify JSON parsing errors in console

3. **Performance Problems**
   - Reduce notification history limit
   - Check for memory leaks in event handlers
   - Monitor SSE connection stability

### Debug Mode

Enable debug logging:

```typescript
localStorage.setItem('notification-debug', 'true')
```

## Future Enhancements

### Planned Features

1. **Notification Grouping**: Batch similar notifications
2. **Sound Alerts**: Audio notifications for critical events
3. **Email Integration**: Send critical alerts via email
4. **Mobile Push**: Native mobile notifications
5. **Analytics**: Notification engagement metrics

### API Extensions

1. **Notification Templates**: Predefined notification formats
2. **Scheduling**: Delayed notification delivery
3. **Channels**: Different notification channels (email, SMS, etc.)
4. **Webhooks**: External notification integrations

---

## Related Documentation

- [SSE Integration Guide](./SSE_INTEGRATION.md)
- [Component Architecture](./COMPONENTS_AND_PAGES.md)
- [Design Philosophy](./DESIGN_PHILOSOPHY.md)
- [API Endpoints](./API_ENDPOINTS.md)

---

*Last Updated: January 2024*
*Version: 1.0.0* 