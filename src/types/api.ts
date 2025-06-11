// TypeScript interfaces for Traffic Monitoring API

// Common response wrapper
export interface ApiResponse<T> {
  data: T[];
  pagination: PaginationInfo;
  enhancement_info?: EnhancementInfo;
}

export interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface EnhancementInfo {
  enhanced_records: number;
  legacy_records: number;
  enhancement_rate: number;
}

// Weather State
export interface WeatherState {
  conditions: string;
  temperature: number;
  humidity: number;
  wind_speed: number;
  visibility: string;
  road_condition: string;
}

// Traffic Data
export interface TrafficData {
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
  congestion_level: string;
  intersection_id?: string;
  sensor_direction?: string;
  coordinated_weather?: WeatherState;
  traffic_light_phase?: string;
  vehicle_flow_rate?: number;
  queue_propagation_factor?: number;
  received_at: string;
  schema_version: string;
}

export interface TrafficQueryParams {
  page?: number;
  limit?: number;
  sensor_id?: string;
  intersection_id?: string;
  sensor_direction?: string;
  start?: string;
  end?: string;
  weather_condition?: string;
  min_speed?: number;
  max_speed?: number;
  min_density?: number;
  max_density?: number;
  include_enhanced?: boolean;
}

export interface TrafficStats {
  total_records: number;
  avg_speed: number;
  avg_density: number;
  enhancement_rate: number; // Add this for backwards compatibility
  congestion_breakdown: {
    level: string;
    count: number;
    percentage: number;
  }[];
}

// Vehicle Data
export interface VehicleRecord {
  _id: string;
  sensor_id: string;
  timestamp: string;
  location_id: string;
  location_x: number;
  location_y: number;
  vehicle_id: string;
  vehicle_class: string;
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

export interface VehicleStats {
  total_vehicles: number; // Add this for backwards compatibility
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
  status_analysis: {
    total_faults: number;
    wrong_way_incidents: number;
    queue_detections: number;
    low_voltage_alerts: number;
  };
  // Add actual API response structure
  overallStats: {
    _id: null;
    totalVehicles: number;
    avgSpeed: number;
    maxSpeed: number;
    minSpeed: number;
    avgLength: number;
    maxLength: number;
    minLength: number;
    totalWithStatus: number;
    uniqueIntersections: any[];
    uniqueSensorDirections: any[];
    enhancedRecords: number;
    enhancementRate: number;
  };
  vehicleClassStats: {
    _id: string;
    count: number;
    avgSpeed: number;
    avgLength: number;
    avgOccupancy: number;
    avgTimeGap: number;
    intersections: any[];
    weatherConditions: any[];
    sensorDirections: any[];
    enhancedLengthRange: string;
  }[];
  timeDistribution: {
    hour: number;
    count: number;
    avgSpeed: number;
    avgLength: number;
    uniqueVehicleClasses: string[];
    weatherConditions: any[];
  }[];
  enhancedAnalytics: {
    weatherCorrelation: any[];
    intersectionStats: any[];
    dataSourceBreakdown: {
      total: number;
      enhanced: number;
      legacy: number;
      enhancement_rate: number;
    };
  };
}

// Intersection Data
export interface IntersectionData {
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
  sensor_breakdown?: {
    direction: string;
    sensor_id: string;
    vehicle_count: number;
    avg_speed: number;
    status: string;
  }[];
}

// Sensor Data
export interface SensorStatusData {
  _id: string;
  sensor_id: string;
  timestamp: string;
  status: string;
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

export interface SensorMapResponse {
  type: "FeatureCollection";
  features: SensorMapFeature[];
  metadata: {
    total_sensors: number;
    sensors_with_direction: number;
    data_sources: {
      traffic_collection: number;
      intersection_collection: number;
    };
    debug: {
      collections_used: string[];
      coordinate_source: string;
    };
  };
}

export interface SensorMapFeature {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
  properties: {
    sensor_id: string;
    intersection_id?: string;
    sensor_direction?: string;
    last_seen: string;
  };
}

// Alert Data
export interface AlertData {
  _id: string;
  sensor_id: string;
  timestamp: string;
  type: string;
  severity: string;
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

// Stream Event
export interface StreamEvent {
  type: string;
  data: any;
  timestamp: string;
  enhanced?: boolean;
} 