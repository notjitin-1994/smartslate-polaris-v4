-- Add email column to user_profiles table
-- Migration: Add email column for Razorpay integration
-- Date: 2025-10-31

-- Add email column as nullable initially to avoid issues with existing records
ALTER TABLE user_profiles
ADD COLUMN email TEXT;

-- Create index on email for performance
CREATE INDEX idx_user_profiles_email ON user_profiles(email);

-- Add comment
COMMENT ON COLUMN user_profiles.email IS 'User email address for Razorpay integration';

-- Update existing records with email from auth.users (optional - run this carefully)
-- This is commented out by default as it should be run manually if needed
/*
UPDATE user_profiles
SET email = au.email
FROM auth.users au
WHERE user_profiles.user_id = au.id
  AND au.email IS NOT NULL
  AND user_profiles.email IS NULL;
*/