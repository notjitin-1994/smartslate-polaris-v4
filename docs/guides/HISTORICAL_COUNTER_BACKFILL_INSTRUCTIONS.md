# Historical Counter Backfill - Complete Instructions

## 🎯 Goal
Update **ALL user counters** to match **ACTUAL blueprint data** in the database for 100% historical accuracy.

---

## ✅ What This Does

For **every single user** in your database:
1. Counts ACTUAL blueprints with `dynamic_questions IS NOT NULL` (creation count)
2. Counts ACTUAL blueprints with `blueprint_json IS NOT NULL` (saving count)
3. Updates their counters to match these real counts
4. Ignores soft-deleted blueprints (`deleted_at IS NULL`)

**Result**: Counters will be **historically accurate** - showing exactly how many blueprints each user has actually created and saved.

---

## 📋 Step-by-Step Instructions

### Step 1: Open Supabase SQL Editor

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**

### Step 2: Run Diagnosis (See Current State)

Copy and paste this query to see current mismatches:

```sql
-- Show current accuracy state
WITH accuracy_check AS (
  SELECT
    up.user_id,
    up.email,
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
)
SELECT
  COUNT(*) AS total_users,
  COUNT(*) FILTER (
    WHERE counter_creation != actual_creation
       OR counter_saving != actual_saving
  ) AS users_with_mismatches,
  SUM(counter_creation - actual_creation) AS total_creation_delta,
  SUM(counter_saving - actual_saving) AS total_saving_delta
FROM accuracy_check;
```

**Expected Output**: You'll see how many users have incorrect counters

### Step 3: See Sample Mismatches (Optional)

If you want to see which specific users are affected:

```sql
WITH accuracy_check AS (
  SELECT
    up.user_id,
    up.email,
    up.subscription_tier,
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
)
SELECT
  SUBSTRING(user_id::TEXT, 1, 8) || '...' AS user_id_short,
  COALESCE(email, 'no email') AS email,
  subscription_tier AS tier,
  counter_creation || ' → ' || actual_creation AS creation_fix,
  counter_saving || ' → ' || actual_saving AS saving_fix
FROM accuracy_check
WHERE counter_creation != actual_creation
   OR counter_saving != actual_saving
LIMIT 20;
```

### Step 4: Create Safety Backup

**IMPORTANT**: Always create a backup first!

```sql
DROP TABLE IF EXISTS user_profiles_counter_backup_manual CASCADE;

CREATE TABLE user_profiles_counter_backup_manual AS
SELECT
  user_id,
  email,
  blueprint_creation_count,
  blueprint_saving_count,
  updated_at,
  NOW() AS backup_created_at
FROM user_profiles;

-- Verify backup
SELECT
  '✅ Backup created: ' || COUNT(*) || ' users backed up' AS status
FROM user_profiles_counter_backup_manual;
```

### Step 5: Apply the Fix (Update ALL Counters)

**This updates every user** - run this carefully:

```sql
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
  blueprint_usage_metadata = jsonb_set(
    jsonb_set(
      COALESCE(up.blueprint_usage_metadata, '{}'::jsonb),
      '{last_counter_backfill}',
      to_jsonb(NOW()::TEXT)
    ),
    '{backfill_reason}',
    '"Historical accuracy correction - all counters updated"'::jsonb
  ),
  updated_at = NOW();

-- Show result
SELECT
  '✅ Update complete: ' || COUNT(*) || ' users updated' AS status
FROM user_profiles;
```

### Step 6: Verify 100% Accuracy

After the update, verify all counters are now correct:

```sql
WITH accuracy_check AS (
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
)
SELECT
  COUNT(*) AS total_users,
  COUNT(*) FILTER (
    WHERE counter_creation = actual_creation
      AND counter_saving = actual_saving
  ) AS accurate_users,
  COUNT(*) FILTER (
    WHERE counter_creation != actual_creation
       OR counter_saving != actual_saving
  ) AS remaining_mismatches,
  ROUND(
    COUNT(*) FILTER (
      WHERE counter_creation = actual_creation
        AND counter_saving = actual_saving
    )::NUMERIC / NULLIF(COUNT(*), 0) * 100,
    2
  ) AS accuracy_percentage
FROM accuracy_check;
```

**Expected Result**:
- `remaining_mismatches` = **0**
- `accuracy_percentage` = **100.00**

### Step 7: Refresh Admin Page

1. Open `/admin/users` in your browser
2. Hard refresh: **Ctrl+Shift+R** (Windows/Linux) or **Cmd+Shift+R** (Mac)
3. Verify all counters now show correct values

---

## 🔄 If Something Goes Wrong (Rollback)

If you need to restore the backup:

```sql
UPDATE user_profiles up
SET
  blueprint_creation_count = backup.blueprint_creation_count,
  blueprint_saving_count = backup.blueprint_saving_count,
  updated_at = NOW()
FROM user_profiles_counter_backup_manual backup
WHERE up.user_id = backup.user_id;

-- Verify rollback
SELECT 'Rollback complete' AS status;

-- Clean up backup
DROP TABLE user_profiles_counter_backup_manual;
```

---

## 📊 What Gets Updated

### Example User Before Backfill:
- Counter: Generated 4 / Saved 4
- Actual data: 0 blueprints with dynamic_questions, 0 with blueprint_json
- **Status**: INCORRECT ❌

### After Backfill:
- Counter: Generated 0 / Saved 0
- Actual data: 0 blueprints with dynamic_questions, 0 with blueprint_json
- **Status**: CORRECT ✅

---

## ✅ Success Criteria

After running the backfill, you should see:

1. ✅ **0 remaining mismatches** in verification query
2. ✅ **100% accuracy** across all users
3. ✅ Admin page shows historically accurate counts
4. ✅ Every counter matches actual blueprint data

---

## 🎯 Why This Matters

**Historical Accuracy**: Your counters will now show the TRUE history of each user's blueprint activity:
- How many dynamic questionnaires they've actually generated
- How many final blueprints they've actually saved
- Not inflated by bugs or resets
- Perfect for analytics and reporting

**Going Forward**: With the database functions now fixed (migration 20251106040000), all future operations will maintain this accuracy automatically.

---

## 📁 Files Reference

- **SQL Script**: `scripts/backfill-all-counters-historical.sql` (contains all queries above)
- **Migration**: `supabase/migrations/20251106050000_backfill_all_user_counters_historical_accuracy.sql` (automated version)
- **Documentation**: This file

---

## ⏱️ Estimated Time

- **Total time**: 2-5 minutes
- **Step 1-3** (Diagnosis): 30 seconds
- **Step 4** (Backup): 10 seconds
- **Step 5** (Update): 30-60 seconds (depends on user count)
- **Step 6** (Verify): 10 seconds
- **Step 7** (Check UI): 30 seconds

---

## 🆘 Need Help?

If you encounter issues:
1. Check the backup table exists: `SELECT * FROM user_profiles_counter_backup_manual LIMIT 1;`
2. Verify the query syntax is exact (no typos)
3. Ensure you have proper database permissions
4. The backup allows safe rollback if anything unexpected happens

**Safe to run multiple times**: This backfill is idempotent - running it again will just recalculate and set the same correct values.
