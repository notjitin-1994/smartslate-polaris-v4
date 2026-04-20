-- Migration: Add deleted_at column to user_profiles for soft deletes
-- Description: Adds soft delete support to user_profiles table
-- Date: 2025-11-04

BEGIN;

-- ============================================================================
-- Add deleted_at column for soft delete functionality
-- ============================================================================

ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Create index for filtering deleted users
CREATE INDEX IF NOT EXISTS idx_user_profiles_deleted_at
  ON public.user_profiles(deleted_at)
  WHERE deleted_at IS NOT NULL;

-- Add comment
COMMENT ON COLUMN public.user_profiles.deleted_at IS 'Timestamp when user was soft-deleted (NULL = active user). Used for audit trail and potential recovery.';

-- ============================================================================
-- Update RLS policies to exclude deleted users from normal queries
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;

-- Recreate policies with deleted_at filter
CREATE POLICY "Users can view own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE POLICY "Users can update own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = user_id AND deleted_at IS NULL)
  WITH CHECK (auth.uid() = user_id AND deleted_at IS NULL);

-- Add policy for admins to view deleted users (via service role key)
DROP POLICY IF EXISTS "Service role can view all profiles including deleted" ON public.user_profiles;
CREATE POLICY "Service role can view all profiles including deleted"
  ON public.user_profiles FOR SELECT
  TO service_role
  USING (true);

DROP POLICY IF EXISTS "Service role can update all profiles including deleted" ON public.user_profiles;
CREATE POLICY "Service role can update all profiles including deleted"
  ON public.user_profiles FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMIT;

-- ============================================================================
-- ROLLBACK INSTRUCTIONS
-- ============================================================================

-- To rollback this migration, run:
-- BEGIN;
-- DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
-- DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
-- DROP POLICY IF EXISTS "Service role can view all profiles including deleted" ON public.user_profiles;
-- DROP POLICY IF EXISTS "Service role can update all profiles including deleted" ON public.user_profiles;
-- DROP INDEX IF EXISTS idx_user_profiles_deleted_at;
-- ALTER TABLE public.user_profiles DROP COLUMN IF EXISTS deleted_at;
-- COMMIT;
