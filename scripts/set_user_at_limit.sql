-- Script to artificially set your user at their blueprint creation limit
-- This is useful for testing the limit enforcement and modal behavior
-- Run this in your Supabase SQL Editor

-- IMPORTANT: This will set your counts to match your limits (making you "at limit")
-- Run check_user_limits.sql first to see your current values

-- Set yourself at the limit (counts = limits)
UPDATE user_profiles
SET
  blueprint_creation_count = blueprint_creation_limit,
  current_month_creation_count = blueprint_creation_limit,
  updated_at = now()
WHERE user_id = auth.uid();

-- Verify the change
SELECT
  subscription_tier,
  blueprint_creation_count,
  blueprint_creation_limit,
  current_month_creation_count,
  (blueprint_creation_count >= blueprint_creation_limit) as is_at_creation_limit
FROM user_profiles
WHERE user_id = auth.uid();

-- Check if you can create (should return false)
SELECT * FROM check_blueprint_creation_limits(auth.uid());

-- To RESET back to zero usage (if you want to start fresh):
-- UPDATE user_profiles
-- SET
--   blueprint_creation_count = 0,
--   current_month_creation_count = 0,
--   blueprint_saving_count = 0,
--   updated_at = now()
-- WHERE user_id = auth.uid();
