-- Migration: 0027_add_blueprint_usage_tracking.sql
-- Description: Add blueprint creation and saving limits tracking
-- Author: System
-- Date: 2025-10-16

BEGIN;

-- Add blueprint usage tracking columns to user_profiles table (skip if exists)
DO $$
BEGIN
  -- Check and add columns only if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'blueprint_creation_count') THEN
    ALTER TABLE user_profiles ADD COLUMN blueprint_creation_count INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'blueprint_saving_count') THEN
    ALTER TABLE user_profiles ADD COLUMN blueprint_saving_count INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'blueprint_creation_limit') THEN
    ALTER TABLE user_profiles ADD COLUMN blueprint_creation_limit INTEGER DEFAULT 2;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'blueprint_saving_limit') THEN
    ALTER TABLE user_profiles ADD COLUMN blueprint_saving_limit INTEGER DEFAULT 2;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'blueprint_usage_metadata') THEN
    ALTER TABLE user_profiles ADD COLUMN blueprint_usage_metadata JSONB DEFAULT '{
      "creation_reset_date": null,
      "saving_reset_date": null,
      "exempt_from_limits": false,
      "exemption_reason": null,
      "last_blueprint_created": null,
      "last_blueprint_saved": null
    }'::jsonb;
  END IF;
END $$;

-- Create index on blueprint counts for performance (skip if exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'user_profiles' AND indexname = 'idx_user_profiles_blueprint_counts') THEN
    CREATE INDEX idx_user_profiles_blueprint_counts ON user_profiles(blueprint_creation_count, blueprint_saving_count);
  END IF;
END $$;

-- Create function to increment blueprint creation count
CREATE OR REPLACE FUNCTION increment_blueprint_creation_count(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_count INTEGER;
  limit_count INTEGER;
  is_exempt BOOLEAN;
BEGIN
  -- Check if user is exempt from limits
  SELECT (blueprint_usage_metadata->>'exempt_from_limits')::boolean
  INTO is_exempt
  FROM user_profiles
  WHERE user_id = p_user_id;

  -- If exempt, allow unlimited creation
  IF is_exempt THEN
    UPDATE user_profiles
    SET
      blueprint_creation_count = blueprint_creation_count + 1,
      blueprint_usage_metadata = jsonb_set(
        blueprint_usage_metadata,
        '{last_blueprint_created}',
        to_jsonb(NOW())
      )
    WHERE user_id = p_user_id;
    RETURN TRUE;
  END IF;

  -- Check current count against limit
  SELECT blueprint_creation_count, blueprint_creation_limit
  INTO current_count, limit_count
  FROM user_profiles
  WHERE user_id = p_user_id;

  IF current_count >= limit_count THEN
    RETURN FALSE; -- Limit exceeded
  END IF;

  -- Increment count and update timestamp
  UPDATE user_profiles
  SET
    blueprint_creation_count = blueprint_creation_count + 1,
    blueprint_usage_metadata = jsonb_set(
      blueprint_usage_metadata,
      '{last_blueprint_created}',
      to_jsonb(NOW())
    )
  WHERE user_id = p_user_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to increment blueprint saving count
CREATE OR REPLACE FUNCTION increment_blueprint_saving_count(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_count INTEGER;
  limit_count INTEGER;
  is_exempt BOOLEAN;
BEGIN
  -- Check if user is exempt from limits
  SELECT (blueprint_usage_metadata->>'exempt_from_limits')::boolean
  INTO is_exempt
  FROM user_profiles
  WHERE user_id = p_user_id;

  -- If exempt, allow unlimited saving
  IF is_exempt THEN
    UPDATE user_profiles
    SET
      blueprint_saving_count = blueprint_saving_count + 1,
      blueprint_usage_metadata = jsonb_set(
        blueprint_usage_metadata,
        '{last_blueprint_saved}',
        to_jsonb(NOW())
      )
    WHERE user_id = p_user_id;
    RETURN TRUE;
  END IF;

  -- Check current count against limit
  SELECT blueprint_saving_count, blueprint_saving_limit
  INTO current_count, limit_count
  FROM user_profiles
  WHERE user_id = p_user_id;

  IF current_count >= limit_count THEN
    RETURN FALSE; -- Limit exceeded
  END IF;

  -- Increment count and update timestamp
  UPDATE user_profiles
  SET
    blueprint_saving_count = blueprint_saving_count + 1,
    blueprint_usage_metadata = jsonb_set(
      blueprint_usage_metadata,
      '{last_blueprint_saved}',
      to_jsonb(NOW())
    )
  WHERE user_id = p_user_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get blueprint usage info for a user
CREATE OR REPLACE FUNCTION get_blueprint_usage_info(p_user_id UUID)
RETURNS TABLE(
  creation_count INTEGER,
  saving_count INTEGER,
  creation_limit INTEGER,
  saving_limit INTEGER,
  is_exempt BOOLEAN,
  exemption_reason TEXT,
  last_creation TIMESTAMPTZ,
  last_saving TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    up.blueprint_creation_count,
    up.blueprint_saving_count,
    up.blueprint_creation_limit,
    up.blueprint_saving_limit,
    (up.blueprint_usage_metadata->>'exempt_from_limits')::boolean,
    up.blueprint_usage_metadata->>'exemption_reason',
    (up.blueprint_usage_metadata->>'last_blueprint_created')::TIMESTAMPTZ,
    (up.blueprint_usage_metadata->>'last_blueprint_saved')::TIMESTAMPTZ
  FROM user_profiles up
  WHERE up.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to exempt user from limits (for developers)
CREATE OR REPLACE FUNCTION exempt_user_from_blueprint_limits(
  p_user_id UUID,
  p_reason TEXT DEFAULT 'Developer exemption'
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE user_profiles
  SET blueprint_usage_metadata = jsonb_set(
    jsonb_set(blueprint_usage_metadata, '{exempt_from_limits}', 'true'::jsonb),
    '{exemption_reason}', to_jsonb(p_reason)
  )
  WHERE user_id = p_user_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-exempt not.jitin@gmail.com user
CREATE OR REPLACE FUNCTION auto_exempt_developer_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-exempt not.jitin@gmail.com from blueprint limits
  IF NEW.user_id IN (
    SELECT id FROM auth.users
    WHERE email = 'not.jitin@gmail.com'
  ) THEN
    NEW.blueprint_usage_metadata = jsonb_set(
      NEW.blueprint_usage_metadata,
      '{exempt_from_limits}',
      'true'::jsonb
    );
    NEW.blueprint_usage_metadata = jsonb_set(
      NEW.blueprint_usage_metadata,
      '{exemption_reason}',
      '"Developer exemption - not.jitin@gmail.com"'::jsonb
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to user_profiles (skip if exists)
DO $$
BEGIN
  -- Drop existing trigger if it exists
  DROP TRIGGER IF EXISTS trigger_auto_exempt_developer ON user_profiles;

  -- Create new trigger
  CREATE TRIGGER trigger_auto_exempt_developer
    BEFORE INSERT ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION auto_exempt_developer_user();
EXCEPTION
  WHEN OTHERS THEN
    -- If function doesn't exist, skip trigger creation
    NULL;
END $$;

-- Initialize all user profiles with blueprint usage fields and proper defaults
-- This ensures both new and existing users get the proper default values
UPDATE user_profiles
SET
  blueprint_creation_count = COALESCE(blueprint_creation_count, 0),
  blueprint_saving_count = COALESCE(blueprint_saving_count, 0),
  blueprint_creation_limit = COALESCE(blueprint_creation_limit, 2),
  blueprint_saving_limit = COALESCE(blueprint_saving_limit, 2),
  blueprint_usage_metadata = COALESCE(blueprint_usage_metadata, '{}'::jsonb);

-- Set exemption status for developer user BEFORE counting blueprints
-- This ensures not.jitin@gmail.com is exempt from limits but existing blueprints don't count against them
UPDATE user_profiles
SET blueprint_usage_metadata = jsonb_set(
  jsonb_set(blueprint_usage_metadata, '{exempt_from_limits}', 'true'::jsonb),
  '{exemption_reason}', '"Developer exemption - not.jitin@gmail.com"'::jsonb
)
WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'not.jitin@gmail.com');

-- Count existing blueprints for each user and update their counts
-- This ensures users who already have blueprints get their counts updated
-- For exempt users (like not.jitin@gmail.com), this sets their counts but limits are ignored in enforcement
UPDATE user_profiles
SET
  blueprint_creation_count = (
    SELECT COUNT(*)
    FROM blueprint_generator bg
    WHERE bg.user_id = user_profiles.user_id
  ),
  blueprint_saving_count = (
    SELECT COUNT(*)
    FROM blueprint_generator bg
    WHERE bg.user_id = user_profiles.user_id
    AND bg.status = 'completed'
  );

-- Ensure developer exemption is maintained after counting (in case the count update affected it)
UPDATE user_profiles
SET blueprint_usage_metadata = jsonb_set(
  jsonb_set(blueprint_usage_metadata, '{exempt_from_limits}', 'true'::jsonb),
  '{exemption_reason}', '"Developer exemption - not.jitin@gmail.com"'::jsonb
)
WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'not.jitin@gmail.com');

COMMIT;
