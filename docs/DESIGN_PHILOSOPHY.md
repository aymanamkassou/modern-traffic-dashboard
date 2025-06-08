# Design Philosophy & UI/UX Guide

This document outlines the design philosophy, UI/UX patterns, and component standards for the Modern Traffic Dashboard. Its purpose is to ensure a cohesive, intuitive, and visually appealing user experience across the entire application. All future development of pages and components must adhere to these guidelines.

## Core Principles

1.  **Clarity over cleverness**: The interface should be intuitive and self-explanatory. Users should understand functionality without needing extensive documentation.
2.  **Consistency is key**: Similar elements should look and behave in similar ways. This builds user confidence and reduces cognitive load.
3.  **Information density**: Display complex data in a structured and digestible manner. Use whitespace, typography, and visual hierarchy effectively.
4.  **Responsive and accessible**: The application must be fully usable and accessible on all screen sizes, from mobile to desktop.
5.  **Aesthetic and professional**: The design should be modern, clean, and visually pleasing, reflecting the quality of the underlying data and technology.

---

## 1. Layout and Spacing

Our layout is built on a foundation of consistent spacing and responsive containers.

### 1.1. Page Layout

-   **Main Container**: Each page is wrapped in a `DashboardLayout` component.
-   **Vertical Rhythm**: The primary content container uses a `space-y-8` class to create consistent vertical spacing between major page sections.
-   **Content Cards**: Individual modules and components are encapsulated within `Card` components.

### 1.2. Spacing System

We use Tailwind CSS's default spacing scale (multiples of 4px).

-   **Container Padding**: `px-4 sm:px-6 lg:px-8`
-   **Section Spacing**: `space-y-8` (32px) for major sections.
-   **Card Content Spacing**: `space-y-6` (24px) for content within a `Card`.
-   **Form/Input Spacing**: `space-y-3` (12px) for labels and inputs.
-   **Gap Spacing**: `gap-2` (8px) for tight groups, `gap-4` (16px) for general component groups, `gap-6` (24px) for grid layouts.

### 1.3. Responsive Grid

-   For displaying lists of items like `EndpointTester` or `StreamTester`, we use a responsive grid system.
-   **Default**: Single column stack (`space-y-8`).
-   **Grid View**: Toggles to `grid grid-cols-1 lg:grid-cols-2 gap-6`. This provides a compact view on larger screens.

---

## 2. Color Palette & Theming

Color is used purposefully to convey information and create visual distinction.

### 2.1. Base Colors

-   Uses `shadcn/ui`'s default theme with CSS variables (`--background`, `--foreground`, `--card`, `--primary`, etc.).
-   Supports **Light** and **Dark** modes via the `ThemeToggle` component.

### 2.2. Categorical Colors

A specific color is assigned to each API category for quick visual identification. This color is used in navigation elements (dots, icons) and section headers.

-   **Traffic Data**: `bg-blue-500`
-   **Vehicles**: `bg-green-500`
-   **Intersections**: `bg-purple-500`
-   **Sensors**: `bg-orange-500`
-   **Alerts**: `bg-red-500`
-   **Risk Analysis**: `bg-yellow-500`
-   **Historical**: `bg-indigo-500`
-   **Coordination**: `bg-pink-500`
-   **Data Receiver**: `bg-teal-500`
-   **Live Streams**: `bg-cyan-500`

### 2.3. Semantic Colors

-   **Success/Connected**: Green (`text-green-500`).
-   **Warning/Error/Destructive**: Red (`text-destructive`, `bg-destructive/10`).
-   **Technical/Code**: Orange (`text-orange-600`). Used for path parameters and technical labels.

---

## 3. Typography

A clear typographic hierarchy guides the user's attention.

-   `h1` (`text-3xl font-bold`): Main page title.
-   `h2` (`text-xl font-semibold`): Section titles within a page.
-   `CardTitle` (`text-lg` or `text-base`): Titles within `Card` components.
-   `p` (`text-muted-foreground`): Descriptive text under titles.
-   **Body Text**: `text-sm` is standard.
-   **Labels/Microcopy**: `text-xs` for form labels or secondary info.
-   **Monospace Font**: `font-mono` is used for all technical content: API paths, URLs, code snippets, parameter keys/values, and type selectors.

---

## 4. Core Components (Shadcn UI)

We leverage `shadcn/ui` for our base component library, with specific styling and usage patterns.

### 4.1. Card

-   **Usage**: The primary container for distinct UI modules (`EndpointTester`, `ParameterForm`, etc.).
-   **Structure**: Always use `CardHeader` and `CardContent` for structure. `CardTitle` should be present.

### 4.2. Button

-   **Default Size**: Use the default button size for primary actions.
-   **Small Size (`size="sm"`):** Reserved for secondary actions or in dense UI areas like header controls.
-   **Responsiveness**: For buttons with text and icons, use `hidden sm:inline` and `sm:hidden` to shorten text on mobile (e.g., "Clear Events" -> "Clear").
-   **Loading State**: A primary button in a loading state should display a spinner and change text to "Testing..." or similar.

### 4.3. Badge

-   **Usage**: To display short, important information like counts, status, or categories.
-   **Styling**: Use `variant="outline"` or `variant="secondary"` for most cases. Use custom styling for specific semantic meaning (e.g., HTTP method badges).
-   **Font**: Use `font-mono` for technical badges (counts, methods).

### 4.4. Input & Select (Forms)

-   **Font**: All form inputs dealing with technical data (`ParameterForm`) use `font-mono`.
-   **Path Parameters**: Use the segmented input design where the parameter name (`:id`) is part of the input's left segment.
-   **Type Selectors**: Must use `font-mono` and have a `w-28` class to fit all options.

### 4.5. Navigation (Tabs & Select)

-   **Desktop**: Use a grid of `Button` components for primary page navigation, providing a large, clear touch target.
-   **Mobile**: Collapse the navigation into a `Select` component (`sm:hidden`) for a clean mobile experience.
-   **Visuals**: Both navigation patterns must display the category's color dot, icon, label, and count badge for consistency.

---

## 5. Iconography

-   **Library**: `lucide-react`.
-   **Usage**: Icons should always be accompanied by text, unless in an icon-only button with a clear tooltip.
-   **Size**: Standard icon size is `h-4 w-4` or `h-5 w-5`.

---

## 6. Areas for Future Improvement

1.  **Centralized Color Configuration**: The categorical colors are currently hardcoded. They should be moved into the `tailwind.config.js` theme for easier management and to create reusable utility classes.
2.  **Navigation Component Abstraction**: The desktop button grid and mobile select menu share significant logic. This could be abstracted into a single, responsive `PageNavigation` component to reduce code duplication.
3.  **Standardized States**: Formalize the design for empty states (e.g., "No data available") and loading states (e.g., skeletons) to be reused across the application.
4.  **Accessibility (A11y)**: While `shadcn/ui` provides a good foundation, we must be diligent in adding `aria-label`s for icon-only buttons and ensuring proper focus management in complex components.
5.  **Form Validation**: Implement a consistent form validation pattern, likely using `zod` for schema definition and a library like `react-hook-form` to handle state and errors.

This document is a living guide. As the application evolves, so too will our design philosophy. 