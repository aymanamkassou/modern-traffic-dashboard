# SSE 'Message' Event Type Fix

## Issue Discovery

During testing, it was discovered that the SSE endpoints were sending events with `type: 'message'` instead of the expected typed events like `type: 'VEHICLE'`, `type: 'TRAFFIC'`, etc.

Console logs showed:
```
🚗 Vehicle SSE Event received: {type: 'message', data: {…}, timestamp: '2025-06-08T15:49:45.251Z', id: undefined}
🚗 Received non-VEHICLE event type: message
```

However, the `data` field contained the expected vehicle/traffic/sensor information:
```javascript
data: {
  id: 'c6d5b6ae-6a6c-4b92-9a72-e93784ed27a9',
  sensor_id: 'sensor-007',
  timestamp: '2025-06-08T15:49:45.251Z',
  speed_kmh: 27.984032,
  length_dm: 48,
  // ... other vehicle data
}
```

## Root Cause

The backend SSE implementation was sending generic `'message'` events (the default EventSource type) instead of custom event types. The actual data structure was correct, but the event type filtering was preventing the data from being processed.

## Solution Applied

### 1. Updated Event Handlers

All SSE event handlers in dashboard components were updated to:

1. **Check for both typed and 'message' events**
2. **Use content-based detection** to identify data types
3. **Process data regardless of event type** if it matches the expected structure

### 2. Helper Functions Added

Added data type detection functions in each component:

```typescript
// Vehicle data detection
const isVehicleData = (data: any) => {
  return data && (
    data.vehicle_id || 
    data.vehicle_class || 
    (data.speed_kmh !== undefined && data.length_dm !== undefined)
  )
}

// Traffic data detection
const isTrafficData = (data: any) => {
  return data && (
    data.congestion_level !== undefined || 
    (data.speed !== undefined && data.density !== undefined)
  )
}

// Sensor data detection
const isSensorData = (data: any) => {
  return data && (
    data.sensor_id !== undefined && 
    (data.status !== undefined || data.hw_fault !== undefined || data.low_voltage !== undefined)
  )
}
```

### 3. Updated Event Processing Logic

Before:
```typescript
if (event.type === 'VEHICLE') {
  // Process vehicle data
}
```

After:
```typescript
if (event.type === 'VEHICLE' || (event.type === 'message' && isVehicleData(event.data))) {
  // Process vehicle data
}
```

## Components Updated

### 1. KPI Grid (`modern-dashboard/src/components/dashboard/kpi-grid.tsx`)
- **LiveVehicleCountCard**: Updated to handle 'message' events with vehicle data
- **OverallRiskScoreCard**: Updated to handle 'message' events with traffic data
- **ActiveCriticalAlertsCard**: Updated to handle 'message' events with sensor data

### 2. Activity Feed (`modern-dashboard/src/components/dashboard/activity-feed.tsx`)
- Updated to handle 'message' events and convert traffic data to activities

### 3. Mini Risk Heatmap (`modern-dashboard/src/components/dashboard/mini-risk-heatmap.tsx`)
- Updated to handle 'message' events with traffic data
- Added `calculateRiskFromTrafficData` helper function
- Fixed type issues with RiskEvent structure

### 4. Sensor Health Overview (`modern-dashboard/src/components/dashboard/sensor-health-overview.tsx`)
- Updated to handle 'message' events with sensor data
- Added real-time health status updates

## Testing Results

After applying these fixes:

1. ✅ **Vehicle Count**: Now properly detects and counts vehicles from SSE stream
2. ✅ **Risk Score**: Now calculates risk based on real-time traffic data
3. ✅ **Alert Generation**: Now creates alerts from sensor status updates
4. ✅ **Activity Feed**: Now generates activities from traffic events
5. ✅ **Risk Heatmap**: Now updates risk locations in real-time
6. ✅ **Sensor Health**: Now shows live sensor status updates

## Debug Information Added

Enhanced debugging was added to all components:
- Console logging for all SSE events with detailed information
- Visual debug information in each KPI card showing connection status
- Debug info display in component UI
- Comprehensive event type and data structure logging

## Backward Compatibility

The updated event handlers maintain backward compatibility:
- Still process properly typed events (`VEHICLE`, `TRAFFIC`, `SENSOR`, etc.) if the backend is updated
- Handle generic `'message'` events with content-based detection
- No breaking changes to existing functionality

## Next Steps

1. **Backend Update** (Optional): Update backend SSE implementation to send typed events
2. **Remove Debugging** (Future): Remove debug console logs once system is stable
3. **Performance Monitoring**: Monitor performance with real-time data processing
4. **Error Handling**: Add more robust error handling for malformed data

## Technical Notes

- Event type detection is now content-based rather than type-based
- All components now work with the actual backend data format
- Added comprehensive error handling and fallback logic
- Maintained type safety with TypeScript guards 