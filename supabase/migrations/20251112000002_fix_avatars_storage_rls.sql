-- Migration: 20251112000002_fix_avatars_storage_rls.sql
-- Description: Fix RLS policies for avatars bucket to support flat file structure with proper role assignment
-- Author: System
-- Date: 2025-11-12

-- Drop ALL existing avatar-related policies (including duplicates)
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload avatars with their user ID" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own avatar" ON storage.objects;

-- Create clean, properly scoped policies for flat file structure
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

-- Ensure bucket is public
UPDATE storage.buckets
SET public = true
WHERE id = 'avatars';
