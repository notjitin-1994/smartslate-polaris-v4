# Database-Based Blueprint Counting Implementation

## Overview

This document describes the implementation of accurate blueprint counting based on actual database records rather than counter columns.

## Problem Statement

Previously, the system relied on counter columns (`blueprint_creation_count` and `blueprint_saving_count`) in the `user_profiles` table. These counters could become inaccurate due to:

1. **Data inconsistency**: Counters could get out of sync with actual data
2. **Deletion handling**: If blueprints were deleted, counters didn't decrease
3. **Migration issues**: Historical data migrations might not update counters correctly
4. **Error scenarios**: Failed operations might increment counters without creating records

## Solution

The new implementation calculates counts dynamically from the `blueprint_generator` table, which is the source of truth for all blueprint data.

### Key Changes

#### 1. New Helper Functions

**`get_actual_blueprint_creation_count(user_id)`**
- Counts ALL blueprint records for a user (any status)
- Represents total blueprint generation attempts
- Query: `SELECT COUNT(*) FROM blueprint_generator WHERE user_id = $1`

**`get_actual_blueprint_saving_count(user_id)`**
- Counts only COMPLETED blueprints with data
- Represents successfully saved blueprints
- Query: `SELECT COUNT(*) FROM blueprint_generator WHERE user_id = $1 AND status = 'completed' AND blueprint_json IS NOT NULL`

**`get_actual_current_month_counts(user_id, billing_cycle_start)`**
- Counts blueprints created within current billing cycle (for paid tiers)
- Returns both creation and saving counts for the current month
- Query filters by `created_at >= billing_cycle_start`

#### 2. Updated Core Functions

**`get_effective_limits(user_id)`**
- Now uses actual database counts instead of counter columns
- Free tier: Uses lifetime counts from `get_actual_blueprint_creation_count/saving_count`
- Paid tiers: Uses monthly counts from `get_actual_current_month_counts`
- Developer/exempt users: Returns unlimited (-1) but still shows actual counts

**`increment_blueprint_creation_count(user_id)`**
- Checks limits using actual counts
- Syncs counter columns after operation (for backwards compatibility)
- **Idempotent**: Safe to call multiple times without double-counting

**`increment_blueprint_saving_count(user_id)`**
- Checks limits using actual counts
- Syncs counter columns after operation (for backwards compatibility)
- **Idempotent**: Safe to call multiple times without double-counting

#### 3. Admin/Maintenance Function

**`sync_blueprint_counters(user_id?)`**
- Syncs counter columns with actual database counts
- Can sync a single user or all users
- Returns report showing old vs new counts
- Useful for auditing and fixing inconsistencies

```sql
-- Sync specific user
SELECT * FROM sync_blueprint_counters('user-uuid'::UUID);

-- Sync all users (returns only mismatched ones)
SELECT * FROM sync_blueprint_counters();
```

### Performance Optimizations

New indexes were added to optimize counting queries:

```sql
-- General user/status index
CREATE INDEX idx_blueprint_generator_user_status
ON blueprint_generator(user_id, status, created_at);

-- Partial index for completed blueprints (speeds up saving count)
CREATE INDEX idx_blueprint_generator_completed
ON blueprint_generator(user_id, status)
WHERE status = 'completed' AND blueprint_json IS NOT NULL;
```

## Backwards Compatibility

- Counter columns (`blueprint_creation_count`, `blueprint_saving_count`) are still maintained
- They are automatically synced when limits are checked
- Old code reading these columns will still work (though values may be slightly stale)
- API responses continue to work unchanged

## Migration Process

The migration (`20251029000000_implement_actual_blueprint_counting.sql`) automatically:

1. Creates all new helper functions
2. Updates existing limit-checking functions
3. Adds performance indexes
4. Syncs all existing user counters with actual data
5. Reports any discrepancies found

## Testing

### Verify Counts Match

```sql
-- Check if stored counts match actual counts for a user
SELECT
  up.user_id,
  up.blueprint_creation_count as stored_creation,
  get_actual_blueprint_creation_count(up.user_id) as actual_creation,
  up.blueprint_saving_count as stored_saving,
  get_actual_blueprint_saving_count(up.user_id) as actual_saving,
  (up.blueprint_creation_count = get_actual_blueprint_creation_count(up.user_id) AND
   up.blueprint_saving_count = get_actual_blueprint_saving_count(up.user_id)) as counts_match
FROM public.user_profiles up
WHERE up.user_id = 'user-uuid'::UUID;
```

### Test Limit Checking

```sql
-- Check if user can create/save more blueprints
SELECT * FROM check_blueprint_creation_limits('user-uuid'::UUID);
SELECT * FROM check_blueprint_saving_limits('user-uuid'::UUID);

-- Get effective limits (uses actual counts)
SELECT * FROM get_effective_limits('user-uuid'::UUID);
```

### Find Users with Mismatches

```sql
-- Find all users where counters don't match actual data
SELECT * FROM sync_blueprint_counters();
```

## Usage in Application Code

No changes required in application code! The existing service layer (`BlueprintUsageService`) continues to work:

```typescript
// These functions now use actual database counts internally
const limits = await BlueprintUsageService.getEffectiveLimits(supabase, userId);
const canCreate = await BlueprintUsageService.canCreateBlueprint(supabase, userId);
const canSave = await BlueprintUsageService.canSaveBlueprint(supabase, userId);
```

## Benefits

1. **Accuracy**: Counts always reflect actual database state
2. **Consistency**: No possibility of counter drift
3. **Auditability**: Can verify counts at any time
4. **Idempotency**: Safe to call increment functions multiple times
5. **Backwards Compatible**: Existing code continues to work
6. **Performance**: Optimized with proper indexes

## Monitoring

To monitor for any counting issues:

```sql
-- Run daily/weekly to check for counter drift
SELECT
  COUNT(*) as users_with_mismatches,
  SUM(ABS(old_creation_count - new_creation_count)) as total_creation_drift,
  SUM(ABS(old_saving_count - new_saving_count)) as total_saving_drift
FROM sync_blueprint_counters();
```

## Future Considerations

1. **Counter column removal**: Once fully confident, we could remove counter columns entirely
2. **Caching**: For very high traffic, consider caching counts with short TTL
3. **Materialized views**: Could use materialized views for complex counting scenarios
4. **Real-time updates**: Consider using database triggers to keep a "counts" table updated in real-time

## Rollback

If needed, the migration can be rolled back:

```sql
-- Drop new functions
DROP FUNCTION IF EXISTS get_actual_blueprint_creation_count(UUID);
DROP FUNCTION IF EXISTS get_actual_blueprint_saving_count(UUID);
DROP FUNCTION IF EXISTS get_actual_current_month_counts(UUID, TIMESTAMPTZ);
DROP FUNCTION IF EXISTS sync_blueprint_counters(UUID);

-- Restore old increment functions (from previous migration)
-- [Include old function definitions here]
```

## Migration File

Location: `supabase/migrations/20251029000000_implement_actual_blueprint_counting.sql`

Applied: 2025-10-29

## Related Files

- Database functions: `supabase/migrations/20251029000000_implement_actual_blueprint_counting.sql`
- Service layer: `frontend/lib/services/blueprintUsageService.ts`
- Previous migration: `supabase/migrations/20251028000000_implement_monthly_rollover_limits.sql`
