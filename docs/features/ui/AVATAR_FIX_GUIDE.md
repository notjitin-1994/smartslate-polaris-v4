# Avatar Upload Fix & Database Sync Guide

## Problem Summary
Avatar uploads are failing because the RLS policies on the **remote** Supabase database have incorrect role specifications. The policies need to be fixed on the remote database.

## Solution: Two-Step Process

### Step 1: Fix Remote RLS Policies (CRITICAL - Do This First!)

1. **Open Supabase Dashboard SQL Editor**:
   - Go to: https://supabase.com/dashboard/project/oyjslszrygcajdpwgxbe
   - Navigate to: SQL Editor → New Query

2. **Run this SQL script**:
   ```sql
   -- Drop ALL existing avatar-related policies
   DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
   DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
   DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;
   DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
   DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
   DROP POLICY IF EXISTS "Users can upload avatars with their user ID" ON storage.objects;
   DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
   DROP POLICY IF EXISTS "Users can view their own avatar" ON storage.objects;

   -- Create clean, properly scoped policies
   CREATE POLICY "avatar_insert_policy"
   ON storage.objects FOR INSERT
   TO authenticated
   WITH CHECK (
     bucket_id = 'avatars'
     AND name LIKE 'avatar_' || auth.uid()::text || '_%'
   );

   CREATE POLICY "avatar_select_policy"
   ON storage.objects FOR SELECT
   TO public
   USING (bucket_id = 'avatars');

   CREATE POLICY "avatar_update_policy"
   ON storage.objects FOR UPDATE
   TO authenticated
   USING (
     bucket_id = 'avatars'
     AND name LIKE 'avatar_' || auth.uid()::text || '_%'
   );

   CREATE POLICY "avatar_delete_policy"
   ON storage.objects FOR DELETE
   TO authenticated
   USING (
     bucket_id = 'avatars'
     AND name LIKE 'avatar_' || auth.uid()::text || '_%'
   );

   -- Ensure bucket is public
   UPDATE storage.buckets
   SET public = true
   WHERE id = 'avatars';

   -- Verify policies
   SELECT policyname, cmd as operation, roles
   FROM pg_policies
   WHERE tablename = 'objects' AND policyname LIKE '%avatar%'
   ORDER BY policyname;
   ```

3. **Verify Output**:
   You should see 4 policies:
   - `avatar_delete_policy` | DELETE | {authenticated}
   - `avatar_insert_policy` | INSERT | {authenticated}
   - `avatar_select_policy` | SELECT | {public}
   - `avatar_update_policy` | UPDATE | {authenticated}

4. **Test Avatar Upload**:
   - Go to your app's settings page
   - Upload a new avatar image
   - It should now work!

### Step 2: Sync Remote Database to Local

After fixing the remote policies, sync everything to your local database:

```bash
# From project root
npm run db:pull

# This will:
# 1. Pull schema changes (including RLS policies)
# 2. Create migration files for any differences
# 3. NOT pull data (users, blueprints, etc.)
```

### Step 3: Pull Remote Data to Local (Optional)

If you want to work with production data locally:

**⚠️ WARNING**: This will overwrite your local database!

```bash
# Option A: Pull entire database dump
npx supabase db dump --db-url "postgresql://postgres:[PASSWORD]@db.oyjslszrygcajdpwgxbe.supabase.co:5432/postgres" > remote_dump.sql
psql -h 127.0.0.1 -p 54322 -U postgres -d postgres < remote_dump.sql

# Option B: Pull specific tables using pg_dump
PGPASSWORD=[REMOTE_PASSWORD] pg_dump \
  -h db.oyjslszrygcajdpwgxbe.supabase.co \
  -p 5432 \
  -U postgres \
  -d postgres \
  -t auth.users \
  -t public.user_profiles \
  -t public.blueprint_generator \
  --data-only \
  | PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres
```

## What Was Wrong

### Original Problem
The RLS policies were using:
```sql
-- Wrong: No role specification
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text IS NOT NULL ...)
```

This caused Supabase to **silently reject** uploads - the client returned "success" but the database blocked the insert.

### Fixed Version
```sql
-- Correct: Explicit role specification
TO authenticated
WITH CHECK (bucket_id = 'avatars' AND name LIKE 'avatar_' || auth.uid()::text || '_%')
```

## Files Created

1. **`supabase/REMOTE_FIX_AVATAR_RLS.sql`** - SQL to run on remote database
2. **`supabase/migrations/20251112000002_fix_avatars_storage_rls.sql`** - Migration for version control
3. **This guide** - Complete instructions

## Next Steps

1. ✅ Run the SQL script in Supabase Dashboard (Step 1)
2. ✅ Test avatar upload in your app
3. ✅ Pull remote schema to local (`npm run db:pull`)
4. (Optional) Pull remote data to local if needed

---

**Questions?** The console logs will now show specific errors if anything goes wrong.
