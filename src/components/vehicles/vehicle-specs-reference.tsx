'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Button } from '@/components/ui/button'
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
  Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'

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

// Status byte definitions
const statusDefinitions = {
  hardware_fault: {
    label: 'Hardware Fault',
    icon: AlertTriangle,
    bit_position: 0,
    description: 'Indicates sensor hardware malfunction or communication error',
    severity: 'critical',
    color: 'text-red-500',
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
    color: 'text-orange-500',
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
    color: 'text-red-500',
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
    color: 'text-blue-500',
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

// Vehicle Specification Card Component
function VehicleSpecCard({ type, spec }: { type: string; spec: any }) {
  const [isOpen, setIsOpen] = useState(false)
  const Icon = spec.icon

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between p-4 h-auto">
          <div className="flex items-center gap-3">
            <Icon className="h-5 w-5" />
            <div className="text-left">
              <div className="font-medium">{spec.label}</div>
              <div className="text-sm text-muted-foreground">{spec.description}</div>
            </div>
          </div>
          {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="px-4 pb-4">
        <div className="space-y-4 pt-2 border-t">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium flex items-center gap-1">
                <Ruler className="h-3 w-3" />
                Typical Length
              </div>
              <div className="text-sm text-muted-foreground">{spec.typical_length}</div>
            </div>
            <div>
              <div className="text-sm font-medium flex items-center gap-1">
                <Gauge className="h-3 w-3" />
                Typical Speed
              </div>
              <div className="text-sm text-muted-foreground">{spec.typical_speed}</div>
            </div>
          </div>
          
          <div>
            <div className="text-sm font-medium mb-2">Characteristics</div>
            <ul className="text-sm text-muted-foreground space-y-1">
              {spec.characteristics.map((char: string, index: number) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="w-1 h-1 rounded-full bg-muted-foreground mt-2 flex-shrink-0" />
                  {char}
                </li>
              ))}
            </ul>
          </div>
          
          <div className="bg-muted/50 p-3 rounded-lg">
            <div className="text-sm font-medium mb-1">Detection Notes</div>
            <div className="text-sm text-muted-foreground">{spec.detection_notes}</div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

// Status Definition Card Component
function StatusDefinitionCard({ type, definition }: { type: string; definition: any }) {
  const [isOpen, setIsOpen] = useState(false)
  const Icon = definition.icon

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between p-4 h-auto">
          <div className="flex items-center gap-3">
            <Icon className={cn("h-5 w-5", definition.color)} />
            <div className="text-left">
              <div className="font-medium flex items-center gap-2">
                {definition.label}
                <Badge variant={
                  definition.severity === 'critical' ? 'destructive' :
                  definition.severity === 'warning' ? 'secondary' :
                  'outline'
                }>
                  Bit {definition.bit_position}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">{definition.description}</div>
            </div>
          </div>
          {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="px-4 pb-4">
        <div className="space-y-4 pt-2 border-t">
          <div>
            <div className="text-sm font-medium mb-2">Implications</div>
            <ul className="text-sm text-muted-foreground space-y-1">
              {definition.implications.map((implication: string, index: number) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="w-1 h-1 rounded-full bg-muted-foreground mt-2 flex-shrink-0" />
                  {implication}
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <div className="text-sm font-medium mb-2">Troubleshooting Steps</div>
            <ol className="text-sm text-muted-foreground space-y-1">
              {definition.troubleshooting.map((step: string, index: number) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-xs bg-muted text-muted-foreground rounded-full w-4 h-4 flex items-center justify-center mt-0.5 flex-shrink-0">
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
  )
}

// Main Vehicle Specs Reference Component
export function VehicleSpecsReference() {
  return (
    <div className="space-y-6">
      {/* Vehicle Classifications */}
      <Card className="animate-fade-in-up">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Vehicle Classifications
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Detailed specifications and characteristics for each vehicle type detected by the system
          </p>
        </CardHeader>
        <CardContent className="space-y-2">
          {Object.entries(vehicleSpecs).map(([type, spec]) => (
            <VehicleSpecCard key={type} type={type} spec={spec} />
          ))}
        </CardContent>
      </Card>

      {/* Status Byte Definitions */}
      <Card className="animate-fade-in-up">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Status Byte Definitions
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Detailed explanation of status flags and their implications for system operation
          </p>
        </CardHeader>
        <CardContent className="space-y-2">
          {Object.entries(statusDefinitions).map(([type, definition]) => (
            <StatusDefinitionCard key={type} type={type} definition={definition} />
          ))}
        </CardContent>
      </Card>

      {/* Quick Reference */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="animate-fade-in-up">
          <CardHeader>
            <CardTitle className="text-lg">Length Reference</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Motorcycle:</span>
                <span className="font-mono">15-25 dm</span>
              </div>
              <div className="flex justify-between">
                <span>Passenger Car:</span>
                <span className="font-mono">35-50 dm</span>
              </div>
              <div className="flex justify-between">
                <span>SUV:</span>
                <span className="font-mono">45-55 dm</span>
              </div>
              <div className="flex justify-between">
                <span>Pickup Truck:</span>
                <span className="font-mono">50-65 dm</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Van:</span>
                <span className="font-mono">45-70 dm</span>
              </div>
              <div className="flex justify-between">
                <span>Bus:</span>
                <span className="font-mono">80-180 dm</span>
              </div>
              <div className="flex justify-between">
                <span>Semi Truck:</span>
                <span className="font-mono">150-220 dm</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-fade-in-up">
          <CardHeader>
            <CardTitle className="text-lg">Status Bit Map</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span>Bit 0:</span>
                <Badge variant="destructive" className="text-xs">Hardware Fault</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Bit 1:</span>
                <Badge variant="secondary" className="text-xs">Low Voltage</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Bit 2:</span>
                <Badge variant="destructive" className="text-xs">Wrong Way</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Bit 3:</span>
                <Badge variant="outline" className="text-xs">Queue Detected</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Bits 4-7:</span>
                <Badge variant="outline" className="text-xs">Reserved</Badge>
              </div>
            </div>
            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <div className="text-xs text-muted-foreground">
                Status byte is an 8-bit value where each bit represents a specific condition or flag.
                Multiple flags can be active simultaneously.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 