# Counter-Based Blueprint Tracking - Test Plan

**Date**: 2025-11-06
**Purpose**: Comprehensive testing guide for counter-based blueprint usage tracking system
**Related Migration**: `20251106000000_enforce_counter_based_tracking.sql`

## Overview

This test plan verifies that the counter-based tracking system works correctly with:
- ✅ No double-counting of blueprint creations
- ✅ Correct increment timing (dynamic questions = creation, final blueprint = saving)
- ✅ Monthly rollover for paid tiers
- ✅ Lifetime counters for free tier
- ✅ Fail-closed semantics (deny on error)
- ✅ Atomic operations with advisory locks

## Prerequisites

1. **Database Migration Applied**:
   ```bash
   cd /home/jitin-m-nair/Desktop/polaris-v3
   npm run db:push  # Apply migration 20251106000000
   ```

2. **Code Changes Applied**:
   - `/api/questionnaire/save/route.ts` - Removed double-counting blocks
   - Migration creates `audit_counter_accuracy()` function

3. **Test Users**:
   - Free tier user (explorer): For lifetime counter testing
   - Paid tier user (navigator/voyager): For monthly rollover testing
   - Developer user: For exemption testing

## Test Categories

### 1. Single Blueprint Creation Journey (No Double-Counting)

**Objective**: Verify creation count increments ONLY when dynamic questions are generated.

#### Test 1.1: Free Tier User - Complete Blueprint Creation

**Steps**:
1. Create test user with `subscription_tier = 'explorer'`
2. Set initial counters: `blueprint_creation_count = 0`, `blueprint_saving_count = 0`
3. Save static questionnaire via `/api/questionnaire/save`
4. Check counters (should be `0, 0`)
5. Generate dynamic questions via `/api/generate-dynamic-questions`
6. Check counters (should be `1, 0`) ✅ **Creation incremented**
7. Save dynamic questionnaire answers
8. Generate final blueprint via `/api/blueprints/generate`
9. Check counters (should be `1, 1`) ✅ **Saving incremented**

**SQL Verification**:
```sql
-- Check counter values
SELECT
  user_id,
  blueprint_creation_count,
  blueprint_saving_count,
  subscription_tier
FROM user_profiles
WHERE user_id = '<test_user_id>';

-- Audit counter accuracy
SELECT * FROM audit_counter_accuracy('<test_user_id>');

-- Expected output:
-- metric                      | counter_value | actual_db_count | difference | status
-- blueprint_creation_count    | 1             | 1               | 0          | MATCH
-- blueprint_saving_count      | 1             | 1               | 0          | MATCH
```

**Expected Result**: Counters match actual database records, no double-counting.

---

### 2. Monthly Rollover System (Paid Tiers)

**Objective**: Verify monthly counters reset correctly for paid tiers while preserving rollover history.

#### Test 2.1: Navigator Tier - Monthly Reset

**Setup**:
1. Create paid tier user: `subscription_tier = 'navigator'`
2. Set billing dates:
   ```sql
   UPDATE user_profiles
   SET billing_cycle_start_date = NOW() - INTERVAL '1 month',
       next_billing_cycle_date = NOW() + INTERVAL '1 day'
   WHERE user_id = '<test_user_id>';
   ```
3. Create some blueprints: `blueprint_creation_count = 3`, `blueprint_saving_count = 2`

**Steps**:
1. Check current counters (should be `3, 2`)
2. Manually trigger monthly reset (simulates cron job):
   ```sql
   SELECT * FROM reset_all_monthly_limits();
   ```
3. Check counters after reset (should be `0, 0` for new month)
4. Check `rollover_history` JSONB column (should contain previous month's data)
5. Create new blueprint in new billing cycle
6. Verify counter increments from 0 → 1

**Expected Result**:
- Counters reset to 0 at billing cycle boundary
- Previous month's data preserved in `rollover_history`
- New increments work correctly from 0

**SQL Verification**:
```sql
-- Check rollover history
SELECT
  user_id,
  subscription_tier,
  blueprint_creation_count,
  blueprint_saving_count,
  rollover_history,
  billing_cycle_start_date,
  next_billing_cycle_date
FROM user_profiles
WHERE user_id = '<test_user_id>';

-- Rollover history should be array of objects like:
-- [
--   {
--     "month": "2025-10",
--     "creation_count": 3,
--     "saving_count": 2,
--     "reset_at": "2025-11-06T..."
--   }
-- ]
```

---

### 3. Free Tier Carryover (Upgrade Scenario)

**Objective**: Verify unused free tier limits carry over for 12 months after upgrade.

#### Test 3.1: Upgrade from Free to Navigator

**Setup**:
1. Create free tier user with partial usage:
   ```sql
   INSERT INTO user_profiles (user_id, subscription_tier, blueprint_creation_count, blueprint_saving_count, blueprint_creation_limit, blueprint_saving_limit)
   VALUES ('<test_user_id>', 'explorer', 1, 0, 2, 2);
   ```

**Steps**:
1. Check initial state: `creation: 1/2, saving: 0/2`
2. Upgrade to Navigator tier:
   ```sql
   SELECT handle_tier_upgrade('<test_user_id>', 'navigator');
   ```
3. Check `free_tier_carryover_data`:
   ```sql
   SELECT
     free_tier_carryover_data,
     free_tier_carryover_expires_at,
     upgraded_from_free_tier
   FROM user_profiles
   WHERE user_id = '<test_user_id>';
   ```
4. Verify carryover calculation:
   - `creation_carryover` = 1 (unused: 2 - 1)
   - `saving_carryover` = 2 (unused: 2 - 0)
   - Expires 12 months from now

**Expected Result**:
- Carryover correctly calculated as (limit - used)
- Expiration date set to 12 months from upgrade
- `upgraded_from_free_tier = true`

---

### 4. Limit Enforcement (Fail-Closed)

**Objective**: Verify system denies operations when limits are exceeded.

#### Test 4.1: Creation Limit Exceeded

**Setup**:
1. Create user at limit: `creation_count = 2`, `creation_limit = 2`

**Steps**:
1. Attempt to generate dynamic questions via API
2. Verify API returns 429 status with limit exceeded message
3. Check that counter does NOT increment (still at 2)
4. Verify blueprint record was NOT created or was rolled back

**Expected API Response**:
```json
{
  "error": "Blueprint creation limit exceeded",
  "details": "You have reached your monthly limit of 2 blueprint generations",
  "upgradeUrl": "/pricing"
}
```

**SQL Verification**:
```sql
-- Counter should NOT have incremented
SELECT blueprint_creation_count FROM user_profiles WHERE user_id = '<test_user_id>';
-- Should still be 2

-- No new blueprint should exist
SELECT COUNT(*) FROM blueprint_generator
WHERE user_id = '<test_user_id>'
  AND dynamic_questions IS NOT NULL;
-- Count should match counter (2)
```

---

### 5. Concurrent Request Handling (Race Conditions)

**Objective**: Verify advisory locks prevent race conditions during concurrent increments.

#### Test 5.1: Simultaneous Blueprint Creations

**Setup**:
1. Create user: `creation_count = 0`, `creation_limit = 2`

**Steps**:
1. Simulate 3 concurrent requests to generate dynamic questions (using parallel API calls)
2. Verify only 2 succeed (third fails with limit exceeded)
3. Check counter value (should be exactly 2, not 3)

**Test Script** (Node.js):
```javascript
// Simulate concurrent requests
const promises = [
  fetch('/api/generate-dynamic-questions', { method: 'POST', body: data1 }),
  fetch('/api/generate-dynamic-questions', { method: 'POST', body: data2 }),
  fetch('/api/generate-dynamic-questions', { method: 'POST', body: data3 }),
];

const results = await Promise.all(promises);
const successes = results.filter(r => r.status === 200);
const failures = results.filter(r => r.status === 429);

console.assert(successes.length === 2, 'Expected 2 successes');
console.assert(failures.length === 1, 'Expected 1 failure');
```

**Expected Result**: Advisory locks ensure atomic increments, preventing double-counting even under concurrent load.

---

### 6. Exemption System

**Objective**: Verify exempt users bypass limits correctly.

#### Test 6.1: Developer Exemption

**Setup**:
1. Create user with developer exemption:
   ```sql
   SELECT exempt_user_from_blueprint_limits('<test_user_id>', 'Developer access');
   ```

**Steps**:
1. Verify `blueprint_usage_metadata->>'exempt_from_limits' = true`
2. Set artificial high usage: `creation_count = 999`
3. Attempt to create new blueprint
4. Verify operation succeeds despite "exceeding" limits
5. Check that counter still increments (for analytics)

**Expected Result**: Exempt users can create unlimited blueprints, counters still track for analytics.

---

### 7. Error Handling (Fail-Closed Semantics)

**Objective**: Verify system denies operations on any error condition.

#### Test 7.1: Database Connection Failure

**Simulation**:
1. Mock Supabase client to return error
2. Attempt blueprint creation
3. Verify operation is denied (fail-closed)

**Expected Behavior**:
```typescript
// In incrementCreationCountV2
if (error) {
  return {
    success: false,
    reason: 'System error - unable to verify limits',
    newCount: 0
  };
}
```

---

### 8. Counter Accuracy Audit

**Objective**: Verify counters match actual database records.

#### Test 8.1: Run Audit for All Users

**SQL Script**:
```sql
-- Audit all users
SELECT
  up.user_id,
  up.subscription_tier,
  acc.*
FROM user_profiles up
CROSS JOIN LATERAL audit_counter_accuracy(up.user_id) acc
WHERE acc.status != 'MATCH';

-- Should return 0 rows (all counters match)
```

**If Mismatches Found**:
```sql
-- For specific user, inspect blueprints
SELECT
  id,
  user_id,
  status,
  dynamic_questions IS NOT NULL as has_dynamic_questions,
  blueprint_json IS NOT NULL as has_blueprint,
  created_at,
  updated_at
FROM blueprint_generator
WHERE user_id = '<user_with_mismatch>'
ORDER BY created_at DESC;
```

---

## Automated Test Suite

### Integration Tests

Create test file: `frontend/__tests__/integration/blueprintCounters.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { createClient } from '@/lib/supabase/server';

describe('Blueprint Counter System', () => {
  let testUserId: string;
  let supabase: any;

  beforeEach(async () => {
    // Setup test user
    supabase = await createClient();
    // ... setup code
  });

  it('should NOT increment counter when saving static questionnaire', async () => {
    const initialCount = await getCreationCount(testUserId);

    await fetch('/api/questionnaire/save', {
      method: 'POST',
      body: JSON.stringify({ staticAnswers: mockData }),
    });

    const finalCount = await getCreationCount(testUserId);
    expect(finalCount).toBe(initialCount); // No increment
  });

  it('should increment counter when generating dynamic questions', async () => {
    const initialCount = await getCreationCount(testUserId);

    await fetch('/api/generate-dynamic-questions', {
      method: 'POST',
      body: JSON.stringify({ blueprintId: mockId }),
    });

    const finalCount = await getCreationCount(testUserId);
    expect(finalCount).toBe(initialCount + 1); // Incremented
  });

  it('should increment saving counter when generating blueprint', async () => {
    const initialCount = await getSavingCount(testUserId);

    await fetch('/api/blueprints/generate', {
      method: 'POST',
      body: JSON.stringify({ blueprintId: mockId }),
    });

    const finalCount = await getSavingCount(testUserId);
    expect(finalCount).toBe(initialCount + 1); // Incremented
  });

  it('should deny creation when limit exceeded', async () => {
    // Set user to limit
    await setCounterAtLimit(testUserId, 'creation');

    const response = await fetch('/api/generate-dynamic-questions', {
      method: 'POST',
      body: JSON.stringify({ blueprintId: mockId }),
    });

    expect(response.status).toBe(429);
    const data = await response.json();
    expect(data.error).toContain('limit exceeded');
  });
});
```

---

## Performance Benchmarks

### Expected Performance

1. **Counter Increment**: < 50ms (includes advisory lock acquisition)
2. **Limit Check**: < 20ms (single query with row lock)
3. **Audit Function**: < 100ms per user (two queries)

### Load Testing

```bash
# Simulate 100 concurrent requests
npm run test:load -- --requests=100 --concurrency=10 --endpoint=/api/generate-dynamic-questions
```

**Metrics to Track**:
- Request success rate (should be based on actual limits, not errors)
- Counter accuracy (no over-increments)
- Lock contention (wait times)

---

## Rollback Plan

If critical issues are found:

```sql
-- Rollback migration
BEGIN;

-- Restore database query functions from 20251029000000
-- (Copy from that migration file)

-- Revert get_effective_limits changes
-- (Use previous version)

COMMIT;
```

Then revert code changes:
```bash
git checkout HEAD~1 frontend/app/api/questionnaire/save/route.ts
```

---

## Success Criteria

✅ **All tests pass** with no double-counting
✅ **Counters match database records** (audit returns all MATCH)
✅ **Monthly rollover works** for paid tiers
✅ **Free tier remains lifetime** counters
✅ **Limits enforced** with 429 responses
✅ **Concurrent requests** handled correctly with advisory locks
✅ **Performance** meets benchmarks
✅ **UX displays** correct counter values

---

## Notes

- Counter-based system is now THE source of truth
- Database queries (get_actual_*) have been removed
- Fail-closed semantics ensure security
- Advisory locks prevent race conditions
- Audit function available for debugging
- Rollover history preserved for 12 months
- Carryover expires 12 months after upgrade

---

## Related Files

- Migration: `supabase/migrations/20251106000000_enforce_counter_based_tracking.sql`
- Service: `frontend/lib/services/blueprintUsageService.ts`
- API Routes:
  - `frontend/app/api/questionnaire/save/route.ts` (modified)
  - `frontend/app/api/generate-dynamic-questions/route.ts` (unchanged)
  - `frontend/app/api/blueprints/generate/route.ts` (unchanged)
- UX: `frontend/components/settings/UsageSection.tsx`
