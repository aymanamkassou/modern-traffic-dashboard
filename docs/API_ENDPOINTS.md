# Traffic Data API Endpoints Documentation

## Base Configuration

**Base URL**: `http://localhost:3001`  
**API Version**: 2.0  
**Content Type**: `application/json`

---

## 🚦 Core Endpoints

### Traffic Data

#### GET `/api/traffic`
Retrieve traffic data with enhanced intersection coordination fields.

```typescript
interface TrafficQueryParams {
  page?: number;
  limit?: number;
  sensor_id?: string;
  intersection_id?: string;
  sensor_direction?: 'north' | 'south' | 'east' | 'west';
  start?: string;
  end?: string;
  weather_condition?: string;
  min_speed?: number;
  max_speed?: number;
  min_density?: number;
  max_density?: number;
  include_enhanced?: boolean;
}

interface TrafficResponse {
  data: TrafficData[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
  enhancement_info: {
    enhanced_records: number;
    legacy_records: number;
    enhancement_rate: number;
  };
}

interface TrafficData {
  _id: string;
  sensor_id: string;
  timestamp: string;
  location_id: string;
  location_x: number;
  location_y: number;
  density: number;
  travel_time: number;
  vehicle_number: number;
  speed: number;
  congestion_level: 'low' | 'medium' | 'high' | 'critical';
  intersection_id?: string;
  sensor_direction?: 'north' | 'south' | 'east' | 'west';
  coordinated_weather?: WeatherState;
  traffic_light_phase?: 'green' | 'yellow' | 'red';
  vehicle_flow_rate?: number;
  queue_propagation_factor?: number;
  received_at: string;
  schema_version: string;
}

interface WeatherState {
  conditions: 'sunny' | 'rain' | 'snow' | 'fog';
  temperature: number;
  humidity: number;
  wind_speed: number;
  visibility: 'good' | 'fair' | 'poor';
  road_condition: 'dry' | 'wet' | 'icy';
}
```

#### GET `/api/traffic/stream` ⚡ SSE
Real-time traffic data stream using Server-Sent Events.

```typescript
interface TrafficStreamParams {
  intersection_id?: string;
  sensor_direction?: string;
}

interface TrafficStreamEvent {
  type: 'TRAFFIC';
  data: TrafficData;
  timestamp: string;
  enhanced: boolean;
}
```

---

### Vehicle Data

#### GET `/api/vehicles`
Retrieve vehicle records with enhanced filtering.

```typescript
interface VehicleQueryParams {
  page?: number;
  limit?: number;
  sensor_id?: string;
  intersection_id?: string;
  sensor_direction?: string;
  vehicle_class?: string;
  weather_condition?: string;
  start?: string;
  end?: string;
  min_speed?: number;
  max_speed?: number;
  status_filter?: string[];
}

interface VehicleResponse {
  data: VehicleRecord[];
  pagination: PaginationInfo;
  enhancement_info: EnhancementInfo;
  specifications: VehicleSpecifications;
}

interface VehicleRecord {
  _id: string;
  sensor_id: string;
  timestamp: string;
  location_id: string;
  location_x: number;
  location_y: number;
  vehicle_id: string;
  vehicle_class: 'passenger_car' | 'suv' | 'pickup_truck' | 'motorcycle' | 'bus' | 'semi_truck' | 'delivery_van';
  length_dm: number;
  speed_kmh: number;
  status: number;
  intersection_id?: string;
  sensor_direction?: string;
  coordinated_weather?: WeatherState;
  decoded_status: {
    hardware_fault: boolean;
    low_voltage: boolean;
    wrong_way_driver: boolean;
    queue_detected: boolean;
  };
}
```

#### GET `/api/vehicles/stats`
Enhanced vehicle statistics with intersection coordination.

```typescript
interface VehicleStatsResponse {
  overall_stats: {
    total_vehicles: number;
    enhanced_records: number;
    enhancement_rate: number;
    avg_speed: number;
    avg_length: number;
    unique_sensors: number;
    time_range: {
      start: string;
      end: string;
    };
  };
  vehicle_class_breakdown: {
    class: string;
    count: number;
    percentage: number;
    avg_speed: number;
    avg_length: number;
  }[];
  intersection_analysis?: {
    intersection_id: string;
    direction_breakdown: {
      direction: string;
      count: number;
      avg_speed: number;
      unique_vehicles: number;
    }[];
    total_intersection_vehicles: number;
  }[];
  status_analysis: {
    total_faults: number;
    wrong_way_incidents: number;
    queue_detections: number;
    low_voltage_alerts: number;
  };
}
```

#### GET `/api/vehicles/stream` ⚡ SSE
Real-time vehicle data stream.

```typescript
interface VehicleStreamEvent {
  type: 'VEHICLE';
  data: VehicleRecord;
  timestamp: string;
  enhanced: boolean;
}
```

---

### Intersection Data

#### GET `/api/intersections`
Retrieve intersection data with coordination capabilities.

```typescript
interface IntersectionQueryParams {
  page?: number;
  limit?: number;
  intersection_id?: string;
  has_coordination?: boolean;
  min_efficiency?: number;
  include_sensors?: boolean;
}

interface IntersectionResponse {
  data: IntersectionData[];
  pagination: PaginationInfo;
  coordination_summary: {
    total_intersections: number;
    coordinated_intersections: number;
    avg_efficiency: number;
  };
}

interface IntersectionData {
  _id: string;
  sensor_id: string;
  timestamp: string;
  intersection_id: string;
  stopped_vehicles_count: number;
  average_wait_time: number;
  left_turn_count: number;
  right_turn_count: number;
  through_count: number;
  coordinated_light_status?: string;
  phase_time_remaining?: number;
  intersection_efficiency?: number;
  total_intersection_vehicles?: number;
}
```

---

### Sensor Management

#### GET `/api/sensors/status`
Sensor status monitoring and health data.

```typescript
interface SensorStatusResponse {
  data: SensorStatusData[];
}

interface SensorStatusData {
  _id: string;
  sensor_id: string;
  timestamp: string;
  status: 'healthy' | 'warning' | 'critical' | 'offline';
  battery_level?: number;
  signal_strength?: number;
  temperature_c?: number;
  hw_fault?: boolean;
  low_voltage?: boolean;
  uptime_s?: number;
  issues: string[];
  last_maintenance?: string;
  error_codes?: string[];
}
```

#### GET `/api/sensors/registry`
Complete sensor registry with capabilities.

```typescript
interface SensorRegistryResponse {
  total_sensors: number;
  sensors: RegisteredSensor[];
}

interface RegisteredSensor {
  sensor_id: string;
  intersection_id?: string;
  sensor_direction?: string;
  type: string;
  enhanced_features: boolean;
  capabilities: {
    intersection_coordination?: boolean;
    weather_sync?: boolean;
    flow_rate_detection?: boolean;
    queue_propagation?: boolean;
    efficiency_metrics?: boolean;
    traffic_flow?: boolean;
    density_detection?: boolean;
    speed_detection?: boolean;
    incident_detection?: boolean;
    weather_monitoring?: boolean;
  };
  status: 'active' | 'inactive';
  first_seen: string;
  last_seen: string;
  data_points: number;
}
```

#### GET `/api/sensors/map`
Geo-spatial sensor map data for visualization.

```typescript
interface SensorMapResponse {
  type: 'FeatureCollection';
  features: SensorMapFeature[];
  metadata: {
    total_sensors: number;
    sensors_with_direction: number;
    data_sources: {
      traffic_collection: number;
      intersection_collection: number;
    };
  };
}

interface SensorMapFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
  properties: {
    sensor_id: string;
    intersection_id?: string;
    sensor_direction?: string;
    last_seen: string;
  };
}
```

#### GET `/api/sensors/stream` ⚡ SSE
Real-time sensor health data stream.

```typescript
interface SensorStreamEvent {
  type: 'SENSOR';
  data: SensorStatusData;
  timestamp: string;
}
```

---

## 🚨 Risk Analysis & Alerts

### Risk Analysis

#### GET `/api/risk/analysis`
Comprehensive multi-factor risk assessment.

```typescript
interface RiskAnalysisParams {
  intersection_id?: string;
  sensor_id?: string;
  location_id?: string;
  include_historical?: boolean;
  time_window?: number;
}

interface RiskAnalysisResponse {
  risk_analysis: {
    overall_risk: {
      score: number;
      level: 'critical' | 'high' | 'medium' | 'low';
      timestamp: string;
      confidence: number;
    };
    risk_breakdown: {
      traffic: number;
      intersection: number;
      environment: number;
      incidents: number;
    };
    risk_factors: {
      category: string;
      factor: string;
      severity: string;
      value: number;
      threshold: number;
      description: string;
      impact: string;
    }[];
  };
  current_conditions: {
    traffic_data: TrafficData | null;
    intersection_data: IntersectionData | null;
    recent_alerts: {
      count: number;
      time_window_minutes: number;
      high_severity_count: number;
      alerts: AlertData[];
    };
    weather_conditions: WeatherState | null;
  };
  recommendations: {
    priority: string;
    action: string;
    description: string;
    estimated_impact: string;
    timeframe: string;
  }[];
}
```

#### GET `/api/risk/heatmap`
Geographical risk mapping with multi-location aggregation.

```typescript
interface RiskHeatmapResponse {
  heatmap_data: {
    location: {
      intersection_id: string;
      sensor_id: string;
      coordinates: {
        lat: number;
        lng: number;
      };
      name?: string;
    };
    risk_score: number;
    risk_level: string;
    last_updated: string;
    stats: {
      traffic: {
        avg_speed: number;
        avg_density: number;
        incident_count: number;
        congestion_level: string;
      };
      intersection: {
        avg_wait_time: number;
        total_collisions: number;
        risky_behavior_incidents: number;
        efficiency_score: number;
      };
      alerts: {
        alert_count: number;
        high_severity_count: number;
        recent_incidents: number;
      };
    };
  }[];
  summary: {
    total_locations: number;
    time_window_hours: number;
    risk_distribution: {
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
    statistics: {
      average_risk_score: number;
      median_risk_score: number;
      max_risk_score: number;
      min_risk_score: number;
    };
  };
}
```

### Alert Management

#### GET `/api/alerts`
Traffic alerts with comprehensive filtering.

```typescript
interface AlertQueryParams {
  page?: number;
  limit?: number;
  type?: string;
  sensor_id?: string;
  severity?: string;
  resolved?: boolean;
  start?: string;
  end?: string;
}

interface AlertResponse {
  data: AlertData[];
  pagination: PaginationInfo;
}

interface AlertData {
  _id: string;
  sensor_id: string;
  timestamp: string;
  type: 'congestion' | 'accident' | 'weather' | 'sensor_fault';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  location_id: string;
  intersection_id?: string;
  resolved: boolean;
  resolution_time?: number;
  resolution_message?: string;
  alert_details: {
    trigger_conditions: any;
    affected_area: {
      intersection_id?: string;
      sensor_ids: string[];
      estimated_impact_radius: number;
    };
    recommended_actions: string[];
  };
}
```

#### GET `/api/alerts/count`

Alert count with advanced filtering.

**Query Parameters:** Same as `/api/alerts`

**Response:**
```typescript
interface AlertCountResponse {
  count: number;
  filters: {
    type: string | null;
    sensor_id: string | null;
    severity: string | null;
    resolved: boolean | null;
    time_range: {
      start: string | null;
      end: string | null;
    };
  };
}
```

#### GET `/api/alerts/stream` ⚡ SSE

Real-time alert data stream using Server-Sent Events.

**Query Parameters:**
```typescript
interface AlertStreamParams {
  type?: string;           // Filter by alert type
  severity?: string;       // Filter by severity level
  sensor_id?: string;      // Filter by specific sensor
  intersection_id?: string; // Filter by intersection
}
```

**Response Stream:**
```typescript
interface AlertStreamEvent {
  type: 'ALERT';
  data: AlertData;
  timestamp: string;
}
```

**Frontend Integration Example:**
```typescript
const eventSource = new EventSource('/api/alerts/stream?severity=high,critical');

eventSource.onmessage = (event) => {
  const update: AlertStreamEvent = JSON.parse(event.data);
  // Handle real-time alert
  console.log('New alert:', update.data);
};
```

---

## 🎯 Coordination Intelligence

#### GET `/api/coordination/intersections`
All intersections coordination overview.

```typescript
interface CoordinationOverviewResponse {
  intersections: {
    intersection_id: string;
    coordinates: [number, number];
    coordination_status: {
      is_coordinated: boolean;
      mode: string;
      last_update: string;
      uptime_percentage: number;
    };
    performance_metrics: {
      efficiency_score: number;
      total_vehicles: number;
      avg_wait_time: number;
      light_cycle_efficiency: number;
    };
    sensor_health: {
      total_sensors: number;
      active_sensors: number;
      sensor_directions: string[];
      health_status: string;
    };
  }[];
  system_overview: {
    total_intersections: number;
    coordinated_intersections: number;
    coordination_rate: number;
    performance_summary: {
      avg_system_efficiency: number;
      total_vehicles_managed: number;
      avg_response_time_ms: number;
    };
  };
}
```

#### GET `/api/coordination/intersections/:id/status`
Comprehensive coordination status for specific intersection.

```typescript
interface IntersectionCoordinationStatus {
  intersection_id: string;
  coordination_details: {
    mode: string;
    status: string;
    last_update: string;
    uptime_24h: number;
    capabilities: {
      weather_synchronization: boolean;
      traffic_light_coordination: boolean;
      flow_tracking: boolean;
      multi_sensor_coordination: boolean;
    };
  };
  sensor_coordination: {
    total_sensors: number;
    active_sensors: number;
    sensor_details: {
      direction: string;
      sensor_id: string;
      status: string;
      last_data: string;
      data_quality: number;
      current_metrics: {
        vehicle_count: number;
        avg_speed: number;
        flow_rate: number;
        queue_length: number;
      };
    }[];
  };
  traffic_light_coordination: {
    current_phase: string;
    phase_remaining: number;
    cycle_efficiency: number;
  };
}
```

#### GET `/api/coordination/stream` ⚡ SSE
Real-time coordination updates stream.

```typescript
interface CoordinationStreamEvent {
  type: 'COORDINATION';
  intersection_id: string;
  coordination_update: {
    light_phase_change?: {
      previous: string;
      current: string;
      phase_remaining: number;
    };
    efficiency_update?: {
      current_efficiency: number;
      trend: string;
    };
    flow_rate_change?: {
      direction: string;
      previous_rate: number;
      current_rate: number;
    };
    weather_sync_update?: WeatherState;
  };
  timestamp: string;
}
```

---

## 📊 Historical Analytics

#### GET `/api/historical/traffic`
Historical traffic pattern analysis.

```typescript
interface HistoricalTrafficParams {
  start?: string;
  end?: string;
  aggregation?: 'hour' | 'day' | 'week' | 'month';
  intersection_id?: string;
  sensor_id?: string;
  include_weather?: boolean;
}

interface HistoricalTrafficResponse {
  traffic_patterns: {
    timestamp: string;
    period: string;
    metrics: {
      avg_density: number;
      avg_speed: number;
      avg_travel_time: number;
      total_vehicles: number;
      congestion_duration_minutes: number;
    };
    density_speed_correlation: {
      correlation_coefficient: number;
      relationship: string;
    };
    peak_analysis: {
      is_peak_hour: boolean;
      peak_type: string;
      intensity: number;
    };
  }[];
  summary: {
    time_range: {
      start: string;
      end: string;
      total_periods: number;
    };
    overall_patterns: {
      avg_density: number;
      avg_speed: number;
      peak_hours: number[];
      lowest_traffic_hours: number[];
    };
  };
}
```

---

## 🔄 Server-Sent Events (SSE) Summary

### Available SSE Endpoints

| Endpoint | Event Type | Description |
|----------|------------|-------------|
| `/api/traffic/stream` | `TRAFFIC` | Real-time traffic data updates |
| `/api/vehicles/stream` | `VEHICLE` | Real-time vehicle detection events |
| `/api/sensors/stream` | `SENSOR` | Real-time sensor health updates |
| `/api/coordination/stream` | `COORDINATION` | Real-time coordination updates |
| `/api/alerts/stream` | `ALERT` | Real-time alert and incident notifications |

### SSE Connection Pattern

```typescript
// Example SSE connection
const eventSource = new EventSource('/api/traffic/stream?intersection_id=bd-anfa-bd-zerktouni');

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};

eventSource.onerror = (error) => {
  console.error('SSE Error:', error);
};
```

---

## 📝 Common Types

```typescript
interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

interface EnhancementInfo {
  enhanced_records: number;
  legacy_records: number;
  enhancement_rate: number;
}

// Base SSE Event
interface BaseSSEEvent {
  type: string;
  timestamp: string;
  data: any;
}
```

This documentation covers all available endpoints in the Traffic Data API v2.0 that the modern-dashboard can integrate with. 