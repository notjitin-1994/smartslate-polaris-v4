-- ============================================================================
-- BLUEPRINT MIGRATION SCRIPT
-- Migrate blueprints from not.jitin@gmail.com to jitin@smartslate.io
-- ============================================================================
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql
-- ============================================================================

-- STEP 1: Find user IDs
-- ============================================================================
DO $$
DECLARE
  v_source_user_id UUID;
  v_target_user_id UUID;
  v_blueprint_count INTEGER;
  v_migrated_count INTEGER;
BEGIN
  -- Get source user ID (not.jitin@gmail.com)
  SELECT au.id INTO v_source_user_id
  FROM auth.users au
  WHERE au.email = 'not.jitin@gmail.com';

  -- Get target user ID (jitin@smartslate.io)
  SELECT au.id INTO v_target_user_id
  FROM auth.users au
  WHERE au.email = 'jitin@smartslate.io';

  -- Verify both users exist
  IF v_source_user_id IS NULL THEN
    RAISE EXCEPTION 'Source user not.jitin@gmail.com not found';
  END IF;

  IF v_target_user_id IS NULL THEN
    RAISE EXCEPTION 'Target user jitin@smartslate.io not found';
  END IF;

  -- Display user IDs for verification
  RAISE NOTICE 'Source User ID (not.jitin@gmail.com): %', v_source_user_id;
  RAISE NOTICE 'Target User ID (jitin@smartslate.io): %', v_target_user_id;

  -- Count blueprints to migrate
  SELECT COUNT(*) INTO v_blueprint_count
  FROM blueprint_generator
  WHERE user_id = v_source_user_id
    AND deleted_at IS NULL;

  RAISE NOTICE 'Blueprints to migrate: %', v_blueprint_count;

  IF v_blueprint_count = 0 THEN
    RAISE NOTICE 'No blueprints to migrate. Exiting.';
    RETURN;
  END IF;

  -- STEP 2: Migrate blueprints
  -- ============================================================================
  RAISE NOTICE 'Starting migration...';

  UPDATE blueprint_generator
  SET
    user_id = v_target_user_id,
    updated_at = NOW()
  WHERE user_id = v_source_user_id
    AND deleted_at IS NULL;

  GET DIAGNOSTICS v_migrated_count = ROW_COUNT;

  RAISE NOTICE 'Migrated % blueprints', v_migrated_count;

  -- STEP 3: Update usage counters
  -- ============================================================================
  RAISE NOTICE 'Updating usage counters...';

  -- Get actual counts after migration
  DECLARE
    v_target_creation_count INTEGER;
    v_target_saving_count INTEGER;
  BEGIN
    -- Count blueprints for target user (all statuses for creation)
    SELECT COUNT(*) INTO v_target_creation_count
    FROM blueprint_generator
    WHERE user_id = v_target_user_id
      AND deleted_at IS NULL;

    -- Count saved blueprints for target user (completed status)
    SELECT COUNT(*) INTO v_target_saving_count
    FROM blueprint_generator
    WHERE user_id = v_target_user_id
      AND status = 'completed'
      AND deleted_at IS NULL;

    -- Update target user's counters
    UPDATE user_profiles
    SET
      blueprint_creation_count = v_target_creation_count,
      blueprint_saving_count = v_target_saving_count,
      updated_at = NOW()
    WHERE user_id = v_target_user_id;

    -- Reset source user's counters to 0
    UPDATE user_profiles
    SET
      blueprint_creation_count = 0,
      blueprint_saving_count = 0,
      updated_at = NOW()
    WHERE user_id = v_source_user_id;

    RAISE NOTICE 'Updated target user counters: creation=%, saving=%',
      v_target_creation_count, v_target_saving_count;
    RAISE NOTICE 'Reset source user counters to 0';
  END;

  -- STEP 4: Verification
  -- ============================================================================
  RAISE NOTICE 'Verifying migration...';

  DECLARE
    v_source_remaining INTEGER;
    v_target_total INTEGER;
  BEGIN
    -- Check source user has no more blueprints
    SELECT COUNT(*) INTO v_source_remaining
    FROM blueprint_generator
    WHERE user_id = v_source_user_id
      AND deleted_at IS NULL;

    -- Check target user's total blueprints
    SELECT COUNT(*) INTO v_target_total
    FROM blueprint_generator
    WHERE user_id = v_target_user_id
      AND deleted_at IS NULL;

    RAISE NOTICE 'Source user remaining blueprints: %', v_source_remaining;
    RAISE NOTICE 'Target user total blueprints: %', v_target_total;

    IF v_source_remaining = 0 AND v_target_total >= v_blueprint_count THEN
      RAISE NOTICE '✅ Migration completed successfully!';
    ELSE
      RAISE WARNING '⚠️ Migration may have issues. Please verify manually.';
    END IF;
  END;

END $$;

-- ============================================================================
-- OPTIONAL: View migration results
-- ============================================================================

-- Check source user blueprints (should be 0)
SELECT
  'Source User (not.jitin@gmail.com)' as account,
  COUNT(*) as blueprint_count
FROM blueprint_generator bg
JOIN auth.users au ON au.id = bg.user_id
WHERE au.email = 'not.jitin@gmail.com'
  AND bg.deleted_at IS NULL

UNION ALL

-- Check target user blueprints (should have all)
SELECT
  'Target User (jitin@smartslate.io)' as account,
  COUNT(*) as blueprint_count
FROM blueprint_generator bg
JOIN auth.users au ON au.id = bg.user_id
WHERE au.email = 'jitin@smartslate.io'
  AND bg.deleted_at IS NULL;

-- ============================================================================
-- View blueprint details for target user
-- ============================================================================
SELECT
  bg.id,
  bg.title,
  bg.status,
  bg.created_at,
  bg.updated_at
FROM blueprint_generator bg
JOIN auth.users au ON au.id = bg.user_id
WHERE au.email = 'jitin@smartslate.io'
  AND bg.deleted_at IS NULL
ORDER BY bg.created_at DESC;
