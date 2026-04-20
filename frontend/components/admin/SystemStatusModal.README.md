# SystemStatusModal Component

A premium glassmorphism modal component for displaying detailed system status information in the Smartslate Polaris admin dashboard.

## Features

- **Brand-Compliant Design**: Full glassmorphism styling following Smartslate Polaris design system
- **Touch-First**: All interactive elements meet 44px minimum touch target requirements
- **Accessible**: WCAG AA compliant with proper ARIA labels, keyboard navigation, and focus management
- **Responsive**: Mobile-first design that scales from 320px to 2560px
- **Smooth Animations**: 300ms transitions with reduced motion support
- **Loading States**: Built-in support for async operations with loading indicators
- **Flexible Actions**: Customizable action buttons with variants (primary, secondary, ghost, destructive)
- **Comprehensive Status Types**: success, warning, error, checking states with appropriate visual indicators

## Installation

Ensure you have the required dependencies:

```bash
npm install @radix-ui/react-dialog lucide-react
```

Import the CSS animations:

```tsx
// In your layout or global styles
import '@/styles/system-status-modal.css';
```

## Basic Usage

```tsx
import { SystemStatusModal } from '@/components/admin/SystemStatusModal';
import type { SystemStatusData } from '@/types/system-status';

function AdminDashboard() {
  const [isOpen, setIsOpen] = React.useState(false);

  const statusData: SystemStatusData = {
    component: 'database',
    componentName: 'PostgreSQL Database',
    status: 'success',
    lastChecked: new Date().toISOString(),
    message: 'All systems operational',
    metrics: [
      {
        label: 'Connection Pool',
        value: '8/20 active',
        status: 'success',
      },
      {
        label: 'Average Query Time',
        value: '12ms',
        status: 'success',
      },
    ],
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)}>View Status</button>

      <SystemStatusModal isOpen={isOpen} onClose={() => setIsOpen(false)} statusData={statusData} />
    </>
  );
}
```

## Props

### SystemStatusModalProps

| Prop         | Type                          | Required | Description                                    |
| ------------ | ----------------------------- | -------- | ---------------------------------------------- |
| `isOpen`     | `boolean`                     | Yes      | Controls modal visibility                      |
| `onClose`    | `() => void`                  | Yes      | Callback when modal is closed                  |
| `statusData` | `SystemStatusData`            | Yes      | Complete status information                    |
| `actions`    | `SystemAction[]`              | No       | Custom action buttons (defaults provided)      |
| `onRetry`    | `() => void \| Promise<void>` | No       | Retry action handler (auto-creates button)     |
| `onViewLogs` | `() => void`                  | No       | View logs action handler (auto-creates button) |
| `isRetrying` | `boolean`                     | No       | Shows loading state on retry button            |

### SystemStatusData

```typescript
interface SystemStatusData {
  component: SystemComponentType; // 'database' | 'api' | 'ai_service' | 'authentication' | 'storage' | 'external_service'
  componentName: string; // Display name (e.g., "PostgreSQL Database")
  status: SystemStatusType; // 'success' | 'warning' | 'error' | 'checking'
  lastChecked: string; // ISO timestamp

  // Optional
  metrics?: HealthMetric[]; // Performance/health metrics
  error?: SystemError; // Error details (for error status)
  message?: string; // Success/info message
  metadata?: Record<string, unknown>; // Additional context
}
```

### HealthMetric

```typescript
interface HealthMetric {
  label: string; // Metric name (e.g., "Connection Pool")
  value: string | number; // Metric value (e.g., "8/20 active")
  status?: SystemStatusType; // Visual indicator for metric
  description?: string; // Additional explanation
}
```

### SystemError

```typescript
interface SystemError {
  code: string; // Error code (e.g., "CONNECTION_FAILED")
  message: string; // User-friendly error message
  details?: string; // Technical details (collapsible)
  timestamp: string; // ISO timestamp
  stack?: string; // Stack trace (not shown in UI)
  retryable: boolean; // Whether retry is possible
}
```

### SystemAction

```typescript
interface SystemAction {
  id: string; // Unique identifier
  label: string; // Button text
  variant: 'primary' | 'secondary' | 'ghost' | 'destructive';
  icon?: React.ComponentType<{ className?: string }>; // Lucide icon
  onClick: () => void | Promise<void>; // Action handler
  disabled?: boolean; // Disable button
  loading?: boolean; // Show loading spinner
}
```

## Examples

### Success State (Healthy Database)

```tsx
const statusData: SystemStatusData = {
  component: 'database',
  componentName: 'PostgreSQL Database',
  status: 'success',
  lastChecked: new Date().toISOString(),
  message: 'All database operations are functioning normally.',
  metrics: [
    { label: 'Connection Pool', value: '8/20 active', status: 'success' },
    { label: 'Average Query Time', value: '12ms', status: 'success' },
    { label: 'Slow Queries (>100ms)', value: '0', status: 'success' },
  ],
};
```

### Warning State (Degraded Performance)

```tsx
const statusData: SystemStatusData = {
  component: 'api',
  componentName: 'REST API Endpoints',
  status: 'warning',
  lastChecked: new Date().toISOString(),
  message: 'API is experiencing elevated response times.',
  metrics: [
    { label: 'Average Response Time', value: '850ms', status: 'warning' },
    { label: 'Success Rate', value: '98.5%', status: 'success' },
    { label: 'Error Rate', value: '1.5%', status: 'warning' },
  ],
};
```

### Error State (Service Down)

```tsx
const statusData: SystemStatusData = {
  component: 'ai_service',
  componentName: 'Claude AI Service',
  status: 'error',
  lastChecked: new Date().toISOString(),
  error: {
    code: 'API_CONNECTION_FAILED',
    message: 'Unable to establish connection to Claude API',
    details: 'Failed to connect to https://api.anthropic.com\nStatus: 503 Service Unavailable',
    timestamp: new Date().toISOString(),
    retryable: true,
  },
  metrics: [
    { label: 'API Status', value: 'Unavailable', status: 'error' },
    { label: 'Fallback System', value: 'Active', status: 'success' },
  ],
};

// With retry handler
<SystemStatusModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  statusData={statusData}
  onRetry={async () => {
    // Retry logic
  }}
  isRetrying={isRetrying}
/>;
```

### Custom Actions

```tsx
const customActions: SystemAction[] = [
  {
    id: 'refresh',
    label: 'Refresh Status',
    variant: 'primary',
    icon: RefreshCw,
    onClick: async () => {
      await checkSystemStatus();
    },
  },
  {
    id: 'contact',
    label: 'Contact Support',
    variant: 'secondary',
    onClick: () => {
      window.open('https://support.example.com', '_blank');
    },
  },
  {
    id: 'dismiss',
    label: 'Dismiss',
    variant: 'ghost',
    onClick: () => setIsOpen(false),
  },
];

<SystemStatusModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  statusData={statusData}
  actions={customActions}
/>;
```

## Accessibility Features

1. **Keyboard Navigation**
   - `Tab` to navigate between interactive elements
   - `Enter` or `Space` to activate buttons
   - `Escape` to close modal

2. **Screen Reader Support**
   - All status indicators have proper ARIA labels
   - Error messages use `role="alert"` with `aria-live="assertive"`
   - Loading states indicated with `aria-busy`
   - Descriptive `aria-label` on all icon buttons

3. **Focus Management**
   - Focus trapped within modal when open
   - Visible focus rings on all interactive elements
   - Focus returns to trigger element on close

4. **Color Contrast**
   - All text meets WCAG AA standards (4.5:1 minimum)
   - Status colors use semantic meaning + icons (not color alone)

5. **Reduced Motion**
   - Respects `prefers-reduced-motion` media query
   - Animations disabled or shortened for users with motion sensitivity

## Design Tokens Used

### Colors

```css
--primary-accent: #a7dadb /* Cyan-teal brand color */ --success: #10b981 /* Green status */
  --warning: #f59e0b /* Amber status */ --error: #ef4444 /* Red status */ --info: #3b82f6
  /* Blue status */ --text-primary: #e0e0e0 /* Primary text */ --text-secondary: #b0c5c6
  /* Secondary text */ --text-disabled: #7a8a8b /* Disabled text */ --background-dark: #020c1b
  /* Base canvas */ --background-paper: #0d1b2a /* Card backgrounds */;
```

### Typography

```css
--text-title: 1.5rem /* 24px - Modal title */ --text-body: 1rem /* 16px - Body text */
  --text-caption: 0.875rem /* 14px - Labels */ --text-small: 0.75rem /* 12px - Timestamps */;
```

### Spacing

```css
--space-2: 0.5rem /* 8px */ --space-4: 1rem /* 16px */ --space-6: 1.5rem /* 24px */;
```

### Border Radius

```css
--radius-md: 0.75rem /* 12px - Badges */ --radius-lg: 1rem /* 16px - Modal */;
```

### Animations

```css
--duration-fast: 200ms /* Quick transitions */ --duration-base: 300ms /* Standard transitions */
  cubic-bezier(0.4, 0, 0.2, 1) /* Smooth easing */;
```

## Touch Target Requirements

All interactive elements meet or exceed the 44px minimum:

- **Close Button**: 44px × 44px
- **Action Buttons**: 44px height minimum, with comfortable padding
- **Retry Button**: 44px height with icon + text
- **Details Disclosure**: 44px touch target for expandable sections

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers with backdrop-filter support

For browsers without backdrop-filter support, the component gracefully degrades to solid backgrounds while maintaining full functionality.

## Performance Considerations

1. **Lazy Loading**: Modal content only rendered when `isOpen={true}`
2. **Memoization**: Formatted timestamps and default actions are memoized
3. **Optimized Animations**: GPU-accelerated transforms, respects reduced motion
4. **Scrolling**: Virtual scrolling not needed (modals should be concise)

## Testing

The component includes comprehensive test coverage:

```bash
# Run component tests
npm run test -- SystemStatusModal.test.tsx

# Run with coverage
npm run test -- --coverage SystemStatusModal.test.tsx
```

## Integration with Admin Dashboard

Typical integration pattern:

```tsx
// In admin dashboard
import { SystemStatusModal } from '@/components/admin/SystemStatusModal';
import { useSystemStatus } from '@/lib/hooks/useSystemStatus';

function AdminDashboard() {
  const { statuses, checkStatus, isChecking } = useSystemStatus();
  const [selectedComponent, setSelectedComponent] = React.useState<string | null>(null);

  const handleComponentClick = async (component: string) => {
    setSelectedComponent(component);
    await checkStatus(component);
  };

  return (
    <div>
      {/* System status cards */}
      {statuses.map((status) => (
        <StatusCard
          key={status.component}
          status={status}
          onClick={() => handleComponentClick(status.component)}
        />
      ))}

      {/* Detail modal */}
      {selectedComponent && (
        <SystemStatusModal
          isOpen={true}
          onClose={() => setSelectedComponent(null)}
          statusData={statuses.find((s) => s.component === selectedComponent)!}
          onRetry={() => checkStatus(selectedComponent)}
          isRetrying={isChecking}
        />
      )}
    </div>
  );
}
```

## Related Components

- `StatusCard` - Compact status indicator for dashboard
- `SystemHealthDashboard` - Full system health overview
- `AlertBanner` - Inline status alerts

## License

Part of the Smartslate Polaris v3 project.
