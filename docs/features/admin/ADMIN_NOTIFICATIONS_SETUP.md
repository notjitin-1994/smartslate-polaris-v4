# Admin Real-Time Notifications System

## Overview

A comprehensive real-time notification system for admin users built with Supabase real-time subscriptions, React Context, and TypeScript.

## Features

✅ **Real-time updates** - Instant notifications via Supabase subscriptions
✅ **Rich notification types** - 12 different notification types with icons and colors
✅ **Priority levels** - Low, Normal, High, Urgent
✅ **Category filtering** - Users, Blueprints, Billing, System, Security, Feedback
✅ **Browser notifications** - Native desktop notifications with permission request
✅ **Mark as read/unread** - Individual or bulk operations
✅ **Action links** - Optional CTAs with custom URLs
✅ **Auto-expiration** - Optional notification expiration
✅ **Database triggers** - Automatic notifications for key events
✅ **Beautiful UI** - Glassmorphism design with animations

## Architecture

### Components
```
frontend/
├── contexts/NotificationContext.tsx          # React context for state management
├── components/admin/
│   ├── NotificationPanel.tsx                 # Dropdown notification UI
│   ├── AdminHeader.tsx                       # Updated with notification bell
│   └── AdminLayout.tsx                       # Wraps with NotificationProvider
├── lib/services/notificationService.ts       # CRUD operations
├── app/api/admin/notifications/route.ts      # API endpoints
└── types/notifications.ts                    # TypeScript types
```

### Database
```
supabase/migrations/
├── 0038_admin_notifications.sql              # Main migration
└── ROLLBACK_0038_admin_notifications.sql     # Rollback script
```

## Setup Instructions

### 1. Run Database Migration

```bash
# From project root
npx supabase db push

# Or manually via Supabase Dashboard:
# 1. Go to SQL Editor
# 2. Copy contents of supabase/migrations/0038_admin_notifications.sql
# 3. Run the migration
```

### 2. Enable Realtime on the Table

In Supabase Dashboard:
1. Go to **Database** → **Replication**
2. Find `admin_notifications` table
3. Enable **Realtime** for INSERT events

### 3. Verify Environment Variables

Ensure these are set in `frontend/.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 4. Test the System

1. Log in as an admin user (user_role = 'developer')
2. Open the admin dashboard
3. Click the notification bell icon
4. Create a test notification via SQL:

```sql
SELECT create_admin_notification(
  'system_alert',
  'Test Notification',
  'This is a test notification',
  'normal',
  'system',
  '{"test": true}'::jsonb
);
```

5. The notification should appear instantly in the dropdown

## Notification Types

| Type | Icon | Description |
|------|------|-------------|
| `user_registration` | 👤 | New user signed up |
| `blueprint_limit_reached` | ⚠️ | User hit blueprint limit |
| `subscription_upgrade` | 📈 | User upgraded tier |
| `subscription_downgrade` | 📉 | User downgraded tier |
| `payment_received` | 💰 | Payment processed successfully |
| `payment_failed` | 💳 | Payment failed |
| `system_alert` | 🔔 | General system alert |
| `cost_threshold` | 💵 | Cost threshold exceeded |
| `feedback_submitted` | 💬 | User submitted feedback |
| `error_alert` | ⚠️ | Application error |
| `security_alert` | 🛡️ | Security-related alert |
| `usage_milestone` | 🏆 | Usage milestone reached |

## Automatic Triggers

The system automatically creates notifications for:

### 1. New User Registration
Triggered when a new user profile is created.

### 2. Blueprint Limit Reached
Triggered when a user reaches their blueprint creation limit.

### 3. Subscription Changes
Triggered when a user changes subscription tiers.

## API Endpoints

### GET `/api/admin/notifications`
Fetch notifications with filters.

**Query Parameters:**
- `type` - Filter by notification type
- `category` - Filter by category
- `priority` - Filter by priority
- `is_read` - Filter by read status (true/false)
- `limit` - Results per page (default: 50)
- `offset` - Pagination offset

**Response:**
```json
{
  "notifications": [...],
  "unreadCount": 5,
  "total": 42
}
```

### POST `/api/admin/notifications`
Create a new notification manually.

**Body:**
```json
{
  "type": "system_alert",
  "title": "System Maintenance",
  "message": "Scheduled maintenance tonight at 11 PM",
  "priority": "high",
  "category": "system",
  "metadata": { "scheduled_time": "2025-11-12T23:00:00Z" },
  "action_url": "/admin/system",
  "action_label": "View Details"
}
```

### PATCH `/api/admin/notifications`
Mark notification(s) as read.

**Body (single):**
```json
{
  "notification_id": "uuid-here"
}
```

**Body (all):**
```json
{
  "mark_all": true
}
```

### DELETE `/api/admin/notifications?id=<uuid>`
Delete a notification.

## Usage in Code

### Creating Notifications

**Option 1: Via Database Function (Recommended)**
```typescript
// In an API route or server action
import { createClient } from '@/lib/supabase/server';

const supabase = await createClient();

await supabase.rpc('create_admin_notification', {
  p_type: 'user_registration',
  p_title: 'New User Registered',
  p_message: `User ${email} just signed up`,
  p_priority: 'normal',
  p_category: 'users',
  p_metadata: { user_id: userId, email },
  p_action_url: `/admin/users`,
  p_action_label: 'View User'
});
```

**Option 2: Via API Route**
```typescript
await fetch('/api/admin/notifications', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'payment_received',
    title: 'Payment Received',
    message: `Payment of $${amount} received`,
    priority: 'normal',
    category: 'billing',
    metadata: { amount, currency: 'USD' }
  })
});
```

### Consuming Notifications

**In a React Component:**
```typescript
import { useNotifications } from '@/contexts/NotificationContext';

function MyComponent() {
  const {
    notifications,
    unreadCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    filterNotifications
  } = useNotifications();

  // Use notifications data
}
```

## Adding Custom Triggers

To add notifications for new events:

### 1. Create Trigger Function

```sql
CREATE OR REPLACE FUNCTION public.notify_custom_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM public.create_admin_notification(
    'system_alert',
    'Custom Event Occurred',
    'Description of event',
    'normal',
    'system',
    jsonb_build_object('event_id', NEW.id)
  );
  RETURN NEW;
END;
$$;
```

### 2. Attach to Table

```sql
CREATE TRIGGER trigger_notify_custom_event
  AFTER INSERT ON public.your_table
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_custom_event();
```

## Browser Notifications

The system requests browser notification permission on first load. To re-enable:

1. Click the lock icon in browser address bar
2. Change Notifications to "Allow"
3. Refresh the page

## Customization

### Adding New Notification Types

1. Update TypeScript types in `frontend/types/notifications.ts`:
```typescript
export type NotificationType =
  | 'user_registration'
  | 'your_new_type';  // Add here

export const NOTIFICATION_ICONS: Record<NotificationType, NotificationIcon> = {
  your_new_type: 'icon-name',  // Add mapping
};
```

2. Update database CHECK constraint:
```sql
ALTER TABLE admin_notifications
DROP CONSTRAINT admin_notifications_type_check;

ALTER TABLE admin_notifications
ADD CONSTRAINT admin_notifications_type_check
CHECK (type IN (
  'user_registration',
  'your_new_type',  -- Add here
  ...
));
```

### Styling Priorities/Categories

Edit color mappings in `frontend/types/notifications.ts`:
```typescript
export const PRIORITY_COLORS: Record<NotificationPriority, string> = {
  urgent: 'text-red-400 bg-red-400/10',  // Customize
};
```

## Performance Considerations

- Notifications auto-expire if `expires_at` is set
- Run cleanup function periodically:
  ```sql
  SELECT cleanup_expired_notifications();
  ```
- Consider archiving old read notifications
- Limit client-side fetch to last N days:
  ```typescript
  await filterNotifications({
    created_after: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  });
  ```

## Security

- **RLS Policies**: Admins can only access their own notifications
- **Role Check**: Only users with `user_role = 'developer'` see notifications
- **Service Role**: Triggers use SECURITY DEFINER for system-level inserts
- **Input Validation**: All API routes validate admin access

## Troubleshooting

### Notifications not appearing
1. Check Supabase Realtime is enabled for the table
2. Verify user has `user_role = 'developer'`
3. Check browser console for WebSocket errors
4. Confirm RLS policies are active

### Build errors
1. Run `npm run typecheck` to find type errors
2. Ensure all imports use correct paths
3. Check Supabase client exports

### Database errors
1. Verify migration ran successfully
2. Check function permissions (SECURITY DEFINER)
3. Confirm triggers are active

## Rollback

To remove the notification system:

```bash
# Run rollback migration
psql -f supabase/migrations/ROLLBACK_0038_admin_notifications.sql

# Or via Supabase Dashboard SQL Editor
```

## Future Enhancements

- [ ] Email digest of notifications
- [ ] Slack/Discord webhook integration
- [ ] Notification preferences per admin
- [ ] Search and advanced filtering
- [ ] Export notification history
- [ ] Notification templates
- [ ] Multi-language support
- [ ] Sound alerts
- [ ] Desktop app integration

## Support

For issues or questions:
1. Check the implementation files listed above
2. Review Supabase logs in Dashboard
3. Test with SQL queries directly
4. Verify environment configuration

---

**Built with:** React 19, Next.js 15, Supabase Realtime, TypeScript, Tailwind CSS, Framer Motion
