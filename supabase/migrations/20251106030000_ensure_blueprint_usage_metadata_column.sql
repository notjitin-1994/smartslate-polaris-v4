-- Migration: Ensure blueprint_usage_metadata column exists
-- This is an idempotent migration that safely adds the column if missing
-- Related to: 0027_add_blueprint_usage_tracking.sql
-- Issue: Production database missing blueprint_usage_metadata column causing increment_blueprint_saving_count to fail

BEGIN;

-- Add blueprint_usage_metadata column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'user_profiles'
    AND column_name = 'blueprint_usage_metadata'
  ) THEN
    ALTER TABLE user_profiles
    ADD COLUMN blueprint_usage_metadata JSONB DEFAULT '{
      "creation_reset_date": null,
      "saving_reset_date": null,
      "exempt_from_limits": false,
      "exemption_reason": null,
      "last_blueprint_created": null,
      "last_blueprint_saved": null
    }'::jsonb;

    RAISE NOTICE 'Added blueprint_usage_metadata column to user_profiles';
  ELSE
    RAISE NOTICE 'blueprint_usage_metadata column already exists in user_profiles';
  END IF;
END $$;

-- Ensure all existing user_profiles have proper metadata (fill in NULL values)
UPDATE user_profiles
SET blueprint_usage_metadata = '{
  "creation_reset_date": null,
  "saving_reset_date": null,
  "exempt_from_limits": false,
  "exemption_reason": null,
  "last_blueprint_created": null,
  "last_blueprint_saved": null
}'::jsonb
WHERE blueprint_usage_metadata IS NULL;

-- Set exemption for developer users (admins should not count against limits)
UPDATE user_profiles
SET blueprint_usage_metadata = jsonb_set(
  jsonb_set(
    COALESCE(blueprint_usage_metadata, '{}'::jsonb),
    '{exempt_from_limits}',
    'true'::jsonb
  ),
  '{exemption_reason}',
  '"Developer/Admin exemption"'::jsonb
)
WHERE user_role = 'developer'
AND (
  blueprint_usage_metadata->>'exempt_from_limits' IS NULL
  OR (blueprint_usage_metadata->>'exempt_from_limits')::boolean = false
);

-- Verify the fix
DO $$
DECLARE
  column_exists BOOLEAN;
  user_count INTEGER;
  dev_count INTEGER;
BEGIN
  -- Check if column exists
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'user_profiles'
    AND column_name = 'blueprint_usage_metadata'
  ) INTO column_exists;

  -- Count users with metadata
  SELECT COUNT(*) INTO user_count
  FROM user_profiles
  WHERE blueprint_usage_metadata IS NOT NULL;

  -- Count developers with exemption
  SELECT COUNT(*) INTO dev_count
  FROM user_profiles
  WHERE user_role = 'developer'
  AND (blueprint_usage_metadata->>'exempt_from_limits')::boolean = true;

  RAISE NOTICE 'Migration verification:';
  RAISE NOTICE '  - Column exists: %', column_exists;
  RAISE NOTICE '  - Users with metadata: %', user_count;
  RAISE NOTICE '  - Developers with exemption: %', dev_count;

  IF NOT column_exists THEN
    RAISE EXCEPTION 'Migration failed: blueprint_usage_metadata column not created';
  END IF;
END $$;

COMMIT;

-- Display sample of user_profiles to verify structure
SELECT
  user_id,
  email,
  user_role,
  blueprint_creation_count,
  blueprint_saving_count,
  blueprint_creation_limit,
  blueprint_saving_limit,
  blueprint_usage_metadata
FROM user_profiles
ORDER BY created_at DESC
LIMIT 5;
