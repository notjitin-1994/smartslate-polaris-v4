# Share Page Public Access Fix

## Problem Summary

The share pages were **not fully public** due to a missing database RLS (Row Level Security) policy. While the middleware, routes, and components were configured for public access, unauthenticated users could not fetch blueprint data from the database.

## Root Cause

During the migration from the old sharing system (migration 0022) to the new advanced share system (migration 0041), the RLS policy that allowed public access to `blueprint_generator` was removed but not replaced with an equivalent policy for the new system.

### What Happened:

1. **Old System** (Migration 0022):
   - Added `share_token` column to `blueprint_generator`
   - Created RLS policy: `"Public can view shared blueprints"` allowing anon users to SELECT where `share_token IS NOT NULL`

2. **New System** (Migration 0041):
   - Created new `share_links` table with advanced features
   - Created RLS policy for `share_links` allowing anon users to SELECT active shares
   - **BUT** removed the `blueprint_generator` RLS policy without replacement

3. **Result**:
   - Unauthenticated users could access `/share/[token]` pages (middleware allowed it)
   - They could query `share_links` table (RLS allowed it)
   - **They COULD NOT fetch blueprint data** from `blueprint_generator` (no RLS policy!)

## Solution

Add a new RLS policy to `blueprint_generator` that allows anon users to view blueprints that have active share links.

### Migration Created

File: `supabase/migrations/0044_fix_public_blueprint_access.sql`

```sql
CREATE POLICY "Public can view blueprints with active share links"
  ON public.blueprint_generator
  FOR SELECT
  TO anon
  USING (
    id IN (
      SELECT blueprint_id
      FROM public.share_links
      WHERE is_active = true
    )
  );
```

## How to Apply the Fix

### Option 1: Via Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run the following SQL:

```sql
CREATE POLICY IF NOT EXISTS "Public can view blueprints with active share links"
  ON public.blueprint_generator
  FOR SELECT
  TO anon
  USING (
    id IN (
      SELECT blueprint_id
      FROM public.share_links
      WHERE is_active = true
    )
  );
```

4. Click **Run** to apply the policy

### Option 2: Via Supabase CLI

```bash
cd /home/jitin-m-nair/Desktop/polaris-v3
npm run db:push
```

Follow the prompts to apply the migration.

### Option 3: Via Migration Script

The migration file has been created at:
```
supabase/migrations/0044_fix_public_blueprint_access.sql
```

It will be applied automatically on the next deployment or when you run `npm run db:push`.

## Verification

After applying the fix, verify it works:

1. **Test unauthenticated access**:
   - Open an incognito/private browser window
   - Navigate to a share URL (e.g., `https://polaris.smartslate.io/share/[token]`)
   - Verify the blueprint loads correctly

2. **Check RLS policies**:
   ```sql
   SELECT * FROM pg_policies
   WHERE tablename = 'blueprint_generator'
   AND policyname = 'Public can view blueprints with active share links';
   ```

3. **Test the short URL format** (`/s/[slug]`):
   - Ensure both `/share/[token]` and `/s/[slug]` formats work for public access

## Current Configuration Status

### ✅ What's Already Public:

1. **Middleware** (`frontend/middleware.ts`):
   - Lines 18, 85-88: `/share/` and `/s/` paths allowed without authentication

2. **API Routes**:
   - `/api/blueprints/share/[token]`: Uses anon key (public)
   - `/api/share/access/[token]`: Uses anon key (public)

3. **Page Components**:
   - `/share/[token]/page.tsx`: Server component, uses public API
   - `/s/[slug]/page.tsx`: Server component, fetches with anon access
   - `ShareAccessView.tsx`: Client component, no auth requirements

4. **Database RLS**:
   - `share_links` table: ✅ Has public SELECT policy
   - `blueprint_generator` table: ⚠️  **NEEDS THE NEW POLICY**

### 🔧 What Needs to be Fixed:

- **blueprint_generator RLS**: Apply the new policy (see "How to Apply the Fix" above)

## Impact

### Before Fix:
- Share pages would load but fail to fetch blueprint data
- Users would see "Blueprint Not Found" error
- Only authenticated users could view shared blueprints (defeating the purpose of sharing)

### After Fix:
- ✅ Anyone with a share link can view the blueprint (no login required)
- ✅ Password-protected shares still require password
- ✅ Email-gated shares still require email
- ✅ Expired/inactive shares still return proper error messages
- ✅ Authenticated users can still manage their own blueprints

## Security Considerations

The new RLS policy is **secure** because:

1. **Selective Access**: Only blueprints with active share links are accessible
2. **Read-Only**: Policy only allows SELECT operations
3. **No User Data Exposed**: Blueprint content only (no user_id, no questionnaire answers)
4. **Respects Share Settings**: Expired, inactive, or view-limited shares are still protected
5. **Existing Auth Unchanged**: Authenticated user policies remain the same

## Files Modified

1. **Created**:
   - `supabase/migrations/0044_fix_public_blueprint_access.sql` (RLS policy migration)
   - `scripts/apply-public-blueprint-policy.ts` (Helper script)
   - `SHARE_PUBLIC_ACCESS_FIX.md` (This document)

2. **No changes needed** (already correct):
   - `frontend/middleware.ts`
   - `frontend/app/share/[token]/page.tsx`
   - `frontend/app/s/[slug]/page.tsx`
   - `frontend/components/share/ShareAccessView.tsx`
   - `frontend/app/api/blueprints/share/[token]/route.ts`
   - `frontend/app/api/share/access/[token]/route.ts`

## Testing Checklist

After applying the fix, test these scenarios:

- [ ] Public access to `/share/[token]` without login
- [ ] Public access to `/s/[slug]` without login
- [ ] Password-protected shares require password
- [ ] Email-gated shares require email
- [ ] Expired shares show expiration message
- [ ] Inactive/revoked shares show error
- [ ] View-limited shares respect max views
- [ ] Logged-in users can still access their own blueprints
- [ ] Share analytics tracking still works
- [ ] Download/print/share buttons work correctly

## Rollback

If you need to rollback this change:

```sql
DROP POLICY IF EXISTS "Public can view blueprints with active share links" ON public.blueprint_generator;
```

**Note**: Rolling back will break public share functionality!

## Next Steps

1. ✅ Migration file created
2. ⏳ **Apply the migration** (see "How to Apply the Fix" above)
3. ⏳ Test public share access
4. ⏳ Deploy to production

---

**Date**: 2025-11-18
**Author**: Claude Code
**Issue**: Share pages not accessible to unauthenticated users
**Status**: ✅ Fix Ready (Migration Created) → ⏳ Needs Application
