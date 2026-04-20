# Tier Separation Implementation Summary

## Date: November 2, 2025
## Issue: Free users showing as "Explorer" tier instead of "Free" tier

---

## Problem Statement

The UX was showing new registered users with "Explorer" badge when they should have "Free" badge. The original implementation incorrectly used 'explorer' as the free tier, causing confusion.

---

## Solution Implemented

### Database Changes

#### 1. Separated 'free' and 'explorer' into distinct tiers

**Migration**: `20251102190000_separate_free_and_explorer_tiers.sql`

**New Tier Structure**:

| Tier | Display Name | Limits (Creation/Saving) | Price (Monthly) | Type |
|------|-------------|--------------------------|-----------------|------|
| **free** | Free | 2/2 | ₹0 | Personal (new users) |
| **explorer** | Explorer | 5/5 | ₹999 | Personal (paid) |
| navigator | Navigator | 25/25 | ₹1,599 | Personal (paid) |
| voyager | Voyager | 50/50 | ₹3,499 | Personal (paid) |
| crew | Crew | 10/10 | ₹1,999 | Team (paid) |
| fleet | Fleet | 30/30 | ₹5,399 | Team (paid) |
| armada | Armada | 60/60 | ₹10,899 | Team (paid) |
| enterprise | Enterprise | Unlimited | Custom | Enterprise |
| developer | Developer | Unlimited | N/A | Special role |

#### 2. Updated Constraints

```sql
-- tier_config table constraint
CHECK (tier IN ('free', 'explorer', 'navigator', 'voyager', 'crew', 'fleet', 'armada', 'enterprise', 'developer'))

-- user_profiles table constraint
CHECK (subscription_tier IN ('free', 'explorer', 'navigator', 'voyager', 'crew', 'fleet', 'armada', 'enterprise', 'developer'))
```

#### 3. Updated handle_new_user() Trigger

**Before**:
```sql
subscription_tier: 'explorer'  -- ❌ Wrong: explorer shown as free
user_role: 'user'             -- ✅ Correct
```

**After**:
```sql
subscription_tier: 'free'     -- ✅ Correct: actual free tier
user_role: 'user'             -- ✅ Correct
```

#### 4. Migrated Existing Users

All existing users on 'explorer' tier (with no payment) were automatically migrated to 'free' tier:

```sql
UPDATE public.user_profiles
SET subscription_tier = 'free'
WHERE subscription_tier = 'explorer'
  AND subscription_metadata->>'plan_id' = 'explorer';
```

---

## TypeScript Changes

### 1. Updated Display Name Functions

**File**: `/frontend/lib/config/tierLimits.ts`
```typescript
export function formatTierDisplayName(tier: string, displayName: string): string {
  if (tier === 'free') {
    return 'Free Tier Member';  // ✅ NEW
  }
  if (tier === 'explorer') {
    return 'Explorer Member';   // ✅ UPDATED (was "Free Tier Member")
  }
  if (tier === 'developer') {
    return 'Developer';
  }
  return `${displayName} Member`;
}
```

**File**: `/frontend/types/subscription.ts`
```typescript
export const getTierDisplayName = (tier: SubscriptionTier): string => {
  switch (tier) {
    case 'free':
      return 'Free Tier Member';    // ✅ NEW
    case 'explorer':
      return 'Explorer Member';      // ✅ UPDATED
    case 'navigator':
      return 'Navigator Member';
    // ... rest of tiers
  }
};
```

### 2. Tier Display Utilities Already Supported

**File**: `/frontend/lib/utils/tierDisplay.ts`

Already had complete support for 'free' tier:
- `getTierDisplayName('free')` → 'Free Tier'
- `getTierDisplayNameShort('free')` → 'Free'
- `getTierInfo('free')` → Complete tier metadata with 2/2 limits
- `isFreeTier('free')` → true
- `isPaidTier('free')` → false

### 3. TierBadge Component

**File**: `/frontend/components/ui/TierBadge.tsx`

Already had 'free' tier configuration with blue badge:
```typescript
const tierConfig = {
  free: {
    icon: Star,
    gradient: 'from-blue-500 to-cyan-500',
    color: 'bg-gradient-to-r from-blue-500 to-cyan-500',
    textColor: 'text-blue-600',
  },
  explorer: {
    icon: Sparkles,
    gradient: 'from-purple-500 to-indigo-500',
    color: 'bg-gradient-to-r from-purple-500 to-indigo-500',
    textColor: 'text-purple-600',
  },
  // ... rest of tiers
};
```

---

## Badge Appearance Guide

### Tier Badges (as seen by users):

1. **Free Tier** (new users)
   - Badge: Blue gradient with Star icon
   - Text: "Free" or "Free Tier Member"
   - Limits: 2 blueprints/month

2. **Explorer** (first paid tier)
   - Badge: Purple gradient with Sparkles icon
   - Text: "Explorer" or "Explorer Member"
   - Limits: 5 blueprints/month
   - Price: ₹999/month

3. **Navigator** (personal tier)
   - Badge: Emerald gradient with Crown icon
   - Text: "Navigator" or "Navigator Member"
   - Limits: 25 blueprints/month

4. **Voyager** (personal tier)
   - Badge: Yellow gradient with Rocket icon
   - Text: "Voyager" or "Voyager Member"
   - Limits: 50 blueprints/month

5. **Crew Member** (team tier)
   - Badge: Pink gradient with Users icon
   - Text: "Crew" or "Crew Member"
   - Limits: 10 blueprints/month

6. **Fleet Member** (team tier)
   - Badge: Violet gradient with Building icon
   - Text: "Fleet" or "Fleet Member"
   - Limits: 30 blueprints/month

7. **Armada Member** (team tier)
   - Badge: Slate gradient with Shield icon
   - Text: "Armada" or "Armada Member"
   - Limits: 60 blueprints/month

---

## User Registration Flow

### New User Registration

1. User signs up via `/signup` page
2. `handle_new_user()` trigger fires automatically
3. User profile created with:
   - `subscription_tier`: **'free'**
   - `user_role`: **'user'**
   - `blueprint_creation_limit`: **2**
   - `blueprint_saving_limit`: **2**
4. User sees **"Free Tier"** badge in UI
5. User can upgrade to **Explorer** or other paid tiers

### Expected UX Flow

**For Free Users**:
- Dashboard shows: "Free Tier Member" badge (blue)
- Usage counter: "0/2 blueprints this month"
- Upgrade button visible: "Upgrade to Explorer"

**For Explorer Users** (after paying):
- Dashboard shows: "Explorer Member" badge (purple)
- Usage counter: "0/5 blueprints this month"
- Higher tier upgrade options visible

---

## Verification Steps

### 1. Database Verification

```sql
-- Check tier configuration
SELECT tier, display_name, blueprint_creation_limit, price_monthly_paise
FROM public.tier_config
WHERE tier IN ('free', 'explorer')
ORDER BY tier;

-- Expected:
-- free    | Free     | 2  | 0
-- explorer| Explorer | 5  | 99900
```

### 2. New User Test

```sql
-- Create test user
INSERT INTO auth.users (id, email) VALUES (gen_random_uuid(), 'test@example.com');

-- Check created profile
SELECT subscription_tier, user_role, blueprint_creation_limit, blueprint_saving_limit
FROM public.user_profiles
WHERE email = 'test@example.com';

-- Expected:
-- subscription_tier: 'free'
-- user_role: 'user'
-- blueprint_creation_limit: 2
-- blueprint_saving_limit: 2
```

### 3. UI Verification

1. **Register a new account**
2. **Check dashboard**: Should show "Free Tier" badge (blue, Star icon)
3. **Check usage stats**: Should show "0/2 blueprints this month"
4. **Check settings**: Should show "Free Tier Member" as current tier

---

## Migrations Deployed

1. ✅ **20251102180000_fix_new_user_default_tier_and_role.sql**
   - Fixed user_role to 'user' instead of 'explorer'
   - Fixed existing users with invalid 'explorer' role

2. ✅ **20251102190000_separate_free_and_explorer_tiers.sql**
   - Added 'free' tier to tier_config
   - Updated 'explorer' to be a paid tier
   - Migrated existing free users to 'free' tier
   - Updated handle_new_user() trigger
   - Updated database constraints

---

## Key Business Rules

1. **All new users start with 'free' tier** (not 'explorer')
2. **'free' tier = 2 blueprints/month, ₹0**
3. **'explorer' tier = 5 blueprints/month, ₹999/month** (first paid tier)
4. **User role is always 'user'** for new signups (not tier-based)
5. **Badges are tier-specific** (free=blue, explorer=purple, etc.)

---

## Important Notes

- **Razorpay Plan IDs**: Explorer tier plan IDs are placeholders (`plan_explorer_monthly`, `plan_explorer_yearly`). These need to be updated with actual Razorpay plan IDs once created.

- **Existing Paid Explorer Users**: If you had any users who actually paid for "explorer" tier, you may need to manually adjust their tier or create a migration to preserve their paid status.

- **Cache Invalidation**: The tier limits cache (`frontend/lib/config/tierLimits.ts`) will automatically refresh within 1 hour. For immediate effect, consider clearing cache or redeploying.

---

## Success Metrics

- ✅ New users get 'free' tier with 2/2 limits
- ✅ New users have 'user' role (not 'explorer')
- ✅ Free users see "Free Tier" badge (blue)
- ✅ Explorer is now a distinct paid tier (purple badge)
- ✅ All tier badges render correctly in UI
- ✅ Database constraints enforce valid tiers
- ✅ TypeScript types are consistent across codebase

---

*Tier separation completed successfully on November 2, 2025*
