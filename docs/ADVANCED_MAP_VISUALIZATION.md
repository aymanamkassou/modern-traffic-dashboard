# Advanced Map Visualization Specification

This document outlines the design, features, and technical specifications for the advanced map component, which serves as the central, interactive hub of the Modern Traffic Dashboard.

---

## 1. Vision & Core Principles

-   **Purpose**: To provide a single, fluid, and intuitive interface for understanding the real-time state and historical patterns of the entire traffic network geographically.
-   **Aesthetic**: Modern, "dark mode" native, clean, and professional. The map should feel like a high-tech command center. Performance is paramount; all interactions must be smooth and lag-free.
-   **Technology Stack**:
    -   **Map Library**: **Mapbox GL JS** combined with **deck.gl** for high-performance data overlays.
    -   **Map Style**: A custom dark-themed map style created in Mapbox Studio. The style will be minimalist and non-distracting, ensuring that the data visualizations are the primary focus.

---

## 2. Base Map Style (Dark Mode)

-   **Roads**: Major arterials are rendered as a slightly luminous, thin line (e.g., a dark, desaturated blue), while minor roads are a very faint gray.
-   **Land/Water**: Land is a very dark gray/charcoal (`#1E1E1E`). Water is a slightly lighter, non-obtrusive dark blue.
-   **Labels**: Text for cities and major roads is a soft, non-pure white (`#EAEAEA`) with a subtle glow effect to ensure readability without being harsh.
-   **Greenery/Parks**: Rendered as a very dark, desaturated green to add subtle texture to the map without distracting from the data.

---

## 3. Data Layers (Togglable)

The map will be composed of several data layers that can be toggled on or off via the Map Control Panel.

### Layer 1: Sensor & Intersection Network (Default: ON)

-   **Data**: `GET /api/sensors/map` for initial GeoJSON data, updated by `GET /api/sensors/stream`.
-   **Visualization**:
    -   Each sensor is a small, pulsating dot. At wider zoom levels, these dots cluster into larger circles showing the sensor count.
    -   **Color indicates status**:
        -   `healthy`: A soft, glowing green.
        -   `warning`: A pulsating yellow.
        -   `critical`/`offline`: A solid, bright red.
-   **Interactivity**:
    -   **Hover**: Tooltip with `sensor_id`, `intersection_id`, and `status`.
    -   **Click**: Opens the detail panel with that sensor's full analytics.

### Layer 2: Risk Heatmap (Default: ON)

-   **Data**: `GET /api/risk/heatmap`.
-   **Visualization**: A `deck.gl` heatmap layer showing the `risk_score`.
    -   **Color Scheme**: Ranges from a cool, transparent blue (low risk) through yellow to a hot, dense red/purple (critical risk).
-   **Interactivity**: This layer is for ambient visualization and has no direct click interaction.

### Layer 3: Live Traffic Flow (Default: OFF)

-   **Data**: `GET /api/traffic/stream`.
-   **Visualization**:
    -   Road segments are colored based on real-time congestion levels (Green for free-flow, Yellow for medium, Red for high/stopped).
    -   A subtle, animated "pulse" effect moves along the road segments in the direction of traffic. The animation speed is proportional to the average vehicle speed.
-   **Interactivity**:
    -   **Hover**: Tooltip with road name, average speed, and congestion level.

### Layer 4: Intersection Coordination State

-   **Data**: `GET /api/coordination/stream`.
-   **Visualization**: When zoomed in, an intersection icon expands to show four indicators for each approach (N, S, E, W).
    -   Indicators light up green or red based on the `coordinated_light_status`.
    -   A radial progress bar visualizes the `phase_time_remaining`.
-   **Interactivity**:
    -   **Click**: Opens the detail panel with a focus on coordination metrics.

### Layer 5: Live Vehicle Positions (Default: OFF - High Performance)

-   **Data**: `GET /api/vehicles/stream`.
-   **Visualization**:
    -   Individual vehicles rendered as small icons, color-coded by `vehicle_class`.
    -   Client-side interpolation provides smooth animation between updates.
    -   A short, fading "trail" behind each vehicle indicates its recent path.
-   **Performance**: This layer is demanding. It will only render vehicles within the current viewport and above a certain zoom level.
-   **Interactivity**:
    -   **Hover**: Tooltip with `vehicle_id`, `class`, and `speed`.

---

## 4. Interactivity & UI Controls

### Map Interactions

-   **Hover**: Show a non-intrusive tooltip with key information.
-   **Click**: Open a detailed analytics sidebar panel (reusing components from other pages) without leaving the map context.

### Map Control Panel

A sleek, collapsible, floating panel for managing map content.

-   **Global Search**: A search bar with autocomplete to find and `flyTo` any sensor or intersection.
-   **Layer Management**: A list of toggle switches for each data layer.
-   **Historical Playback Mode**:
    -   A special mode that disables live streams.
    -   Provides a date/time picker and a timeline slider.
    -   Includes play/pause controls and playback speed options (`1x`, `2x`, `5x`) to animate historical data on the map.

This specification provides the complete vision for a best-in-class, interactive traffic map, forming the core of the dashboard's visualization capabilities. 