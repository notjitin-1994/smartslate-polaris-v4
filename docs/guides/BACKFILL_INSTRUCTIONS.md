# Counter Backfill Instructions - Quick Start

## What This Does

Updates all existing users' blueprint creation and saving counters to match their actual blueprint states, fixing the double-counting bug for historical data.

## Step-by-Step Instructions

### Step 1: Preview Changes (Optional but Recommended)

See what will change before applying the migration:

```bash
cd /home/jitin-m-nair/Desktop/polaris-v3

# If you have psql installed locally
psql "$DATABASE_URL" -f scripts/preview-counter-backfill.sql

# OR use Supabase SQL Editor (copy/paste contents of scripts/preview-counter-backfill.sql)
```

This shows:
- How many users will be affected
- What the counter changes will be
- Summary statistics

### Step 2: Apply the Backfill Migration

```bash
cd /home/jitin-m-nair/Desktop/polaris-v3
npm run db:push
```

This will:
1. Create a backup table with old counter values
2. Calculate correct counts from actual blueprint data
3. Update all user counters
4. Log summary statistics

**Watch for the output**:
```
NOTICE:  Backfill Complete:
NOTICE:    Total users processed: 150
NOTICE:    Users with counter changes: 47
NOTICE:    Creation count total delta: -23
NOTICE:    Saving count total delta: -12
```

### Step 3: Verify Success

```bash
# If you have psql installed locally
psql "$DATABASE_URL" -f scripts/verify-counter-backfill.sql

# OR use Supabase SQL Editor (copy/paste contents of scripts/verify-counter-backfill.sql)
```

**Success indicators**:
- ✅ Backup table exists
- ✅ "Users with Mismatched Counters" = 0
- ✅ No rows returned from accuracy check

### Step 4: Test in Browser

1. Visit `http://localhost:3000/` (homepage)
2. Visit `http://localhost:3000/my-starmaps`
3. Check that counter values are correct
4. Try refreshing the page - counts should remain stable

## What Changed

### Before Backfill (Double-Counting Bug)

```
User Journey:
1. Create blueprint record → Counter +1 (WRONG!)
2. Save static questionnaire → Counter +1 (WRONG!)
3. Generate dynamic questions → Counter +1 (Correct)

Result: Counter = 3, Actual = 1 (double/triple counted!)
```

### After Backfill (Correct)

```
User Journey:
1. Create blueprint record → Counter unchanged
2. Save static questionnaire → Counter unchanged
3. Generate dynamic questions → Counter +1

Result: Counter = 1, Actual = 1 ✅
```

## Expected Outcomes

### Negative Delta (Most Common)

**Example**: User has 10 creation count, but only 5 blueprints with dynamic questions
- **Before**: Counter = 10 (inflated by double-counting)
- **After**: Counter = 5 (matches reality)
- **Delta**: -5 (negative = decreased)

This is **correct** - the bug was fixed and historical data corrected.

### Positive Delta (Less Common)

**Example**: User has 3 creation count, but 5 blueprints with dynamic questions
- **Before**: Counter = 3 (some increments failed)
- **After**: Counter = 5 (matches reality)
- **Delta**: +2 (positive = increased)

This is **correct** - missed increments are now accounted for.

### Zero Delta

**Example**: New users created after the fix
- **Before**: Counter = 2
- **After**: Counter = 2
- **Delta**: 0 (no change needed)

Already accurate, no correction needed.

## Rollback (if needed)

If something goes wrong:

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

## Cleanup (After Verification)

Once you've verified everything works correctly for several days:

```sql
-- Only run after thorough verification!
DROP TABLE IF EXISTS public.user_profiles_counter_backup_20251106;
```

⚠️ **Warning**: You cannot rollback after dropping the backup table!

## Related Migrations

This backfill is part of a series of fixes:

1. `20251106000000_enforce_counter_based_tracking.sql` - Removed database query functions
2. `20251106010000_fix_get_blueprint_usage_info_use_counters.sql` - Fixed display function
3. **`20251106020000_backfill_user_counters.sql`** - This backfill (you are here)

All three must be applied together.

## Files Reference

- **Migration**: `supabase/migrations/20251106020000_backfill_user_counters.sql`
- **Preview Script**: `scripts/preview-counter-backfill.sql`
- **Verify Script**: `scripts/verify-counter-backfill.sql`
- **Detailed Guide**: `docs/COUNTER_BACKFILL_GUIDE.md`
- **Test Plan**: `docs/COUNTER_BASED_TRACKING_TEST_PLAN.md`

## Need Help?

- See detailed FAQ: `docs/COUNTER_BACKFILL_GUIDE.md`
- Check test plan: `docs/COUNTER_BASED_TRACKING_TEST_PLAN.md`
- Review migration code: `supabase/migrations/20251106020000_backfill_user_counters.sql`
