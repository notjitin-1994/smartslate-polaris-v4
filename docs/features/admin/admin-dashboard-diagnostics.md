# Admin Dashboard Diagnostics Guide

## Issue
Production database users are not appearing in the admin user management panel at `/admin/users`.

## Diagnostic Tools Added

### 1. Debug Endpoint
**URL**: `/api/admin/debug`

This endpoint provides comprehensive diagnostic information including:
- Environment variable checks
- Admin client initialization status
- User profiles count
- Auth users count
- Data merge validation
- Sample data from both tables

**How to use**:
```bash
# In browser (must be logged in as admin)
http://localhost:3000/api/admin/debug

# Or in production
https://your-domain.com/api/admin/debug
```

**Expected output**:
```json
{
  "timestamp": "2025-10-25T...",
  "environment": "production",
  "checks": {
    "environmentVariables": {
      "hasSupabaseUrl": true,
      "hasServiceRoleKey": true,
      "urlPrefix": "https://your-project.supabase.co",
      "keyPrefix": "eyJhbGciOiJIUzI1NiIs..."
    },
    "adminClient": {
      "initialized": true,
      "error": null
    },
    "userProfiles": {
      "success": true,
      "count": 150,
      "error": null
    },
    "authUsers": {
      "success": true,
      "count": 150,
      "error": null,
      "sampleUserIds": [...]
    },
    "profilesFetch": {
      "success": true,
      "count": 5,
      "sampleProfiles": [...]
    },
    "dataMerge": {
      "success": true,
      "mergedSamples": [...],
      "profileIdsMatchingAuth": 5,
      "profileIdsNotMatchingAuth": 0
    }
  }
}
```

### 2. Server-Side Logging
Added detailed console logs to `/api/admin/users/route.ts`:

- Request parameters (page, limit, filters, sort)
- Profiles query result (count, errors)
- Auth users fetch result (count, sample IDs)
- Final merged result (count, sample user)

**How to view**:
- **Local development**: Check terminal where `npm run dev` is running
- **Vercel production**: Check Vercel dashboard → Functions → Logs
- **Other hosting**: Check your hosting provider's log viewer

**Log format**:
```
[Admin Users API] Request params: { page: 1, limit: 50, ... }
[Admin Users API] Profiles query result: { profilesCount: 150, totalCount: 150, ... }
[Admin Users API] Auth users fetch result: { authUsersCount: 150, ... }
[Admin Users API] Final result: { totalUsersBeforeFilter: 150, filteredUsersCount: 150, ... }
```

### 3. Admin Client Logging
Added diagnostics to `/lib/supabase/admin.ts`:

- Environment variable presence check
- URL and key prefix validation
- Detailed error messages

**Log format**:
```
[Admin Client] Environment check: { hasUrl: true, hasServiceRoleKey: true, ... }
```

### 4. Frontend Logging
Added client-side logging to `UserManagementTable.tsx`:

- Fetch parameters
- API response details
- Error reporting

**How to view**: Open browser DevTools → Console

**Log format**:
```
[UserManagementTable] Fetching users with params: { page: "1", limit: "20", ... }
[UserManagementTable] API response: { usersCount: 150, pagination: {...}, ... }
```

## Troubleshooting Steps

### Step 1: Check Debug Endpoint
1. Navigate to `/api/admin/debug` in production
2. Verify all checks pass:
   - `environmentVariables.hasServiceRoleKey` should be `true`
   - `userProfiles.count` should match expected user count
   - `authUsers.count` should match expected user count
   - `dataMerge.profileIdsNotMatchingAuth` should be `0`

### Step 2: Check Environment Variables
If `hasServiceRoleKey` is `false`:

**Vercel**:
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add `SUPABASE_SERVICE_ROLE_KEY` (NOT `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY`)
3. Redeploy the application

**Other platforms**: Add environment variable according to platform documentation

### Step 3: Check Server Logs
1. Open production logs (Vercel dashboard or your hosting provider)
2. Look for `[Admin Users API]` and `[Admin Client]` log entries
3. Check for errors or unexpected counts

### Step 4: Verify Database State
Using Supabase Studio:
1. Go to Supabase Dashboard → Table Editor
2. Check `user_profiles` table - count rows
3. Go to Authentication → Users - count users
4. Verify counts match

### Step 5: Check RLS Policies
If service role key is set but still not working:
1. Go to Supabase Dashboard → Authentication → Policies
2. Verify `user_profiles` table has RLS policies
3. Service role key should bypass RLS, but verify policies exist

## Common Issues and Solutions

### Issue: Service Role Key Not Set
**Symptom**: Debug endpoint shows `hasServiceRoleKey: false`
**Solution**: Add `SUPABASE_SERVICE_ROLE_KEY` environment variable in production

### Issue: Users Mismatch Between Tables
**Symptom**: `userProfiles.count` ≠ `authUsers.count`
**Solution**: Some users may not have profiles yet. Check `profileIdsNotMatchingAuth` count

### Issue: Environment Variables Not Picked Up
**Symptom**: Logs show "NOT_SET" for variables
**Solution**:
1. Verify variable name is exact (no typos)
2. Redeploy after adding variables
3. Clear build cache if using Vercel

### Issue: All Users Still Not Showing
**Symptom**: Debug endpoint passes all checks but UI shows few users
**Solution**:
1. Check browser console for frontend errors
2. Verify pagination (users might be on page 2+)
3. Check if filters are accidentally applied
4. Clear browser cache and hard reload

## Production Deployment Checklist

Before deploying to production:
- [ ] `NEXT_PUBLIC_SUPABASE_URL` is set
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is set (NOT the anon key)
- [ ] Service role key has correct permissions
- [ ] Environment variables are set in production environment (not just development)
- [ ] Application is redeployed after adding environment variables

## Removing Diagnostic Logs

Once the issue is resolved, you may want to remove verbose logging:

1. **Keep**:
   - Error logging (console.error)
   - Critical operation logs

2. **Remove**:
   - `console.log('[Admin Users API] ...')` statements
   - `console.log('[Admin Client] ...')` statements
   - `console.log('[UserManagementTable] ...')` statements
   - Or wrap them in `if (process.env.NODE_ENV === 'development')`

3. **Optional**:
   - Keep `/api/admin/debug` endpoint for future troubleshooting
   - Add authentication check to ensure only admins can access it
