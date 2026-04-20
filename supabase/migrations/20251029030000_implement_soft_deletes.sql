-- Migration: Implement soft deletes for blueprints
-- Date: 2025-10-29
-- Description: Add deleted_at column and update counting logic
-- - Creation count: Includes deleted blueprints (cumulative for billing period)
-- - Saving count: Excludes deleted blueprints (current saved)

-- Add deleted_at column to blueprint_generator
ALTER TABLE public.blueprint_generator
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN public.blueprint_generator.deleted_at IS
'Timestamp when blueprint was soft-deleted. NULL means not deleted.
Deleted blueprints still count toward creation limits but not saving limits.';

-- Create index for efficient queries on non-deleted blueprints
CREATE INDEX IF NOT EXISTS idx_blueprint_generator_not_deleted
ON public.blueprint_generator(user_id, created_at)
WHERE deleted_at IS NULL;

-- Update get_actual_blueprint_creation_count
-- Counts ALL blueprints created (including deleted ones)
CREATE OR REPLACE FUNCTION get_actual_blueprint_creation_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Count ALL blueprints for this user, including soft-deleted ones
  -- Creation count is cumulative for the billing period
  SELECT COUNT(*)::INTEGER
  INTO v_count
  FROM public.blueprint_generator
  WHERE user_id = p_user_id;

  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION get_actual_blueprint_creation_count IS
'Counts all blueprints created by user, including soft-deleted ones.
This is cumulative for the billing period and only resets on subscription renewal.';

-- Update get_actual_blueprint_saving_count
-- Counts ONLY non-deleted blueprints with data
CREATE OR REPLACE FUNCTION get_actual_blueprint_saving_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Count only NON-DELETED blueprints that have blueprint_json data
  -- Saving count reflects current saved blueprints
  SELECT COUNT(*)::INTEGER
  INTO v_count
  FROM public.blueprint_generator
  WHERE user_id = p_user_id
    AND blueprint_json IS NOT NULL
    AND deleted_at IS NULL;  -- Exclude soft-deleted blueprints

  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION get_actual_blueprint_saving_count IS
'Counts non-deleted blueprints with data (blueprint_json IS NOT NULL).
Excludes soft-deleted blueprints. This reflects current saved blueprints.';

-- Update get_actual_current_month_counts
CREATE OR REPLACE FUNCTION get_actual_current_month_counts(
  p_user_id UUID,
  p_billing_cycle_start TIMESTAMPTZ
)
RETURNS TABLE(
  creation_count INTEGER,
  saving_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    -- Creation: Count all blueprints in this billing period (including deleted)
    COUNT(*)::INTEGER as creation_count,
    -- Saving: Count only non-deleted blueprints with data in this billing period
    COUNT(*) FILTER (
      WHERE blueprint_json IS NOT NULL
        AND deleted_at IS NULL
    )::INTEGER as saving_count
  FROM public.blueprint_generator
  WHERE user_id = p_user_id
    AND created_at >= p_billing_cycle_start;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION get_actual_current_month_counts IS
'Returns blueprint counts for the current billing cycle.
Creation count includes deleted blueprints (cumulative).
Saving count excludes deleted blueprints (current saved).';

-- Create function to soft-delete a blueprint
CREATE OR REPLACE FUNCTION soft_delete_blueprint(p_blueprint_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_updated BOOLEAN;
BEGIN
  -- Soft delete by setting deleted_at timestamp
  -- Only allow users to delete their own blueprints
  UPDATE public.blueprint_generator
  SET deleted_at = NOW()
  WHERE id = p_blueprint_id
    AND user_id = p_user_id
    AND deleted_at IS NULL;  -- Can't delete already deleted blueprints

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  RETURN v_updated > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION soft_delete_blueprint IS
'Soft deletes a blueprint by setting deleted_at timestamp.
Returns true if blueprint was deleted, false if not found or already deleted.
Only allows users to delete their own blueprints.';

-- Create function to restore a soft-deleted blueprint
CREATE OR REPLACE FUNCTION restore_blueprint(p_blueprint_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_updated BOOLEAN;
BEGIN
  -- Restore by clearing deleted_at timestamp
  UPDATE public.blueprint_generator
  SET deleted_at = NULL
  WHERE id = p_blueprint_id
    AND user_id = p_user_id
    AND deleted_at IS NOT NULL;  -- Can only restore deleted blueprints

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  RETURN v_updated > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION restore_blueprint IS
'Restores a soft-deleted blueprint by clearing deleted_at timestamp.
Returns true if blueprint was restored, false if not found or not deleted.';

-- Create function to permanently delete old soft-deleted blueprints (cleanup)
CREATE OR REPLACE FUNCTION cleanup_old_deleted_blueprints(p_days_old INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  -- Permanently delete blueprints that have been soft-deleted for more than p_days_old days
  DELETE FROM public.blueprint_generator
  WHERE deleted_at IS NOT NULL
    AND deleted_at < NOW() - (p_days_old || ' days')::INTERVAL;

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_old_deleted_blueprints IS
'Permanently deletes blueprints that have been soft-deleted for more than the specified days.
Default is 30 days. Should be run periodically as a maintenance job.
Returns the number of blueprints permanently deleted.';
