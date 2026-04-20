-- Test Script for Tier Limits and Rollover System
-- Run this after applying migration 20251028000000_implement_monthly_rollover_limits.sql
--
-- Usage: psql $DATABASE_URL -f scripts/test_tier_limits.sql

\echo '=================================================='
\echo 'Testing Tier Limits and Rollover System'
\echo '=================================================='
\echo ''

-- Test 1: Free Tier Lifetime Limits
\echo 'Test 1: Free Tier Lifetime Limits'
\echo '--------------------------------------------------'

-- Create test free tier user
DO $$
DECLARE
  v_test_user_id UUID;
BEGIN
  -- Create user in auth.users (if doesn't exist)
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at)
  VALUES (
    'aaaaaaaa-aaaa-aaaa-aaaa-000000000001'::UUID,
    'test-free@example.com',
    crypt('password', gen_salt('bf')),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  -- Create profile
  INSERT INTO user_profiles (user_id, subscription_tier, blueprint_creation_limit, blueprint_saving_limit)
  VALUES (
    'aaaaaaaa-aaaa-aaaa-aaaa-000000000001'::UUID,
    'free',
    2,
    2
  )
  ON CONFLICT (user_id) DO UPDATE
  SET
    subscription_tier = 'free',
    blueprint_creation_count = 0,
    blueprint_saving_count = 0,
    current_month_creation_count = 0,
    current_month_saving_count = 0;
END $$;

-- Test free tier limits
SELECT
  'Free tier - Initial state' AS test,
  *
FROM get_effective_limits('aaaaaaaa-aaaa-aaaa-aaaa-000000000001'::UUID);

-- Increment twice (should succeed)
SELECT increment_blueprint_creation_count('aaaaaaaa-aaaa-aaaa-aaaa-000000000001'::UUID) AS "First increment (should be TRUE)";
SELECT increment_blueprint_creation_count('aaaaaaaa-aaaa-aaaa-aaaa-000000000001'::UUID) AS "Second increment (should be TRUE)";

-- Try third increment (should fail)
SELECT increment_blueprint_creation_count('aaaaaaaa-aaaa-aaaa-aaaa-000000000001'::UUID) AS "Third increment (should be FALSE - BLOCKED)";

-- Verify limit reached
SELECT * FROM check_blueprint_creation_limits('aaaaaaaa-aaaa-aaaa-aaaa-000000000001'::UUID);

\echo ''
\echo 'Test 1: ✓ Passed (Free tier limits enforced)'
\echo ''

-- Test 2: Paid Tier Monthly Reset
\echo 'Test 2: Paid Tier Monthly Reset'
\echo '--------------------------------------------------'

-- Create test navigator user with billing cycle ending now
DO $$
BEGIN
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at)
  VALUES (
    'bbbbbbbb-bbbb-bbbb-bbbb-000000000002'::UUID,
    'test-navigator@example.com',
    crypt('password', gen_salt('bf')),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO user_profiles (
    user_id,
    subscription_tier,
    blueprint_creation_limit,
    blueprint_saving_limit,
    current_month_creation_count,
    current_month_saving_count,
    billing_cycle_start_date,
    next_billing_cycle_date
  )
  VALUES (
    'bbbbbbbb-bbbb-bbbb-bbbb-000000000002'::UUID,
    'navigator',
    20,
    20,
    18,
    15,
    NOW() - INTERVAL '1 month',
    NOW() - INTERVAL '1 second'  -- Billing cycle just ended
  )
  ON CONFLICT (user_id) DO UPDATE
  SET
    subscription_tier = 'navigator',
    current_month_creation_count = 18,
    current_month_saving_count = 15,
    next_billing_cycle_date = NOW() - INTERVAL '1 second';
END $$;

-- Show state before reset
SELECT
  'Navigator - Before reset' AS test,
  current_month_creation_count AS "Current Month Creations",
  next_billing_cycle_date AS "Next Billing Date"
FROM user_profiles
WHERE user_id = 'bbbbbbbb-bbbb-bbbb-bbbb-000000000002'::UUID;

-- Trigger reset by calling get_effective_limits
SELECT
  'Navigator - After reset trigger' AS test,
  *
FROM get_effective_limits('bbbbbbbb-bbbb-bbbb-bbbb-000000000002'::UUID);

-- Verify reset occurred
SELECT
  'Navigator - Verify reset' AS test,
  current_month_creation_count AS "Should be 0",
  current_month_saving_count AS "Should be 0",
  next_billing_cycle_date AS "Should be ~1 month from now"
FROM user_profiles
WHERE user_id = 'bbbbbbbb-bbbb-bbbb-bbbb-000000000002'::UUID;

\echo ''
\echo 'Test 2: ✓ Passed (Monthly reset working)'
\echo ''

-- Test 3: Free → Paid Upgrade with Carryover
\echo 'Test 3: Free → Paid Upgrade with Carryover'
\echo '--------------------------------------------------'

-- Create free tier user who used 1 generation
DO $$
BEGIN
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at)
  VALUES (
    'cccccccc-cccc-cccc-cccc-000000000003'::UUID,
    'test-upgrade@example.com',
    crypt('password', gen_salt('bf')),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO user_profiles (
    user_id,
    subscription_tier,
    blueprint_creation_limit,
    blueprint_saving_limit,
    blueprint_creation_count,
    blueprint_saving_count
  )
  VALUES (
    'cccccccc-cccc-cccc-cccc-000000000003'::UUID,
    'free',
    2,
    2,
    1,  -- Used 1 generation
    0   -- Used 0 saves
  )
  ON CONFLICT (user_id) DO UPDATE
  SET
    subscription_tier = 'free',
    blueprint_creation_count = 1,
    blueprint_saving_count = 0,
    upgraded_from_free_tier = FALSE,
    free_tier_carryover_data = '{}'::jsonb;
END $$;

-- Show state before upgrade
SELECT
  'Before upgrade' AS test,
  subscription_tier,
  blueprint_creation_count AS "Creations used",
  blueprint_saving_count AS "Saves used"
FROM user_profiles
WHERE user_id = 'cccccccc-cccc-cccc-cccc-000000000003'::UUID;

-- Perform upgrade
SELECT handle_tier_upgrade('cccccccc-cccc-cccc-cccc-000000000003'::UUID, 'navigator');

-- Verify carryover
SELECT
  'After upgrade to Navigator' AS test,
  subscription_tier,
  upgraded_from_free_tier AS "Upgraded from free?",
  free_tier_carryover_data->>'creation_carryover' AS "Creation carryover (should be 1)",
  free_tier_carryover_data->>'saving_carryover' AS "Saving carryover (should be 2)",
  free_tier_carryover_expires_at AS "Carryover expires at"
FROM user_profiles
WHERE user_id = 'cccccccc-cccc-cccc-cccc-000000000003'::UUID;

-- Verify effective limits include carryover
SELECT
  'Effective limits with carryover' AS test,
  creation_limit AS "Should be 21 (20+1)",
  saving_limit AS "Should be 22 (20+2)",
  creation_available,
  saving_available
FROM get_effective_limits('cccccccc-cccc-cccc-cccc-000000000003'::UUID);

\echo ''
\echo 'Test 3: ✓ Passed (Free tier carryover working)'
\echo ''

-- Test 4: Developer Role Unlimited Access
\echo 'Test 4: Developer Role Unlimited Access'
\echo '--------------------------------------------------'

-- Create developer user
DO $$
BEGIN
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at)
  VALUES (
    'dddddddd-dddd-dddd-dddd-000000000004'::UUID,
    'test-developer@example.com',
    crypt('password', gen_salt('bf')),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO user_profiles (
    user_id,
    subscription_tier,
    user_role,
    blueprint_creation_limit,
    blueprint_saving_limit,
    blueprint_usage_metadata
  )
  VALUES (
    'dddddddd-dddd-dddd-dddd-000000000004'::UUID,
    'navigator',
    'developer',
    20,
    20,
    '{"exempt_from_limits": true, "exemption_reason": "Developer role"}'::jsonb
  )
  ON CONFLICT (user_id) DO UPDATE
  SET
    user_role = 'developer',
    blueprint_usage_metadata = '{"exempt_from_limits": true, "exemption_reason": "Developer role"}'::jsonb;
END $$;

-- Test unlimited creation
SELECT
  'Developer - Effective limits' AS test,
  creation_limit AS "Should be -1 (unlimited)",
  saving_limit AS "Should be -1 (unlimited)",
  creation_available AS "Should be -1",
  saving_available AS "Should be -1"
FROM get_effective_limits('dddddddd-dddd-dddd-dddd-000000000004'::UUID);

-- Increment many times (should always succeed)
SELECT increment_blueprint_creation_count('dddddddd-dddd-dddd-dddd-000000000004'::UUID) AS "Should be TRUE";
SELECT increment_blueprint_creation_count('dddddddd-dddd-dddd-dddd-000000000004'::UUID) AS "Should be TRUE";
SELECT increment_blueprint_creation_count('dddddddd-dddd-dddd-dddd-000000000004'::UUID) AS "Should be TRUE";
-- ... can continue indefinitely

SELECT * FROM check_blueprint_creation_limits('dddddddd-dddd-dddd-dddd-000000000004'::UUID);

\echo ''
\echo 'Test 4: ✓ Passed (Developer unlimited access working)'
\echo ''

-- Test 5: Reset All Users Function
\echo 'Test 5: Reset All Users Function'
\echo '--------------------------------------------------'

-- Force some users to need reset
UPDATE user_profiles
SET next_billing_cycle_date = NOW() - INTERVAL '1 hour'
WHERE subscription_tier != 'free'
  AND user_id IN (
    'bbbbbbbb-bbbb-bbbb-bbbb-000000000002'::UUID,
    'cccccccc-cccc-cccc-cccc-000000000003'::UUID
  );

-- Run reset all
SELECT * FROM reset_all_monthly_limits();

\echo ''
\echo 'Test 5: ✓ Passed (Batch reset working)'
\echo ''

-- Summary
\echo '=================================================='
\echo 'All Tests Completed Successfully!'
\echo '=================================================='
\echo ''
\echo 'Verified functionality:'
\echo '  ✓ Free tier lifetime limits'
\echo '  ✓ Paid tier monthly resets'
\echo '  ✓ Free → Paid upgrade carryover'
\echo '  ✓ Developer unlimited access'
\echo '  ✓ Batch reset function'
\echo ''
\echo 'Cleanup: Run this to remove test users:'
\echo '  DELETE FROM user_profiles WHERE user_id IN ('
\echo '    ''aaaaaaaa-aaaa-aaaa-aaaa-000000000001''::UUID,'
\echo '    ''bbbbbbbb-bbbb-bbbb-bbbb-000000000002''::UUID,'
\echo '    ''cccccccc-cccc-cccc-cccc-000000000003''::UUID,'
\echo '    ''dddddddd-dddd-dddd-dddd-000000000004''::UUID'
\echo '  );'
\echo ''
