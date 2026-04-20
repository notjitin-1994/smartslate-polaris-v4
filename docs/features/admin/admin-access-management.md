# Admin Access Management Guide

## Overview

This guide explains how to grant and manage admin/developer access to SmartSlate Polaris v3. Admin access provides full dashboard capabilities, unlimited features, and user management permissions.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Granting Admin Access](#granting-admin-access)
- [Revoking Admin Access](#revoking-admin-access)
- [Verifying Access](#verifying-access)
- [Admin Capabilities](#admin-capabilities)
- [Security Considerations](#security-considerations)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before granting admin access, ensure:

1. **User Account Exists**: The user must have already signed up on the platform
2. **Environment Variables**: Supabase credentials are configured in `frontend/.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```
3. **Dependencies Installed**: Run `npm install` in the project root

## Granting Admin Access

### Method 1: CLI Script (Recommended)

The simplest way to grant admin access is using the CLI script:

```bash
# From project root
npm run admin:grant-access <email>

# Example
npm run admin:grant-access not.jitin@gmail.com
```

#### What the Script Does

1. Validates the email format
2. Looks up the user in the database
3. Updates the user profile with:
   - `user_role` = 'developer'
   - `subscription_tier` = 'developer'
   - `blueprint_creation_limit` = -1 (unlimited)
   - `blueprint_saving_limit` = -1 (unlimited)
4. Logs the change to the `role_audit_log` table
5. Displays a success summary

#### Example Output

```
==========================================
   Grant Admin Access Script
==========================================

ℹ Target email: not.jitin@gmail.com
ℹ Supabase URL: https://your-project.supabase.co

Step 1: Looking up user...
✓ User found!
ℹ   User ID: abc-123-def-456
ℹ   Name: Jitin Nair
ℹ   Current Role: explorer
ℹ   Current Tier: explorer
ℹ   Account Created: 1/15/2025, 10:30:45 AM

Step 2: Granting developer access...
✓ User profile updated!

Step 3: Creating audit log entry...
✓ Audit log entry created!

==========================================
   SUCCESS!
==========================================

✓ Developer access granted to: not.jitin@gmail.com

Changes made:
ℹ   Role: explorer → developer
ℹ   Tier: explorer → developer
ℹ   Blueprint Creation Limit: → Unlimited (-1)
ℹ   Blueprint Saving Limit: → Unlimited (-1)

Capabilities granted:
ℹ   ✓ Full access to /admin dashboard
ℹ   ✓ Unlimited blueprint creation
ℹ   ✓ Unlimited blueprint saving
ℹ   ✓ User management capabilities
ℹ   ✓ System monitoring and analytics

==========================================

Next steps:
ℹ 1. Ask not.jitin@gmail.com to log out and log back in
ℹ 2. They should now see the Admin Dashboard link
ℹ 3. Navigate to /admin to access the dashboard
```

### Method 2: API Endpoint

You can also grant access programmatically via the API:

```typescript
// POST /api/admin/grant-access
const response = await fetch('/api/admin/grant-access', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'not.jitin@gmail.com',
    role: 'developer',
    tier: 'developer',
  }),
});

const result = await response.json();
```

#### API Response

```json
{
  "success": true,
  "message": "Successfully granted developer role and developer tier to not.jitin@gmail.com",
  "user": {
    "id": "abc-123-def-456",
    "email": "not.jitin@gmail.com",
    "role": "developer",
    "tier": "developer",
    "full_name": "Jitin Nair",
    "blueprint_creation_limit": -1,
    "blueprint_saving_limit": -1
  },
  "changes": {
    "role": { "old": "explorer", "new": "developer" },
    "tier": { "old": "explorer", "new": "developer" }
  }
}
```

### Method 3: Direct Database Update (Advanced)

For emergency situations or when the API is unavailable:

```sql
-- Update user profile
UPDATE user_profiles
SET
  user_role = 'developer',
  subscription_tier = 'developer',
  blueprint_creation_limit = -1,
  blueprint_saving_limit = -1,
  role_assigned_at = NOW(),
  updated_at = NOW()
WHERE email = 'not.jitin@gmail.com';

-- Create audit log entry
INSERT INTO role_audit_log (
  admin_user_id,
  target_user_id,
  old_role,
  new_role,
  reason,
  metadata
)
SELECT
  user_id,
  user_id,
  'explorer',
  'developer',
  'Manual database update',
  '{"method": "SQL", "updated_at": "' || NOW() || '"}'::jsonb
FROM user_profiles
WHERE email = 'not.jitin@gmail.com';
```

## Revoking Admin Access

### Via API

```typescript
// DELETE /api/admin/grant-access
const response = await fetch('/api/admin/grant-access', {
  method: 'DELETE',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'user@example.com',
  }),
});
```

This will:
- Reset `user_role` to 'explorer'
- Reset `subscription_tier` to 'explorer'
- Set creation limit to 2
- Set saving limit to 2
- Log the revocation to audit table

### Via Database

```sql
UPDATE user_profiles
SET
  user_role = 'explorer',
  subscription_tier = 'explorer',
  blueprint_creation_limit = 2,
  blueprint_saving_limit = 2,
  role_assigned_at = NOW(),
  updated_at = NOW()
WHERE email = 'user@example.com';
```

## Verifying Access

### 1. Check Database

```sql
SELECT
  email,
  user_role,
  subscription_tier,
  blueprint_creation_limit,
  blueprint_saving_limit,
  role_assigned_at
FROM user_profiles
WHERE email = 'not.jitin@gmail.com';
```

Expected result for admin:
```
email                 | user_role  | subscription_tier | blueprint_creation_limit | blueprint_saving_limit | role_assigned_at
--------------------- | ---------- | ----------------- | ------------------------ | ---------------------- | ----------------
not.jitin@gmail.com   | developer  | developer         | -1                       | -1                     | 2025-01-25 13:45:00
```

### 2. Check Admin Dashboard Access

1. User should log out and log back in
2. Navigate to `/admin`
3. If access is granted, the admin dashboard will load
4. If access is denied, user will be redirected to `/`

### 3. Check Auth Function

```typescript
import { checkAdminAccess } from '@/lib/auth/adminAuth';

const { isAdmin, user } = await checkAdminAccess();
console.log('Is Admin:', isAdmin);
console.log('User:', user);
```

Expected output for admin:
```
Is Admin: true
User: {
  id: 'abc-123-def-456',
  email: 'not.jitin@gmail.com',
  user_role: 'developer',
  full_name: 'Jitin Nair'
}
```

## Admin Capabilities

Once granted developer access, users can:

### Dashboard Access
- ✅ View admin dashboard at `/admin`
- ✅ See system-wide metrics and analytics
- ✅ Access all admin pages and features

### User Management
- ✅ View all users in the system
- ✅ Search and filter users
- ✅ Update user roles and tiers
- ✅ Bulk operations on users
- ✅ View user activity and usage stats

### System Features
- ✅ Unlimited blueprint creation
- ✅ Unlimited blueprint saving
- ✅ No rate limits or quotas
- ✅ Access to all premium features

### Monitoring
- ✅ View cost monitoring
- ✅ Database health metrics
- ✅ System alerts and logs
- ✅ Activity audit trail

## Security Considerations

### ⚠️ Important Security Notes

1. **Service Role Key**: The `SUPABASE_SERVICE_ROLE_KEY` bypasses Row Level Security (RLS)
   - Never expose this key to the client
   - Only use server-side or in admin scripts
   - Rotate regularly if compromised

2. **Admin Access**: Developer role has full system access
   - Grant sparingly and only to trusted users
   - Regularly audit admin users
   - Monitor admin activity in `role_audit_log`

3. **Audit Trail**: All role changes are logged
   - Review `role_audit_log` table regularly
   - Logs include old/new values and timestamps
   - Cannot be deleted by regular users

4. **Production**: Additional safeguards for production:
   - Require multi-factor authentication
   - Implement IP whitelisting for admin access
   - Add email notifications for role changes
   - Regular access reviews

### Audit Log Query

```sql
SELECT
  ral.created_at,
  ral.reason,
  admin.email as admin_email,
  target.email as target_email,
  ral.old_role,
  ral.new_role,
  ral.metadata
FROM role_audit_log ral
JOIN user_profiles admin ON admin.user_id = ral.admin_user_id
JOIN user_profiles target ON target.user_id = ral.target_user_id
WHERE target.email = 'not.jitin@gmail.com'
ORDER BY ral.created_at DESC;
```

## Troubleshooting

### User Not Found

**Error**: "User not found with email: xxx"

**Solution**:
- Verify the user has signed up on the platform
- Check for typos in the email address
- Query the database directly to confirm:
  ```sql
  SELECT email FROM user_profiles WHERE email ILIKE '%jitin%';
  ```

### Environment Variables Missing

**Error**: "Missing required environment variables"

**Solution**:
- Check `frontend/.env.local` exists
- Verify `NEXT_PUBLIC_SUPABASE_URL` is set
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set
- Restart the development server after adding variables

### Access Still Denied After Granting

**Solutions**:
1. Ask user to **log out completely and log back in**
2. Clear browser cookies and cache
3. Verify database update was successful:
   ```sql
   SELECT user_role FROM user_profiles WHERE email = 'xxx';
   ```
4. Check admin auth function:
   ```typescript
   const { isAdmin } = await checkAdminAccess();
   ```

### Script Fails to Run

**Error**: "Cannot find module 'tsx'"

**Solution**:
```bash
# Install tsx if missing
npm install -D tsx

# Or use npx
npx tsx scripts/grant-admin-access.ts not.jitin@gmail.com
```

## Related Files

- **API Endpoint**: `frontend/app/api/admin/grant-access/route.ts`
- **CLI Script**: `scripts/grant-admin-access.ts`
- **Auth Utils**: `frontend/lib/auth/adminAuth.ts`
- **Admin Layout**: `frontend/app/admin/layout.tsx`
- **Admin Dashboard**: `frontend/app/admin/page.tsx`

## Support

For additional help:
1. Check the admin dashboard documentation
2. Review database migrations in `supabase/migrations/`
3. Examine role audit logs for troubleshooting
4. Contact development team for production access requests
