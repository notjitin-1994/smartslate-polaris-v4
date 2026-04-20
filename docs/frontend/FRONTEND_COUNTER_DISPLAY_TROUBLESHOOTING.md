# Frontend Counter Display Troubleshooting Guide

## 🎯 Issue

After running the historical backfill, the frontend pages (/ and /my-starmaps) still show incorrect counter values.

**Expected**: Generated 1 / Saved 0
**Showing**: Generated 1 / Saved 1

---

## 📊 How Frontend Gets Counter Data

### Data Flow Chain

```
Frontend Pages (/, /my-starmaps)
  ↓
useUserUsage() Hook
  ↓
/api/user/usage API Endpoint
  ↓
BlueprintUsageService.getBlueprintUsageInfo()
  ↓
RPC: get_blueprint_usage_info(user_id)
  ↓
Reads from: user_profiles.blueprint_creation_count
            user_profiles.blueprint_saving_count
```

**Key Finding**: Frontend reads directly from counter columns in `user_profiles` table via the `get_blueprint_usage_info` database function.

---

## 🔍 Step-by-Step Diagnosis

### Step 1: Verify Database Counters

Open Supabase SQL Editor and run:

```sql
-- Check the actual counter values for your test user
SELECT
  user_id,
  email,
  blueprint_creation_count AS counter_creation,
  blueprint_saving_count AS counter_saving,
  updated_at
FROM user_profiles
WHERE email = 'your-test-user@example.com'; -- Replace with actual email
```

**Expected Result**: Should show `counter_creation: 1` and `counter_saving: 0`

**If counters are WRONG** → Backfill didn't work. Go to Step 6.
**If counters are CORRECT** → Continue to Step 2.

---

### Step 2: Verify RPC Function Returns Correct Data

```sql
-- Test the exact function frontend uses
SELECT * FROM get_blueprint_usage_info('your-user-id-here'::UUID);
```

Replace `your-user-id-here` with the actual user UUID from Step 1.

**Expected Result**: `creation_count: 1` and `saving_count: 0`

**If RPC returns WRONG values** → Database function is broken. Contact support.
**If RPC returns CORRECT values** → Frontend caching issue. Continue to Step 3.

---

### Step 3: Hard Refresh Browser

The most common issue is **browser cache**. Try these in order:

#### Option A: Hard Refresh (Recommended)
1. Open the home page (/) or /my-starmaps
2. Press **Ctrl+Shift+R** (Windows/Linux) or **Cmd+Shift+R** (Mac)
3. Check if counters update

#### Option B: Manual Refresh Button
1. On /my-starmaps page, look for the refresh icon (↻) next to the counters
2. Click the refresh button
3. Check if counters update

#### Option C: Clear Browser Cache Completely
1. Open DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

---

### Step 4: Check API Response in DevTools

1. Open the home page (/)
2. Press F12 to open DevTools
3. Go to **Network** tab
4. Filter for "usage" or refresh the page
5. Find the request to `/api/user/usage`
6. Click on it and view the **Response** tab

**Check the response JSON**:
```json
{
  "success": true,
  "usage": {
    "creationCount": 1,   // Should be 1
    "savingCount": 1,     // Should be 0 ❌
    ...
  }
}
```

**If API returns wrong values** → Database issue. Go to Step 6.
**If API returns correct values** → React state issue. Go to Step 5.

---

### Step 5: Force Frontend State Refresh

Open browser console (F12 → Console tab) and run:

```javascript
// Force refresh usage data
localStorage.setItem('blueprint_operation_completed', Date.now());
window.dispatchEvent(new StorageEvent('storage', {
  key: 'blueprint_operation_completed',
  newValue: Date.now().toString()
}));

// Then manually refresh
window.location.reload();
```

---

### Step 6: Manual Database Fix (If Counters Are Wrong)

If Step 1 showed wrong counters, re-run the backfill for the specific user:

```sql
-- Fix counters for one user
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
    '"Manual fix after backfill verification"'::jsonb
  ),
  updated_at = NOW()
WHERE user_id = 'your-user-id-here'::UUID;

-- Verify the fix
SELECT * FROM get_blueprint_usage_info('your-user-id-here'::UUID);
```

Then go back to Step 3 (hard refresh).

---

### Step 7: Check All Users Were Backfilled

```sql
-- Verify backfill ran for all users
SELECT
  COUNT(*) AS total_users,
  COUNT(*) FILTER (
    WHERE blueprint_usage_metadata->>'last_counter_backfill' IS NOT NULL
  ) AS users_backfilled,
  MAX((blueprint_usage_metadata->>'last_counter_backfill')::TIMESTAMPTZ) AS most_recent_backfill
FROM user_profiles;
```

**If users_backfilled = 0** → Backfill migration was never executed!
**Solution**: Run migration `20251106050000_backfill_all_user_counters_historical_accuracy.sql` or the manual script.

---

## 🎯 Quick Fix Summary

**90% of cases**: Hard refresh (Ctrl+Shift+R) solves the issue.

**If that doesn't work**:
1. Check database counters are correct (Step 1)
2. If database wrong → Re-run backfill (Step 6)
3. If database correct → Clear all browser cache (Step 3C)
4. If still wrong → Check API response in DevTools (Step 4)

---

## 🔧 Common Issues and Solutions

### Issue 1: "Backfill ran but counters still wrong"

**Cause**: Backfill script had syntax error or was rolled back
**Solution**: Re-run the backfill using the corrected script in `scripts/backfill-all-counters-historical.sql`

### Issue 2: "API returns correct values but UI shows wrong"

**Cause**: Browser cache or React component not re-rendering
**Solution**:
1. Clear browser cache completely
2. Click the manual refresh button (↻) on /my-starmaps page
3. Close and reopen the browser

### Issue 3: "Database counters are correct but get_blueprint_usage_info returns wrong values"

**Cause**: Database function not updated to latest version
**Solution**: Verify migration `20251106010000_fix_get_blueprint_usage_info_use_counters.sql` was applied

### Issue 4: "Only some users show wrong counters"

**Cause**: Backfill ran partially or user was added after backfill
**Solution**: Run the manual fix query (Step 6) for affected users

---

## 📝 Files Reference

- **Verification Script**: `scripts/verify-frontend-counter-display.sql`
- **Backfill Migration**: `supabase/migrations/20251106050000_backfill_all_user_counters_historical_accuracy.sql`
- **Backfill Manual Script**: `scripts/backfill-all-counters-historical.sql`
- **RPC Function Fix**: `supabase/migrations/20251106010000_fix_get_blueprint_usage_info_use_counters.sql`

---

## ✅ Success Criteria

After following this guide, you should see:

1. ✅ Database counters match actual blueprint data (Step 1)
2. ✅ RPC function returns correct values (Step 2)
3. ✅ API endpoint returns correct values (Step 4)
4. ✅ Frontend displays correct values after hard refresh (Step 3)

---

## 🆘 Still Not Working?

If you've completed all steps and the issue persists:

1. **Check browser DevTools Console** for any JavaScript errors
2. **Verify user authentication** - Log out and log back in
3. **Test with a different browser** to rule out browser-specific cache
4. **Check database logs** in Supabase Dashboard for any errors

**Most likely remaining issue**: Service worker cache or CDN cache (if using)
- Clear service worker in DevTools → Application → Service Workers → Unregister
- Wait 5-10 minutes for CDN cache to expire if using Vercel/Netlify
