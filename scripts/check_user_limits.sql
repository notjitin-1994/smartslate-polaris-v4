-- Check your current blueprint limits and usage
-- Run this in your Supabase SQL Editor

-- Replace 'YOUR_USER_ID_HERE' with your actual user ID

-- Get your user profile limits
SELECT
  user_id,
  subscription_tier,
  user_role,
  blueprint_creation_count,
  blueprint_creation_limit,
  current_month_creation_count,
  blueprint_saving_count,
  blueprint_saving_limit,
  billing_cycle_start_date,
  next_billing_cycle_date,
  is_exempt_from_limits,
  exemption_reason
FROM user_profiles
WHERE user_id = auth.uid();  -- Uses your current logged-in user

-- Check effective limits with rollover (uses the new function)
SELECT * FROM get_effective_limits(auth.uid());

-- Check if you can create a blueprint
SELECT * FROM check_blueprint_creation_limits(auth.uid());

-- Count actual blueprints in the database
SELECT
  COUNT(*) as total_blueprints,
  COUNT(*) FILTER (WHERE status = 'completed') as completed,
  COUNT(*) FILTER (WHERE status = 'draft') as draft,
  COUNT(*) FILTER (WHERE status = 'generating') as generating,
  COUNT(*) FILTER (WHERE status = 'error') as error
FROM blueprint_generator
WHERE user_id = auth.uid();

-- Show recent blueprint creation dates
SELECT
  id,
  title,
  status,
  created_at,
  updated_at
FROM blueprint_generator
WHERE user_id = auth.uid()
ORDER BY created_at DESC
LIMIT 10;
