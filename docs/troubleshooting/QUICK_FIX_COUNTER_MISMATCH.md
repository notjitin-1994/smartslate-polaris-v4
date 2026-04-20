# Quick Fix: Counter Shows 0 But User Has Generated Questionnaire

## Problem
User has dynamic questionnaire generated, but counter shows:
- **Current**: Generated 0 / Saved 0
- **Expected**: Generated 1 / Saved 0

## Immediate Fix (30 seconds)

### Method 1: Browser Console (Recommended - Fastest)

1. **Open** `/admin/users` page in your browser (must be logged in as admin)

2. **Open DevTools Console** (Press F12)

3. **Run this to see affected users**:
```javascript
fetch('/api/admin/users/fix-counters', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ action: 'diagnose', dryRun: true })
})
  .then(res => res.json())
  .then(data => {
    console.log('📊 Summary:', data.summary);
    console.log('🔍 Affected users:', data.mismatches);
    console.table(data.mismatches.map(u => ({
      email: u.email || u.user_id.substring(0, 8),
      current_gen: u.current_creation_count,
      should_be_gen: u.correct_creation_count,
      current_saved: u.current_saving_count,
      should_be_saved: u.correct_saving_count
    })));
  });
```

4. **Apply the fix**:
```javascript
fetch('/api/admin/users/fix-counters', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ action: 'fix', dryRun: false })
})
  .then(res => res.json())
  .then(data => {
    console.log('✅ Fix applied!');
    console.log(`📈 Updated ${data.summary.updatedCount} users`);
    console.log('🔄 Please hard refresh the page (Ctrl+Shift+R)');
  });
```

5. **Hard refresh** the page: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)

**Expected Result**: Counter now shows `Generated 1 / Saved 0` ✅

---

### Method 2: SQL Direct (If you prefer Supabase SQL Editor)

1. **Open** Supabase SQL Editor

2. **Run diagnosis** (copy from `scripts/diagnose-single-user-counter.sql`):
```sql
SELECT
  up.user_id,
  up.email,
  up.blueprint_creation_count AS current_counter,
  (
    SELECT COUNT(*)
    FROM blueprint_generator bg
    WHERE bg.user_id = up.user_id
      AND bg.dynamic_questions IS NOT NULL
      AND bg.deleted_at IS NULL
  ) AS should_be
FROM user_profiles up
WHERE up.blueprint_creation_count = 0
  AND EXISTS (
    SELECT 1 FROM blueprint_generator bg
    WHERE bg.user_id = up.user_id
      AND bg.dynamic_questions IS NOT NULL
      AND bg.deleted_at IS NULL
  );
```

3. **Apply the fix** (copy from `scripts/fix-admin-usage-counts.sql`):
```sql
-- Update all counters to match reality
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

4. **Verify**:
```sql
-- Should return 0 rows (no mismatches)
SELECT COUNT(*) AS remaining_mismatches
FROM user_profiles up
WHERE up.blueprint_creation_count != (
  SELECT COUNT(*) FROM blueprint_generator bg
  WHERE bg.user_id = up.user_id
    AND bg.dynamic_questions IS NOT NULL
    AND bg.deleted_at IS NULL
);
```

---

## Why This Happened

This user generated their dynamic questionnaire **before** the recent fix was applied. The old increment function had a bug where:
- Blueprint data was saved successfully ✅
- But counter increment failed silently ❌

**Good news**: The bug is now fixed in the code (using V2 increment functions with fail-closed semantics). This fix only needs to be run **once** to correct historical data.

**Going forward**: All new dynamic questionnaire generations will correctly increment the counter.

---

## Verification

After running the fix, check the user in `/admin/users`:
- ✅ "Gen" column should show: `1 / [limit]`
- ✅ "Saved" column should show: `0 / [limit]`

If the user later generates the final blueprint:
- ✅ "Gen" stays at: `1 / [limit]`
- ✅ "Saved" updates to: `1 / [limit]`

---

## Files Reference

- Full documentation: `docs/USAGE_COUNTER_FIX_COMPLETE.md`
- SQL diagnosis: `scripts/diagnose-single-user-counter.sql`
- SQL fix: `scripts/fix-admin-usage-counts.sql`
- API endpoint: `frontend/app/api/admin/users/fix-counters/route.ts`
