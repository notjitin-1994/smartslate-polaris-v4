# System Status Modal - Usage Examples

## Quick Start

Visit `http://localhost:3001/admin` and click on any system status item to see detailed information.

## Visual Flow

```
Admin Dashboard
│
└── System Status Section
    │
    ├── API Services [Click] ──────────┐
    ├── Database [Click] ──────────────┤
    ├── AI Services [Click] ───────────┼──> Opens Modal
    ├── Storage [Click] ───────────────┤
    └── Payment Gateway [Click] ───────┘
```

## Modal Structure

```
┌─────────────────────────────────────────────────┐
│  [Icon] Component Name              [X Close]   │
│  Status • Response Time                         │
├─────────────────────────────────────────────────┤
│                                                 │
│  📊 STATUS DETAILS                             │
│  ┌───────────────────────────────────────────┐ │
│  │ Detailed status message here              │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  📈 PERFORMANCE METRICS                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ Metric 1 │ │ Metric 2 │ │ Metric 3 │       │
│  │ Value ✓  │ │ Value ⚠  │ │ Value ✗  │       │
│  └──────────┘ └──────────┘ └──────────┘       │
│                                                 │
│  🕐 RECENT EVENTS                              │
│  • Event 1 - timestamp (info)                  │
│  • Event 2 - timestamp (warning)               │
│  • Event 3 - timestamp (error)                 │
│                                                 │
│  ⚠️  RECOMMENDATIONS                           │
│  • Fix suggestion 1                            │
│  • Fix suggestion 2                            │
│                                                 │
│  🕐 Last checked: timestamp                    │
│                                                 │
├─────────────────────────────────────────────────┤
│  [View Status Page]     [Close] [Retry Check]  │
└─────────────────────────────────────────────────┘
```

## Example Scenarios

### 1. Operational Status (All Green)

**What You See:**
- Green checkmark icon
- "Operational" status
- Fast response time (< 500ms)
- All metrics showing success (✓)
- No warnings or recommendations

**Example Data:**
```json
{
  "name": "Database",
  "status": "Operational",
  "responseTime": 234,
  "details": "PostgreSQL database is operational. 156 user profiles found.",
  "metrics": [
    { "label": "Connection Status", "value": "Connected", "status": "success" },
    { "label": "Response Time", "value": "234ms", "status": "success" },
    { "label": "Query Performance", "value": "Excellent", "status": "success" }
  ],
  "recentEvents": [
    {
      "timestamp": "2025-11-09T10:30:00Z",
      "message": "Database health check completed",
      "severity": "info"
    }
  ],
  "recommendations": []
}
```

### 2. Degraded Performance (Yellow Warning)

**What You See:**
- Yellow warning triangle icon
- "Degraded Performance" status
- Slower response time (> 3000ms)
- Some metrics showing warnings (⚠)
- Recommendations to improve performance

**Example Data:**
```json
{
  "name": "AI Services",
  "status": "Degraded Performance",
  "responseTime": 4532,
  "details": "AI service response time is slower than expected.",
  "metrics": [
    { "label": "API Status", "value": "Connected", "status": "success" },
    { "label": "Response Time", "value": "4532ms", "status": "warning" },
    { "label": "Performance", "value": "Slow", "status": "warning" }
  ],
  "recentEvents": [
    {
      "timestamp": "2025-11-09T10:28:00Z",
      "message": "Slow response detected",
      "severity": "warning"
    }
  ],
  "recommendations": [
    "AI service response time is slower than expected. This may affect user experience."
  ]
}
```

### 3. Major Outage (Red Error)

**What You See:**
- Red X circle icon
- "Major Outage" status
- No response time or error timeout
- Metrics showing failures (✗)
- Critical recommendations to fix

**Example Data:**
```json
{
  "name": "Payment Gateway",
  "status": "Major Outage",
  "responseTime": 0,
  "details": "Razorpay credentials not configured",
  "metrics": [
    { "label": "Credentials Status", "value": "Not Configured", "status": "error" }
  ],
  "recentEvents": [
    {
      "timestamp": "2025-11-09T10:25:00Z",
      "message": "Razorpay credentials missing",
      "severity": "error"
    }
  ],
  "recommendations": [
    "Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to environment variables",
    "Restart the application after configuration"
  ]
}
```

## Interactive Features

### Click Behavior

```typescript
// Each status card is clickable
<ServiceStatusCard
  service={service}      // Current service data
  index={index}          // For stagger animation
  getStatusColor={fn}    // Status color mapper
/>

// On Click:
// 1. Shows loading state
// 2. Fetches detailed status from API
// 3. Opens modal with full information
// 4. User can retry or close
```

### Keyboard Navigation

- **Tab**: Move between interactive elements
- **Enter**: Activate focused button (open modal)
- **Escape**: Close modal
- **Focus Trap**: Tab cycles within modal when open

### Touch Interactions

- **Tap**: Open modal (44px+ touch target)
- **Swipe**: Scroll modal content
- **Double Tap**: Zoom (native behavior)
- **Pinch**: Zoom (native behavior)

## Color Coding

### Status Colors

| Status | Color | Icon | When |
|--------|-------|------|------|
| Operational | Green (#10b981) | ✓ CheckCircle2 | Everything working normally |
| Degraded Performance | Yellow (#fbbf24) | ⚠ AlertTriangle | Slow but functional |
| Partial Outage | Orange (#f97316) | ⚠ AlertCircle | Some features down |
| Major Outage | Red (#ef4444) | ✗ XCircle | Critical failure |

### Metric Status Colors

| Status | Color | When |
|--------|-------|------|
| Success | Emerald (#10b981) | Within acceptable range |
| Warning | Yellow (#fbbf24) | Approaching limits |
| Error | Red (#ef4444) | Exceeds limits or failed |

## API Endpoints

### Component-Specific Details

```bash
# Get detailed status for each component
GET /api/admin/system-status/api        # API Services
GET /api/admin/system-status/database   # Database
GET /api/admin/system-status/ai         # AI Services
GET /api/admin/system-status/storage    # Storage
GET /api/admin/system-status/payment    # Payment Gateway
```

### Response Format

```typescript
interface DetailedStatus {
  name: string;
  status: 'Operational' | 'Degraded Performance' | 'Partial Outage' | 'Major Outage';
  responseTime?: number;
  lastChecked: string;
  details?: string;
  metrics: Array<{
    label: string;
    value: string;
    status?: 'success' | 'warning' | 'error';
  }>;
  recentEvents: Array<{
    timestamp: string;
    message: string;
    severity: 'info' | 'warning' | 'error';
  }>;
  recommendations: string[];
}
```

## Common Use Cases

### 1. Monitoring System Health

**Scenario**: Admin wants to check if all systems are running smoothly

**Steps**:
1. Navigate to `/admin`
2. Scroll to System Status section
3. All green indicators = all good
4. Click any item for detailed metrics

### 2. Investigating Performance Issues

**Scenario**: Users report slow blueprint generation

**Steps**:
1. Navigate to `/admin`
2. Click on "AI Services" status
3. Check response time metrics
4. Review recent events
5. Follow recommendations

### 3. Debugging Configuration Errors

**Scenario**: Payment subscriptions not working

**Steps**:
1. Navigate to `/admin`
2. Click on "Payment Gateway" status
3. Check credentials status
4. Review error messages
5. Follow recommendations to fix

### 4. Routine Health Checks

**Scenario**: Daily system verification

**Steps**:
1. Navigate to `/admin`
2. Note overall system status
3. Click items with warnings
4. Address recommendations
5. Use retry to verify fixes

## Best Practices

### For Administrators

1. **Regular Monitoring**: Check status daily
2. **Proactive**: Address warnings before they become errors
3. **Documentation**: Note recurring issues
4. **Testing**: Use retry button to verify fixes
5. **Communication**: Share status page with team

### For Developers

1. **Error Handling**: Ensure graceful degradation
2. **Logging**: Log all health check failures
3. **Monitoring**: Set up alerts for critical issues
4. **Performance**: Optimize slow endpoints
5. **Testing**: Test all status states locally

## Troubleshooting

### Modal Not Opening

**Symptoms**: Click doesn't trigger modal
**Causes**:
- JavaScript error in console
- API endpoint unreachable
- Authentication failure

**Solutions**:
1. Check browser console for errors
2. Verify admin role in user_profiles table
3. Check network tab for API response
4. Clear browser cache and reload

### Slow Response Times

**Symptoms**: Modal takes >5 seconds to open
**Causes**:
- Database slow queries
- External API timeouts
- Network latency

**Solutions**:
1. Check database performance
2. Verify external API status
3. Review server logs
4. Optimize health check queries

### Incorrect Status Display

**Symptoms**: Status shows green but service is down
**Causes**:
- Stale cache
- Health check too simple
- RLS policy blocking query

**Solutions**:
1. Hard refresh (Ctrl+Shift+R)
2. Improve health check logic
3. Review RLS policies
4. Check service role permissions

---

**Last Updated**: 2025-11-09
**Related Files**:
- `frontend/app/admin/page.tsx` - Main admin dashboard
- `frontend/components/admin/SystemStatusDetailModal.tsx` - Modal component
- `frontend/app/api/admin/system-status/[component]/route.ts` - API routes
