# Admin Usage Counts Fix - Action Plan

## Problem Summary

The usage counts displayed in the `/admin/users` page are incorrect. The counts shown for "Gen" (blueprint_creation_count) and "Saved" (blueprint_saving_count) do not match the actual number of blueprints in the database.

## Root Cause Analysis

After comprehensive codebase review using sequential thinking, I've identified that:

1. **The admin API is correct** (`frontend/app/api/admin/users/route.ts` lines 127-130)
   - It reads from the correct columns: `blueprint_creation_count` and `blueprint_saving_count`

2. **The frontend display is correct** (`frontend/components/admin/users/UserManagementTable.tsx` lines 732-778)
   - It displays the values from the API response correctly

3. **The database counters are out of sync**
   - The counter columns in `user_profiles` table don't match the actual blueprint data
   - The backfill migration (20251106020000) may not have run or counters got out of sync since then

## Solution Approach

I've created two methods to fix this issue:

### Method 1: SQL Script (Direct Database Fix)
**File**: `scripts/fix-admin-usage-counts.sql`

**Use this method if you prefer direct database access.**

### Method 2: API Endpoint (Automated Fix)
**File**: `frontend/app/api/admin/users/fix-counters/route.ts`

**Use this method for a more user-friendly, automated approach.**

---

## Implementation Steps

### Option A: Using SQL Script (Recommended for Quick Fix)

1. **Navigate to Supabase SQL Editor**
   - Open your Supabase project dashboard
   - Go to SQL Editor

2. **Run Diagnosis**
   ```sql
   -- Copy and paste from scripts/fix-admin-usage-counts.sql
   -- Run PHASE 1 only to see the diagnosis
   ```

3. **Review Output**
   - Check how many users have mismatched counters
   - Review the detailed mismatch information
   - Note the delta values (positive = counter is higher, negative = counter is lower)

4. **Apply the Fix**
   - In the SQL script, uncomment the section marked "UNCOMMENT BELOW TO ACTUALLY FIX THE COUNTERS"
   - Run the entire script
   - Verify that "users_still_mismatched = 0"

5. **Test in Admin UI**
   - Refresh the `/admin/users` page
   - Verify usage counts are now correct

### Option B: Using API Endpoint (More Automated)

1. **Ensure the API endpoint exists**
   ```bash
   # The file should be at:
   frontend/app/api/admin/users/fix-counters/route.ts
   ```

2. **Run Diagnosis via Browser Console**
   ```javascript
   // Open browser DevTools Console on /admin/users page
   // Run diagnosis only (dry run)
   fetch('/api/admin/users/fix-counters', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ action: 'diagnose', dryRun: true })
   })
     .then(res => res.json())
     .then(data => {
       console.log('Diagnosis Results:', data);
       console.table(data.summary);
       if (data.mismatches?.length > 0) {
         console.log('Mismatches:', data.mismatches);
       }
     });
   ```

3. **Review Output**
   - Check `data.summary` for total users and mismatch counts
   - Review `data.mismatches` for detailed information

4. **Apply the Fix**
   ```javascript
   // Run the actual fix (not a dry run)
   fetch('/api/admin/users/fix-counters', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ action: 'fix', dryRun: false })
   })
     .then(res => res.json())
     .then(data => {
       console.log('Fix Applied:', data);
       console.log(`Updated ${data.summary.updatedCount} users`);
     });
   ```

5. **Verify the Fix**
   ```javascript
   // Quick health check
   fetch('/api/admin/users/fix-counters', {
     method: 'GET'
   })
     .then(res => res.json())
     .then(data => {
       console.log('Health Check:', data);
       // Should show: status: 'healthy', usersWithMismatches: 0
     });
   ```

6. **Refresh Admin Page**
   - Hard refresh the `/admin/users` page (Ctrl+Shift+R or Cmd+Shift+R)
   - Verify usage counts are now correct

---

## Technical Details

### What the Fix Does

1. **For each user**, it counts:
   - **Creation count**: Number of blueprints with `dynamic_questions IS NOT NULL AND deleted_at IS NULL`
   - **Saving count**: Number of blueprints with `blueprint_json IS NOT NULL AND deleted_at IS NULL`

2. **Compares** these actual counts with the counter values in `user_profiles` table

3. **Updates** the counter columns to match reality:
   ```sql
   UPDATE user_profiles
   SET
     blueprint_creation_count = <actual_count>,
     blueprint_saving_count = <actual_count>,
     updated_at = NOW()
   ```

### Why Counters Got Out of Sync

Possible reasons:
1. The backfill migration (20251106020000) never ran or failed silently
2. There was a bug in the increment functions that has since been fixed
3. Manual database changes were made that bypassed the counter increment logic
4. Blueprints were soft-deleted (deleted_at set) but counters weren't decremented

### Prevention Measures

To prevent this from happening again:

1. **Use the audit function** (available in migration 20251106000000):
   ```sql
   SELECT * FROM audit_counter_accuracy('user-id-here'::UUID);
   ```

2. **Monitor counter health** regularly using the GET endpoint:
   ```bash
   curl https://your-app.com/api/admin/users/fix-counters
   ```

3. **Always use increment functions** when creating blueprints:
   - `increment_blueprint_creation_count_v2()` for dynamic question generation
   - `increment_blueprint_saving_count_v2()` for final blueprint generation

4. **Never manually update counters** - let the atomic increment functions handle it

---

## Verification Queries

After applying the fix, verify it worked:

### Check Global Health
```sql
SELECT COUNT(*) AS users_with_mismatches
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
-- Expected: 0
```

### Check Specific User
```sql
SELECT
  up.user_id,
  up.email,
  up.blueprint_creation_count,
  (
    SELECT COUNT(*)
    FROM blueprint_generator bg
    WHERE bg.user_id = up.user_id
      AND bg.dynamic_questions IS NOT NULL
      AND bg.deleted_at IS NULL
  ) AS actual_creation_count,
  up.blueprint_saving_count,
  (
    SELECT COUNT(*)
    FROM blueprint_generator bg
    WHERE bg.user_id = up.user_id
      AND bg.blueprint_json IS NOT NULL
      AND bg.deleted_at IS NULL
  ) AS actual_saving_count
FROM user_profiles up
WHERE up.user_id = 'YOUR-USER-ID'::UUID;
```

---

## Success Criteria

After implementing the fix, you should see:

1. ✅ All users in `/admin/users` page show accurate usage counts
2. ✅ "Gen" count matches number of blueprints with dynamic questions
3. ✅ "Saved" count matches number of blueprints with final blueprint JSON
4. ✅ SQL verification query returns 0 mismatches
5. ✅ API health check returns `status: 'healthy'`

---

## Rollback Plan

If something goes wrong, you can rollback:

### If using SQL script:
The script creates a backup automatically. Check if `user_profiles_counter_backup_20251106` table exists.

### If using API endpoint:
No automatic backup, but you can manually create one:
```sql
CREATE TABLE user_profiles_backup_manual AS
SELECT * FROM user_profiles;
```

Then restore:
```sql
UPDATE user_profiles
SET
  blueprint_creation_count = backup.blueprint_creation_count,
  blueprint_saving_count = backup.blueprint_saving_count
FROM user_profiles_backup_manual backup
WHERE user_profiles.user_id = backup.user_id;
```

---

## Next Steps

1. Choose Method A (SQL) or Method B (API)
2. Run diagnosis to see current state
3. Apply the fix
4. Verify the fix worked
5. Test in admin UI
6. Monitor for any issues

---

## Support

If you encounter any issues:

1. Check the browser console for errors
2. Check Supabase logs for database errors
3. Run the verification queries to see exact state
4. Share the diagnosis output for further investigation

## Files Changed/Created

- ✅ `scripts/fix-admin-usage-counts.sql` - SQL diagnosis and fix script
- ✅ `frontend/app/api/admin/users/fix-counters/route.ts` - API endpoint for automated fix
- ✅ `docs/ADMIN_USAGE_COUNTS_FIX_PLAN.md` - This action plan
