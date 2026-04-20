-- Migration: Fix type mismatch in soft delete functions
-- Date: 2025-10-29
-- Description: Fix v_updated variable type from BOOLEAN to INTEGER
-- Bug: ROW_COUNT returns INTEGER, not BOOLEAN

-- Fix soft_delete_blueprint function
CREATE OR REPLACE FUNCTION soft_delete_blueprint(p_blueprint_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_updated INTEGER;  -- FIXED: Changed from BOOLEAN to INTEGER
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

-- Fix restore_blueprint function
CREATE OR REPLACE FUNCTION restore_blueprint(p_blueprint_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_updated INTEGER;  -- FIXED: Changed from BOOLEAN to INTEGER
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
