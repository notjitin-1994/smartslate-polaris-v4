# Roles and Tiers System Update

**Date**: 2025-10-25
**Migration**: `0033_update_roles_and_tiers.sql`
**Status**: Breaking Change

## Overview

The roles and tiers system has been updated to separate user roles from subscription tiers, removing the previous tier-based role system and the Enterprise tier.

## What Changed

### Roles (Before → After)

**Before** (Tier-based roles):
- `explorer`, `navigator`, `voyager`, `crew`, `fleet`, `armada`, `enterprise`, `developer`

**After** (Permission-based roles):
- `user` - Standard user access (default)
- `developer` - Development and admin access
- `admin` - Full system administrative access

### Tiers (Before → After)

**Before**:
- `explorer` (free tier)
- `navigator`, `voyager`, `crew`, `fleet`, `armada`, `enterprise` (paid tiers)
- `developer` (special admin tier)

**After**:
- `free` - Free tier (2 blueprints/month)
- `explorer` - Enhanced features for learners
- `navigator` - Advanced features and analytics
- `voyager` - Professional-grade learning tools
- `crew` - Team collaboration features (Crew Member)
- `fleet` - Multi-team management (Fleet Member)
- `armada` - Large organization features (Armada Member)

**Removed**: `enterprise` tier

## Migration Details

### Database Changes

The migration `0033_update_roles_and_tiers.sql` performs the following:

1. **Updates user_role constraint** to accept only: `user`, `developer`, `admin`
2. **Updates subscription_tier constraint** to accept only: `free`, `explorer`, `navigator`, `voyager`, `crew`, `fleet`, `armada`
3. **Migrates existing data**:
   - All tier-based roles (except `developer`) → `user`
   - `developer` role → `developer` (preserved)
   - No `admin` roles exist yet (must be manually assigned)
   - `explorer` tier → `free`
   - `developer` tier → `free`
   - `enterprise` tier → `armada`
   - All other tiers remain unchanged

4. **Updates handle_new_user() function** to use `free` tier and `user` role as defaults
5. **Creates new helper functions**:
   - `is_admin_or_developer(user_id)` - Check if user has admin privileges
   - `get_user_role(user_id)` - Get user's role

### TypeScript Changes

**New Types** (`frontend/lib/utils/tierDisplay.ts`):

```typescript
// User roles
export type UserRole = 'user' | 'developer' | 'admin';

// Subscription tiers
export type SubscriptionTier =
  | 'free'
  | 'explorer'
  | 'navigator'
  | 'voyager'
  | 'crew'
  | 'fleet'
  | 'armada';
```

**New Functions**:

```typescript
// Role display functions
getRoleDisplayName(role: string | null | undefined): string
getRoleInfo(role: string | null | undefined): { displayName, color, description }
isDeveloperRole(role: string | null | undefined): boolean
isAdminRole(role: string | null | undefined): boolean
hasAdminAccess(role: string | null | undefined): boolean

// Updated tier display functions
getTierDisplayName(tier: string | null | undefined): string
getTierDisplayNameShort(tier: string | null | undefined): string
getTierInfo(tier: string | null | undefined): { displayName, shortName, color, isPaid, description }
isPaidTier(tier: string | null | undefined): boolean
isFreeTier(tier: string | null | undefined): boolean
```

### UI Component Updates

**Updated Components**:
- `frontend/components/admin/users/UserEditModal.tsx` - Role and tier dropdowns
- `frontend/components/admin/users/AdvancedFilters.tsx` - Filter options
- All components using `getTierDisplayName()` now show updated tier names

**Display Name Changes**:
- Free tier: `"Free Tier"` (was `"Free Tier Member"`)
- Individual tiers: `"Explorer"`, `"Navigator"`, `"Voyager"` (no "Member" suffix)
- Team tiers: `"Crew Member"`, `"Fleet Member"`, `"Armada Member"` (with "Member" suffix)
- Roles: `"User"`, `"Developer"`, `"Admin"`

### API Changes

**Updated Endpoints**:
- `POST /api/admin/grant-access` - Now accepts new role and tier values
  - Default role: `developer` (unchanged)
  - Default tier: `free` (was `developer`)
  - Valid roles: `user`, `developer`, `admin`
  - Valid tiers: `free`, `explorer`, `navigator`, `voyager`, `crew`, `fleet`, `armada`

## Migration Steps

### 1. Apply Database Migration

```bash
# From project root
cd supabase
supabase migration apply 0033_update_roles_and_tiers
```

### 2. Verify Migration

```sql
-- Check role distribution
SELECT user_role, COUNT(*) as count
FROM public.user_profiles
GROUP BY user_role;

-- Check tier distribution
SELECT subscription_tier, COUNT(*) as count
FROM public.user_profiles
GROUP BY subscription_tier;

-- Verify constraints
SELECT conname, contype, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'public.user_profiles'::regclass
AND (conname LIKE '%role%' OR conname LIKE '%tier%');
```

### 3. Update Frontend Code

```bash
# From frontend directory
cd frontend
npm run typecheck  # Verify TypeScript types
npm run lint       # Check for issues
npm run test       # Run updated tests
```

### 4. Deploy

```bash
# Build and deploy
npm run build
# Deploy to your hosting platform
```

## Rollback Procedure

If you need to rollback:

```bash
cd supabase
supabase migration apply ROLLBACK_0033_update_roles_and_tiers
```

**⚠️ Rollback Limitations**:
- Users with `admin` role will become `developer`
- Cannot distinguish between original `armada` and migrated `enterprise` users
- All will remain as `armada` after rollback

## Backwards Compatibility

### Breaking Changes

1. **Old role values are invalid**: Code checking for `explorer`, `navigator`, etc. as roles will fail
2. **Old tier values**: `explorer` tier is now `free`, `enterprise` tier removed
3. **Display names changed**: UI showing tier names will display differently

### Migration Path for Existing Code

**Before**:
```typescript
// Old tier-based role check
if (user.user_role === 'explorer') { }
if (user.user_role === 'developer') { }
```

**After**:
```typescript
// New role-based check
if (user.user_role === 'user') { }
if (user.user_role === 'developer') { }
if (user.user_role === 'admin') { }

// Or use helper functions
if (hasAdminAccess(user.user_role)) { }
if (isDeveloperRole(user.user_role)) { }
```

**Before**:
```typescript
// Old tier check
if (user.subscription_tier === 'explorer') { }
```

**After**:
```typescript
// New tier check
if (user.subscription_tier === 'free') { }
if (isFreeTier(user.subscription_tier)) { }
```

## Testing

### Updated Tests

All tests in `frontend/__tests__/utils/tierDisplay.test.ts` have been updated to test:
- New role functions (`getRoleDisplayName`, `isDeveloperRole`, `isAdminRole`, `hasAdminAccess`)
- Updated tier functions with new values
- Correct display names for all tiers
- Business logic validation

### Test Coverage

```bash
cd frontend
npm run test -- __tests__/utils/tierDisplay.test.ts
```

Expected: All tests passing ✅

## FAQ

### Q: What happens to existing users?

**A**: All existing users are migrated automatically:
- Users with tier-based roles → `user` role (except developers)
- Users with `explorer` tier → `free` tier
- Users with `enterprise` tier → `armada` tier
- All other tiers remain unchanged

### Q: How do I assign the new `admin` role?

**A**: Use the admin API or direct database update:

```bash
# Via API (recommended)
curl -X POST /api/admin/grant-access \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "role": "admin", "tier": "free"}'

# Or via Supabase SQL Editor
UPDATE user_profiles
SET user_role = 'admin', role_assigned_at = NOW()
WHERE email = 'admin@example.com';
```

### Q: What's the difference between `developer` and `admin` roles?

**A**:
- **Developer**: Development and admin dashboard access (existing role)
- **Admin**: Full system administrative access (new role, higher privileges)

Both have admin access for now, but future features may differentiate between them.

### Q: Why was Enterprise tier removed?

**A**: Enterprise tier was redundant with Armada tier. Armada now represents the highest tier for large organizations.

### Q: Can users have different roles and tiers?

**A**: Yes! Roles and tiers are now independent:
- A user can be `role: admin` with `tier: free` (admin access, free tier limits)
- A user can be `role: user` with `tier: armada` (paid features, no admin access)

## Support

For issues or questions about this migration:
1. Check the migration logs in `public.migration_log` table
2. Review the rollback migration if needed
3. Contact the development team

## Related Files

- Database: `supabase/migrations/0033_update_roles_and_tiers.sql`
- Rollback: `supabase/migrations/ROLLBACK_0033_update_roles_and_tiers.sql`
- Types: `frontend/lib/utils/tierDisplay.ts`
- Tests: `frontend/__tests__/utils/tierDisplay.test.ts`
- API: `frontend/app/api/admin/grant-access/route.ts`
- UI Components: `frontend/components/admin/users/*.tsx`
