'use client';

import { useState, useMemo, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Car, Navigation, Wifi, AlertTriangle, Radio, Database, Shield, BarChart3, Target, TrendingUp, ChevronDown, Grid3X3 } from 'lucide-react';
import { EndpointTester } from '@/components/testing/endpoint-tester';
import { StreamTester } from '@/components/testing/stream-tester';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { DashboardLayout } from '@/components/dashboard/layout';

// Parameter type definition
interface Parameter {
  key: string;
  value: string;
  type: 'string' | 'number' | 'boolean';
}

interface EndpointConfig {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  description: string;
  presets?: { [key: string]: Parameter[] };
  pathParams?: string[];
}

interface StreamConfig {
  path: string;
  description: string;
  presets?: { [key: string]: Parameter[] };
}

// Endpoint configurations based on the API documentation
const apiEndpoints: { [key: string]: EndpointConfig[] } = {
  traffic: [
    {
      path: '/api/traffic',
      method: 'GET' as const,
      description: 'Retrieve traffic data with enhanced intersection coordination fields',
      presets: {
        'Basic Query': [
          { key: 'limit', value: '20', type: 'number' as const },
          { key: 'page', value: '1', type: 'number' as const }
        ],
        'Intersection Filter': [
          { key: 'intersection_id', value: 'bd-anfa-bd-zerktouni', type: 'string' as const },
          { key: 'limit', value: '10', type: 'number' as const },
          { key: 'include_enhanced', value: 'true', type: 'boolean' as const }
        ],
        'Speed Range': [
          { key: 'min_speed', value: '20', type: 'number' as const },
          { key: 'max_speed', value: '60', type: 'number' as const },
          { key: 'limit', value: '50', type: 'number' as const }
        ]
      }
    }
  ],
  vehicles: [
    {
      path: '/api/vehicles',
      method: 'GET' as const,
      description: 'Retrieve vehicle records with enhanced filtering',
      presets: {
        'Basic Query': [
          { key: 'limit', value: '20', type: 'number' as const },
          { key: 'page', value: '1', type: 'number' as const }
        ],
        'Vehicle Class Filter': [
          { key: 'vehicle_class', value: 'passenger_car', type: 'string' as const },
          { key: 'limit', value: '15', type: 'number' as const }
        ],
        'Intersection Analysis': [
          { key: 'intersection_id', value: 'bd-anfa-bd-zerktouni', type: 'string' as const },
          { key: 'sensor_direction', value: 'north', type: 'string' as const }
        ]
      }
    },
    {
      path: '/api/vehicles/stats',
      method: 'GET' as const,
      description: 'Enhanced vehicle statistics with intersection coordination',
      presets: {
        'Basic Stats': [
          { key: 'time_window', value: '60', type: 'number' as const }
        ],
        'Intersection Stats': [
          { key: 'intersection_id', value: 'bd-anfa-bd-zerktouni', type: 'string' as const },
          { key: 'include_weather', value: 'true', type: 'boolean' as const },
          { key: 'include_intersection', value: 'true', type: 'boolean' as const }
        ]
      }
    },
    {
      path: '/api/vehicles/intersection/:intersectionId',
      method: 'GET' as const,
      description: 'Intersection-specific vehicle analytics with 4-sensor breakdown',
      pathParams: ['intersectionId'],
      presets: {
        'Basic Analysis': [
          { key: 'timeWindow', value: '60', type: 'number' as const }
        ],
        'With Weather': [
          { key: 'timeWindow', value: '120', type: 'number' as const },
          { key: 'includeWeather', value: 'true', type: 'boolean' as const }
        ]
      }
    },
    {
      path: '/api/vehicles/intersection/:intersectionId/diagnostics',
      method: 'GET' as const,
      description: 'Diagnostic information for intersection vehicle data availability',
      pathParams: ['intersectionId']
    },
    {
      path: '/api/vehicles/specifications',
      method: 'GET' as const,
      description: 'Enhanced vehicle specifications from Rust simulator'
    }
  ],
  intersections: [
    {
      path: '/api/intersections',
      method: 'GET' as const,
      description: 'Retrieve intersection data with coordination capabilities',
      presets: {
        'Basic Query': [
          { key: 'limit', value: '10', type: 'number' as const }
        ],
        'Coordinated Only': [
          { key: 'has_coordination', value: 'true', type: 'boolean' as const },
          { key: 'include_sensors', value: 'true', type: 'boolean' as const }
        ],
        'High Efficiency': [
          { key: 'min_efficiency', value: '0.8', type: 'number' as const }
        ]
      }
    },
    {
      path: '/api/intersections/:id/coordination',
      method: 'GET' as const,
      description: 'Real-time coordination status for specific intersection',
      pathParams: ['id']
    }
  ],
  sensors: [
    {
      path: '/api/sensors/status',
      method: 'GET' as const,
      description: 'Sensor status monitoring and health data'
    },
    {
      path: '/api/sensors/registry',
      method: 'GET' as const,
      description: 'Complete sensor registry with capabilities and enhanced features'
    },
    {
      path: '/api/sensors/map',
      method: 'GET' as const,
      description: 'Geo-spatial sensor map data for visualization with GeoJSON format'
    },
    {
      path: '/api/sensors/:id/capabilities',
      method: 'GET' as const,
      description: 'Get detailed capabilities for a specific sensor',
      pathParams: ['id']
    },
    {
      path: '/api/sensors/intersection/:id',
      method: 'GET' as const,
      description: 'Get all sensors for a specific intersection',
      pathParams: ['id']
    },
    {
      path: '/api/sensors/history/:sensorId',
      method: 'GET' as const,
      description: 'Get sensor health history for time-series analysis',
      pathParams: ['sensorId'],
      presets: {
        'Recent History': [
          { key: 'start', value: '2024-01-01T00:00:00Z', type: 'string' as const },
          { key: 'end', value: '2024-01-31T23:59:59Z', type: 'string' as const }
        ]
      }
    }
  ],
  alerts: [
    {
      path: '/api/alerts',
      method: 'GET' as const,
      description: 'Traffic alerts with comprehensive filtering',
      presets: {
        'Recent Alerts': [
          { key: 'limit', value: '20', type: 'number' as const }
        ],
        'High Priority': [
          { key: 'severity', value: 'high', type: 'string' as const },
          { key: 'resolved', value: 'false', type: 'boolean' as const }
        ],
        'By Type': [
          { key: 'type', value: 'congestion', type: 'string' as const },
          { key: 'limit', value: '10', type: 'number' as const }
        ]
      }
    },
    {
      path: '/api/alerts/stats',
      method: 'GET' as const,
      description: 'Comprehensive alert statistics and analytics'
    },
    {
      path: '/api/alerts/count',
      method: 'GET' as const,
      description: 'Alert count with advanced filtering',
      presets: {
        'Total Count': [],
        'Unresolved Count': [
          { key: 'resolved', value: 'false', type: 'boolean' as const }
        ]
      }
    }
  ],
  dataReceiver: [
    {
      path: '/api/receive/traffic',
      method: 'POST' as const,
      description: 'Receive traffic data from Kafka consumers'
    },
    {
      path: '/api/receive/vehicle',
      method: 'POST' as const,
      description: 'Receive vehicle data from Kafka consumers'
    },
    {
      path: '/api/receive/intersection',
      method: 'POST' as const,
      description: 'Receive intersection data from Kafka consumers'
    },
    {
      path: '/api/receive/sensor',
      method: 'POST' as const,
      description: 'Receive sensor health data from Kafka consumers'
    },
    {
      path: '/api/receive/alert',
      method: 'POST' as const,
      description: 'Receive traffic alerts from Kafka consumers'
    },
    {
      path: '/api/receive/coordination',
      method: 'POST' as const,
      description: 'Receive coordination summaries from enhanced consumers'
    }
  ],
  riskAnalysis: [
    {
      path: '/api/risk/analysis',
      method: 'GET' as const,
      description: 'Comprehensive multi-factor risk assessment with real-time analysis',
      presets: {
        'Basic Analysis': [
          { key: 'time_window', value: '60', type: 'number' as const }
        ],
        'Intersection Risk': [
          { key: 'intersection_id', value: 'bd-anfa-bd-zerktouni', type: 'string' as const },
          { key: 'include_historical', value: 'true', type: 'boolean' as const },
          { key: 'time_window', value: '120', type: 'number' as const }
        ],
        'Sensor Risk': [
          { key: 'sensor_id', value: 'sensor-bd-anfa-north', type: 'string' as const },
          { key: 'include_historical', value: 'true', type: 'boolean' as const }
        ]
      }
    },
    {
      path: '/api/risk/heatmap',
      method: 'GET' as const,
      description: 'Geographical risk mapping with multi-location aggregation',
      presets: {
        'Basic Heatmap': [
          { key: 'time_window', value: '120', type: 'number' as const }
        ],
        'High Risk Only': [
          { key: 'min_risk_score', value: '60', type: 'number' as const },
          { key: 'include_factors', value: 'true', type: 'boolean' as const }
        ],
        'Critical Risk': [
          { key: 'risk_level', value: 'critical', type: 'string' as const },
          { key: 'include_factors', value: 'true', type: 'boolean' as const }
        ]
      }
    }
  ],
  historicalAnalytics: [
    {
      path: '/api/historical/traffic',
      method: 'GET' as const,
      description: 'Historical traffic pattern analysis with density vs speed correlation',
      presets: {
        'Daily Patterns': [
          { key: 'aggregation', value: 'hour', type: 'string' as const },
          { key: 'include_weather', value: 'true', type: 'boolean' as const }
        ],
        'Weekly Trends': [
          { key: 'aggregation', value: 'day', type: 'string' as const },
          { key: 'start', value: '2024-01-01T00:00:00Z', type: 'string' as const },
          { key: 'end', value: '2024-01-31T23:59:59Z', type: 'string' as const }
        ],
        'Intersection History': [
          { key: 'intersection_id', value: 'bd-anfa-bd-zerktouni', type: 'string' as const },
          { key: 'aggregation', value: 'hour', type: 'string' as const }
        ]
      }
    },
    {
      path: '/api/historical/incidents',
      method: 'GET' as const,
      description: 'Historical incident frequency and pattern analysis'
    },
    {
      path: '/api/historical/congestion',
      method: 'GET' as const,
      description: 'Congestion heatmap and pattern analysis'
    },
    {
      path: '/api/historical/weather',
      method: 'GET' as const,
      description: 'Weather impact analysis and distribution patterns'
    }
  ],
  coordinationIntelligence: [
    {
      path: '/api/coordination/intersections',
      method: 'GET' as const,
      description: 'All intersections coordination overview with system-wide health monitoring',
      presets: {
        'All Intersections': [],
        'Coordinated Only': [
          { key: 'status_filter', value: 'coordinated', type: 'string' as const },
          { key: 'include_diagnostics', value: 'true', type: 'boolean' as const }
        ],
        'High Efficiency': [
          { key: 'min_efficiency', value: '0.8', type: 'number' as const }
        ]
      }
    },
    {
      path: '/api/coordination/intersections/:id/status',
      method: 'GET' as const,
      description: 'Comprehensive coordination status for specific intersection',
      pathParams: ['id']
    },
    {
      path: '/api/coordination/intersections/:id/weather-sync',
      method: 'GET' as const,
      description: 'Weather synchronization analysis across intersection sensors',
      pathParams: ['id']
    },
    {
      path: '/api/coordination/intersections/:id/flow',
      method: 'GET' as const,
      description: 'Flow tracking with granular time buckets and detailed analytics',
      pathParams: ['id'],
      presets: {
        'Basic Flow': [
          { key: 'granularity', value: '15min', type: 'string' as const },
          { key: 'time_window', value: '24', type: 'number' as const }
        ],
        'High Resolution': [
          { key: 'granularity', value: '5min', type: 'string' as const },
          { key: 'time_window', value: '6', type: 'number' as const },
          { key: 'include_predictions', value: 'true', type: 'boolean' as const }
        ],
        'Extended Analysis': [
          { key: 'granularity', value: '1hour', type: 'string' as const },
          { key: 'time_window', value: '168', type: 'number' as const }
        ]
      }
    }
  ]
};

// Stream configurations
const streamEndpoints: StreamConfig[] = [
  {
    path: '/api/traffic/stream',
    description: 'Real-time traffic data stream using Server-Sent Events',
    presets: {
      'All Traffic': [],
      'Specific Intersection': [
        { key: 'intersection_id', value: 'bd-anfa-bd-zerktouni', type: 'string' as const }
      ],
      'By Direction': [
        { key: 'sensor_direction', value: 'north', type: 'string' as const }
      ]
    }
  },
  {
    path: '/api/sensors/stream',
    description: 'Real-time sensor health data stream using Server-Sent Events',
    presets: {
      'All Sensors': []
    }
  },
  {
    path: '/api/vehicles/stream',
    description: 'Real-time vehicle data stream using Server-Sent Events',
    presets: {
      'All Vehicles': [],
      'Intersection Vehicles': [
        { key: 'intersection_id', value: 'bd-anfa-bd-zerktouni', type: 'string' as const }
      ],
      'Vehicle Class Filter': [
        { key: 'vehicle_class', value: 'passenger_car', type: 'string' as const }
      ]
    }
  },
  {
    path: '/api/coordination/stream',
    description: 'Real-time intersection coordination updates using Server-Sent Events',
    presets: {
      'All Coordination': [],
      'Specific Intersection': [
        { key: 'intersection_id', value: 'bd-anfa-bd-zerktouni', type: 'string' as const }
      ]
    }
  }
];

// Move tabConfig outside component to prevent recreation on every render
const tabConfig = [
  { key: 'traffic', label: 'Traffic Data', icon: Activity, count: apiEndpoints.traffic.length, color: 'bg-blue-500' },
  { key: 'vehicles', label: 'Vehicles', icon: Car, count: apiEndpoints.vehicles.length, color: 'bg-green-500' },
  { key: 'intersections', label: 'Intersections', icon: Navigation, count: apiEndpoints.intersections.length, color: 'bg-purple-500' },
  { key: 'sensors', label: 'Sensors', icon: Wifi, count: apiEndpoints.sensors.length, color: 'bg-orange-500' },
  { key: 'alerts', label: 'Alerts', icon: AlertTriangle, count: apiEndpoints.alerts.length, color: 'bg-red-500' },
  { key: 'riskAnalysis', label: 'Risk Analysis', icon: Shield, count: apiEndpoints.riskAnalysis.length, color: 'bg-yellow-500' },
  { key: 'historicalAnalytics', label: 'Historical', icon: BarChart3, count: apiEndpoints.historicalAnalytics.length, color: 'bg-indigo-500' },
  { key: 'coordinationIntelligence', label: 'Coordination', icon: Target, count: apiEndpoints.coordinationIntelligence.length, color: 'bg-pink-500' },
  { key: 'dataReceiver', label: 'Data Receiver', icon: Database, count: apiEndpoints.dataReceiver.length, color: 'bg-teal-500' },
  { key: 'streams', label: 'Live Streams', icon: Radio, count: streamEndpoints.length, color: 'bg-cyan-500' }
];

export default function TestApiPage() {
  const [activeTab, setActiveTab] = useState('traffic');
  const [viewMode, setViewMode] = useState<'tabs' | 'grid'>('tabs');

  const activeTabConfig = useMemo(() => 
    tabConfig.find(tab => tab.key === activeTab), 
    [activeTab]
  );

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
  }, []);

  const handleViewModeToggle = useCallback(() => {
    setViewMode(prev => prev === 'tabs' ? 'grid' : 'tabs');
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">API Testing Interface</h1>
            <p className="text-muted-foreground">
              Comprehensive testing suite for all traffic monitoring API endpoints and real-time streams
            </p>
          </div>
          <ThemeToggle />
        </div>

        {/* Navigation Controls */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          {/* Mobile Dropdown */}
          <div className="sm:hidden w-full">
            <Select value={activeTab} onValueChange={handleTabChange}>
              <SelectTrigger className="w-full">
                <div className="flex items-center gap-2">
                  {activeTabConfig && (
                    <>
                      <div className={`w-3 h-3 rounded-full ${activeTabConfig.color}`} />
                      <activeTabConfig.icon className="h-4 w-4" />
                      <span>{activeTabConfig.label}</span>
                      <Badge variant="secondary" className="text-xs font-mono ml-auto">
                        {activeTabConfig.count}
                      </Badge>
                    </>
                  )}
                </div>
              </SelectTrigger>
              <SelectContent>
                {tabConfig.map(tab => {
                  const IconComponent = tab.icon;
                  return (
                    <SelectItem key={tab.key} value={tab.key}>
                      <div className="flex items-center gap-2 w-full">
                        <div className={`w-3 h-3 rounded-full ${tab.color}`} />
                        <IconComponent className="h-4 w-4" />
                        <span>{tab.label}</span>
                        <Badge variant="secondary" className="text-xs font-mono ml-auto">
                          {tab.count}
                        </Badge>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Desktop Tab Grid */}
          <div className="hidden sm:grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-5 gap-2 flex-1">
            {tabConfig.map(tab => {
              const IconComponent = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <Button
                  key={tab.key}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleTabChange(tab.key)}
                  className={`flex flex-col items-center gap-1 h-auto py-3 px-2 relative transition-all ${
                    isActive 
                      ? 'bg-primary text-primary-foreground shadow-md' 
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full ${tab.color} ${isActive ? 'opacity-100' : 'opacity-60'}`} />
                  <IconComponent className="h-4 w-4" />
                  <span className="text-xs font-medium text-center leading-tight">{tab.label}</span>
                  <Badge 
                    variant={isActive ? "secondary" : "outline"} 
                    className="text-xs font-mono absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center"
                  >
                    {tab.count}
                  </Badge>
                </Button>
              );
            })}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleViewModeToggle}
              className="hidden lg:flex items-center gap-2"
            >
              <Grid3X3 className="h-4 w-4" />
              <span className="text-xs">Grid View</span>
            </Button>
          </div>
        </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">

        {/* API Endpoint Tabs */}
        {Object.entries(apiEndpoints).map(([category, endpoints]) => (
          <TabsContent key={category} value={category} className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {activeTabConfig && (
                  <>
                    <div className={`w-4 h-4 rounded-full ${activeTabConfig.color}`} />
                    <activeTabConfig.icon className="h-5 w-5" />
                    <h2 className="text-xl font-semibold">{activeTabConfig.label}</h2>
                    <Badge variant="outline" className="font-mono">
                      {endpoints.length} endpoint{endpoints.length !== 1 ? 's' : ''}
                    </Badge>
                  </>
                )}
              </div>
            </div>
            
            <div className={viewMode === 'grid' ? 
              "grid grid-cols-1 lg:grid-cols-2 gap-6" : 
              "space-y-8"
            }>
              {endpoints.map((endpoint, index) => (
                <EndpointTester
                  key={`${category}-${index}`}
                  config={endpoint}
                  baseUrl="http://localhost:3001"
                />
              ))}
            </div>
          </TabsContent>
        ))}

        {/* Streaming Tab */}
        <TabsContent value="streams" className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {activeTabConfig && (
                <>
                  <div className={`w-4 h-4 rounded-full ${activeTabConfig.color}`} />
                  <activeTabConfig.icon className="h-5 w-5" />
                  <h2 className="text-xl font-semibold">{activeTabConfig.label}</h2>
                  <Badge variant="outline" className="font-mono">
                    {streamEndpoints.length} stream{streamEndpoints.length !== 1 ? 's' : ''}
                  </Badge>
                </>
              )}
            </div>
          </div>

          <Card className="border-l-4 border-l-cyan-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Radio className="h-5 w-5 text-cyan-600" />
                Server-Sent Events Streams
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Test real-time data streaming endpoints with live event monitoring
              </p>
            </CardHeader>
          </Card>
          
          <div className={viewMode === 'grid' ? 
            "grid grid-cols-1 lg:grid-cols-2 gap-6" : 
            "space-y-8"
          }>
            {streamEndpoints.map((stream, index) => (
              <StreamTester
                key={`stream-${index}`}
                config={stream}
                baseUrl="http://localhost:3001"
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
      </div>
    </DashboardLayout>
  );
} 