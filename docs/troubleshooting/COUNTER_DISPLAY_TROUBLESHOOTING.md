# Counter Display Troubleshooting Guide

## Current Status

All migrations have been applied successfully:
1. ✅ `20251106000000_enforce_counter_based_tracking.sql` - Enforces counter-based tracking
2. ✅ `20251106010000_fix_get_blueprint_usage_info_use_counters.sql` - Fixes display function
3. ✅ `20251106020000_backfill_user_counters.sql` - Backfills historical data

## If Counters Still Show Wrong Values

### Step 1: Verify Database State

Run this query in your Supabase SQL Editor to check if counters are accurate in the database:

```sql
-- Copy and paste this into Supabase SQL Editor
-- Expected result: users_with_mismatched_counters = 0

SELECT COUNT(*) AS users_with_mismatched_counters
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

**Expected Result**: `users_with_mismatched_counters = 0`

If you see `> 0`, the backfill didn't complete correctly. Run:
```bash
npm run db:push
```

### Step 2: Check Specific User's Data

Replace `'YOUR-USER-ID'` with your actual user ID (you can find it in the Supabase Auth Users table):

```sql
SELECT
  up.user_id,
  up.subscription_tier,
  up.blueprint_creation_count AS counter_creation,
  (
    SELECT COUNT(*)
    FROM blueprint_generator bg
    WHERE bg.user_id = up.user_id
      AND bg.dynamic_questions IS NOT NULL
      AND bg.deleted_at IS NULL
  ) AS actual_blueprints_with_dynamic_questions,
  up.blueprint_saving_count AS counter_saving,
  (
    SELECT COUNT(*)
    FROM blueprint_generator bg
    WHERE bg.user_id = up.user_id
      AND bg.blueprint_json IS NOT NULL
      AND bg.deleted_at IS NULL
  ) AS actual_blueprints_with_final_blueprint
FROM user_profiles up
WHERE up.user_id = 'YOUR-USER-ID'::UUID;
```

**Expected Result**:
- `counter_creation` = `actual_blueprints_with_dynamic_questions`
- `counter_saving` = `actual_blueprints_with_final_blueprint`

### Step 3: Test the API Endpoint Directly

Open your browser's DevTools Console and run:

```javascript
// Run this in browser console while logged in to your app
fetch('/api/user/usage', {
  method: 'GET',
  headers: { 'Content-Type': 'application/json' },
  cache: 'no-store'
})
  .then(res => res.json())
  .then(data => {
    console.log('API Response:', data);
    console.table({
      'Creation Count': data.usage.creationCount,
      'Creation Limit': data.usage.creationLimit,
      'Saving Count': data.usage.savingCount,
      'Saving Limit': data.usage.savingLimit,
    });
  });
```

This will show you exactly what the API is returning.

### Step 4: Clear All Caches

1. **Hard refresh the browser**:
   - Chrome/Edge: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
   - Firefox: `Ctrl+F5` (Windows/Linux) or `Cmd+Shift+R` (Mac)

2. **Clear localStorage**:
   ```javascript
   // Run in browser console
   localStorage.clear();
   sessionStorage.clear();
   console.log('Storage cleared - please refresh the page');
   ```

3. **Restart the dev server**:
   ```bash
   # In frontend directory
   npm run dev
   ```

### Step 5: Check Browser Console Logs

Open DevTools Console and look for logs from `useUserUsage`:

```
[useUserUsage] fetchUsage called
[useUserUsage] Starting fetch to /api/user/usage
[useUserUsage] Response status: 200
[useUserUsage] Response data: { ... }
[useUserUsage] Setting usage state: { ... }
```

If you see errors here, share them for further investigation.

### Step 6: Verify RPC Function is Updated

Run this in Supabase SQL Editor to check if the `get_blueprint_usage_info` function is using counters:

```sql
SELECT
  routine_name,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'get_blueprint_usage_info';
```

The definition should include:
- `up.blueprint_creation_count as creation_count` (counter column)
- `up.blueprint_saving_count as saving_count` (counter column)

It should NOT include:
- `get_actual_blueprint_creation_count()` (this function was dropped)
- `get_actual_blueprint_saving_count()` (this function was dropped)

## Expected Behavior After Fix

### Homepage (http://localhost:3000/)
The usage display should show:
- Creation count = number of blueprints where `dynamic_questions IS NOT NULL`
- Saving count = number of blueprints where `blueprint_json IS NOT NULL`

### My Starmaps (http://localhost:3000/my-starmaps)
Same counters as homepage, displayed in the header.

### When Counters Increment

**Creation Count Increments**:
- ONLY when you generate dynamic questions via the "Generate Questions" button
- NOT when you save the static questionnaire
- NOT when you create a blueprint record

**Saving Count Increments**:
- ONLY when you generate the final blueprint via the "Generate Blueprint" button

## Common Issues

### Issue: "Still shows old values after refresh"

**Possible causes**:
1. Browser cache not cleared (do hard refresh)
2. Multiple browser tabs open (close all and reopen)
3. Database query cache (Supabase sometimes caches, wait 30 seconds)

**Solution**:
- Close all tabs
- Wait 30 seconds
- Hard refresh (Ctrl+Shift+R)
- Check browser console for errors

### Issue: "Counters are 0 but I have blueprints"

**Possible cause**: Blueprints don't have `dynamic_questions` or `blueprint_json` populated yet.

**Explanation**:
- Creation count ONLY counts blueprints with `dynamic_questions IS NOT NULL`
- If you have drafts (static questionnaire saved but no dynamic questions generated), they don't count
- This is expected behavior

**Verification**:
```sql
-- Check your blueprint states
SELECT
  id,
  created_at,
  CASE
    WHEN dynamic_questions IS NOT NULL THEN 'Has Dynamic Questions'
    WHEN static_answers IS NOT NULL THEN 'Draft (Static Only)'
    ELSE 'Empty'
  END as blueprint_state,
  CASE
    WHEN blueprint_json IS NOT NULL THEN 'Has Final Blueprint'
    ELSE 'No Final Blueprint'
  END as blueprint_completion
FROM blueprint_generator
WHERE user_id = 'YOUR-USER-ID'::UUID
  AND deleted_at IS NULL
ORDER BY created_at DESC;
```

### Issue: "Negative delta in backfill"

This is **CORRECT** and expected!

**Explanation**: The old system had a double-counting bug where:
1. Saving static questionnaire incremented counter (+1)
2. Generating dynamic questions incremented counter again (+1)
3. Result: Counter = 2, but only 1 blueprint with dynamic questions

**The backfill fixes this**:
- Before: Counter = 10 (inflated by double-counting)
- After: Counter = 5 (matches reality)
- Delta = -5 (negative = decreased, which is correct)

## Need More Help?

If counters are still incorrect after all these steps:

1. Run the verification SQL in Step 1
2. Share the output
3. Run the API test in Step 3
4. Share the console output
5. Check browser console for errors and share them

This will help identify the exact issue.
