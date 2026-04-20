# Tier Limits and Monthly Rollover System

**Migration:** `20251028000000_implement_monthly_rollover_limits.sql`
**Last Updated:** 2025-10-28
**Status:** ✅ Implemented

## Overview

SmartSlate Polaris v3 implements a sophisticated tier-based limit system with monthly rollover tracking. The system ensures:

1. **Free Tier**: Lifetime limits (2 generations + 2 saves, no resets)
2. **Paid Tiers**: Monthly limits with automatic resets and 12-month rollover history
3. **Free→Paid Upgrade**: Automatic carryover of unused free tier limits for 12 months
4. **Backend Enforcement**: All limits enforced at the database level with automatic reset handling

---

## Tier Limits Summary

| Tier | Type | Generations/Month | Saves/Month | Reset Policy |
|------|------|-------------------|-------------|--------------|
| **Free** | Personal | 2 (lifetime) | 2 (lifetime) | No reset |
| **Explorer** | Personal | 5 | 5 | Monthly + 12mo rollover |
| **Navigator** | Personal | 20 | 20 | Monthly + 12mo rollover |
| **Voyager** | Personal | 40 | 40 | Monthly + 12mo rollover |
| **Crew** | Team | 10/user | 10/user | Monthly + 12mo rollover |
| **Fleet** | Team | 30/user | 30/user | Monthly + 12mo rollover |
| **Armada** | Team | 60/user | 60/user | Monthly + 12mo rollover |
| **Developer** | Special | Unlimited | Unlimited | N/A |

---

## Database Schema

### New Columns in `user_profiles`

```sql
-- Billing cycle tracking
billing_cycle_start_date      TIMESTAMPTZ    -- When current billing period started
next_billing_cycle_date       TIMESTAMPTZ    -- When limits will reset

-- Free tier carryover tracking
upgraded_from_free_tier       BOOLEAN        -- User was upgraded from free
free_tier_carryover_expires_at TIMESTAMPTZ   -- When carryover expires (12 months)
free_tier_carryover_data      JSONB          -- Carryover amounts

-- Monthly usage tracking
current_month_creation_count  INTEGER        -- This month's generations
current_month_saving_count    INTEGER        -- This month's saves

-- Rollover history (last 12 months)
rollover_history              JSONB          -- Array of monthly usage records
```

### `free_tier_carryover_data` Structure

```json
{
  "creation_carryover": 2,              // Unused free generations
  "saving_carryover": 1,                // Unused free saves
  "initial_free_creation_count": 0,     // Usage at upgrade time
  "initial_free_saving_count": 1,       // Usage at upgrade time
  "upgrade_date": "2025-10-28T10:30:00Z"
}
```

### `rollover_history` Structure

```json
[
  {
    "month": "2025-10",
    "creation_count": 18,
    "saving_count": 15,
    "billing_cycle_end": "2025-11-01T00:00:00Z"
  },
  {
    "month": "2025-09",
    "creation_count": 20,
    "saving_count": 20,
    "billing_cycle_end": "2025-10-01T00:00:00Z"
  }
  // ... up to 12 months
]
```

---

## Database Functions

### Core Limit Functions

#### `get_effective_limits(p_user_id UUID)`

**Purpose:** Calculate current limits with rollover and carryover applied
**Auto-triggers:** Monthly reset if needed

**Returns:**
```sql
creation_limit      INTEGER  -- Total allowed this month (base + carryover)
saving_limit        INTEGER  -- Total allowed this month (base + carryover)
creation_used       INTEGER  -- Used this month
saving_used         INTEGER  -- Used this month
creation_available  INTEGER  -- Remaining this month
saving_available    INTEGER  -- Remaining this month
```

**Example:**
```sql
-- Free tier user (never resets)
SELECT * FROM get_effective_limits('user-uuid');
-- Returns: { creation_limit: 2, saving_limit: 2, creation_used: 1, ... }

-- Navigator tier user with carryover (2 unused from free tier)
SELECT * FROM get_effective_limits('user-uuid');
-- Returns: { creation_limit: 22, saving_limit: 22, creation_used: 10, ... }
```

---

#### `check_blueprint_creation_limits(p_user_id UUID)`

**Purpose:** Check if user can create a new blueprint
**Auto-triggers:** Monthly reset via `get_effective_limits()`

**Returns:**
```sql
can_create      BOOLEAN
current_count   INTEGER
limit_count     INTEGER
remaining       INTEGER
reason          TEXT
```

**Example:**
```sql
SELECT * FROM check_blueprint_creation_limits('user-uuid');
-- Returns: { can_create: true, current_count: 5, limit_count: 20, remaining: 15, reason: 'Blueprint creation allowed' }
```

---

#### `check_blueprint_saving_limits(p_user_id UUID)`

**Purpose:** Check if user can save a blueprint
**Auto-triggers:** Monthly reset via `get_effective_limits()`

**Returns:** Same structure as `check_blueprint_creation_limits`

---

### Usage Tracking Functions

#### `increment_blueprint_creation_count(p_user_id UUID)`

**Purpose:** Increment creation counter (called when blueprint created)
**Returns:** `BOOLEAN` - `TRUE` if incremented, `FALSE` if limit reached

**Behavior:**
- Free tier: Increments `blueprint_creation_count` (cumulative, never resets)
- Paid tier: Increments both `current_month_creation_count` and `blueprint_creation_count`
- Developer: Always returns `TRUE` (unlimited)

**Example:**
```typescript
const canIncrement = await supabase.rpc('increment_blueprint_creation_count', {
  p_user_id: userId
});

if (!canIncrement) {
  return { error: 'Limit reached' };
}
```

---

#### `increment_blueprint_saving_count(p_user_id UUID)`

**Purpose:** Increment saving counter (called when blueprint saved)
**Returns:** `BOOLEAN` - `TRUE` if incremented, `FALSE` if limit reached

**Behavior:** Same as `increment_blueprint_creation_count` but for saves

---

### Tier Management Functions

#### `handle_tier_upgrade(p_user_id UUID, p_new_tier TEXT)`

**Purpose:** Handle tier changes with automatic free tier carryover
**Returns:** `VOID`

**Behavior:**

1. **Free → Paid Upgrade:**
   - Calculate unused allowances: `max(0, 2 - current_usage)`
   - Set `upgraded_from_free_tier = TRUE`
   - Set `free_tier_carryover_expires_at = NOW() + 12 months`
   - Store carryover amounts in `free_tier_carryover_data`
   - Reset billing cycle to current date
   - Reset monthly counters to 0

2. **Paid → Paid Change:**
   - Update `subscription_tier`
   - Keep existing billing cycle and counters

3. **Any → Free Downgrade:**
   - Update `subscription_tier = 'free'`
   - Clear carryover data
   - Switch to cumulative counters

**Example:**
```sql
-- Upgrade user from free to navigator
SELECT handle_tier_upgrade('user-uuid', 'navigator');

-- User had used 1 generation and 0 saves on free tier
-- Result: Navigator tier (20/month) + 1 creation carryover + 2 saving carryover
-- Effective limits for next 12 months: 21 creations/month, 22 saves/month
```

---

### Monthly Reset Functions

#### `should_reset_monthly_limits(p_user_id UUID)`

**Purpose:** Check if user needs monthly reset
**Returns:** `BOOLEAN`

**Logic:**
- Free tier: Always returns `FALSE` (no resets)
- Paid tier: Returns `TRUE` if `NOW() >= next_billing_cycle_date`

---

#### `reset_monthly_limits(p_user_id UUID)`

**Purpose:** Perform monthly reset for a single user
**Returns:** `VOID`

**Behavior:**

1. Add current month to `rollover_history` (keeps last 12 months)
2. Check if free tier carryover has expired (12 months passed)
   - If expired: Clear carryover data and flag
3. Reset `current_month_creation_count = 0`
4. Reset `current_month_saving_count = 0`
5. Update `billing_cycle_start_date = next_billing_cycle_date`
6. Update `next_billing_cycle_date = next_billing_cycle_date + 1 month`

**Called by:** `get_effective_limits()` automatically when needed

---

#### `reset_all_monthly_limits()`

**Purpose:** Reset all users who need it (run as scheduled job)
**Returns:**
```sql
users_processed  INTEGER  -- Total users checked
users_reset      INTEGER  -- Users who were reset
```

**Usage:** Call this function once daily via cron job or Supabase scheduled function

**Example:**
```sql
-- Run as daily cron job
SELECT * FROM reset_all_monthly_limits();
-- Returns: { users_processed: 150, users_reset: 42 }
```

---

## API Integration

### BlueprintUsageService Methods

#### Existing Methods (Updated)

```typescript
// Check if user can create (uses new database functions)
const canCreate = await BlueprintUsageService.canCreateBlueprint(supabase, userId);
// Returns: { canCreate: boolean, reason?: string }

// Check if user can save (uses new database functions)
const canSave = await BlueprintUsageService.canSaveBlueprint(supabase, userId);
// Returns: { canSave: boolean, reason?: string }

// Increment creation count (uses updated database function)
const success = await BlueprintUsageService.incrementCreationCount(supabase, userId);
// Returns: boolean

// Increment saving count (uses updated database function)
const success = await BlueprintUsageService.incrementSavingCount(supabase, userId);
// Returns: boolean
```

#### New Methods

```typescript
// Get effective limits with rollover/carryover
const limits = await BlueprintUsageService.getEffectiveLimits(supabase, userId);
// Returns: {
//   creationLimit: 22,
//   savingLimit: 22,
//   creationUsed: 10,
//   savingUsed: 8,
//   creationAvailable: 12,
//   savingAvailable: 14
// }

// Get comprehensive user info
const info = await BlueprintUsageService.getComprehensiveUserLimits(supabase, userId);
// Returns: {
//   role: 'user',
//   tier: 'navigator',
//   maxGenerationsMonthly: 22,
//   maxSavedStarmaps: 22,
//   currentGenerations: 10,
//   currentSavedStarmaps: 8,
//   generationsRemaining: 12,
//   savedRemaining: 14,
//   isExempt: false,
//   hasFreeTierCarryover: true,
//   carryoverExpiresAt: '2026-10-28T10:30:00Z'
// }

// Handle tier upgrade
await BlueprintUsageService.handleTierUpgrade(supabase, userId, 'navigator');

// Reset all users (admin/cron only)
const result = await BlueprintUsageService.resetAllMonthlyLimits(supabase);
// Returns: { usersProcessed: 150, usersReset: 42 }
```

---

### API Endpoints

#### Existing Endpoints (Already Enforce Limits)

**`POST /api/questionnaire/save`**
- Checks creation limits before creating new blueprint
- Increments creation count after successful creation
- Returns 429 status if limit exceeded

**`POST /api/blueprints/generate`**
- Checks saving limits before generating
- Increments saving count after successful save
- Returns 429 status if limit exceeded

#### New Admin Endpoint

**`POST /api/admin/upgrade-tier`**

**Purpose:** Upgrade user's subscription tier (Admin/Developer only)

**Request:**
```json
{
  "userId": "uuid",
  "newTier": "navigator"
}
```

**Response (Free → Paid):**
```json
{
  "success": true,
  "message": "Successfully upgraded from free to navigator tier. Free tier limits have been carried over for 12 months.",
  "carryoverInfo": {
    "creationCarryover": 2,
    "savingCarryover": 1,
    "expiresAt": "2026-10-28T10:30:00Z"
  }
}
```

**Response (Paid → Paid):**
```json
{
  "success": true,
  "message": "Successfully changed tier from explorer to navigator"
}
```

**Error Responses:**
- `401`: Unauthorized (not logged in)
- `403`: Forbidden (not admin/developer)
- `404`: User not found
- `500`: Internal server error

---

## Usage Scenarios

### Scenario 1: Free Tier User (Lifetime Limits)

**User:** Jane Doe
**Tier:** Free
**Limits:** 2 generations (lifetime), 2 saves (lifetime)

**Timeline:**
1. **Oct 1**: Creates blueprint #1 → `blueprint_creation_count = 1`
2. **Oct 15**: Creates blueprint #2 → `blueprint_creation_count = 2`
3. **Oct 20**: Tries to create blueprint #3 → ❌ **BLOCKED** (limit reached)
4. **Nov 1**: Still blocked (no monthly reset for free tier)
5. **Dec 1**: Still blocked (lifetime limit applies)

**Remaining:** 0 generations, 2 saves (until first save)

---

### Scenario 2: Navigator Tier User (Monthly Reset)

**User:** John Smith
**Tier:** Navigator
**Limits:** 20 generations/month, 20 saves/month

**Timeline:**
1. **Oct 1**: Billing cycle starts
2. **Oct 1-30**: Creates 18 blueprints → `current_month_creation_count = 18`
3. **Oct 31**: Creates 2 more blueprints → `current_month_creation_count = 20`
4. **Oct 31**: Tries to create another → ❌ **BLOCKED** (monthly limit)
5. **Nov 1 00:00**: Auto-reset triggered
   - Oct data saved to `rollover_history`
   - `current_month_creation_count = 0`
   - `next_billing_cycle_date = Dec 1`
6. **Nov 1 00:01**: Can create again ✅ (new month)

**Rollover History:** Keeps last 12 months for analytics

---

### Scenario 3: Free → Navigator Upgrade with Carryover

**User:** Alice Johnson
**Initial Tier:** Free
**Upgrade To:** Navigator
**Free Tier Usage:** 0 generations used, 1 save used

**Carryover Calculation:**
- Creation carryover: `max(0, 2 - 0) = 2`
- Saving carryover: `max(0, 2 - 1) = 1`

**Result:**
- Base Navigator limits: 20 generations/month, 20 saves/month
- **Effective limits for next 12 months:**
  - Generations: 20 + 2 = **22/month**
  - Saves: 20 + 1 = **21/month**

**Timeline:**
1. **Oct 28**: Upgrade from free → navigator
   - `upgraded_from_free_tier = TRUE`
   - `free_tier_carryover_expires_at = Oct 28, 2026`
   - `free_tier_carryover_data = { creation_carryover: 2, saving_carryover: 1 }`
   - `billing_cycle_start_date = Oct 28, 2025`
   - `next_billing_cycle_date = Nov 28, 2025`
   - `current_month_creation_count = 0` (reset on upgrade)

2. **Oct 28 - Nov 27**: Can create up to 22 blueprints, save up to 21

3. **Nov 28**: Monthly reset
   - Oct 28-Nov 27 usage moved to `rollover_history`
   - `current_month_creation_count = 0`
   - Still has carryover (22/month total)

4. **Oct 28, 2026**: Carryover expires
   - `upgraded_from_free_tier = FALSE`
   - `free_tier_carryover_data` cleared
   - Effective limits revert to base: 20/month, 20/month

---

### Scenario 4: Developer Role (Unlimited)

**User:** not.jitin@gmail.com
**Role:** Developer
**Tier:** Any (doesn't matter)

**Behavior:**
- `canCreateBlueprint()` → Always returns `TRUE`
- `canSaveBlueprint()` → Always returns `TRUE`
- `incrementCreationCount()` → Always returns `TRUE` (still increments for tracking)
- `incrementSavingCount()` → Always returns `TRUE` (still increments for tracking)
- Limits returned: `-1` (unlimited)

**No restrictions apply**

---

## Scheduled Jobs

### Daily Reset Job

**Frequency:** Once per day (recommended: 00:00 UTC)
**Function:** `reset_all_monthly_limits()`
**Implementation:** Supabase Edge Function or external cron

**Example (Supabase Edge Function):**

```typescript
// functions/daily-reset/index.ts
import { createClient } from '@supabase/supabase-js';

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { data, error } = await supabase.rpc('reset_all_monthly_limits');

  if (error) {
    console.error('Reset failed:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  console.log('Reset completed:', data);
  return new Response(JSON.stringify(data), { status: 200 });
});
```

**Cron Schedule:**
```bash
# crontab entry
0 0 * * * curl -X POST https://your-project.supabase.co/functions/v1/daily-reset
```

---

## Testing Scenarios

### Test 1: Free Tier Limit Enforcement

```sql
-- Setup: Create free tier test user
INSERT INTO auth.users (email) VALUES ('test-free@example.com');
INSERT INTO user_profiles (user_id, subscription_tier)
VALUES ('test-uuid', 'free');

-- Test: Create 3 blueprints (should block on 3rd)
SELECT increment_blueprint_creation_count('test-uuid'); -- TRUE
SELECT increment_blueprint_creation_count('test-uuid'); -- TRUE
SELECT increment_blueprint_creation_count('test-uuid'); -- FALSE (blocked)

-- Verify
SELECT * FROM check_blueprint_creation_limits('test-uuid');
-- Expected: can_create = FALSE, current_count = 2, limit_count = 2
```

---

### Test 2: Monthly Reset for Paid Tier

```sql
-- Setup: Create navigator user with billing cycle ending today
INSERT INTO user_profiles (user_id, subscription_tier, next_billing_cycle_date, current_month_creation_count)
VALUES ('test-uuid', 'navigator', NOW() - INTERVAL '1 second', 18);

-- Test: Trigger reset via get_effective_limits
SELECT * FROM get_effective_limits('test-uuid');

-- Verify: Should have reset counters
SELECT current_month_creation_count, next_billing_cycle_date
FROM user_profiles
WHERE user_id = 'test-uuid';
-- Expected: current_month_creation_count = 0, next_billing_cycle_date = NOW() + 1 month
```

---

### Test 3: Free → Paid Upgrade with Carryover

```sql
-- Setup: Free tier user with 1 generation used
INSERT INTO user_profiles (user_id, subscription_tier, blueprint_creation_count)
VALUES ('test-uuid', 'free', 1);

-- Test: Upgrade to navigator
SELECT handle_tier_upgrade('test-uuid', 'navigator');

-- Verify: Check carryover
SELECT
  subscription_tier,
  upgraded_from_free_tier,
  free_tier_carryover_data
FROM user_profiles
WHERE user_id = 'test-uuid';
-- Expected:
-- subscription_tier = 'navigator'
-- upgraded_from_free_tier = TRUE
-- free_tier_carryover_data.creation_carryover = 1 (2 - 1 used)

-- Verify effective limits
SELECT * FROM get_effective_limits('test-uuid');
-- Expected: creation_limit = 21 (20 base + 1 carryover)
```

---

### Test 4: Carryover Expiration (12 months)

```sql
-- Setup: User with carryover that expired yesterday
UPDATE user_profiles
SET
  upgraded_from_free_tier = TRUE,
  free_tier_carryover_expires_at = NOW() - INTERVAL '1 day',
  free_tier_carryover_data = '{"creation_carryover": 2, "saving_carryover": 2}'
WHERE user_id = 'test-uuid';

-- Test: Trigger reset (which checks for expiration)
SELECT * FROM get_effective_limits('test-uuid');

-- Verify: Carryover should be cleared
SELECT
  upgraded_from_free_tier,
  free_tier_carryover_data,
  free_tier_carryover_expires_at
FROM user_profiles
WHERE user_id = 'test-uuid';
-- Expected:
-- upgraded_from_free_tier = FALSE
-- free_tier_carryover_data.creation_carryover = 0
```

---

## Migration Checklist

### Pre-Migration

- [ ] Backup production database
- [ ] Test migration on staging environment
- [ ] Verify all existing user counts are correct

### Migration Steps

1. Run migration:
   ```bash
   cd /path/to/polaris-v3
   npm run db:push  # Or use Supabase CLI
   ```

2. Verify migration success:
   ```sql
   -- Check new columns exist
   SELECT column_name
   FROM information_schema.columns
   WHERE table_name = 'user_profiles'
     AND column_name IN (
       'billing_cycle_start_date',
       'next_billing_cycle_date',
       'current_month_creation_count',
       'rollover_history'
     );

   -- Check functions exist
   SELECT routine_name
   FROM information_schema.routines
   WHERE routine_name IN (
     'get_effective_limits',
     'check_blueprint_creation_limits',
     'handle_tier_upgrade',
     'reset_all_monthly_limits'
   );
   ```

3. Verify data initialization:
   ```sql
   -- Check that existing users have billing dates set
   SELECT COUNT(*)
   FROM user_profiles
   WHERE billing_cycle_start_date IS NULL
      OR next_billing_cycle_date IS NULL;
   -- Expected: 0

   -- Check that monthly counters match cumulative counters
   SELECT COUNT(*)
   FROM user_profiles
   WHERE current_month_creation_count != blueprint_creation_count;
   -- Expected: 0 (for new migration, they should match)
   ```

### Post-Migration

- [ ] Test limit enforcement on staging
- [ ] Deploy updated `BlueprintUsageService` to frontend
- [ ] Deploy admin tier upgrade endpoint
- [ ] Set up daily reset scheduled job
- [ ] Monitor logs for errors
- [ ] Verify user experience (no unintended blocks)

### Rollback (If Needed)

```bash
# Run rollback migration
psql $DATABASE_URL -f supabase/migrations/ROLLBACK_20251028000000_implement_monthly_rollover_limits.sql
```

**Warning:** Rollback will delete all rollover history data. Only use if migration fails critically.

---

## Monitoring & Maintenance

### Key Metrics to Track

1. **Daily Reset Job Success Rate**
   ```sql
   -- Log reset results daily
   SELECT * FROM reset_all_monthly_limits();
   ```

2. **Users Approaching Limits**
   ```sql
   -- Find users at 80%+ of their monthly limit
   SELECT
     user_id,
     subscription_tier,
     current_month_creation_count,
     blueprint_creation_limit,
     (current_month_creation_count::FLOAT / NULLIF(blueprint_creation_limit, 0)) * 100 AS usage_percentage
   FROM user_profiles
   WHERE subscription_tier != 'free'
     AND (current_month_creation_count::FLOAT / NULLIF(blueprint_creation_limit, 0)) >= 0.8
   ORDER BY usage_percentage DESC;
   ```

3. **Carryover Expiration Tracking**
   ```sql
   -- Find carryovers expiring in next 30 days
   SELECT
     user_id,
     subscription_tier,
     free_tier_carryover_expires_at,
     free_tier_carryover_data
   FROM user_profiles
   WHERE upgraded_from_free_tier = TRUE
     AND free_tier_carryover_expires_at <= NOW() + INTERVAL '30 days';
   ```

---

## Troubleshooting

### Issue: User can't create blueprints but shouldn't be blocked

**Diagnosis:**
```sql
-- Check user's current status
SELECT * FROM get_effective_limits('user-uuid');
SELECT * FROM check_blueprint_creation_limits('user-uuid');
SELECT * FROM user_profiles WHERE user_id = 'user-uuid';
```

**Possible Causes:**
1. Billing cycle needs manual reset
2. Limits set incorrectly
3. Developer exemption not applied

**Fix:**
```sql
-- Manual reset
SELECT reset_monthly_limits('user-uuid');

-- Or adjust limits
UPDATE user_profiles
SET blueprint_creation_limit = 20
WHERE user_id = 'user-uuid';
```

---

### Issue: Carryover not applied after upgrade

**Diagnosis:**
```sql
SELECT
  subscription_tier,
  upgraded_from_free_tier,
  free_tier_carryover_data,
  free_tier_carryover_expires_at
FROM user_profiles
WHERE user_id = 'user-uuid';
```

**Fix:**
```sql
-- Re-run tier upgrade
SELECT handle_tier_upgrade('user-uuid', 'navigator');
```

---

### Issue: Monthly reset not happening

**Diagnosis:**
```sql
-- Check who needs reset
SELECT user_id, next_billing_cycle_date
FROM user_profiles
WHERE subscription_tier != 'free'
  AND next_billing_cycle_date <= NOW();
```

**Fix:**
```sql
-- Manual reset for specific user
SELECT reset_monthly_limits('user-uuid');

-- Or reset all
SELECT * FROM reset_all_monthly_limits();
```

---

## Security Considerations

1. **Database Functions:** All functions use `SECURITY DEFINER` to run with function owner's permissions
2. **RLS Policies:** User profiles table has RLS enabled (users can only see their own data)
3. **Admin Endpoints:** Tier upgrade endpoint checks for admin/developer role before allowing changes
4. **No Client-Side Bypass:** All limit checks happen server-side in database functions
5. **Atomic Operations:** Counter increments use database transactions to prevent race conditions

---

## Future Enhancements

### Planned Features

1. **Usage Analytics Dashboard**
   - Show users their monthly usage trends
   - Display rollover history graphs
   - Alert users when approaching limits

2. **Proactive Upgrade Prompts**
   - Suggest tier upgrades based on usage patterns
   - Show cost-benefit analysis for next tier

3. **Team Seat Management**
   - Track per-user limits within team tiers
   - Admin dashboard for team usage monitoring

4. **Custom Limit Overrides**
   - Allow admins to set custom limits for specific users
   - Track override reasons and expiration dates

5. **Webhook Notifications**
   - Trigger webhooks when users hit limits
   - Send usage reports to external systems

---

## References

- **Migration File:** `supabase/migrations/20251028000000_implement_monthly_rollover_limits.sql`
- **Rollback File:** `supabase/migrations/ROLLBACK_20251028000000_implement_monthly_rollover_limits.sql`
- **Service Layer:** `frontend/lib/services/blueprintUsageService.ts`
- **Admin API:** `frontend/app/api/admin/upgrade-tier/route.ts`
- **Tier Definitions:** `docs/database-cleanup-summary.md`
- **PRD:** `docs/prds/user-roles-and-subscriptions.txt`
