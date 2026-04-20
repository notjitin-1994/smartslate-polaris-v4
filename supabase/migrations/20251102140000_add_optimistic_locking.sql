-- Migration: Add optimistic locking to prevent race conditions
-- Purpose: Fix CVE-003 - Prevent concurrent modifications through version control
-- Created: 2025-11-02

-- Add version column to user_profiles for optimistic locking
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;

-- Create index for faster version lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_version
ON public.user_profiles(user_id, version);

-- Add version column to blueprint_generator for optimistic locking
ALTER TABLE public.blueprint_generator
ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;

-- Create index for blueprint version lookups
CREATE INDEX IF NOT EXISTS idx_blueprint_generator_version
ON public.blueprint_generator(id, version);

-- Function to update user_profiles with version check (generic optimistic locking)
CREATE OR REPLACE FUNCTION public.update_user_profile_with_version(
  p_user_id UUID,
  p_expected_version INTEGER,
  p_updates JSONB
)
RETURNS TABLE(
  success BOOLEAN,
  new_version INTEGER,
  reason TEXT
)
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rows_updated INTEGER;
  v_new_version INTEGER;
  v_update_query TEXT;
BEGIN
  -- Build dynamic update query based on JSONB fields
  -- This is a simplified version - in production, use proper parameterized queries
  UPDATE user_profiles
  SET
    version = version + 1,
    updated_at = NOW(),
    -- Update fields from JSONB (simplified for this example)
    blueprint_creation_count = COALESCE((p_updates->>'blueprint_creation_count')::INTEGER, blueprint_creation_count),
    blueprint_saving_count = COALESCE((p_updates->>'blueprint_saving_count')::INTEGER, blueprint_saving_count),
    subscription_tier = COALESCE(p_updates->>'subscription_tier', subscription_tier),
    user_role = COALESCE(p_updates->>'user_role', user_role)
  WHERE user_id = p_user_id
    AND version = p_expected_version
  RETURNING version INTO v_new_version;

  GET DIAGNOSTICS v_rows_updated = ROW_COUNT;

  IF v_rows_updated = 0 THEN
    -- Check if user exists
    IF EXISTS (SELECT 1 FROM user_profiles WHERE user_id = p_user_id) THEN
      RETURN QUERY SELECT
        false,
        0,
        'Version mismatch - concurrent modification detected. Please refresh and retry.'::TEXT;
    ELSE
      RETURN QUERY SELECT
        false,
        0,
        'User profile not found'::TEXT;
    END IF;
  ELSE
    RETURN QUERY SELECT
      true,
      v_new_version,
      'Update successful'::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to update blueprint_generator with version check
CREATE OR REPLACE FUNCTION public.update_blueprint_with_version(
  p_blueprint_id UUID,
  p_expected_version INTEGER,
  p_updates JSONB
)
RETURNS TABLE(
  success BOOLEAN,
  new_version INTEGER,
  reason TEXT
)
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rows_updated INTEGER;
  v_new_version INTEGER;
BEGIN
  -- Update blueprint with version check
  UPDATE blueprint_generator
  SET
    version = version + 1,
    updated_at = NOW(),
    -- Update fields from JSONB (simplified for this example)
    status = COALESCE(p_updates->>'status', status),
    blueprint_json = COALESCE(p_updates->'blueprint_json', blueprint_json),
    blueprint_markdown = COALESCE(p_updates->>'blueprint_markdown', blueprint_markdown),
    dynamic_questions = COALESCE(p_updates->'dynamic_questions', dynamic_questions),
    dynamic_answers = COALESCE(p_updates->'dynamic_answers', dynamic_answers)
  WHERE id = p_blueprint_id
    AND version = p_expected_version
  RETURNING version INTO v_new_version;

  GET DIAGNOSTICS v_rows_updated = ROW_COUNT;

  IF v_rows_updated = 0 THEN
    -- Check if blueprint exists
    IF EXISTS (SELECT 1 FROM blueprint_generator WHERE id = p_blueprint_id) THEN
      -- Check if user owns the blueprint (for better error messaging)
      IF EXISTS (
        SELECT 1 FROM blueprint_generator
        WHERE id = p_blueprint_id
        AND user_id = auth.uid()
      ) THEN
        RETURN QUERY SELECT
          false,
          0,
          'Version mismatch - blueprint was modified by another process. Please refresh and retry.'::TEXT;
      ELSE
        RETURN QUERY SELECT
          false,
          0,
          'Unauthorized - you do not own this blueprint'::TEXT;
      END IF;
    ELSE
      RETURN QUERY SELECT
        false,
        0,
        'Blueprint not found'::TEXT;
    END IF;
  ELSE
    RETURN QUERY SELECT
      true,
      v_new_version,
      'Blueprint updated successfully'::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Enhanced atomic increment with version tracking
CREATE OR REPLACE FUNCTION public.increment_with_version_check(
  p_user_id UUID,
  p_field TEXT, -- 'creation' or 'saving'
  p_expected_version INTEGER
)
RETURNS TABLE(
  success BOOLEAN,
  new_version INTEGER,
  new_count INTEGER,
  reason TEXT
)
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rows_updated INTEGER;
  v_new_version INTEGER;
  v_new_count INTEGER;
  v_current_count INTEGER;
  v_limit INTEGER;
  v_tier TEXT;
BEGIN
  -- Get current user state
  IF p_field = 'creation' THEN
    SELECT blueprint_creation_count, subscription_tier
    INTO v_current_count, v_tier
    FROM user_profiles
    WHERE user_id = p_user_id;

    -- Get limit from tier config
    SELECT creation_limit INTO v_limit
    FROM get_tier_limits(v_tier);
  ELSE
    SELECT blueprint_saving_count, subscription_tier
    INTO v_current_count, v_tier
    FROM user_profiles
    WHERE user_id = p_user_id;

    -- Get limit from tier config
    SELECT saving_limit INTO v_limit
    FROM get_tier_limits(v_tier);
  END IF;

  -- Check limits (unless unlimited)
  IF v_limit != -1 AND v_current_count >= v_limit THEN
    RETURN QUERY SELECT
      false,
      0,
      v_current_count,
      format('Limit exceeded: %s/%s', v_current_count, v_limit)::TEXT;
    RETURN;
  END IF;

  -- Attempt atomic increment with version check
  IF p_field = 'creation' THEN
    UPDATE user_profiles
    SET
      blueprint_creation_count = blueprint_creation_count + 1,
      version = version + 1,
      updated_at = NOW()
    WHERE user_id = p_user_id
      AND version = p_expected_version
    RETURNING version, blueprint_creation_count
    INTO v_new_version, v_new_count;
  ELSE
    UPDATE user_profiles
    SET
      blueprint_saving_count = blueprint_saving_count + 1,
      version = version + 1,
      updated_at = NOW()
    WHERE user_id = p_user_id
      AND version = p_expected_version
    RETURNING version, blueprint_saving_count
    INTO v_new_version, v_new_count;
  END IF;

  GET DIAGNOSTICS v_rows_updated = ROW_COUNT;

  IF v_rows_updated = 0 THEN
    -- Version mismatch - concurrent modification
    RETURN QUERY SELECT
      false,
      0,
      v_current_count,
      'Concurrent modification detected - another process updated this record. Please retry.'::TEXT;
  ELSE
    RETURN QUERY SELECT
      true,
      v_new_version,
      v_new_count,
      'Increment successful'::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update version on any user_profiles update
CREATE OR REPLACE FUNCTION public.update_version_on_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only increment version if it wasn't already incremented in this update
  IF NEW.version = OLD.version THEN
    NEW.version = OLD.version + 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to user_profiles
DROP TRIGGER IF EXISTS trigger_update_user_profiles_version ON public.user_profiles;
CREATE TRIGGER trigger_update_user_profiles_version
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  WHEN (OLD.* IS DISTINCT FROM NEW.*)
  EXECUTE FUNCTION public.update_version_on_change();

-- Apply trigger to blueprint_generator
DROP TRIGGER IF EXISTS trigger_update_blueprint_generator_version ON public.blueprint_generator;
CREATE TRIGGER trigger_update_blueprint_generator_version
  BEFORE UPDATE ON public.blueprint_generator
  FOR EACH ROW
  WHEN (OLD.* IS DISTINCT FROM NEW.*)
  EXECUTE FUNCTION public.update_version_on_change();

-- Add comments for documentation
COMMENT ON COLUMN public.user_profiles.version IS 'Optimistic locking version number - incremented on each update to prevent race conditions (CVE-003 fix)';
COMMENT ON COLUMN public.blueprint_generator.version IS 'Optimistic locking version number - incremented on each update to prevent race conditions (CVE-003 fix)';
COMMENT ON FUNCTION public.update_user_profile_with_version IS 'Update user profile with optimistic locking check. Prevents concurrent modifications.';
COMMENT ON FUNCTION public.update_blueprint_with_version IS 'Update blueprint with optimistic locking check. Prevents concurrent modifications.';
COMMENT ON FUNCTION public.increment_with_version_check IS 'Atomic increment with version checking to prevent race conditions in concurrent updates.';