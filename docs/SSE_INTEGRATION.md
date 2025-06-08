# Server-Sent Events (SSE) Integration Guide

This document outlines how Server-Sent Events are implemented and used throughout the Modern Traffic Dashboard to provide real-time data updates.

## Overview

Server-Sent Events (SSE) enable real-time, one-way communication from the server to the client. The dashboard uses SSE to stream live traffic data, alerts, and system updates without requiring constant polling.

## SSE Hook Implementation

### `useServerSentEvents`

Located in `src/hooks/use-server-sent-events.ts`, this custom hook provides a robust SSE client with the following features:

- **Auto-reconnection** with exponential backoff
- **Event buffering** with configurable limits
- **Connection state management**
- **Error handling and recovery**
- **Cleanup on unmount**

#### Usage Example

```typescript
import { useServerSentEvents } from '@/hooks/use-server-sent-events'

const { isConnected, events, connect, disconnect } = useServerSentEvents(
  'http://localhost:3001/api/stream/activities',
  {
    maxEvents: 50,
    autoConnect: true,
    retryInterval: 3000,
    onEvent: (event) => console.log('New event:', event)
  }
)
```

## SSE Endpoints

### Backend API Endpoints

All SSE endpoints are served from the backend API (`traffic-data-API`) on port 3001:

| Endpoint | Purpose | Data Format |
|----------|---------|-------------|
| `/api/traffic/stream` | Live traffic flow data | TrafficEvent |
| `/api/vehicles/stream` | Real-time vehicle detection events | VehicleEvent |
| `/api/sensors/stream` | Sensor status and health updates | SensorEvent |
| `/api/coordination/stream` | Intersection coordination status | CoordinationEvent |

### Event Data Structures

#### ActivityEvent
```typescript
interface ActivityEvent {
  type: 'alert_critical' | 'alert_resolved' | 'intersection_upgrade' | 'intersection_offline' | 'traffic_spike' | 'sensor_fault'
  title: string
  description: string
  timestamp: string
  location: string
  severity: 'critical' | 'warning' | 'info'
  metadata?: Record<string, any>
}
```

#### RiskEvent
```typescript
interface RiskEvent {
  intersection_id: string
  risk_score: number
  risk_level: 'minimal' | 'low' | 'medium' | 'high' | 'critical'
  coordinates: { lat: number; lng: number }
  contributing_factors: string[]
  timestamp: string
}
```

#### TrafficEvent
```typescript
interface TrafficEvent {
  intersection_id: string
  direction: 'north' | 'south' | 'east' | 'west'
  vehicle_flow_rate: number
  average_speed: number
  density: number
  congestion_level: number
  timestamp: string
}
```

## Component Integration

### Components Using SSE

| Component | SSE Endpoint | Purpose | Update Frequency |
|-----------|--------------|---------|------------------|
| **RealTimeActivityFeed** | `/api/sensors/stream` | Live system events derived from sensor data | Real-time |
| **MiniRiskHeatmap** | *Custom implementation* | Risk score updates for map visualization | Every 30s |
| **LiveTrafficMetrics** | `/api/traffic/stream` | Traffic flow data for selected intersection | Real-time |
| **VehicleCountWidget** | `/api/vehicles/stream` | Live vehicle detection count | Real-time |
| **SensorStatusGrid** | `/api/sensors/stream` | Sensor health and status updates | Every 60s |
| **IntersectionCoordination** | `/api/coordination/stream` | Traffic light coordination status | Real-time |
| **OverallRiskScore** | `/api/traffic/stream` | System-wide risk derived from traffic data | Real-time |
| **SensorHealthOverview** | `/api/sensors/stream` | Real-time sensor health breakdown | Every 60s |
| **ActiveCriticalAlerts** | `/api/sensors/stream` | Live critical alerts from sensor issues | Real-time |

### SSE Component Pattern

All SSE-enabled components follow this pattern:

```typescript
'use client'

import { useServerSentEvents } from '@/hooks/use-server-sent-events'
import { useEffect, useState } from 'react'

export function MySSEComponent() {
  const [data, setData] = useState([])
  
  const { events, isConnected, error } = useServerSentEvents(
    'http://localhost:3001/api/traffic/stream?intersection_id=bd-anfa-bd-zerktouni',
    {
      autoConnect: true,
      maxEvents: 100,
      onEvent: (event) => {
        // Handle incoming event
        setData(prev => [event.data, ...prev.slice(0, 49)])
      }
    }
  )

  // Error handling UI
  if (error) {
    return <ErrorComponent error={error} />
  }

  // Connection status indicator
  return (
    <div>
      <ConnectionIndicator isConnected={isConnected} />
      {/* Component content */}
    </div>
  )
}
```

## Error Handling & Fallbacks

### Connection Status Indicators

All SSE components include visual indicators for connection status:

- **🟢 Connected**: Live data streaming
- **🟡 Reconnecting**: Attempting to reconnect
- **🔴 Disconnected**: Connection failed, showing cached data

### Graceful Degradation

When SSE connections fail:

1. **Cache Strategy**: Components display last known good data
2. **Polling Fallback**: Some components fall back to periodic API calls
3. **User Feedback**: Clear error messages and retry options
4. **Auto-Recovery**: Automatic reconnection with exponential backoff

### Error Types

```typescript
interface SSEError {
  type: 'connection_failed' | 'parse_error' | 'timeout' | 'server_error'
  message: string
  timestamp: string
  endpoint: string
}
```

## Performance Considerations

### Event Buffering

- Default buffer size: 100 events per component
- Automatic cleanup of old events
- Memory-efficient event storage

### Connection Management

- Shared connections where possible
- Automatic cleanup on component unmount
- Debounced reconnection attempts

### Browser Compatibility

- EventSource polyfill for older browsers
- Feature detection and graceful fallback
- Mobile browser optimization

## Testing SSE Integration

### Development Tools

Use the built-in Stream Tester component (`/test-api`) to:

- Test SSE endpoints manually
- View real-time event streams
- Debug connection issues
- Validate event data formats

### Example Test Cases

```typescript
// Test connection
const { isConnected } = useServerSentEvents('http://localhost:3001/api/stream/activities')
expect(isConnected).toBe(true)

// Test event reception
const { events } = useServerSentEvents(endpoint, {
  onEvent: (event) => {
    expect(event.type).toBeDefined()
    expect(event.timestamp).toBeDefined()
  }
})
```

## Security Considerations

### CORS Configuration

SSE endpoints are configured with appropriate CORS headers:

```javascript
{
  "Access-Control-Allow-Origin": "*", // Configure for production
  "Access-Control-Allow-Headers": "Cache-Control",
}
```

### Data Validation

All incoming SSE events are validated:

- JSON parsing with error handling
- Schema validation for event data
- Sanitization of user-facing content

### Rate Limiting

Backend implements rate limiting for SSE connections:

- Max connections per IP
- Event frequency limits
- Bandwidth throttling

## Production Deployment

### Load Balancing

SSE connections require sticky sessions:

- Configure load balancer for session affinity
- Use Redis for shared session state
- Implement connection health checks

### Monitoring

Track SSE performance metrics:

- Connection count and duration
- Event throughput and latency
- Error rates and types
- Client reconnection patterns

### Scaling Considerations

- Horizontal scaling with message queues
- Connection pooling and limits
- Event aggregation for high-frequency data

## Troubleshooting Guide

### Common Issues

1. **Connection Drops**
   - Check network stability
   - Verify SSE endpoint availability
   - Review browser console for errors

2. **Missing Events**
   - Confirm event format matches expected schema
   - Check server-side event publishing
   - Verify client-side event handling

3. **Performance Issues**
   - Monitor event buffer sizes
   - Check for memory leaks
   - Optimize event processing logic

### Debug Commands

```javascript
// Enable SSE debugging
localStorage.setItem('sse-debug', 'true')

// View active connections
console.log(window.__sse_connections)

// Test endpoint manually
new EventSource('http://localhost:3001/api/stream/activities')
``` 