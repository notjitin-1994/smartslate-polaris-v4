# Tier Display Naming Convention

## Overview

This document defines the user-facing display names for subscription tiers in SmartSlate Polaris v3.

## Business Rule

**All authenticated users are "Free Tier Members" by default unless they have subscribed to a paid plan.**

- Users who have NOT subscribed to a paid plan → **"Free Tier Member"**
- Users who HAVE subscribed to a paid plan → **"[Tier Name] Member"** (e.g., "Navigator Member", "Voyager Member")
- Developer role (special admin) → **"Developer"**

## Implementation

### Utility Functions

Location: `frontend/lib/utils/tierDisplay.ts`

```typescript
import { getTierDisplayName, getTierDisplayNameShort, getTierInfo, isFreeTier } from '@/lib/utils/tierDisplay';

// Full display name with "Member" suffix
getTierDisplayName('explorer');  // returns "Free Tier Member"
getTierDisplayName('navigator'); // returns "Navigator Member"
getTierDisplayName('developer'); // returns "Developer"

// Short display name (for badges, compact UI)
getTierDisplayNameShort('explorer');  // returns "Free Tier"
getTierDisplayNameShort('navigator'); // returns "Navigator"

// Check if user is on free tier
isFreeTier('explorer');  // returns true
isFreeTier('navigator'); // returns false

// Get comprehensive tier information
const tierInfo = getTierInfo('navigator');
// Returns: { displayName, shortName, color, isPaid, description }
```

### Tier Mapping

| Database Value | Display Name | Short Name | Type |
|---------------|--------------|------------|------|
| `explorer` | Free Tier Member | Free Tier | Free |
| `navigator` | Navigator Member | Navigator | Paid |
| `voyager` | Voyager Member | Voyager | Paid |
| `crew` | Crew Member | Crew | Paid |
| `fleet` | Fleet Member | Fleet | Paid |
| `armada` | Armada Member | Armada | Paid |
| `enterprise` | Enterprise Member | Enterprise | Paid |
| `developer` | Developer | Developer | Special |

## Usage Guidelines

### ✅ DO

1. **Always use the utility functions** for tier display:
   ```typescript
   // Good
   <h2>{getTierDisplayName(profile.subscription_tier)}</h2>
   ```

2. **Use `getTierDisplayName()` for full member titles**:
   - Page headings
   - Subscription cards
   - User profiles
   - Account settings

3. **Use `getTierDisplayNameShort()` for compact contexts**:
   - Badges
   - Navigation items
   - Table cells
   - Status indicators

4. **Use `isFreeTier()` for conditional logic**:
   ```typescript
   if (isFreeTier(user.subscription_tier)) {
     // Show upgrade CTA
   }
   ```

### ❌ DON'T

1. **Don't hardcode tier names**:
   ```typescript
   // Bad
   <h2>{tier === 'explorer' ? 'Free Tier' : tier}</h2>

   // Good
   <h2>{getTierDisplayName(tier)}</h2>
   ```

2. **Don't use raw database values in UI**:
   ```typescript
   // Bad
   <p>Your tier: {profile.subscription_tier}</p>

   // Good
   <p>Your tier: {getTierDisplayName(profile.subscription_tier)}</p>
   ```

3. **Don't mix naming conventions**:
   ```typescript
   // Bad - inconsistent
   {tier === 'explorer' ? 'Free User' : 'Premium Member'}

   // Good - consistent
   {getTierDisplayName(tier)}
   ```

## Component Examples

### SubscriptionSection Component

```typescript
import { getTierDisplayName, getTierDisplayNameShort } from '@/lib/utils/tierDisplay';

export function SubscriptionSection() {
  const { profile } = useUserProfile();

  return (
    <div>
      <h2>{getTierDisplayName(profile.subscription_tier)}</h2>
      <p>Membership: {getTierDisplayNameShort(profile.subscription_tier)}</p>
    </div>
  );
}
```

### UsageBadge Component

```typescript
import { getTierInfo } from '@/lib/utils/tierDisplay';

export function TierBadge({ tier }: { tier: string }) {
  const tierInfo = getTierInfo(tier);

  return (
    <div className={`badge ${tierInfo.color}`}>
      {tierInfo.shortName}
    </div>
  );
}
```

### Conditional Rendering

```typescript
import { isFreeTier, isPaidTier } from '@/lib/utils/tierDisplay';

export function UpgradePrompt({ tier }: { tier: string }) {
  if (!isFreeTier(tier)) {
    return null; // Don't show to paid members
  }

  return (
    <div>
      <p>You're currently a Free Tier Member</p>
      <button>Upgrade to unlock more features</button>
    </div>
  );
}
```

## UI/UX Considerations

### Messaging

1. **Welcome messages**:
   - ✅ "Welcome, Free Tier Member!"
   - ✅ "Welcome, Navigator Member!"
   - ❌ "Welcome, explorer!"

2. **Upgrade prompts**:
   - ✅ "Upgrade to a premium membership"
   - ✅ "Become a Navigator Member today"
   - ❌ "Upgrade to premium"

3. **Status displays**:
   - ✅ "Your membership: Free Tier"
   - ✅ "Your membership: Voyager"
   - ❌ "Your tier: explorer"

### Accessibility

- Always use semantic HTML with proper headings
- Ensure tier badges have sufficient color contrast
- Provide text alternatives for tier icons
- Use ARIA labels where appropriate:
  ```typescript
  <div aria-label={`${getTierDisplayName(tier)} subscription`}>
    {/* Tier badge content */}
  </div>
  ```

## Testing

### Unit Tests

Location: `frontend/__tests__/utils/tierDisplay.test.ts`

```typescript
import { getTierDisplayName, isFreeTier } from '@/lib/utils/tierDisplay';

describe('tierDisplay utilities', () => {
  it('displays explorer as Free Tier Member', () => {
    expect(getTierDisplayName('explorer')).toBe('Free Tier Member');
  });

  it('displays navigator as Navigator Member', () => {
    expect(getTierDisplayName('navigator')).toBe('Navigator Member');
  });

  it('identifies explorer as free tier', () => {
    expect(isFreeTier('explorer')).toBe(true);
    expect(isFreeTier('navigator')).toBe(false);
  });
});
```

## Database Schema

The underlying database schema remains unchanged:

```sql
-- subscription_tier values in database
CHECK (subscription_tier IN (
  'explorer', 'navigator', 'voyager',
  'crew', 'fleet', 'armada',
  'enterprise', 'developer'
))
```

**Important**: The database stores tier values in lowercase (e.g., `explorer`, `navigator`). The display utilities handle the transformation to user-friendly names.

## Migration Notes

If you're updating existing code:

1. **Find all tier display instances**:
   ```bash
   grep -r "subscription_tier\|subscriptionTier" frontend/
   ```

2. **Replace hardcoded tier names** with utility functions

3. **Update tests** to use new naming convention

4. **Verify UI consistency** across all pages:
   - Dashboard
   - Settings/Profile
   - Subscription management
   - Usage statistics
   - Upgrade prompts

## Related Files

- `frontend/lib/utils/tierDisplay.ts` - Main utility functions
- `frontend/components/usage/UsageBadge.tsx` - Tier badge component
- `frontend/components/settings/SubscriptionSection.tsx` - Subscription display
- `frontend/components/dashboard/UsageStatsCard.tsx` - Usage statistics
- `supabase/migrations/0026_add_subscription_and_roles.sql` - Database schema

## Support

For questions or issues with tier display naming:
- Check this documentation first
- Review `frontend/lib/utils/tierDisplay.ts` for implementation details
- See component examples in `frontend/components/usage/` and `frontend/components/settings/`
