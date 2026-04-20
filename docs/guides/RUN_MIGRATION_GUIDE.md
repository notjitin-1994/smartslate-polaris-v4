# Quick Migration Guide: Admin Notifications

The notification system is ready to use, but requires running a database migration first.

## Step 1: Run the Migration via Supabase Dashboard

Since the CLI requires a database password, the easiest way is via the Supabase Dashboard:

### Option A: Via Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard/project/oyjslszrygcajdpwgxbe

2. **Navigate to SQL Editor**
   - Click "SQL Editor" in the left sidebar

3. **Create New Query**
   - Click "+ New query" button

4. **Copy Migration SQL**
   - Open the file: `supabase/migrations/0038_admin_notifications.sql`
   - Copy ALL the contents

5. **Paste and Run**
   - Paste the SQL into the query editor
   - Click "Run" or press `Ctrl/Cmd + Enter`
   - Wait for "Success" message

6. **Verify**
   - Go to "Database" → "Tables"
   - Look for `admin_notifications` table
   - Should see ~15 columns

### Option B: Via CLI (if you have database password)

```bash
# Set your database password when prompted
npx supabase db push
```

## Step 2: Enable Realtime

1. **Go to Database → Replication** in Supabase Dashboard

2. **Find `admin_notifications` table**

3. **Toggle "Realtime" to ON**
   - This enables WebSocket subscriptions for instant notifications

## Step 3: Verify It Works

1. **Restart your dev server** (if running)
   ```bash
   npm run dev
   ```

2. **Log in as admin** (user with `user_role = 'developer'`)

3. **Go to Admin Dashboard**
   - You should see the notification bell icon
   - No more errors in console

4. **Create a test notification** via SQL Editor:
   ```sql
   SELECT create_admin_notification(
     'system_alert',
     'System Online',
     'Notification system is now active!',
     'high',
     'system',
     '{}'::jsonb,
     '/admin',
     'View Dashboard'
   );
   ```

5. **Check the bell icon** - Should show "1" unread notification

6. **Click the bell** - Should see your test notification with animation

## Troubleshooting

### Error: "relation admin_notifications does not exist"
- Migration hasn't been run yet
- Follow Step 1 above
- The app will work but notifications will be empty until migration runs

### Error: "function get_unread_notification_count does not exist"
- Same as above - run the migration
- Functions are created in the same migration

### Notifications don't appear in real-time
- Check that Realtime is enabled (Step 2)
- Refresh the page after enabling
- Check browser console for WebSocket errors

### Can't see notification bell
- Verify you're logged in as admin (`user_role = 'developer'`)
- Check that AdminLayout is wrapping your admin pages
- Inspect the user profile in Supabase

## What Gets Created

The migration creates:

✅ `admin_notifications` table with indexes and RLS policies
✅ Helper functions (`create_admin_notification`, `mark_notification_read`, etc.)
✅ Automatic triggers for user events
✅ Cleanup functions for expired notifications

## Next Steps

Once migration is complete:

- Notifications will auto-generate for:
  - New user registrations
  - Blueprint limit warnings
  - Subscription tier changes

- You can manually create notifications via:
  - API: `POST /api/admin/notifications`
  - Service: `createNotification()` function
  - SQL: `create_admin_notification()` function

See `ADMIN_NOTIFICATIONS_SETUP.md` for full documentation.
