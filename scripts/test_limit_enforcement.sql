-- Test script to verify blueprint limit enforcement
-- Run this in your Supabase SQL editor or via psql

-- Create a test user with free tier (2 creation limit)
DO $$
DECLARE
  v_test_user_id UUID := gen_random_uuid();
BEGIN
  -- Insert test user profile
  INSERT INTO public.user_profiles (
    user_id,
    subscription_tier,
    user_role,
    blueprint_creation_limit,
    blueprint_saving_limit,
    blueprint_creation_count,
    current_month_creation_count
  ) VALUES (
    v_test_user_id,
    'free',
    'user',  -- Valid role: user, developer, or admin
    2,  -- Free tier limit
    2,
    0,  -- No blueprints created yet
    0
  );

  RAISE NOTICE 'Created test user: %', v_test_user_id;

  -- Test 1: User should be able to create (0/2 used)
  RAISE NOTICE '=== Test 1: Check initial creation ability ===';
  PERFORM * FROM check_blueprint_creation_limits(v_test_user_id);
  RAISE NOTICE 'Result: %', (SELECT can_create FROM check_blueprint_creation_limits(v_test_user_id));

  -- Test 2: Increment count to 1
  RAISE NOTICE '=== Test 2: Increment to 1/2 ===';
  PERFORM increment_blueprint_creation_count(v_test_user_id);
  PERFORM * FROM check_blueprint_creation_limits(v_test_user_id);
  RAISE NOTICE 'Result: %', (SELECT can_create FROM check_blueprint_creation_limits(v_test_user_id));

  -- Test 3: Increment count to 2 (at limit)
  RAISE NOTICE '=== Test 3: Increment to 2/2 (at limit) ===';
  PERFORM increment_blueprint_creation_count(v_test_user_id);
  PERFORM * FROM check_blueprint_creation_limits(v_test_user_id);
  RAISE NOTICE 'Result: %', (SELECT can_create FROM check_blueprint_creation_limits(v_test_user_id));
  RAISE NOTICE 'Reason: %', (SELECT reason FROM check_blueprint_creation_limits(v_test_user_id));

  -- Test 4: Try to create beyond limit
  RAISE NOTICE '=== Test 4: Try to increment beyond limit ===';
  BEGIN
    PERFORM increment_blueprint_creation_count(v_test_user_id);
    RAISE NOTICE 'ERROR: Should not have allowed increment!';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Correctly blocked: %', SQLERRM;
  END;

  -- Cleanup
  DELETE FROM public.user_profiles WHERE user_id = v_test_user_id;
  RAISE NOTICE 'Test user deleted';
END $$;

-- Show effective limits for any existing users
SELECT
  user_id,
  subscription_tier,
  blueprint_creation_count,
  blueprint_creation_limit,
  current_month_creation_count,
  (SELECT can_create FROM check_blueprint_creation_limits(user_id)) as can_create_now,
  (SELECT remaining FROM check_blueprint_creation_limits(user_id)) as remaining_creations
FROM user_profiles
LIMIT 5;
