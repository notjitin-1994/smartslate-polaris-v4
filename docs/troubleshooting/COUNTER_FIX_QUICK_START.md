# Counter Bug Fix - Quick Start Guide

## 🎯 Goal
Fix **ALL user counters** to be **historically accurate** - matching actual blueprint data for every user.

---

## ⚡ Quick Start (5 Minutes)

### Step 1: Open Supabase SQL Editor
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** → **New Query**

### Step 2: Run the Backfill
Copy the entire contents of `scripts/backfill-all-counters-historical.sql` and run it step-by-step.

**Or use this simplified version**:

```sql
-- 1. Create backup (REQUIRED)
DROP TABLE IF EXISTS user_profiles_counter_backup_manual CASCADE;
CREATE TABLE user_profiles_counter_backup_manual AS
SELECT * FROM user_profiles;

-- 2. Update ALL counters to match reality
UPDATE user_profiles up
SET
  blueprint_creation_count = (
    SELECT COUNT(*)::INTEGER
    FROM blueprint_generator bg
    WHERE bg.user_id = up.user_id
      AND bg.dynamic_questions IS NOT NULL
      AND bg.deleted_at IS NULL
  ),
  blueprint_saving_count = (
    SELECT COUNT(*)::INTEGER
    FROM blueprint_generator bg
    WHERE bg.user_id = up.user_id
      AND bg.blueprint_json IS NOT NULL
      AND bg.deleted_at IS NULL
  ),
  updated_at = NOW();

-- 3. Verify (should show 0 mismatches)
WITH accuracy_check AS (
  SELECT
    up.user_id,
    up.blueprint_creation_count AS counter,
    (SELECT COUNT(*) FROM blueprint_generator bg
     WHERE bg.user_id = up.user_id
       AND bg.dynamic_questions IS NOT NULL
       AND bg.deleted_at IS NULL) AS actual
  FROM user_profiles up
)
SELECT COUNT(*) FILTER (WHERE counter != actual) AS remaining_mismatches
FROM accuracy_check;
```

### Step 3: Refresh Pages to See Updated Counters
1. Open home page (`/`) or `/my-starmaps` in browser
2. Hard refresh: **Ctrl+Shift+R** (Windows/Linux) or **Cmd+Shift+R** (Mac)
3. Or click the refresh button (↻) next to counters on /my-starmaps page
4. Verify counters now show correct values

**If counters still show wrong values after refresh**:
- See `docs/FRONTEND_COUNTER_DISPLAY_TROUBLESHOOTING.md` for complete diagnosis guide
- Most common fix: Clear browser cache completely (DevTools → Right-click refresh → "Empty Cache and Hard Reload")

---

## ✅ What Got Fixed

### Two Critical Bugs

**Bug #1**: Database Functions (✅ Fixed in migration 20251106040000)
- `increment_blueprint_creation_count_v2` was resetting BOTH counters
- `increment_blueprint_saving_count_v2` was resetting BOTH counters
- Now each function only touches its own counter

**Bug #2**: Historical Data (⏳ You need to run the backfill)
- Existing counters are out of sync due to Bug #1
- Backfill will reset ALL counters to match actual data
- Going forward, counters will stay accurate automatically

---

## 📊 Expected Results

**Before Backfill**:
| User | Counter Shows | Actual Data | Status |
|------|---------------|-------------|--------|
| User A | Gen 4 / Saved 4 | Gen 0 / Saved 0 | ❌ Wrong |
| User B | Gen 1 / Saved 1 | Gen 1 / Saved 0 | ❌ Wrong |

**After Backfill**:
| User | Counter Shows | Actual Data | Status |
|------|---------------|-------------|--------|
| User A | Gen 0 / Saved 0 | Gen 0 / Saved 0 | ✅ Correct |
| User B | Gen 1 / Saved 0 | Gen 1 / Saved 0 | ✅ Correct |

---

## 📚 Full Documentation

- **Step-by-step guide**: `docs/HISTORICAL_COUNTER_BACKFILL_INSTRUCTIONS.md`
- **Technical details**: `docs/COUNTER_INCREMENT_BUG_FIX.md`
- **SQL script**: `scripts/backfill-all-counters-historical.sql`

---

## 🆘 Rollback (If Needed)

```sql
UPDATE user_profiles up
SET
  blueprint_creation_count = backup.blueprint_creation_count,
  blueprint_saving_count = backup.blueprint_saving_count
FROM user_profiles_counter_backup_manual backup
WHERE up.user_id = backup.user_id;
```

---

## ✅ Success Criteria

After running the backfill:
- ✅ 0 remaining mismatches in verification query
- ✅ Admin page shows historically accurate counts
- ✅ Every counter matches actual blueprint data
- ✅ 100% accuracy across all users
