# Developer Access for Jitin Email Accounts

## Overview
This document outlines the configuration that grants unlimited blueprint generation access to `jitin@smartslate.io` and `jitin@testslate.io` with developer role privileges.

## Implementation Details

### 1. Automatic Role Assignment (Trigger-based)
When `jitin@smartslate.io` or `jitin@testslate.io` signs up and creates their user profile, the `auto_exempt_developer_user()` trigger function will automatically:

- Set `user_role` to `'developer'`
- Set `blueprint_creation_limit` to `-1` (unlimited)
- Set `blueprint_saving_limit` to `-1` (unlimited)
- Add exemption metadata to their usage tracking
- Self-assign the role with timestamp logging

### 2. Manual Role Assignment (if user already exists)
If the user already exists in the system, you can use either:

#### Method A: Direct SQL Update
```sql
-- Run the script: scripts/assign_developer_role.sql
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -f scripts/assign_developer_role.sql
```

#### Method B: Helper Function
```sql
-- Assign to both users at once
SELECT public.assign_developer_role_to_emails(ARRAY['jitin@smartslate.io', 'jitin@testslate.io']);

-- Or assign individually
SELECT public.assign_developer_role('jitin@smartslate.io');
SELECT public.assign_developer_role('jitin@testslate.io');
```

### 3. Database Changes Made

#### Updated Functions
- `auto_exempt_developer_user()` - Enhanced to include jitin@smartslate.io and jitin@testslate.io
- `assign_developer_role()` - Helper function for single user assignment
- `assign_developer_role_to_emails()` - New helper function for batch assignment

#### Migration File
- `supabase/migrations/20251031154000_grant_developer_role_to_jitin.sql`

#### Scripts
- `scripts/assign_developer_role.sql` - Manual assignment script

## Access Features

### Unlimited Blueprint Access
- **Blueprint Creation**: Unlimited (limit = -1)
- **Blueprint Saving**: Unlimited (limit = -1)
- **Usage Tracking**: Exempt from all limits
- **Exemption Reason**: "Developer - jitin@smartslate.io - Unlimited blueprint access"

### Developer Role Privileges
- **User Role**: `developer`
- **Permissions**: Full access to admin features
- **Self-Assignment**: Can assign roles to themselves
- **Access Level**: Bypasses all subscription limits

## Verification

### Check User Status
```sql
SELECT
  u.email,
  up.user_role,
  up.blueprint_creation_limit,
  up.blueprint_saving_limit,
  up.blueprint_usage_metadata,
  up.role_assigned_at
FROM auth.users u
JOIN public.user_profiles up ON u.id = up.user_id
WHERE u.email IN ('jitin@smartslate.io', 'jitin@testslate.io')
ORDER BY u.email;
```

### Expected Results
- `user_role`: `developer`
- `blueprint_creation_limit`: `-1`
- `blueprint_saving_limit`: `-1`
- `blueprint_usage_metadata.exempt_from_limits`: `true`
- `blueprint_usage_metadata.exemption_reason`: "Developer - jitin@smartslate.io - Unlimited blueprint access"

## Usage Notes

1. **Automatic**: The role is assigned automatically upon signup through the trigger
2. **Immediate**: Access is granted immediately - no approval needed
3. **Unlimited**: No monthly or daily limits on blueprint creation/saving
4. **Persistent**: The role and permissions persist across sessions
5. **Logging**: All role assignments are logged for audit purposes

## Security Considerations

- The function uses `SECURITY DEFINER` for proper database permissions
- Role assignments are logged with timestamps
- User can only self-assign if their email matches the hardcoded list
- The exemption metadata clearly identifies the reason for unlimited access

## Future Maintenance

To add more developers, update the `auto_exempt_developer_user()` function with additional email addresses following the same pattern as `jitin@smartslate.io` and `jitin@testslate.io`. Each new email should have its own conditional block with appropriate logging and metadata.