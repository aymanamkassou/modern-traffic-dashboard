// SSE Event Type Definitions for Traffic Dashboard

// Base SSE Event structure from the hook
export interface BaseSSEEvent {
  type: string
  data: any
  timestamp: string
  id?: string
}

// Activity Feed Events
export interface ActivityEvent {
  type: 'alert_critical' | 'alert_resolved' | 'intersection_upgrade' | 'intersection_offline' | 'traffic_spike' | 'sensor_fault'
  title: string
  description: string
  timestamp: string
  location: string
  severity: 'critical' | 'warning' | 'info'
  metadata?: Record<string, any>
}

// Risk Heatmap Events
export interface RiskEvent {
  intersection_id: string
  risk_score: number
  risk_level: 'minimal' | 'low' | 'medium' | 'high' | 'critical'
  coordinates: { lat: number; lng: number }
  contributing_factors: string[]
  timestamp: string
}

// Traffic Flow Events
export interface TrafficEvent {
  intersection_id: string
  direction: 'north' | 'south' | 'east' | 'west'
  vehicle_flow_rate: number
  average_speed: number
  density: number
  congestion_level: number
  travel_time?: number
  traffic_light_phase: string
  timestamp: string
}

// Vehicle Detection Events
export interface VehicleEvent {
  vehicle_id: string
  intersection_id: string
  vehicle_class: string
  speed: number
  direction: string
  timestamp: string
  status_flags?: {
    hardware_fault: boolean
    wrong_way_driver: boolean
    oversized_vehicle: boolean
    emergency_vehicle: boolean
  }
  confidence_score?: number
}

// Sensor Status Events
export interface SensorEvent {
  sensor_id: string
  intersection_id: string
  status: 'online' | 'offline' | 'error' | 'maintenance'
  battery_level?: number
  temperature?: number
  last_communication: string
  error_messages?: string[]
  capabilities: {
    basic_capabilities: string[]
    enhanced_capabilities: string[]
  }
  timestamp: string
}

// Intersection Coordination Events
export interface CoordinationEvent {
  intersection_id: string
  coordination_status: 'coordinated' | 'legacy' | 'offline' | 'error'
  coordinated_light_status?: {
    current_phase: string
    phase_time_remaining: number
    cycle_length: number
    coordination_offset: number
  }
  efficiency_metrics?: {
    cycle_efficiency: number
    average_wait_time: number
    throughput: number
  }
  timestamp: string
}

// Alert Events (from backend alert system)
export interface AlertEvent {
  alert_id: string
  intersection_id?: string
  alert_type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'active' | 'resolved' | 'acknowledged'
  message: string
  created_at: string
  resolved_at?: string
  metadata?: Record<string, any>
}

// Weather Events (for correlation with traffic data)
export interface WeatherEvent {
  location: { lat: number; lng: number }
  weather_condition: string
  temperature: number
  visibility: number
  precipitation: number
  wind_speed: number
  impact_assessment: {
    traffic_impact: 'minimal' | 'moderate' | 'significant' | 'severe'
    recommended_actions: string[]
  }
  timestamp: string
}

// System Status Events
export interface SystemEvent {
  event_type: 'startup' | 'shutdown' | 'maintenance' | 'upgrade' | 'error' | 'recovery'
  component: string
  message: string
  severity: 'info' | 'warning' | 'error'
  affected_intersections?: string[]
  estimated_duration?: number
  timestamp: string
}

// ACTUAL API Response Types (from the real endpoints)
export interface TrafficStreamEvent {
  type: 'TRAFFIC'
  data: {
    _id: string
    sensor_id: string
    timestamp: string
    location_id: string
    location_x: number
    location_y: number
    density: number
    travel_time: number
    vehicle_number: number
    speed: number
    congestion_level: string
    intersection_id?: string
    sensor_direction?: string
    coordinated_weather?: {
      conditions: string
      temperature: number
      humidity: number
      wind_speed: number
      visibility: string
      road_condition: string
    }
    traffic_light_phase?: string
    vehicle_flow_rate?: number
    queue_propagation_factor?: number
    received_at: string
    schema_version: string
  }
  timestamp: string
  enhanced: boolean
}

export interface VehicleStreamEvent {
  type: 'VEHICLE'
  data: {
    _id: string
    sensor_id: string
    timestamp: string
    location_id: string
    location_x: number
    location_y: number
    vehicle_id: string
    vehicle_class: string
    length_dm: number
    speed_kmh: number
    status: number
    intersection_id?: string
    sensor_direction?: string
    decoded_status: {
      hardware_fault: boolean
      low_voltage: boolean
      wrong_way_driver: boolean
      queue_detected: boolean
    }
  }
  timestamp: string
  enhanced: boolean
}

export interface SensorStreamEvent {
  type: 'SENSOR'
  data: {
    _id: string
    sensor_id: string
    timestamp: string
    status: string
    battery_level?: number
    signal_strength?: number
    temperature_c?: number
    hw_fault?: boolean
    low_voltage?: boolean
    uptime_s?: number
    issues: string[]
    last_maintenance?: string
    error_codes?: string[]
  }
  timestamp: string
}

export interface CoordinationStreamEvent {
  type: 'COORDINATION'
  intersection_id: string
  coordination_update: {
    light_phase_change?: {
      previous: string
      current: string
      phase_remaining: number
    }
    efficiency_update?: {
      current_efficiency: number
      trend: string
    }
    flow_rate_change?: {
      direction: string
      previous_rate: number
      current_rate: number
    }
    weather_sync_update?: {
      conditions: string
      temperature: number
      humidity: number
      wind_speed: number
      visibility: string
      road_condition: string
    }
  }
  timestamp: string
}

// Union type for all actual SSE events from the API
export type ActualSSEEvent = 
  | TrafficStreamEvent
  | VehicleStreamEvent
  | SensorStreamEvent
  | CoordinationStreamEvent

// Union type for all possible SSE events (including simulated ones)
export type DashboardSSEEvent = 
  | ActivityEvent
  | RiskEvent
  | TrafficEvent
  | VehicleEvent
  | SensorEvent
  | CoordinationEvent
  | AlertEvent
  | WeatherEvent
  | SystemEvent
  | ActualSSEEvent

// Event type guards for runtime type checking
export function isActivityEvent(event: any): event is ActivityEvent {
  return event && typeof event.type === 'string' && 
         typeof event.title === 'string' && 
         typeof event.description === 'string' &&
         ['alert_critical', 'alert_resolved', 'intersection_upgrade', 'intersection_offline', 'traffic_spike', 'sensor_fault'].includes(event.type)
}

export function isRiskEvent(event: any): event is RiskEvent {
  return event && typeof event.intersection_id === 'string' && 
         typeof event.risk_score === 'number' &&
         typeof event.risk_level === 'string'
}

export function isTrafficEvent(event: any): event is TrafficEvent {
  return event && typeof event.intersection_id === 'string' && 
         typeof event.direction === 'string' && 
         typeof event.vehicle_flow_rate === 'number'
}

export function isVehicleEvent(event: any): event is VehicleEvent {
  return event && typeof event.vehicle_id === 'string' && 
         typeof event.intersection_id === 'string' &&
         typeof event.vehicle_class === 'string'
}

export function isSensorEvent(event: any): event is SensorEvent {
  return event && typeof event.sensor_id === 'string' && 
         typeof event.intersection_id === 'string' &&
         typeof event.status === 'string'
}

export function isCoordinationEvent(event: any): event is CoordinationEvent {
  return event && typeof event.intersection_id === 'string' && 
         typeof event.coordination_status === 'string'
}

// SSE Endpoint configurations - Updated to match actual API endpoints
export const SSE_ENDPOINTS = {
  // These are the actual endpoints that exist in the API:
  TRAFFIC: '/api/traffic/stream',
  VEHICLES: '/api/vehicles/stream', 
  SENSORS: '/api/sensors/stream',
  COORDINATION: '/api/coordination/stream',
  
  // These endpoints don't exist yet - using fallbacks to traffic stream:
  ACTIVITIES: '/api/traffic/stream', // Will use traffic stream for activity-like events
  RISK_HEATMAP: '/api/traffic/stream', // Will derive risk data from traffic stream
  ALERTS: '/api/traffic/stream', // Will derive alerts from traffic stream
  WEATHER: '/api/traffic/stream', // Weather data comes with traffic stream
  SYSTEM: '/api/traffic/stream' // System events via traffic stream
} as const

// SSE Configuration options
export interface SSEConfig {
  baseUrl?: string
  maxRetries?: number
  retryDelay?: number
  maxEvents?: number
  autoConnect?: boolean
}

export const DEFAULT_SSE_CONFIG: SSEConfig = {
  baseUrl: 'http://localhost:3001',
  maxRetries: 5,
  retryDelay: 3000,
  maxEvents: 100,
  autoConnect: true
}

// Real SSE Event Interfaces Based on Actual Stream Data

// Common metadata fields present in all stream data
interface StreamMetadata {
  stream_type: 'SENSOR' | 'TRAFFIC' | 'VEHICLE' | 'ALERT' | 'COORDINATION' | 'INTERSECTION';
  enhanced: boolean;
  _enhanced: boolean;
  _processed_by: string;
  _processing_timestamp: string;
  _received_at?: string;
}

// Weather data structure used in coordinated streams
export interface CoordinatedWeather {
  conditions: string; // "overcast", "partly_cloudy", "sunny", etc.
  temperature: number;
  humidity: number;
  wind_speed: number;
  visibility: string; // "good", "fair", "poor"
  road_condition: string; // "dry", "wet", "icy"
}

// Vehicle type distribution in traffic data
export interface VehicleTypeDistribution {
  cars: number;
  buses: number;
  motorcycles: number;
  trucks: number;
}

// Real Sensor Stream Data
export interface SensorStreamData extends StreamMetadata {
  sensor_id: string;
  timestamp: string;
  battery_level: number; // 0-100
  temperature_c: number; // Celsius
  hw_fault: boolean;
  low_voltage: boolean;
  uptime_s: number; // seconds
  message_count: number;
  stream_type: 'SENSOR';
}

// Real Traffic Stream Data  
export interface TrafficStreamData extends StreamMetadata {
  sensor_id: string;
  timestamp: string;
  location_id: string;
  location_x: number; // longitude
  location_y: number; // latitude
  density: number; // 0-100
  travel_time: number; // seconds
  vehicle_number: number;
  speed: number; // km/h
  direction_change: string; // "left", "right", "none"
  pedestrian_count: number;
  bicycle_count: number;
  heavy_vehicle_count: number;
  incident_detected: boolean;
  visibility: string;
  weather_conditions: string;
  road_condition: string;
  congestion_level: string; // "low", "medium", "high", "critical"
  average_vehicle_size: string; // "small", "medium", "large"
  vehicle_type_distribution: VehicleTypeDistribution;
  traffic_flow_direction: string; // "north-south", "east-west", "both"
  red_light_violations: number;
  temperature: number;
  humidity: number;
  wind_speed: number;
  air_quality_index: number;
  near_miss_events: number;
  accident_severity: string; // "none", "minor", "major"
  roadwork_detected: boolean;
  illegal_parking_cases: number;
  // Enhanced intersection coordination fields
  intersection_id?: string;
  sensor_direction?: string; // "north", "south", "east", "west"
  coordinated_weather?: CoordinatedWeather;
  traffic_light_phase?: string; // "red", "yellow", "green"
  vehicle_flow_rate?: number; // vehicles/minute
  queue_propagation_factor?: number; // 0.0-1.0
  stream_type: 'TRAFFIC';
}

// Real Vehicle Stream Data
export interface VehicleStreamData extends StreamMetadata {
  id: string; // UUID
  sensor_id: string;
  timestamp: string;
  speed_kmh: number;
  length_dm: number; // decimeters
  vehicle_class: string; // "passenger_car", "suv", "delivery_van", "semi_truck", etc.
  occupancy_s: number; // seconds
  time_gap_s: number; // seconds
  status: number; // status byte
  counter: number;
  stream_type: 'VEHICLE';
}

// Real Alert Stream Data
export interface AlertStreamData extends StreamMetadata {
  sensor_id: string;
  timestamp: string;
  type: string; // "traffic-queue", "congestion", "accident", etc.
  vehicle_data?: {
    counter: number;
    id: string;
    length_dm: number;
    occupancy_s: number;
    sensor_id: string;
    speed_kmh: number;
    status: number;
    time_gap_s: number;
    timestamp: string;
    vehicle_class: string;
  };
  stream_type: 'ALERT';
}

// Real Coordination Stream Data
export interface CoordinationStreamData extends StreamMetadata {
  type: string; // "intersection_coordination"
  intersection_id: string;
  coordination_state: {
    sensors: string[];
    lastWeather: CoordinatedWeather;
    lastLightPhase: string;
    lastUpdate: string;
    messageCount: number;
    sensorDirections: string[];
  };
  message_type: string; // "intersection-data"
  enhanced_fields: {
    coordinated_light_status?: string;
    phase_time_remaining?: number;
    intersection_efficiency?: number;
    total_intersection_vehicles?: number;
    sensor_direction?: string;
    coordinated_weather?: CoordinatedWeather;
    traffic_light_phase?: string;
    vehicle_flow_rate?: number;
    queue_propagation_factor?: number;
  };
  timestamp: string;
  _coordination_summary: boolean;
  stream_type: 'COORDINATION';
}

// Real Intersection Stream Data
export interface IntersectionStreamData extends StreamMetadata {
  // Can be either coordination update or raw intersection data
  type?: string; // "coordination_update" for coordination updates
  intersection_id?: string;
  coordination_summary?: {
    sensors: string[];
    lastWeather: CoordinatedWeather;
    lastLightPhase: string;
    lastUpdate: string;
    messageCount: number;
    sensorDirections: string[];
  };
  enhanced_fields?: {
    sensor_direction?: string;
    coordinated_weather?: CoordinatedWeather;
    traffic_light_phase?: string;
    vehicle_flow_rate?: number;
    queue_propagation_factor?: number;
    coordinated_light_status?: string;
    phase_time_remaining?: number;
    intersection_efficiency?: number;
    total_intersection_vehicles?: number;
  };
  // OR raw intersection sensor data
  sensor_id?: string;
  timestamp?: string;
  stopped_vehicles_count?: number;
  average_wait_time?: number;
  left_turn_count?: number;
  right_turn_count?: number;
  average_speed_by_direction?: {
    north_south: number;
    east_west: number;
  };
  lane_occupancy?: number;
  intersection_blocking_vehicles?: number;
  traffic_light_compliance_rate?: number;
  pedestrians_crossing?: number;
  jaywalking_pedestrians?: number;
  cyclists_crossing?: number;
  risky_behavior_detected?: boolean;
  queue_length_by_lane?: {
    lane1: number;
    lane2: number;
    lane3: number;
  };
  intersection_congestion_level?: string;
  intersection_crossing_time?: number;
  traffic_light_impact?: string;
  near_miss_incidents?: number;
  collision_count?: number;
  sudden_braking_events?: number;
  illegal_parking_detected?: boolean;
  wrong_way_vehicles?: number;
  ambient_light_level?: number;
  traffic_light_status?: string;
  local_weather_conditions?: string;
  fog_or_smoke_detected?: boolean;
  coordinated_light_status?: string;
  phase_time_remaining?: number;
  intersection_efficiency?: number;
  total_intersection_vehicles?: number;
  _coordination_summary?: boolean;
  stream_type: 'INTERSECTION';
}

// Connection message (first message from each stream)
export interface ConnectionMessage {
  message?: string; // "Connected to enhanced stream"
  stream_type: string;
  enhanced_features?: string[];
  timestamp: string;
  type?: string; // "connection"
  features?: string[];
}

// Union type for all possible stream data
export type StreamData = 
  | SensorStreamData 
  | TrafficStreamData 
  | VehicleStreamData 
  | AlertStreamData 
  | CoordinationStreamData 
  | IntersectionStreamData
  | ConnectionMessage;

// SSE Event wrapper (what comes from EventSource)
export interface SSEEvent {
  type: string; // Usually "message"
  data: StreamData;
  timestamp?: string;
  id?: string;
}

// Helper type guards
export const isSensorData = (data: any): data is SensorStreamData => {
  return data && data.stream_type === 'SENSOR' && data.sensor_id && data.battery_level !== undefined;
}

export const isTrafficData = (data: any): data is TrafficStreamData => {
  return data && data.stream_type === 'TRAFFIC' && data.sensor_id && data.density !== undefined;
}

export const isVehicleData = (data: any): data is VehicleStreamData => {
  return data && data.stream_type === 'VEHICLE' && data.id && data.speed_kmh !== undefined;
}

export const isAlertData = (data: any): data is AlertStreamData => {
  return data && data.stream_type === 'ALERT' && data.type && data.sensor_id;
}

export const isCoordinationData = (data: any): data is CoordinationStreamData => {
  return data && data.stream_type === 'COORDINATION' && data.intersection_id && data.coordination_state;
}

export const isIntersectionData = (data: any): data is IntersectionStreamData => {
  return data && data.stream_type === 'INTERSECTION';
}

export const isConnectionMessage = (data: any): data is ConnectionMessage => {
  return data && data.message && (data.message.includes('Connected') || data.type === 'connection');
} 