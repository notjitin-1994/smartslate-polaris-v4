# Admin Blueprint Generation - Verification Guide

## Summary of Changes

### 1. Admin Access Control Implementation ✅
Created `/frontend/lib/auth/adminUtils.ts` with:
- `isUserAdmin()` - Checks if user has `user_role = 'developer'`
- `getClientForUser()` - Returns service role client for admins, authenticated client for regular users

### 2. Blueprint Generation API ✅
Updated `/frontend/app/api/blueprints/generate/route.ts`:
- Added admin authentication and client selection
- Made all database queries admin-aware (admins can access any blueprint)
- Usage limits attributed to blueprint owner, not admin
- Admins bypass usage limits

### 3. Dynamic Questions API ✅
Updated `/frontend/app/api/generate-dynamic-questions/route.ts`:
- Added proper authentication (was missing)
- Added admin check and client selection
- Made all queries admin-aware
- Admins bypass usage limits
- All rollback operations are admin-aware

### 4. Database Column Fix ✅
Created migration `20251106030000_ensure_blueprint_usage_metadata_column.sql`:
- Adds `blueprint_usage_metadata` JSONB column if missing
- Initializes existing user profiles with proper metadata
- Auto-exempts developer users from limits
- Includes verification queries

**Migration Applied Successfully:**
- Column exists: ✓
- Users with metadata: 24
- Developers with exemption: 1

## How Admin Access Works

### Security Pattern
1. **Authentication**: User must be logged in via Supabase auth
2. **Admin Check**: Query `user_profiles` to check if `user_role = 'developer'`
3. **Client Selection**:
   - Regular users → Authenticated client (respects RLS)
   - Admin users → Service role client (bypasses RLS)
4. **Usage Attribution**: Counts attributed to blueprint owner, not the admin

### Admin Capabilities
- ✅ View any user's blueprints
- ✅ Generate blueprints for any user
- ✅ Regenerate dynamic questions for any user
- ✅ Bypass usage limits (for themselves)
- ✅ Manage blueprints without RLS restrictions

### What Regular Users See
- ❌ Cannot access other users' blueprints (RLS enforced)
- ❌ Cannot bypass usage limits
- ❌ Only see their own data

## Testing Admin Blueprint Generation

### Test Case 1: Admin Generates Blueprint for Regular User
```typescript
// Admin user: 3244b837-2432-4f3d-aba6-a80e6d11e471
// Regular user blueprint: bb8d0863-e9ad-4c76-aab9-46ded24dd237
// Blueprint owner: 94deaef3-3c92-4823-ad2d-c5054c5f07a6

// Expected behavior:
// 1. Admin can access the blueprint (bypass RLS)
// 2. Blueprint generates successfully
// 3. Usage count increments for the OWNER (94deaef3...), not admin
// 4. Admin doesn't consume their own limits
```

### Test Case 2: Verify Usage Tracking
```sql
-- Check blueprint owner's usage counts
SELECT
  user_id,
  email,
  user_role,
  blueprint_creation_count,
  blueprint_saving_count,
  blueprint_usage_metadata
FROM user_profiles
WHERE user_id = '94deaef3-3c92-4823-ad2d-c5054c5f07a6';

-- Should show incremented counts after blueprint generation
```

### Test Case 3: Admin User Exemption
```sql
-- Verify admin user has exemption
SELECT
  user_id,
  email,
  user_role,
  blueprint_usage_metadata->>'exempt_from_limits' as is_exempt,
  blueprint_usage_metadata->>'exemption_reason' as reason
FROM user_profiles
WHERE user_role = 'developer';

-- Should return: is_exempt = true, reason = "Developer/Admin exemption"
```

## Verification Checklist

- [x] Migration applied successfully
- [x] `blueprint_usage_metadata` column exists
- [x] Admin utility functions created
- [x] Blueprint generation API updated
- [x] Dynamic questions API updated
- [x] Admin users get service role client
- [x] Regular users get authenticated client
- [x] Usage counts attributed to blueprint owner
- [x] Developer users auto-exempted from limits
- [ ] **Test**: Admin generates blueprint for regular user
- [ ] **Test**: Verify usage count increments for owner
- [ ] **Test**: Confirm blueprint displays correctly for owner

## Expected Log Output

When admin generates a blueprint, you should see:
```
[INFO] [api] blueprints.generate.request_received: Request received
[INFO] [api] blueprints.generate.client_selected: Supabase client selected { isAdmin: true }
[INFO] [api] blueprints.generate.context_ready: Context built successfully
[LIMITS] Blueprint saving allowed { userId: '94deaef3...', newCount: X }
[INFO] [api] blueprints.generate.success: Blueprint generated successfully
```

## Files Modified

1. `/frontend/lib/auth/adminUtils.ts` - **CREATED**
2. `/frontend/app/api/blueprints/generate/route.ts` - **MODIFIED**
3. `/frontend/app/api/generate-dynamic-questions/route.ts` - **MODIFIED**
4. `/supabase/migrations/20251106030000_ensure_blueprint_usage_metadata_column.sql` - **CREATED**

## Database Functions Used

- `increment_blueprint_creation_count(user_id)` - Increments creation counter
- `increment_blueprint_saving_count(user_id)` - Increments saving counter (NOW WORKS)
- `check_blueprint_creation_limits(user_id)` - Checks if user can create
- `check_blueprint_saving_limits(user_id)` - Checks if user can save
- `get_blueprint_usage_info(user_id)` - Gets usage stats

All functions now properly access `blueprint_usage_metadata` column.

## Next Steps

1. **Test the fix**: Have an admin user generate a blueprint for a regular user
2. **Verify counts**: Check that the owner's usage counts increment correctly
3. **Confirm display**: Ensure the blueprint appears in the owner's account
4. **Monitor logs**: Watch for any remaining errors in the console

## Troubleshooting

### If you still see "column does not exist" error:
```sql
-- Verify column exists
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'user_profiles'
AND column_name = 'blueprint_usage_metadata';

-- Should return: jsonb type with default value
```

### If usage counts don't increment:
```sql
-- Test the function directly
SELECT increment_blueprint_saving_count('user-id-here');

-- Should return: true (if limit not exceeded)
```

### If admin access denied:
```sql
-- Verify admin role
SELECT user_id, email, user_role
FROM user_profiles
WHERE user_role = 'developer';

-- Admin user should appear in results
```

## Security Notes

- Service role client bypasses ALL RLS policies - use with caution
- Admin checks are performed server-side only (never trust client)
- Usage attribution ensures fair accounting (admin actions don't consume their limits)
- Developer users are auto-exempted from usage limits
- All admin operations are logged for audit trail
