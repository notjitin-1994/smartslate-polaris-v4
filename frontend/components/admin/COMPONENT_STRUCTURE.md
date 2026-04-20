# SystemStatusModal - Component Structure

## Visual Hierarchy

```
SystemStatusModal (Radix Dialog Root)
│
├── Dialog.Overlay (Backdrop)
│   └── Blur: 18px
│   └── Background: rgba(2, 12, 27, 0.8)
│   └── Animation: fade-in / fade-out (200ms)
│
└── Dialog.Content (Modal Container)
    └── Position: Fixed center
    └── Width: calc(100vw - 2rem) / max-w-2xl
    └── Animation: fade-in-up (300ms)
    │
    └── .glass-shell (Glassmorphism Container)
        │
        ├── Header Section (.px-6 .py-5)
        │   ├── Left: Title + Status
        │   │   ├── Dialog.Title (text-title)
        │   │   │   └── "[Component Name] Status"
        │   │   │
        │   │   └── Status Row (flex gap-3)
        │   │       ├── StatusBadge Component
        │   │       │   ├── Icon (16px)
        │   │       │   └── Label (text-caption)
        │   │       │   └── Colors: success/warning/error/checking
        │   │       │
        │   │       └── Timestamp (text-small)
        │   │           └── "Last checked: [time]"
        │   │
        │   └── Right: Close Button
        │       └── Dialog.Close (44px × 44px)
        │           └── X Icon (20px)
        │
        ├── Body Section (.px-6 .py-5 .overflow-y-auto)
        │   │   └── Max Height: 60vh
        │   │   └── Custom Scrollbar Styling
        │   │
        │   ├── Success/Info Message (if message && !error)
        │   │   └── Alert Box (.glass-card .p-4)
        │   │       └── Status-colored background
        │   │       └── Message text (text-body)
        │   │
        │   ├── Error Details (if error)
        │   │   └── Error Card (.glass-card .p-4)
        │   │       ├── Icon + Title Row
        │   │       │   ├── XCircle Icon (20px, text-error)
        │   │       │   └── Error Code (text-body, font-semibold)
        │   │       │
        │   │       ├── Error Message (text-caption)
        │   │       │
        │   │       ├── Technical Details (collapsible)
        │   │       │   └── <details>
        │   │       │       └── <pre> with error.details
        │   │       │
        │   │       └── Retryable Notice (if error.retryable)
        │   │           └── Info message (text-small, text-info)
        │   │
        │   ├── Health Metrics (if metrics && metrics.length > 0)
        │   │   └── Metrics Card (.glass-card .p-4)
        │   │       ├── Heading: "Health Metrics"
        │   │       │
        │   │       └── Metric List
        │   │           └── MetricRow × N
        │   │               ├── Left: Label + Description
        │   │               │   ├── Label (text-caption, font-medium)
        │   │               │   └── Description (text-small, text-disabled)
        │   │               │
        │   │               └── Right: Value (with status color)
        │   │
        │   └── Empty State (if no message, error, or metrics)
        │       └── Centered Content
        │           ├── Clock Icon (48px, text-disabled)
        │           └── "No additional details available"
        │
        └── Footer Section (.px-6 .py-4) [if actions.length > 0]
            └── Actions Row (flex justify-end gap-3)
                └── ActionButton × N
                    ├── Variant: primary/secondary/ghost/destructive
                    ├── Height: 44px minimum
                    ├── Icon (optional, 16px)
                    ├── Label (text-caption)
                    └── Loading State (spinner if action.loading)
```

## Component Breakdown

### 1. StatusBadge

**Purpose**: Display current component status with icon and label

**Props**: `{ status: SystemStatusType }`

**Rendering**:

```
┌─────────────────────────────┐
│ ✓  Operational              │  ← Success (green)
│ ⚠  Degraded                 │  ← Warning (amber)
│ ✕  Unavailable              │  ← Error (red)
│ ⏰ Checking...              │  ← Checking (blue)
└─────────────────────────────┘
```

**States**: success | warning | error | checking

### 2. MetricRow

**Purpose**: Display individual health metric with optional description

**Props**: `{ metric: HealthMetric }`

**Rendering**:

```
┌────────────────────────────────────────────┐
│ Connection Pool              8/20 active   │
│ Available connections in pool              │
├────────────────────────────────────────────┤
│ Average Query Time                  12ms   │
└────────────────────────────────────────────┘
```

### 3. ActionButton

**Purpose**: Render action button with variant styling and loading state

**Props**: `{ action: SystemAction }`

**Variants**:

- Primary: Cyan-teal background, dark text
- Secondary: Indigo background, white text
- Ghost: Transparent, secondary text, hover background
- Destructive: Red background, white text

**States**:

- Normal
- Hover (color shift + scale)
- Active (scale down)
- Disabled (50% opacity)
- Loading (spinner + disabled)

## Layout Breakpoints

### Mobile (< 768px)

```
┌─────────────────────────────┐
│ Modal: calc(100vw - 2rem)   │
│ Single column content       │
│ Stacked action buttons      │
│ 60vh max content height     │
└─────────────────────────────┘
```

### Tablet (768px - 1024px)

```
┌──────────────────────────────────┐
│ Modal: max-w-2xl (672px)         │
│ Two-column metrics grid          │
│ Horizontal action buttons        │
│ 60vh max content height          │
└──────────────────────────────────┘
```

### Desktop (> 1024px)

```
┌──────────────────────────────────┐
│ Modal: max-w-2xl (672px)         │
│ Two-column metrics grid          │
│ Horizontal action buttons        │
│ 60vh max content height          │
└──────────────────────────────────┘
```

## Interaction Flow

### Opening Modal

```
1. User clicks status card/button
   ↓
2. Parent sets isOpen={true}
   ↓
3. Backdrop fades in (200ms)
   ↓
4. Modal fades in + slides up (300ms)
   ↓
5. Focus moves to modal content
   ↓
6. Keyboard focus trapped
```

### Closing Modal

```
1. User clicks close button / ESC / backdrop
   ↓
2. onClose() callback triggered
   ↓
3. Modal fades out (200ms)
   ↓
4. Backdrop fades out (200ms)
   ↓
5. Focus returns to trigger element
   ↓
6. Modal unmounted
```

### Retry Action

```
1. User clicks "Retry Check" button
   ↓
2. Button shows loading state (spinner)
   ↓
3. onRetry() callback triggered
   ↓
4. Parent fetches new status data
   ↓
5. statusData prop updates
   ↓
6. Modal content re-renders
   ↓
7. Loading state clears
```

## State Management

### Component State (Internal)

- None - fully controlled by parent

### Parent State (External)

```typescript
const [isOpen, setIsOpen] = useState(false);
const [statusData, setStatusData] = useState<SystemStatusData>({...});
const [isRetrying, setIsRetrying] = useState(false);
```

### Derived State

```typescript
// Formatted timestamp (useMemo)
const formattedTimestamp = useMemo(() => {
  return new Intl.DateTimeFormat(...).format(new Date(lastChecked));
}, [lastChecked]);

// Default actions (useMemo)
const defaultActions = useMemo(() => {
  return [/* retry, logs */];
}, [onRetry, onViewLogs, status, isRetrying]);
```

## Accessibility Tree

```
dialog [role="dialog"]
├── overlay [aria-hidden="true"]
│
└── content
    ├── title [role="heading" aria-level="2"]
    │
    ├── status-badge [role="status"]
    │   └── aria-label="Status: Operational"
    │
    ├── close-button [role="button"]
    │   └── aria-label="Close modal"
    │
    ├── description [id="system-status-description"]
    │   ├── message-alert [role="alert"] (if success/info)
    │   │
    │   ├── error-alert [role="alert" aria-live="assertive"] (if error)
    │   │   └── details [role="group"]
    │   │
    │   └── metrics [role="list"]
    │       └── metric × N [role="listitem"]
    │
    └── actions
        └── button × N [role="button"]
            └── aria-busy="true" (if loading)
```

## Animation Timeline

### Opening Sequence (0ms - 300ms)

```
0ms:   isOpen changes to true
       ↓
0ms:   Backdrop starts fade-in (opacity: 0 → 1)
       ↓
0ms:   Modal starts fade-in-up
       - opacity: 0 → 1
       - translateY: 20px → 0
       - scale: 0.95 → 1
       ↓
200ms: Backdrop fully visible
       ↓
300ms: Modal fully visible
       Focus moves to modal
```

### Closing Sequence (0ms - 200ms)

```
0ms:   isOpen changes to false
       onClose() triggered
       ↓
0ms:   Modal starts fade-out (opacity: 1 → 0)
       ↓
0ms:   Backdrop starts fade-out (opacity: 1 → 0)
       ↓
200ms: Both fully transparent
       Modal unmounted
       Focus returns to trigger
```

### Reduced Motion

```
All animations: 0.01ms duration
Transitions: instant
```

## CSS Class Reference

### Glassmorphism

```css
.glass-shell
  - Modal container
  - Heavy blur (18px)
  - Gradient border
  - Strong shadow

.glass-card
  - Content sections
  - Medium blur (12px)
  - Lighter border
  - Moderate shadow
```

### Animations

```css
.animate-fade-in
  - Opacity transition
  - 200ms duration

.animate-fade-out
  - Opacity transition
  - 200ms duration

.animate-fade-in-up
  - Opacity + transform
  - 300ms duration
  - Slide up effect
```

### Interactions

```css
.hover-lift:hover
  - translateY(-2px)
  - 300ms transition

.active\:scale-95:active
  - scale(0.95)
  - Instant
```

## Theming Tokens

```css
/* Status Colors */
--color-success: #10b981 --color-warning: #f59e0b --color-error: #ef4444 --color-info: #3b82f6
  /* Background Layers */ --bg-dark: #020c1b /* Base canvas */ --bg-paper: #0d1b2a /* Cards */
  --bg-surface: #142433 /* Elevated */ /* Text Hierarchy */ --text-primary: #e0e0e0
  --text-secondary: #b0c5c6 --text-disabled: #7a8a8b /* Spacing (4px grid) */ --space-2: 8px
  --space-4: 16px --space-6: 24px /* Typography Scale */ --text-title: 1.5rem /* 24px */
  --text-body: 1rem /* 16px */ --text-caption: 0.875rem /* 14px */ --text-small: 0.75rem /* 12px */
  /* Border Radius */ --radius-md: 0.75rem /* 12px */ --radius-lg: 1rem /* 16px */ /* Transitions */
  --duration-fast: 200ms --duration-base: 300ms --easing: cubic-bezier(0.4, 0, 0.2, 1);
```

---

This structure ensures a consistent, accessible, and beautiful user experience across all system status displays.
