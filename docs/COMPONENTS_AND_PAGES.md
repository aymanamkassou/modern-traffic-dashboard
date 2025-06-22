# Dashboard Components & Pages Specification

This document serves as the comprehensive blueprint for developing the user interface of the Modern Traffic Dashboard. It details every page, component, and their interactions with the backend API, ensuring a cohesive, feature-rich, and visually stunning application.

**Guiding Principles:**
- **Clarity & Simplicity:** Every component must be intuitive and easy to understand.
- **Actionable Intelligence:** Go beyond raw data. Each component must answer a key question for a traffic engineer or planner.
- **Real-time First:** The UI should feel alive, with data updating seamlessly via Server-Sent Events (SSE).
- **Consistency:** Adhere to the `DESIGN_PHILOSOPHY.md` to maintain a unified look and feel.

---

## Page: Overview (`/`)

**Purpose**: To provide a command center-style, at-a-glance summary of the entire traffic network's health, performance, and technological status.

| Component                  | Description                                                                                                                              | Key APIs & Streams                                                                                             | SSE Enhanced |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------ |
| **KPI Grid**               | A row of 5 summary cards displaying the most critical system metrics with real-time updates.                                             | Multiple APIs with SSE integration                                                                             | ⚡ Yes       |
| **- Overall Risk Score**   | A prominent radial gauge chart showing the system-wide average risk score. Color changes dynamically with risk level. **Uses SSE** for live risk updates derived from traffic data. | `GET /api/risk/analysis`, **SSE**: `/api/traffic/stream` (derived from traffic conditions)                    | ⚡ Yes       |
| **- Live Vehicle Count**   | A real-time count of unique vehicles detected across the network in the last 5 minutes. **Uses SSE** for instant updates.              | **SSE**: `/api/vehicles/stream` (client-side aggregation)                                                     | ⚡ Yes       |
| **- Sensor Health Overview** | A donut chart visualizing sensor status breakdown (healthy/warning/critical/offline) with expandable details for specific issues. **Uses SSE** for real-time sensor health updates. | `GET /api/sensors/status`, **SSE**: `/api/sensors/stream`                                                     | ⚡ Yes       |
| **- Active Critical Alerts** | A count of unresolved `high` or `critical` severity alerts. **Uses SSE** to detect new alerts instantly. Clicking navigates to Alerts page. | `GET /api/alerts/count?resolved=false&severity=high,critical`, **SSE**: `/api/sensors/stream` (sensor-based alerts)              | ⚡ Yes       |
| **- Network Performance**  | A composite score showing overall system efficiency based on average speeds, flow rates, and coordination status.                        | `GET /api/coordination/intersections`, `GET /api/historical/traffic`                                          | 🔄 Planned   |
| **Mini Risk Heatmap**      | A non-interactive geographical map showing all intersections color-coded by their current risk level. **Uses SSE** for live risk updates. | `GET /api/risk/heatmap`, **SSE**: *Custom implementation*                                                     | NO       |
| **Real-time Activity Feed**| A scrolling ticker list of the latest high-importance system events (e.g., new critical alerts, intersection mode changes). **Uses SSE** for real-time events. | **SSE**: `/api/sensors/stream` (derived from sensor events)                                                   | ⚡ Yes       |
| **24-Hour Trend Chart**    | A combined bar and line chart showing system-wide vehicle volume (bars) and average speed (line) over the last 24 hours.                 | `GET /api/historical/traffic?aggregation=hour`                                                                | 🚫 No        |

---

## Page: Traffic Flow (`/traffic`)

**Purpose**: To provide a detailed, real-time view of traffic dynamics at a selected intersection, clearly distinguishing between the data available from enhanced vs. legacy sensors.

| Component                      | Description                                                                                                                                 | Key APIs & Streams                                                                        |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| **Intersection Selector**      | A primary, searchable dropdown to select an intersection, which filters the entire page's data.                                             | `GET /api/intersections` (to populate the list)                                           |
| **Directional Flow Gauges (x4)** | Four large, semi-circular gauge charts, one for each direction (N, S, E, W), visualizing the real-time `vehicle_flow_rate`. **Uses SSE** for live updates.                  | **SSE**: `/api/traffic/stream?intersection_id={id}`                                            |
| **Real-time Metrics Table**    | A table with 4 rows (one per direction) showing live `Speed`, `Density`, `Travel Time`, `Congestion Level`, and `Traffic Light Phase`. **Uses SSE** for live data.         | **SSE**: `/api/traffic/stream?intersection_id={id}`                                            |
| **- Sparkline Trends**         | Tiny line charts embedded within the metrics table cells to show the last 5 minutes of speed and density history.                             | Client-side data buffering from the stream.                                               |
| **Data Enhancement Indicator** | A clear visual indicator (e.g., a badge) showing the `enhancement_rate` for the data being displayed, answering "How much of this data is from enhanced sensors?". | `enhancement_info` from `GET /api/traffic` |
| **Historical Comparison Chart**| A line chart comparing speed vs. density for the selected intersection over a user-selected time range (e.g., last hour, last 24 hours).      | `GET /api/traffic`                                                                        |

---

## Page: Vehicles (`/vehicles`)

**Purpose**: To analyze vehicle-specific data, including classifications, speeds, and status flags, while understanding the source and quality of the data.

| Component                   | Description                                                                                                                                | Key APIs & Streams                                               |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------- |
| **Vehicle Statistics Dashboard** | A set of summary cards and charts showing `overall_stats` and `vehicle_class_breakdown`. Includes a donut chart for vehicle classes and a bar chart for `data_source_breakdown` (Enhanced vs. Legacy). | `GET /api/vehicles/stats`                                        |
| **Live Vehicle Log**        | A filterable, sortable, and paginated data table of the most recent vehicle records. Decodes the `status` byte into readable icons/tags. **Uses SSE** for live updates.      | `GET /api/vehicles`, **SSE**: `/api/vehicles/stream` |
| **Status Anomaly Chart**    | A bar chart showing the frequency of status alerts (`hardware_fault`, `wrong_way_driver`, etc.) to identify recurring vehicle issues.        | `GET /api/vehicles/stats` (using `status_analysis`)              |
| **Vehicle Specs Reference** | A static, well-formatted accordion component displaying vehicle specifications, lengths, and status byte definitions.                        | `GET /api/vehicles/specifications`                               |

---

## Page: Intersections (`/intersections`)

**Purpose**: To manage and monitor the performance of all intersections, with a focus on comparing the capabilities and efficiency of coordinated vs. legacy systems.

| Component                     | Description                                                                                                                                       | Key APIs & Streams                                                         |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| **Intersections Master List**   | A data table or grid of cards listing all intersections, showing `id`, `coordination_status` (as a prominent "Enhanced" or "Legacy" badge), `efficiency`, and `total_vehicles`. | `GET /api/intersections`                                                   |
| **Intersection Detail View**    | A rich, tabbed component shown on selection.                                                                                                        | (See sub-components)                                                       |
| **- Tab 1: Coordination**     | Visualizes traffic light status (`coordinated_light_status`) and `phase_time_remaining`. Includes KPI cards for `cycle_efficiency`, wait times, etc. **Uses SSE** for real-time coordination updates. | `GET /api/coordination/intersections/:id/status`, **SSE**: `/api/coordination/stream` |
| **- Tab 2: Vehicle Analysis** | Shows a 4-quadrant breakdown of vehicle counts, avg speed, and vehicle classes for each approach (North, South, East, West).                         | `GET /api/vehicles/intersection/:intersectionId`                             |
| **- Tab 3: Sensor Status**    | Lists all sensors at the intersection, their status, and key metrics.                                                                              | `GET /api/sensors/intersection/:id`                                          |
| **- Tab 4: Diagnostics**      | A utility view showing data availability, collection stats, and suggestions for troubleshooting data gaps at this intersection.                     | `GET /api/vehicles/intersection/:intersectionId/diagnostics`                 |

---

## Page: Sensors (`/sensors`)

**Purpose**: To monitor the health, status, and capabilities of all sensors in the network, making it easy to identify which sensors provide enhanced data.

| Component                   | Description                                                                                                                               | Key APIs & Streams                                                     |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| **Sensor Status Grid**      | A grid of cards, one for each sensor. Card's border color indicates `status`. Shows `sensor_id`, `battery_level`, and an "Enhanced" badge if applicable. **Uses SSE** for live status updates. | `GET /api/sensors/status`, `GET /api/sensors/registry`, **SSE**: `/api/sensors/stream` |
| **Sensor Detail Modal**     | A modal opened on card click, showing detailed status, issues, and a clear list of all `basic_capabilities` and `enhanced_capabilities`. | `GET /api/sensors/:id/capabilities`, `GET /api/sensors/status` (from parent) |
| **Health History Charts**   | Within the detail modal, a tab with time-series charts for `batteryHistory`, `temperatureHistory`, and `uptimeHistory`.                     | `GET /api/sensors/history/:sensorId`                                   |

---

## Page: Analytics (`/analytics`)

**Purpose**: To provide a powerful section for deep-dive analysis of historical data, risks, and trends. Organized by tabs.

| Component (by Tab)                | Description                                                                                                                              | Key APIs & Streams                                      |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| **Tab: Risk Analysis**            |                                                                                                                                          |                                                         |
| **- Intersection Risk Profiler**  | Select an intersection to see its `overall_risk` score in a gauge chart and the `risk_breakdown` in a radar chart.                         | `GET /api/risk/analysis`                                |
| **- Top Risk Factors**            | A prioritized, human-readable list of the factors contributing to the risk score.                                                        | `risk_factors` from `GET /api/risk/analysis`            |
| **Tab: Historical Performance**   |                                                                                                                                          |                                                         |
| **- Multi-Metric Traffic Chart**  | An interactive chart to plot `avg_speed`, `avg_density`, and `total_vehicles` over time for any intersection.                                | `GET /api/historical/traffic`                           |
| **- Weather Impact Dashboard**    | A series of bar charts comparing key traffic metrics (`avg_speed_change`, `incident_rate_multiplier`) across different weather conditions.   | `GET /api/historical/weather`                           |
| **Tab: Incidents & Congestion**   |                                                                                                                                          |                                                         |
| **- Congestion Hotspot Heatmap**  | A table-based heatmap showing intersections (rows) vs. hours of the day (columns), with cell color indicating congestion level.            | `GET /api/historical/congestion`                        |
| **- Incident Hotspot Treemap**    | A treemap where the size of the shape represents the incident count for an intersection, highlighting hotspots.                            | `GET /api/historical/incidents`                         |

---

## Page: Map View (`/map`)

**Purpose**: To provide the primary, fully-interactive geographical interface for monitoring the entire traffic network.

| Component                   | Description                                                                                                                                   | Key APIs & Streams                                      |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| **Advanced Map Component**  | The main full-screen map. Its detailed specification is in `ADVANCED_MAP_VISUALIZATION.md`.                                                     | All geo-related APIs and streams.                       |
| **Map Control Panel**       | A floating panel with layer toggles (Sensors, Risk Heatmap, Traffic Flow), a time-scrubber for historical playback, and a global search bar.      | -                                                       |
| **Interactive Detail Panel**| A sidebar that appears on-click, showing detailed analytics for the selected map element by reusing components from other pages.              | Context-dependent.                                      |

---

## Page: API Testing (`/test-api`)

**Purpose**: A developer-focused utility page for testing API endpoints and streams. This page is crucial for diagnostics and ensuring data integrity.

| Component                  | Description                                                                                                                                    | Key APIs & Streams                                   |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| **Endpoint Tester**        | An interactive component for a single API endpoint. It includes fields for path/query parameters, a "Send" button, and displays the JSON response. | All `GET` endpoints.                                 |
| **Stream Tester**          | Connects to an SSE stream (`/api/traffic/stream`, `/api/sensors/stream`, `/api/vehicles/stream`, etc.). Displays a live, scrolling log of incoming event data. **Primary SSE testing tool**.                  | **All SSE endpoints**: `/api/*/stream`                             |
| **API Category Navigation**| A set of tabs or an accordion to group `Endpoint Tester` components by category (Traffic, Vehicles, etc.) for easy navigation.                   | -                                                    |

---

## Page: Settings (`/settings`)

**Purpose**: A page for user-specific configuration.

| Component                 | Description                                                                              |
| ------------------------- | ---------------------------------------------------------------------------------------- |
| **Theme Toggle**          | A clear toggle for switching between Light and Dark themes across the application.       |
| **Notification Preferences**| A set of checkboxes allowing users to subscribe/unsubscribe from different alert types. |
| **Default Map View**      | Inputs to set the default coordinates and zoom level for the Map View page.              |

---

## Server-Sent Events (SSE) Integration

### Components Using Real-time SSE Streams

The following components have been enhanced with **Server-Sent Events** for real-time data updates:

| Component | SSE Endpoint | Update Type | Purpose |
|-----------|--------------|-------------|---------|
| **RealTimeActivityFeed** | `/api/sensors/stream` | System Events | Live alerts derived from sensor data |
| **MiniRiskHeatmap** | *Custom implementation* | Risk Updates | Real-time intersection risk scores |
| **DirectionalFlowGauges** | `/api/traffic/stream` | Traffic Data | Live vehicle flow rates by direction |
| **RealTimeMetricsTable** | `/api/traffic/stream` | Traffic Metrics | Speed, density, congestion levels |
| **LiveVehicleLog** | `/api/vehicles/stream` | Vehicle Events | New vehicle detections and classifications |
| **IntersectionCoordination** | `/api/coordination/stream` | Light Status | Traffic signal coordination updates |
| **SensorStatusGrid** | `/api/sensors/stream` | Sensor Health | Battery, temperature, connectivity status |

### SSE Implementation Guidelines

1. **Connection Management**: All SSE components use the `useServerSentEvents` hook for robust connection handling
2. **Error Handling**: Components display connection status and gracefully handle disconnections
3. **Data Buffering**: Events are buffered client-side with configurable limits (default: 100 events)
4. **Auto-Reconnection**: Failed connections automatically retry with exponential backoff
5. **Performance**: Event processing is optimized to prevent UI blocking

### Connection Status Indicators

All SSE-enabled components include visual connection indicators:

- **🟢 Live**: Connected and receiving real-time data
- **🟡 Reconnecting**: Attempting to reconnect after disconnection  
- **🔴 Offline**: Connection failed, showing last known data
- **⚡ Enhanced**: Component supports enhanced real-time features

For detailed SSE implementation information, see `SSE_INTEGRATION.md`.
