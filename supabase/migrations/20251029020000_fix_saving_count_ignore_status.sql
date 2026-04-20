-- Migration: Fix blueprint saving count to ignore status
-- Date: 2025-10-29
-- Description: Count all blueprints with data as "saved", regardless of status

-- Update get_actual_blueprint_saving_count to ignore status
CREATE OR REPLACE FUNCTION get_actual_blueprint_saving_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Count ALL blueprints that have blueprint_json data, regardless of status
  -- Any blueprint with data is considered "saved"
  SELECT COUNT(*)::INTEGER
  INTO v_count
  FROM public.blueprint_generator
  WHERE user_id = p_user_id
    AND blueprint_json IS NOT NULL;

  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION get_actual_blueprint_saving_count IS
'Counts blueprints with data (blueprint_json IS NOT NULL), regardless of status.
Any blueprint that has been generated and has data is considered "saved".';

-- Update get_actual_current_month_counts to use same logic
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
    COUNT(*)::INTEGER as creation_count,
    -- Count blueprints with data, regardless of status
    COUNT(*) FILTER (WHERE blueprint_json IS NOT NULL)::INTEGER as saving_count
  FROM public.blueprint_generator
  WHERE user_id = p_user_id
    AND created_at >= p_billing_cycle_start;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION get_actual_current_month_counts IS
'Returns blueprint counts for the current billing cycle.
Saving count includes all blueprints with data, regardless of status.';
