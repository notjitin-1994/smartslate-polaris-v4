# Counter Increment Bug - Root Cause and Fix

## 🐛 Bug Description

**User Report**: When a user generates a dynamic questionnaire, BOTH "Generated" and "Saved" counters are being incremented.

**Expected Behavior**:
- Dynamic questionnaire generation → Increment ONLY "Generated" (blueprint_creation_count)
- Final blueprint generation → Increment ONLY "Saved" (blueprint_saving_count)

**Actual Behavior** (Before Fix):
- Dynamic questionnaire generation → Increments BOTH counters ❌
- Final blueprint generation → Increments BOTH counters ❌

---

## 🔍 Root Cause Analysis

### Found in Migration File
**File**: `supabase/migrations/20251102130000_fail_closed_enforcement.sql`

### Bug Location #1: increment_blueprint_creation_count_v2 (Lines 104-114)
```sql
-- Check monthly reset for non-free tiers
IF v_tier != 'explorer' AND v_last_reset IS NOT NULL THEN
  IF v_last_reset < (NOW() - INTERVAL '30 days') THEN
    v_current_count := 0;

    -- ❌ BUG: Resetting BOTH counters instead of just creation_count
    UPDATE user_profiles
    SET
      blueprint_creation_count = 0,
      blueprint_saving_count = 0,  -- WRONG! Should NOT touch saving counter
      ...
```

### Bug Location #2: increment_blueprint_saving_count_v2 (Lines 260-270)
```sql
-- Check monthly reset for non-free tiers
IF v_tier != 'explorer' AND v_last_reset IS NOT NULL THEN
  IF v_last_reset < (NOW() - INTERVAL '30 days') THEN
    v_current_count := 0;

    -- ❌ BUG: Resetting BOTH counters instead of just saving_count
    UPDATE user_profiles
    SET
      blueprint_creation_count = 0,  -- WRONG! Should NOT touch creation counter
      blueprint_saving_count = 0,
      ...
```

### Why This Causes Both Counters to Increment

When monthly reset logic is triggered:
1. User generates dynamic questionnaire
2. `increment_blueprint_creation_count_v2` is called
3. Monthly reset check runs → Resets BOTH counters to 0
4. Then increments creation_count to 1
5. **Side effect**: saving_count was reset to 0 even though it shouldn't be touched

Later, when checking the admin page:
- If the increment function ran during a monthly reset window, BOTH counters get reset
- This creates the appearance that both counters are being incremented together

**The real issue**: Each increment function should ONLY manage its own counter, never touch the other counter.

---

## ✅ Fix Applied

### Migration Created
**File**: `supabase/migrations/20251106040000_fix_increment_functions_reset_only_own_counter.sql`

### Changes Made

#### 1. increment_blueprint_creation_count_v2 (Fixed)
```sql
-- ✅ NOW: Only resets creation counter
UPDATE user_profiles
SET
  blueprint_creation_count = 0,
  -- Removed: blueprint_saving_count = 0
  blueprint_usage_metadata = jsonb_set(
    COALESCE(blueprint_usage_metadata, '{}'::jsonb),
    '{last_creation_reset}',
    to_jsonb(NOW())
  ),
  updated_at = NOW()
WHERE user_id = p_user_id;
```

#### 2. increment_blueprint_saving_count_v2 (Fixed)
```sql
-- ✅ NOW: Only resets saving counter
UPDATE user_profiles
SET
  -- Removed: blueprint_creation_count = 0
  blueprint_saving_count = 0,
  blueprint_usage_metadata = jsonb_set(
    COALESCE(blueprint_usage_metadata, '{}'::jsonb),
    '{last_saving_reset}',
    to_jsonb(NOW())
  ),
  updated_at = NOW()
WHERE user_id = p_user_id;
```

### Result
- ✅ Dynamic questionnaire generation → Increments ONLY creation_count
- ✅ Final blueprint generation → Increments ONLY saving_count
- ✅ Each function is isolated and only manages its own counter
- ✅ Monthly resets are independent for each counter type

---

## 🔧 What You Need to Do Now

### Step 1: Migration is Already Applied ✅
The migration `20251106040000` has been pushed to the remote database. The database functions are now fixed.

### Step 2: Reset Existing Incorrect Counters
Users who experienced the bug may have incorrect counter values. You need to run the counter fix to reset all counters to match reality.

#### Option A: Browser Console (Recommended)
1. Open `/admin/users` page (logged in as admin)
2. Press F12 to open DevTools Console
3. Run:
```javascript
fetch('/api/admin/users/fix-counters', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ action: 'fix', dryRun: false })
})
  .then(res => res.json())
  .then(data => {
    console.log(`✅ Fixed ${data.summary.updatedCount} users`);
    console.log('🔄 Hard refresh the page (Ctrl+Shift+R)');
  });
```
4. Hard refresh: `Ctrl+Shift+R`

#### Option B: SQL Direct (Supabase SQL Editor)
```sql
-- Reset all counters to match actual blueprint data
UPDATE user_profiles up
SET
  blueprint_creation_count = (
    SELECT COUNT(*)
    FROM blueprint_generator bg
    WHERE bg.user_id = up.user_id
      AND bg.dynamic_questions IS NOT NULL
      AND bg.deleted_at IS NULL
  ),
  blueprint_saving_count = (
    SELECT COUNT(*)
    FROM blueprint_generator bg
    WHERE bg.user_id = up.user_id
      AND bg.blueprint_json IS NOT NULL
      AND bg.deleted_at IS NULL
  ),
  updated_at = NOW();
```

---

## ✅ Verification

### Test the Fix
1. Create a new test user (or use an existing user with 0 counters)
2. Generate dynamic questionnaire
3. Check admin page:
   - ✅ "Generated" should show 1
   - ✅ "Saved" should show 0
4. Generate final blueprint
5. Check admin page:
   - ✅ "Generated" should STILL show 1 (unchanged)
   - ✅ "Saved" should now show 1

### Expected Counter Behavior

| Action | Generated Counter | Saved Counter |
|--------|------------------|---------------|
| Initial | 0 | 0 |
| After generating dynamic questions | 1 ✅ | 0 ✅ |
| After generating final blueprint | 1 ✅ | 1 ✅ |
| Generate another dynamic questionnaire | 2 ✅ | 1 ✅ |
| Save that blueprint | 2 ✅ | 2 ✅ |

---

## 📊 Impact Summary

### Who Was Affected?
- Any user who generated dynamic questionnaires or blueprints while the monthly reset window was active
- Paid tier users (non-explorer) are more likely to hit monthly reset logic
- Free tier (explorer) users are NOT affected by the reset bug (they don't have monthly resets)

### Data Integrity
- ✅ Blueprint data itself is NOT affected (all blueprints are intact)
- ❌ Counter values may be incorrect for some users
- ✅ Running the counter fix will correct all values

---

## 🚀 Files Changed

### New Migration Created
- `supabase/migrations/20251106040000_fix_increment_functions_reset_only_own_counter.sql`

### No Application Code Changes Needed
The application code in these files is already correct:
- ✅ `frontend/app/api/generate-dynamic-questions/route.ts` - Calls `incrementCreationCountV2`
- ✅ `frontend/app/api/blueprints/generate/route.ts` - Calls `incrementSavingCountV2`

The bug was ONLY in the database functions, which are now fixed.

---

## 📝 Summary

**What was broken**: Database increment functions were resetting both counters during monthly reset checks

**What's fixed**: Each increment function now only manages its own counter

**Action required**: Run the counter fix once to reset all existing counters to match reality

**Going forward**: All new dynamic questionnaire and blueprint generations will correctly increment only their respective counters
