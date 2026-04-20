-- Fix: Ensure blueprint_usage_metadata column exists
-- This adds the missing column if it doesn't exist

BEGIN;

-- Add blueprint_usage_metadata column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'user_profiles'
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

    RAISE NOTICE 'Added blueprint_usage_metadata column';
  ELSE
    RAISE NOTICE 'blueprint_usage_metadata column already exists';
  END IF;
END $$;

-- Ensure all existing user_profiles have proper metadata
UPDATE user_profiles
SET blueprint_usage_metadata = COALESCE(blueprint_usage_metadata, '{}'::jsonb)
WHERE blueprint_usage_metadata IS NULL;

-- Set exemption for developer users
UPDATE user_profiles
SET blueprint_usage_metadata = jsonb_set(
  jsonb_set(
    COALESCE(blueprint_usage_metadata, '{}'::jsonb),
    '{exempt_from_limits}',
    'true'::jsonb
  ),
  '{exemption_reason}',
  '"Developer exemption"'::jsonb
)
WHERE user_role = 'developer';

-- Verify the fix
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

COMMIT;
