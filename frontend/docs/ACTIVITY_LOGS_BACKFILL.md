# Activity Logs Backfill Guide

## Overview

This guide explains how to backfill activity logs for users and blueprints that existed before the activity logging system was implemented.

## What Gets Backfilled

The backfill process creates activity log entries for:

1. **User Created Logs** - For all users in the system, using their original account creation timestamp
2. **User Updated Logs** - For users whose profiles have been updated (where `updated_at` > `created_at`)
3. **Blueprint Created Logs** - For all existing blueprints in the system

## Methods to Backfill

### Method 1: Run Migration (Recommended for First Deployment)

The migration runs automatically when deployed and will populate activity logs for all existing data.

```bash
# From project root
npm run db:push
```

The migration file: `supabase/migrations/20251104020000_backfill_activity_logs.sql`

### Method 2: API Endpoint (Recommended for Manual Re-runs)

Use the admin API endpoint to trigger backfill on-demand:

**Check Status:**

```bash
GET /api/admin/backfill-activity-logs
```

Response:

```json
{
  "success": true,
  "stats": {
    "total_logs": 150,
    "backfilled_logs": 100,
    "users_without_logs": 5,
    "blueprints_without_logs": 3
  },
  "needs_backfill": true
}
```

**Run Backfill:**

```bash
POST /api/admin/backfill-activity-logs
```

Response:

```json
{
  "success": true,
  "message": "Successfully backfilled 108 activity log entries",
  "results": {
    "user_created": 50,
    "user_updated": 25,
    "blueprint_created": 33,
    "errors": []
  },
  "total": 108
}
```

### Method 3: Direct SQL Functions

You can call the RPC functions directly from SQL:

```sql
-- Check users without logs
SELECT * FROM get_users_without_activity_logs();

-- Check blueprints without logs
SELECT * FROM get_blueprints_without_activity_logs();

-- Run backfill
SELECT backfill_user_created_logs();
SELECT backfill_user_updated_logs();
SELECT backfill_blueprint_created_logs();
```

## How Backfilled Logs Are Marked

All backfilled logs have metadata to identify them:

```json
{
  "backfilled": true,
  "source": "backfill_api" | "migration_20251104020000",
  "email": "user@example.com",
  "original_created_at": "2025-01-01T12:00:00Z"
}
```

You can query backfilled logs:

```sql
SELECT * FROM activity_logs
WHERE metadata->>'backfilled' = 'true';
```

## Safety Features

1. **Idempotent** - Running backfill multiple times is safe. It only creates logs for records that don't have them.
2. **Preserves Timestamps** - Uses original `created_at` or `updated_at` timestamps, not the current time.
3. **No Overwrites** - Never modifies existing activity logs.
4. **Marked** - All backfilled entries are clearly marked in metadata.

## Verification

After running backfill, verify the results:

```sql
-- Count by action type
SELECT
  action_type,
  COUNT(*) as total,
  COUNT(CASE WHEN metadata->>'backfilled' = 'true' THEN 1 END) as backfilled
FROM activity_logs
GROUP BY action_type
ORDER BY action_type;

-- Check for users without logs
SELECT COUNT(*) FROM get_users_without_activity_logs();
-- Should return 0 if backfill is complete

-- Check for blueprints without logs
SELECT COUNT(*) FROM get_blueprints_without_activity_logs();
-- Should return 0 if backfill is complete
```

## Rollback

If you need to remove backfilled logs:

```bash
# Run rollback migration
psql $DATABASE_URL < supabase/migrations/ROLLBACK_20251104020000_backfill_activity_logs.sql
```

Or via SQL:

```sql
-- Remove all backfilled logs from migration
DELETE FROM activity_logs
WHERE metadata->>'backfilled' = 'true'
  AND metadata->>'source' = 'migration_20251104020000';

-- Remove all backfilled logs from API
DELETE FROM activity_logs
WHERE metadata->>'backfilled' = 'true'
  AND metadata->>'source' = 'backfill_api';
```

## Troubleshooting

### Some users still showing empty activity logs

Check if the backfill ran successfully:

```sql
SELECT * FROM get_users_without_activity_logs();
```

If users appear here, run the backfill again via API endpoint.

### Backfill shows errors

Check the API response for specific error messages:

```json
{
  "success": false,
  "results": {
    "errors": ["User created logs: permission denied"]
  }
}
```

Ensure:

- You're authenticated as an admin
- RLS policies allow the operation
- Database functions have proper permissions

### Performance concerns

The backfill is optimized with:

- Single INSERT statements with subqueries
- Proper indexing on activity_logs table
- WHERE NOT EXISTS clauses to avoid duplicates

For very large datasets (100K+ records), consider running during off-peak hours.

## Integration with Admin UI

### Display Backfilled Logs

Backfilled logs appear in the activity log UI with a special indicator:

```tsx
{
  activity.metadata?.backfilled && <Badge variant="secondary">Backfilled</Badge>;
}
```

### Filter Out Backfilled Logs

To show only "real" activity:

```sql
SELECT * FROM activity_logs
WHERE metadata->>'backfilled' IS NULL
  OR metadata->>'backfilled' = 'false';
```

## Best Practices

1. **Run Once** - Run the backfill once after deploying the activity logging system
2. **Verify** - Always check the status endpoint before and after running backfill
3. **Monitor** - Watch for errors in the API response
4. **Document** - Keep track of when backfill was run in your deployment logs

## Related Files

- Migration: `supabase/migrations/20251104020000_backfill_activity_logs.sql`
- Rollback: `supabase/migrations/ROLLBACK_20251104020000_backfill_activity_logs.sql`
- API Endpoint: `app/api/admin/backfill-activity-logs/route.ts`
- Activity Logger: `lib/utils/activityLogger.ts`
