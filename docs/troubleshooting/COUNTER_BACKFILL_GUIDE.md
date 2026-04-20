# Counter Backfill Guide

**Purpose**: Update all existing users' counter values to match actual blueprint data
**Date**: 2025-11-06
**Migration**: `20251106020000_backfill_user_counters.sql`

## What This Does

This migration sets counter values based on actual blueprint states:

- **Creation Count** = Number of blueprints with `dynamic_questions IS NOT NULL`
- **Saving Count** = Number of blueprints with `blueprint_json IS NOT NULL`

This ensures historical data aligns with the new counter-based tracking logic where:
- Creation count increments when **dynamic questions are generated** (not when static questionnaire is saved)
- Saving count increments when **final blueprint is generated**

## Before Running the Migration

### 1. Preview What Will Change

Run this query to see which users will have their counters updated:

```sql
SELECT
  up.user_id,
  up.blueprint_creation_count AS current_creation,
  COALESCE(
    (
      SELECT COUNT(*)::INTEGER
      FROM blueprint_generator bg
      WHERE bg.user_id = up.user_id
        AND bg.dynamic_questions IS NOT NULL
        AND bg.deleted_at IS NULL
    ),
    0
  ) AS new_creation,
  up.blueprint_saving_count AS current_saving,
  COALESCE(
    (
      SELECT COUNT(*)::INTEGER
      FROM blueprint_generator bg
      WHERE bg.user_id = up.user_id
        AND bg.blueprint_json IS NOT NULL
        AND bg.deleted_at IS NULL
    ),
    0
  ) AS new_saving
FROM user_profiles up
WHERE up.blueprint_creation_count != COALESCE(
    (
      SELECT COUNT(*)::INTEGER
      FROM blueprint_generator bg
      WHERE bg.user_id = up.user_id
        AND bg.dynamic_questions IS NOT NULL
        AND bg.deleted_at IS NULL
    ),
    0
  )
  OR up.blueprint_saving_count != COALESCE(
    (
      SELECT COUNT(*)::INTEGER
      FROM blueprint_generator bg
      WHERE bg.user_id = up.user_id
        AND bg.blueprint_json IS NOT NULL
        AND bg.deleted_at IS NULL
    ),
    0
  )
ORDER BY up.user_id;
```

### 2. Check Summary Statistics

See how many users will be affected:

```sql
WITH changes AS (
  SELECT
    up.user_id,
    up.blueprint_creation_count AS old_creation,
    COALESCE(
      (
        SELECT COUNT(*)::INTEGER
        FROM blueprint_generator bg
        WHERE bg.user_id = up.user_id
          AND bg.dynamic_questions IS NOT NULL
          AND bg.deleted_at IS NULL
      ),
      0
    ) AS new_creation,
    up.blueprint_saving_count AS old_saving,
    COALESCE(
      (
        SELECT COUNT(*)::INTEGER
        FROM blueprint_generator bg
        WHERE bg.user_id = up.user_id
          AND bg.blueprint_json IS NOT NULL
          AND bg.deleted_at IS NULL
      ),
      0
    ) AS new_saving
  FROM user_profiles up
)
SELECT
  COUNT(*) AS total_users,
  COUNT(*) FILTER (WHERE old_creation != new_creation) AS creation_count_will_change,
  COUNT(*) FILTER (WHERE old_saving != new_saving) AS saving_count_will_change,
  SUM(new_creation - old_creation) AS total_creation_delta,
  SUM(new_saving - old_saving) AS total_saving_delta
FROM changes;
```

## Running the Migration

### Apply via npm command (recommended):

```bash
cd /home/jitin-m-nair/Desktop/polaris-v3
npm run db:push
```

This will apply all pending migrations including the backfill.

### Check migration logs:

After running, check the console output for statistics:

```
NOTICE:  Backfill Complete:
NOTICE:    Total users processed: 150
NOTICE:    Users with counter changes: 47
NOTICE:    Creation count total delta: -23 (positive = increased, negative = decreased)
NOTICE:    Saving count total delta: -12 (positive = increased, negative = decreased)
```

**Negative delta means**: Some users had higher counter values than actual blueprints (due to double-counting bug). This is expected and correct.

**Positive delta means**: Some users had lower counter values than actual blueprints (less common but possible if increments failed).

## After Running the Migration

### 1. Verify Backup Table Was Created

```sql
SELECT COUNT(*) FROM user_profiles_counter_backup_20251106;
```

This table contains the old values for rollback safety.

### 2. View Users with Counter Changes

```sql
SELECT
  user_id,
  blueprint_creation_count_old AS old_creation,
  blueprint_creation_count_new AS new_creation,
  (blueprint_creation_count_new - blueprint_creation_count_old) AS creation_delta,
  blueprint_saving_count_old AS old_saving,
  blueprint_saving_count_new AS new_saving,
  (blueprint_saving_count_new - blueprint_saving_count_old) AS saving_delta,
  backed_up_at
FROM user_profiles_counter_backup_20251106
WHERE blueprint_creation_count_old != blueprint_creation_count_new
   OR blueprint_saving_count_old != blueprint_saving_count_new
ORDER BY backed_up_at DESC;
```

### 3. Verify Counters Match Reality (should return 0 rows)

```sql
SELECT
  up.user_id,
  up.blueprint_creation_count AS counter_creation,
  (
    SELECT COUNT(*)
    FROM blueprint_generator bg
    WHERE bg.user_id = up.user_id
      AND bg.dynamic_questions IS NOT NULL
      AND bg.deleted_at IS NULL
  ) AS actual_creation,
  up.blueprint_saving_count AS counter_saving,
  (
    SELECT COUNT(*)
    FROM blueprint_generator bg
    WHERE bg.user_id = up.user_id
      AND bg.blueprint_json IS NOT NULL
      AND bg.deleted_at IS NULL
  ) AS actual_saving
FROM user_profiles up
WHERE up.blueprint_creation_count != (
  SELECT COUNT(*)
  FROM blueprint_generator bg
  WHERE bg.user_id = up.user_id
    AND bg.dynamic_questions IS NOT NULL
    AND bg.deleted_at IS NULL
)
OR up.blueprint_saving_count != (
  SELECT COUNT(*)
  FROM blueprint_generator bg
  WHERE bg.user_id = up.user_id
    AND bg.blueprint_json IS NOT NULL
    AND bg.deleted_at IS NULL
);
```

If this returns 0 rows, **backfill was successful**! ✅

### 4. Test with Specific User

Pick a user and verify their counters:

```sql
SELECT
  up.user_id,
  up.blueprint_creation_count,
  up.blueprint_saving_count,
  (SELECT COUNT(*) FROM blueprint_generator WHERE user_id = up.user_id AND dynamic_questions IS NOT NULL AND deleted_at IS NULL) AS actual_creations,
  (SELECT COUNT(*) FROM blueprint_generator WHERE user_id = up.user_id AND blueprint_json IS NOT NULL AND deleted_at IS NULL) AS actual_saves
FROM user_profiles up
WHERE up.user_id = '<test-user-id>'::UUID;
```

## Rollback Procedure

If you need to restore the old counter values:

```sql
BEGIN;

UPDATE user_profiles up
SET
  blueprint_creation_count = backup.blueprint_creation_count_old,
  blueprint_saving_count = backup.blueprint_saving_count_old,
  updated_at = NOW()
FROM user_profiles_counter_backup_20251106 backup
WHERE up.user_id = backup.user_id;

COMMIT;
```

Verify rollback:

```sql
SELECT COUNT(*) FROM user_profiles up
JOIN user_profiles_counter_backup_20251106 backup ON up.user_id = backup.user_id
WHERE up.blueprint_creation_count = backup.blueprint_creation_count_old
  AND up.blueprint_saving_count = backup.blueprint_saving_count_old;
```

Should equal total number of users.

## Cleanup (Optional)

After verifying the backfill worked correctly and you're satisfied with the results, you can drop the backup table:

```sql
-- Only run this after verifying everything is correct!
DROP TABLE IF EXISTS public.user_profiles_counter_backup_20251106;
```

⚠️ **Warning**: Once you drop the backup table, you cannot rollback the migration!

## Expected Outcomes

### Typical Delta Patterns

**Negative Delta (Counter Decreases)**:
- **Reason**: User had double-counting from old bug (static save + dynamic generation both incremented)
- **Example**: User created 5 blueprints, counter was 10 (double-counted), now corrected to 5
- **Action**: No action needed, this is the fix working correctly

**Positive Delta (Counter Increases)**:
- **Reason**: Less common, happens if increment operations failed in the past
- **Example**: User created 5 blueprints, counter was 3 (some increments failed), now corrected to 5
- **Action**: No action needed, counters now accurate

**Zero Delta (No Change)**:
- **Reason**: User's counters were already accurate
- **Example**: New users created after the double-counting fix
- **Action**: No action needed

### User Impact

**For existing users**:
- Counter values now match actual blueprint states
- Some users may see their "used" counts decrease (if they were double-counted before)
- Limits remain the same
- No data loss - all blueprints are preserved

**For new users** (created after migration):
- Counters increment correctly from the start
- No backfill needed

## Frequently Asked Questions

### Q: Will users lose their blueprints?
**A**: No! This migration only updates counter values. All blueprint data is preserved.

### Q: What if a user's counter goes down?
**A**: This is expected for users affected by the double-counting bug. Their actual usage was lower than what the counter showed. Now it's accurate.

### Q: Can I run this migration multiple times?
**A**: Yes, it's idempotent. Running it again will recalculate counts based on current blueprint states.

### Q: What about deleted blueprints?
**A**: The migration excludes soft-deleted blueprints (`deleted_at IS NOT NULL`), so they don't count toward usage.

### Q: How long does this take?
**A**: Depends on database size. Typical execution: 1-5 seconds for <1000 users, 5-30 seconds for larger databases.

## Migration Flow Diagram

```
Before Migration (Double-Counting Bug):
User creates blueprint → Static save increments counter → Dynamic gen increments counter AGAIN
Result: Counter = 2, Actual blueprints with dynamic_questions = 1

After Backfill:
Counter = 1 (matches actual dynamic_questions count)

Future (Correct Behavior):
User creates blueprint → Static save (no increment) → Dynamic gen increments counter
Result: Counter = 1, Actual blueprints with dynamic_questions = 1
```

## Related Files

- Migration: `supabase/migrations/20251106020000_backfill_user_counters.sql`
- Counter Logic Fix: `supabase/migrations/20251106000000_enforce_counter_based_tracking.sql`
- Display Fix: `supabase/migrations/20251106010000_fix_get_blueprint_usage_info_use_counters.sql`
- Test Plan: `docs/COUNTER_BASED_TRACKING_TEST_PLAN.md`
