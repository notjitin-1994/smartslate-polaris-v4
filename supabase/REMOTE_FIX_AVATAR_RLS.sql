-- ==========================================
-- FIX AVATAR UPLOAD RLS POLICIES - REMOTE
-- ==========================================
-- Run this in Supabase Dashboard SQL Editor
-- Project: https://supabase.com/dashboard/project/oyjslszrygcajdpwgxbe
-- ==========================================

-- Step 1: Drop ALL existing avatar-related policies (including duplicates)
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload avatars with their user ID" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own avatar" ON storage.objects;

-- Step 2: Create clean, properly scoped policies
-- Files are named: avatar_{user_id}_{timestamp}.{ext}

-- Policy 1: INSERT - Allow authenticated users to upload their avatar
CREATE POLICY "avatar_insert_policy"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND name LIKE 'avatar_' || auth.uid()::text || '_%'
);

-- Policy 2: SELECT - Allow everyone to view avatars (public bucket)
CREATE POLICY "avatar_select_policy"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Policy 3: UPDATE - Allow users to update their own avatars
CREATE POLICY "avatar_update_policy"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND name LIKE 'avatar_' || auth.uid()::text || '_%'
);

-- Policy 4: DELETE - Allow users to delete their own avatars
CREATE POLICY "avatar_delete_policy"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND name LIKE 'avatar_' || auth.uid()::text || '_%'
);

-- Step 3: Ensure bucket is public
UPDATE storage.buckets
SET public = true
WHERE id = 'avatars';

-- Step 4: Verify policies were created
SELECT
  policyname,
  cmd as operation,
  roles
FROM pg_policies
WHERE tablename = 'objects'
  AND policyname LIKE '%avatar%'
ORDER BY policyname;
