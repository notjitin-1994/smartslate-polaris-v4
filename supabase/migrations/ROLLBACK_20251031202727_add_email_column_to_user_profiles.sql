-- Remove email column from user_profiles table
-- Rollback migration: Remove email column for Razorpay integration
-- Date: 2025-10-31

-- Drop index first
DROP INDEX IF EXISTS idx_user_profiles_email;

-- Remove email column
ALTER TABLE user_profiles
DROP COLUMN IF EXISTS email;