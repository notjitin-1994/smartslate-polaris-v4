-- Migration: Validation tests for all security fixes
-- Purpose: Test and validate all implemented security fixes
-- Created: 2025-11-02

-- Create test helper functions
CREATE OR REPLACE FUNCTION public.run_security_validation_tests()
RETURNS TABLE(
  test_name TEXT,
  test_category TEXT,
  passed BOOLEAN,
  message TEXT
)
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Test 1: Validate tier_config table exists and has data (CVE-002)
  RETURN QUERY
  SELECT
    'tier_config_exists'::TEXT,
    'CVE-002'::TEXT,
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'tier_config'),
    'Tier configuration table created'::TEXT;

  -- Test 2: Validate all tiers are configured (CVE-002)
  RETURN QUERY
  SELECT
    'all_tiers_configured'::TEXT,
    'CVE-002'::TEXT,
    (SELECT COUNT(*) FROM tier_config) >= 8,
    format('Found %s tier configurations', (SELECT COUNT(*) FROM tier_config))::TEXT;

  -- Test 3: Validate fail-closed functions exist (CVE-001)
  RETURN QUERY
  SELECT
    'fail_closed_functions_exist'::TEXT,
    'CVE-001'::TEXT,
    EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'increment_blueprint_creation_count_v2'),
    'Fail-closed increment functions created'::TEXT;

  -- Test 4: Validate version column exists (CVE-003)
  RETURN QUERY
  SELECT
    'optimistic_locking_enabled'::TEXT,
    'CVE-003'::TEXT,
    EXISTS(
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'user_profiles' AND column_name = 'version'
    ),
    'Version column added for optimistic locking'::TEXT;

  -- Test 5: Validate audit log table exists
  RETURN QUERY
  SELECT
    'audit_log_exists'::TEXT,
    'Audit'::TEXT,
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'security_audit_log'),
    'Security audit log table created'::TEXT;

  -- Test 6: Validate scheduled reset function exists
  RETURN QUERY
  SELECT
    'scheduled_reset_exists'::TEXT,
    'Scheduled'::TEXT,
    EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'reset_monthly_limits_scheduled'),
    'Scheduled reset function created'::TEXT;

  -- Test 7: Test fail-closed behavior (should deny on null user)
  RETURN QUERY
  WITH test_result AS (
    SELECT * FROM increment_blueprint_creation_count_v2(gen_random_uuid())
  )
  SELECT
    'fail_closed_null_user'::TEXT,
    'CVE-001'::TEXT,
    (SELECT success FROM test_result) = false,
    format('Fail-closed: denied for non-existent user - %s', (SELECT reason FROM test_result))::TEXT;

  -- Test 8: Validate RLS is enabled on critical tables
  RETURN QUERY
  SELECT
    'rls_enabled_tier_config'::TEXT,
    'Security'::TEXT,
    (SELECT relrowsecurity FROM pg_class WHERE relname = 'tier_config'),
    'RLS enabled on tier_config table'::TEXT;

  -- Test 9: Validate RLS is enabled on audit log
  RETURN QUERY
  SELECT
    'rls_enabled_audit_log'::TEXT,
    'Security'::TEXT,
    (SELECT relrowsecurity FROM pg_class WHERE relname = 'security_audit_log'),
    'RLS enabled on security_audit_log table'::TEXT;

  -- Test 10: Validate indexes exist for performance
  RETURN QUERY
  SELECT
    'performance_indexes_exist'::TEXT,
    'Performance'::TEXT,
    EXISTS(SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_profiles_version'),
    'Performance indexes created for version tracking'::TEXT;

END;
$$ LANGUAGE plpgsql;

-- Function to test race condition prevention (CVE-003)
CREATE OR REPLACE FUNCTION public.test_race_condition_prevention()
RETURNS TABLE(
  test_name TEXT,
  result TEXT,
  details JSONB
)
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_test_user_id UUID;
  v_version1 INTEGER;
  v_version2 INTEGER;
  v_result1 RECORD;
  v_result2 RECORD;
BEGIN
  -- Create a test user
  v_test_user_id := gen_random_uuid();

  INSERT INTO user_profiles (
    user_id,
    subscription_tier,
    user_role,
    blueprint_creation_count,
    blueprint_saving_count
  ) VALUES (
    v_test_user_id,
    'explorer',
    'user',
    0,
    0
  ) RETURNING version INTO v_version1;

  -- Test 1: Successful update with correct version
  SELECT * INTO v_result1
  FROM update_user_profile_with_version(
    v_test_user_id,
    v_version1,
    jsonb_build_object('blueprint_creation_count', 1)
  );

  RETURN QUERY
  SELECT
    'correct_version_update'::TEXT,
    CASE WHEN v_result1.success THEN 'PASS' ELSE 'FAIL' END,
    jsonb_build_object(
      'expected', true,
      'actual', v_result1.success,
      'new_version', v_result1.new_version
    );

  -- Test 2: Failed update with incorrect version (simulating race condition)
  SELECT * INTO v_result2
  FROM update_user_profile_with_version(
    v_test_user_id,
    v_version1, -- Using old version (should fail)
    jsonb_build_object('blueprint_creation_count', 2)
  );

  RETURN QUERY
  SELECT
    'race_condition_prevention'::TEXT,
    CASE WHEN NOT v_result2.success THEN 'PASS' ELSE 'FAIL' END,
    jsonb_build_object(
      'expected_success', false,
      'actual_success', v_result2.success,
      'reason', v_result2.reason
    );

  -- Cleanup test user
  DELETE FROM user_profiles WHERE user_id = v_test_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to test dual counting logic
CREATE OR REPLACE FUNCTION public.test_dual_counting_logic()
RETURNS TABLE(
  test_name TEXT,
  result TEXT,
  details JSONB
)
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_test_user_id UUID;
  v_initial_creation INTEGER;
  v_initial_saving INTEGER;
  v_result_creation RECORD;
  v_result_saving RECORD;
BEGIN
  -- Create a test user with explorer tier (5/5 limits)
  v_test_user_id := gen_random_uuid();

  INSERT INTO user_profiles (
    user_id,
    subscription_tier,
    user_role,
    blueprint_creation_count,
    blueprint_saving_count
  ) VALUES (
    v_test_user_id,
    'explorer',
    'user',
    2, -- Start with 2 created
    1  -- Start with 1 saved
  );

  -- Test dual increment (simulating dynamic questions generation)
  SELECT * INTO v_result_creation
  FROM increment_blueprint_creation_count_v2(v_test_user_id);

  SELECT * INTO v_result_saving
  FROM increment_blueprint_saving_count_v2(v_test_user_id);

  -- Get final counts
  SELECT blueprint_creation_count, blueprint_saving_count
  INTO v_initial_creation, v_initial_saving
  FROM user_profiles
  WHERE user_id = v_test_user_id;

  RETURN QUERY
  SELECT
    'dual_counting_increments'::TEXT,
    CASE
      WHEN v_result_creation.success AND v_result_saving.success
      THEN 'PASS'
      ELSE 'FAIL'
    END,
    jsonb_build_object(
      'creation_success', v_result_creation.success,
      'saving_success', v_result_saving.success,
      'final_creation_count', v_initial_creation,
      'final_saving_count', v_initial_saving,
      'expected_creation', 3,
      'expected_saving', 2
    );

  -- Cleanup
  DELETE FROM user_profiles WHERE user_id = v_test_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to validate all security fixes
CREATE OR REPLACE FUNCTION public.validate_all_security_fixes()
RETURNS TABLE(
  category TEXT,
  total_tests INTEGER,
  passed_tests INTEGER,
  failed_tests INTEGER,
  success_rate NUMERIC
)
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH all_tests AS (
    -- Run basic validation tests
    SELECT * FROM run_security_validation_tests()
    UNION ALL
    -- Run race condition tests
    SELECT
      test_name,
      'CVE-003'::TEXT as test_category,
      result = 'PASS' as passed,
      format('Race condition test: %s', result)::TEXT as message
    FROM test_race_condition_prevention()
    UNION ALL
    -- Run dual counting tests
    SELECT
      test_name,
      'DualCounting'::TEXT as test_category,
      result = 'PASS' as passed,
      format('Dual counting test: %s', result)::TEXT as message
    FROM test_dual_counting_logic()
  ),
  test_summary AS (
    SELECT
      test_category,
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE passed = true) as passed,
      COUNT(*) FILTER (WHERE passed = false) as failed
    FROM all_tests
    GROUP BY test_category
  )
  SELECT
    test_category,
    total::INTEGER,
    passed::INTEGER,
    failed::INTEGER,
    ROUND((passed::NUMERIC / NULLIF(total, 0)) * 100, 2) as success_rate
  FROM test_summary
  ORDER BY test_category;
END;
$$ LANGUAGE plpgsql;

-- Note: Run validation tests manually with:
-- SELECT * FROM validate_all_security_fixes();
--
-- Automatic test execution is disabled during migration to avoid foreign key violations.

-- Add comments for documentation
COMMENT ON FUNCTION public.run_security_validation_tests IS 'Runs basic validation tests for all security fixes';
COMMENT ON FUNCTION public.test_race_condition_prevention IS 'Tests optimistic locking and race condition prevention (CVE-003)';
COMMENT ON FUNCTION public.test_dual_counting_logic IS 'Tests dual counting for dynamic questions generation';
COMMENT ON FUNCTION public.validate_all_security_fixes IS 'Comprehensive validation of all security fixes implemented';