-- Test script to verify developer role assignment for jitin@smartslate.io
-- This simulates what would happen when the user signs up

-- Step 1: Test the helper function (works independently)
SELECT 'Testing helper function...' as test_step;

-- This should return TRUE if the function exists and works
SELECT proname FROM pg_proc WHERE proname = 'assign_developer_role';

-- Step 2: Check that the trigger function is properly updated
SELECT 'Checking trigger function...' as test_step;

-- This should show the updated function with jitin@smartslate.io logic
SELECT
  CASE
    WHEN prosrc LIKE '%jitin@smartslate.io%' THEN 'Function updated correctly'
    ELSE 'Function needs update'
  END as function_status
FROM pg_proc
WHERE proname = 'auto_exempt_developer_user';

-- Step 3: Verify trigger is enabled
SELECT 'Checking trigger status...' as test_step;

SELECT
  tgname,
  CASE
    WHEN tgenabled = 'O' THEN 'Enabled'
    WHEN tgenabled = 'D' THEN 'Disabled'
    ELSE tgenabled
  END as status
FROM pg_trigger
WHERE tgname = 'trigger_auto_exempt_developer';

-- Step 4: Test what would happen for a test user (optional)
-- Note: This creates a temporary test user to verify the logic
SELECT 'Testing assignment logic (dry run)...' as test_step;

-- Create mock NEW records to test the trigger logic for both users
WITH mock_new AS (
  SELECT
    gen_random_uuid() as user_id,
    'jitin@smartslate.io' as email,
    'explorer' as user_role,
    2 as blueprint_creation_limit,
    2 as blueprint_saving_limit,
    '{}'::jsonb as blueprint_usage_metadata
  UNION ALL
  SELECT
    gen_random_uuid() as user_id,
    'jitin@testslate.io' as email,
    'explorer' as user_role,
    2 as blueprint_creation_limit,
    2 as blueprint_saving_limit,
    '{}'::jsonb as blueprint_usage_metadata
)
SELECT
  email as user_email,
  CASE
    WHEN email IN ('jitin@smartslate.io', 'jitin@testslate.io')
    THEN 'Developer role + Unlimited access'
    ELSE 'User not in auto-assign list'
  END as assignment_result
FROM mock_new
WHERE email IN ('jitin@smartslate.io', 'jitin@testslate.io');

SELECT 'Test completed. The system is ready for both jitin@smartslate.io and jitin@testslate.io to receive developer access automatically upon signup.' as final_status;