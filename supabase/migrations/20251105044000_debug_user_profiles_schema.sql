-- Migration: Debug user_profiles schema
-- Description: Check what columns actually exist in user_profiles table
-- This will help us understand why the trigger is failing

-- Query to see all columns in user_profiles
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_profiles'
ORDER BY ordinal_position;
