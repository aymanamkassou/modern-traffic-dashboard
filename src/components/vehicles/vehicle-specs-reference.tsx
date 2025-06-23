'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AnimatedList } from '@/components/ui/animated-list'
import { useVehicleSpecifications } from '@/lib/api-client'
import { 
  Car, 
  Truck, 
  Bus, 
  Bike,
  ChevronDown,
  ChevronRight,
  Info,
  Ruler,
  Gauge,
  AlertTriangle,
  Battery,
  Navigation,
  Users,
  Zap,
  RefreshCw,
  BookOpen,
  Shield
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Vehicle specifications data
const vehicleSpecs = {
  passenger_car: {
    label: 'Passenger Car',
    icon: Car,
    description: 'Standard passenger vehicles including sedans, hatchbacks, and coupes',
    typical_length: '35-50 dm',
    typical_speed: '30-80 km/h',
    characteristics: [
      'Low profile and compact design',
      'Typically 4-5 passengers',
      'Good fuel efficiency',
      'Urban and highway use'
    ],
    detection_notes: 'Most common vehicle type, baseline for classification algorithms'
  },
  suv: {
    label: 'SUV',
    icon: Car,
    description: 'Sport Utility Vehicles with higher ground clearance and larger profile',
    typical_length: '45-55 dm',
    typical_speed: '25-75 km/h',
    characteristics: [
      'Higher profile than passenger cars',
      'Increased ground clearance',
      'Larger passenger capacity',
      'All-terrain capability'
    ],
    detection_notes: 'Distinguished by height and width profile differences'
  },
  pickup_truck: {
    label: 'Pickup Truck',
    icon: Truck,
    description: 'Light trucks with open cargo bed for hauling',
    typical_length: '50-65 dm',
    typical_speed: '25-70 km/h',
    characteristics: [
      'Open cargo bed design',
      'Higher profile than cars',
      'Variable load capacity',
      'Work and personal use'
    ],
    detection_notes: 'Identified by distinctive bed profile and length'
  },
  motorcycle: {
    label: 'Motorcycle',
    icon: Bike,
    description: 'Two-wheeled motor vehicles including bikes and scooters',
    typical_length: '15-25 dm',
    typical_speed: '20-120 km/h',
    characteristics: [
      'Smallest vehicle profile',
      'High speed variability',
      'Lane splitting capability',
      'Weather dependent usage'
    ],
    detection_notes: 'Challenging detection due to small profile and lane positioning'
  },
  bus: {
    label: 'Bus',
    icon: Bus,
    description: 'Large passenger vehicles for public or private transportation',
    typical_length: '80-180 dm',
    typical_speed: '15-60 km/h',
    characteristics: [
      'Largest passenger vehicle type',
      'High passenger capacity',
      'Frequent stops',
      'Dedicated routes'
    ],
    detection_notes: 'Easily identified by length and height, affects traffic flow significantly'
  },
  semi_truck: {
    label: 'Semi Truck',
    icon: Truck,
    description: 'Large commercial vehicles with trailer for freight transport',
    typical_length: '150-220 dm',
    typical_speed: '15-90 km/h',
    characteristics: [
      'Longest vehicle type',
      'Heavy freight capacity',
      'Wide turning radius',
      'Highway and arterial use'
    ],
    detection_notes: 'Identified by extreme length and articulated design'
  },
  delivery_van: {
    label: 'Delivery Van',
    icon: Truck,
    description: 'Medium-sized commercial vehicles for package and goods delivery',
    typical_length: '45-70 dm',
    typical_speed: '20-70 km/h',
    characteristics: [
      'Box-like cargo area',
      'Frequent stops',
      'Urban delivery focus',
      'Variable load capacity'
    ],
    detection_notes: 'Distinguished by boxy profile and commercial usage patterns'
  }
}

// Status byte definitions with semantic colors
const statusDefinitions = {
  hardware_fault: {
    label: 'Hardware Fault',
    icon: AlertTriangle,
    bit_position: 0,
    description: 'Indicates sensor hardware malfunction or communication error',
    severity: 'critical',
    implications: [
      'Sensor data may be unreliable',
      'Requires immediate maintenance',
      'May affect traffic coordination',
      'Could impact safety systems'
    ],
    troubleshooting: [
      'Check sensor power supply',
      'Verify communication cables',
      'Inspect for physical damage',
      'Review error logs'
    ]
  },
  low_voltage: {
    label: 'Low Voltage',
    icon: Battery,
    bit_position: 1,
    description: 'Power supply voltage below operational threshold',
    severity: 'warning',
    implications: [
      'Reduced sensor performance',
      'Potential data loss',
      'Shortened operational life',
      'May lead to hardware failure'
    ],
    troubleshooting: [
      'Check power supply connections',
      'Measure voltage levels',
      'Inspect for corrosion',
      'Consider power supply upgrade'
    ]
  },
  wrong_way_driver: {
    label: 'Wrong Way Driver',
    icon: Navigation,
    bit_position: 2,
    description: 'Vehicle detected traveling against traffic flow direction',
    severity: 'critical',
    implications: [
      'Immediate safety hazard',
      'Potential for accidents',
      'Traffic disruption',
      'Emergency response needed'
    ],
    troubleshooting: [
      'Verify sensor orientation',
      'Check detection algorithms',
      'Review traffic patterns',
      'Alert traffic management'
    ]
  },
  queue_detected: {
    label: 'Queue Detected',
    icon: Users,
    bit_position: 3,
    description: 'Traffic queue or congestion formation identified',
    severity: 'info',
    implications: [
      'Traffic flow reduction',
      'Increased travel times',
      'Potential spillback',
      'Signal timing adjustment needed'
    ],
    troubleshooting: [
      'Monitor queue length',
      'Adjust signal timing',
      'Check for incidents',
      'Implement traffic management'
    ]
  }
}

// Vehicle Specification Card Component with animations
function VehicleSpecCard({ type, spec, index }: { type: string; spec: any; index: number }) {
  const [isOpen, setIsOpen] = useState(false)
  const Icon = spec.icon

  return (
    <div 
      className="animate-fade-in-up"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button 
            variant="ghost" 
            className="w-full justify-between p-4 h-auto hover:bg-muted/50 transition-all duration-200"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div className="text-left">
                <div className="font-medium">{spec.label}</div>
                <div className="text-sm text-muted-foreground">{spec.description}</div>
              </div>
            </div>
            {isOpen ? (
              <ChevronDown className="h-4 w-4 transition-transform duration-200" />
            ) : (
              <ChevronRight className="h-4 w-4 transition-transform duration-200" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="px-4 pb-4 animate-fade-in-up">
          <div className="space-y-4 pt-2 border-t">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="text-sm font-medium flex items-center gap-1">
                  <Ruler className="h-3 w-3 text-muted-foreground" />
                  Typical Length
                </div>
                <div className="text-sm text-muted-foreground font-mono">{spec.typical_length}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm font-medium flex items-center gap-1">
                  <Gauge className="h-3 w-3 text-muted-foreground" />
                  Typical Speed
                </div>
                <div className="text-sm text-muted-foreground font-mono">{spec.typical_speed}</div>
              </div>
            </div>
            
            <div>
              <div className="text-sm font-medium mb-2">Characteristics</div>
              <ul className="text-sm text-muted-foreground space-y-1">
                {spec.characteristics.map((char: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="w-1 h-1 rounded-full bg-primary mt-2 flex-shrink-0" />
                    {char}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="text-sm font-medium mb-1 flex items-center gap-1">
                <Info className="h-3 w-3" />
                Detection Notes
              </div>
              <div className="text-sm text-muted-foreground">{spec.detection_notes}</div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

// Status Definition Card Component with animations
function StatusDefinitionCard({ type, definition, index }: { type: string; definition: any; index: number }) {
  const [isOpen, setIsOpen] = useState(false)
  const Icon = definition.icon

  return (
    <div 
      className="animate-fade-in-up"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button 
            variant="ghost" 
            className="w-full justify-between p-4 h-auto hover:bg-muted/50 transition-all duration-200"
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-lg",
                definition.severity === 'critical' && "bg-destructive/10",
                definition.severity === 'warning' && "bg-warning/10",
                definition.severity === 'info' && "bg-primary/10"
              )}>
                <Icon className={cn(
                  "h-5 w-5",
                  definition.severity === 'critical' && "text-destructive",
                  definition.severity === 'warning' && "text-warning",
                  definition.severity === 'info' && "text-primary"
                )} />
              </div>
              <div className="text-left">
                <div className="font-medium flex items-center gap-2">
                  {definition.label}
                  <Badge 
                    variant={
                      definition.severity === 'critical' ? 'destructive' :
                      definition.severity === 'warning' ? 'secondary' :
                      'outline'
                    }
                    className="text-xs"
                  >
                    Bit {definition.bit_position}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">{definition.description}</div>
              </div>
            </div>
            {isOpen ? (
              <ChevronDown className="h-4 w-4 transition-transform duration-200" />
            ) : (
              <ChevronRight className="h-4 w-4 transition-transform duration-200" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="px-4 pb-4 animate-fade-in-up">
          <div className="space-y-4 pt-2 border-t">
            <div>
              <div className="text-sm font-medium mb-2 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Implications
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                {definition.implications.map((implication: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="w-1 h-1 rounded-full bg-destructive/50 mt-2 flex-shrink-0" />
                    {implication}
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <div className="text-sm font-medium mb-2 flex items-center gap-1">
                <Shield className="h-3 w-3" />
                Troubleshooting Steps
              </div>
              <ol className="text-sm text-muted-foreground space-y-1">
                {definition.troubleshooting.map((step: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-xs bg-primary/20 text-primary rounded-full w-4 h-4 flex items-center justify-center mt-0.5 flex-shrink-0 font-medium">
                      {index + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

// Loading skeleton component
function SpecificationSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardHeader>
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-2/3" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, j) => (
                <Skeleton key={j} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// Main Vehicle Specs Reference Component
export function VehicleSpecsReference() {
  const { data: specifications, isLoading, error, refetch } = useVehicleSpecifications()

  if (isLoading) {
    return <SpecificationSkeleton />
  }

  if (error) {
    return (
      <Card className="border-destructive/50 animate-fade-in-up">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Error Loading Vehicle Specifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            {error.message || 'Failed to load vehicle specifications. Please try again later.'}
          </p>
          <Button onClick={() => refetch()} size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!specifications) {
    return (
      <Card className="border-warning/50 animate-fade-in-up">
        <CardHeader>
          <CardTitle className="text-warning flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            No Specifications Available
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Vehicle specifications data is not currently available.
          </p>
        </CardContent>
      </Card>
    )
  }

  // Create enhanced vehicle specs from API data
  const apiVehicleSpecs = Object.entries(specifications.enhanced_vehicle_lengths || {}).reduce((acc, [type, length]) => {
    acc[type] = {
      label: type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
      icon: vehicleSpecs[type as keyof typeof vehicleSpecs]?.icon || Car,
      description: vehicleSpecs[type as keyof typeof vehicleSpecs]?.description || `Enhanced ${type.replace(/_/g, ' ')} detection`,
      typical_length: length,
      typical_speed: vehicleSpecs[type as keyof typeof vehicleSpecs]?.typical_speed || '20-80 km/h',
      characteristics: vehicleSpecs[type as keyof typeof vehicleSpecs]?.characteristics || [
        'Enhanced sensor detection',
        'Real-time classification',
        'Precise length measurement',
        'Speed and direction tracking'
      ],
      detection_notes: vehicleSpecs[type as keyof typeof vehicleSpecs]?.detection_notes || 'Enhanced detection from Rust simulator integration'
    }
    return acc
  }, {} as any)

  // Create status definitions from API data
  const apiStatusDefinitions = Object.entries(specifications.status_byte_decoding || {}).reduce((acc, [key, description]) => {
    const bitNum = key.replace('bit_', '')
    const statusKey = key === 'bit_2' ? 'hardware_fault' : 
                     key === 'bit_3' ? 'low_voltage' :
                     key === 'bit_4' ? 'wrong_way_driver' :
                     key === 'bit_5' ? 'queue_detected' : key
    
    if (statusDefinitions[statusKey as keyof typeof statusDefinitions]) {
      acc[statusKey] = {
        ...statusDefinitions[statusKey as keyof typeof statusDefinitions],
        description: description.replace(/\(0x[0-9A-F]+\)/g, '').trim()
      }
    }
    return acc
  }, {} as any)

  // Component list for animated rendering
  const componentList = [
    {
      id: 'integration-info',
      component: specifications.integration_info && (
        <Card className="border-success/50 bg-success/5 animate-fade-in-up">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm mb-2">
              <Zap className="h-4 w-4 text-success" />
              <span className="font-medium text-success-foreground">
                {specifications.integration_info.source} v{specifications.integration_info.version}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {specifications.integration_info.features.map((feature: string, index: number) => (
                <Badge key={index} variant="outline" className="text-xs border-success/30">
                  {feature}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )
    },
    {
      id: 'vehicle-classifications',
      component: (
        <Card className="animate-fade-in-up">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Vehicle Classifications
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Real-time specifications from the enhanced traffic simulator system
            </p>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(apiVehicleSpecs).map(([type, spec], index) => (
              <VehicleSpecCard key={type} type={type} spec={spec} index={index} />
            ))}
          </CardContent>
        </Card>
      )
    },
    {
      id: 'status-definitions',
      component: (
        <Card className="animate-fade-in-up">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Status Byte Definitions
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Real-time status flag definitions from sensor integration
            </p>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(apiStatusDefinitions).map(([type, definition], index) => (
              <StatusDefinitionCard key={type} type={type} definition={definition} index={index} />
            ))}
          </CardContent>
        </Card>
      )
    },
    {
      id: 'quick-reference',
      component: (
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="animate-fade-in-up">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Ruler className="h-5 w-5" />
                Length Reference
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {Object.entries(specifications.enhanced_vehicle_lengths || {}).map(([type, length]) => (
                  <div key={type} className="flex justify-between items-center py-1">
                    <span className="capitalize">{type.replace(/_/g, ' ')}:</span>
                    <span className="font-mono text-muted-foreground">{length}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="animate-fade-in-up">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Quick Status Reference
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="destructive" className="text-xs">Critical</Badge>
                  <span className="text-muted-foreground">Hardware Fault, Wrong Way</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">Warning</Badge>
                  <span className="text-muted-foreground">Low Voltage</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">Info</Badge>
                  <span className="text-muted-foreground">Queue Detected</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }
  ]

  return (
    <AnimatedList
      items={componentList.filter(item => item.component)}
      renderItem={(item) => item.component}
      keyExtractor={(item) => item.id}
      staggerDelay={100}
      className="space-y-6"
    />
  )
} 