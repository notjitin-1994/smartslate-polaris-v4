-- Backfill Historical Cost Data
-- This migration updates existing api_usage_logs and estimates costs for historical blueprints

-- ==============================================================
-- 1. UPDATE EXISTING API_USAGE_LOGS WITH PROPER PRICING
-- ==============================================================

-- For logs that exist before cache token support, ensure:
-- - Cache tokens are set to 0 (already default)
-- - Pricing is recalculated if it was $0 but pricing now exists
-- - pricing_found flag is set correctly

DO $$
DECLARE
  v_log RECORD;
  v_pricing RECORD;
  v_input_cost INTEGER;
  v_output_cost INTEGER;
  v_total_cost INTEGER;
BEGIN
  RAISE NOTICE 'Starting backfill of historical cost data...';

  -- Process logs where pricing_found is NULL or false but pricing now exists
  FOR v_log IN
    SELECT id, user_id, api_provider, model_id, input_tokens, output_tokens
    FROM public.api_usage_logs
    WHERE (pricing_found IS NULL OR pricing_found = false)
      AND total_cost_cents = 0
  LOOP
    -- Try to find pricing for this model
    SELECT
      input_cost_per_million_tokens,
      output_cost_per_million_tokens
    INTO v_pricing
    FROM public.api_model_pricing
    WHERE provider = v_log.api_provider
      AND model_id = v_log.model_id
      AND is_active = true
    ORDER BY effective_from DESC
    LIMIT 1;

    -- If pricing exists, recalculate costs
    IF FOUND THEN
      v_input_cost := ROUND((v_log.input_tokens::NUMERIC / 1000000) * v_pricing.input_cost_per_million_tokens);
      v_output_cost := ROUND((v_log.output_tokens::NUMERIC / 1000000) * v_pricing.output_cost_per_million_tokens);
      v_total_cost := v_input_cost + v_output_cost;

      -- Update the log
      UPDATE public.api_usage_logs
      SET
        input_cost_cents = v_input_cost,
        output_cost_cents = v_output_cost,
        total_cost_cents = v_total_cost,
        pricing_found = true
      WHERE id = v_log.id;

      RAISE NOTICE 'Updated log % with new pricing (cost: % cents)', v_log.id, v_total_cost;
    END IF;
  END LOOP;

  RAISE NOTICE 'Backfill of existing logs complete.';
END $$;

-- ==============================================================
-- 2. ESTIMATE COSTS FOR BLUEPRINTS WITHOUT USAGE LOGS
-- ==============================================================

-- This function estimates costs for blueprints that were generated
-- before cost tracking was implemented

CREATE OR REPLACE FUNCTION public.estimate_blueprint_costs()
RETURNS TABLE (
  blueprint_id UUID,
  estimated_cost_cents INTEGER,
  estimated_input_tokens INTEGER,
  estimated_output_tokens INTEGER,
  estimation_method TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH blueprint_stats AS (
    SELECT
      bg.id,
      bg.user_id,
      bg.created_at,
      -- Estimate token counts based on content length
      COALESCE(LENGTH(bg.static_answers::TEXT), 0) as static_length,
      COALESCE(LENGTH(bg.dynamic_questions::TEXT), 0) as dynamic_questions_length,
      COALESCE(LENGTH(bg.dynamic_answers::TEXT), 0) as dynamic_answers_length,
      COALESCE(LENGTH(bg.blueprint_markdown), 0) as blueprint_length,
      bg.status
    FROM public.blueprint_generator bg
    WHERE bg.status IN ('completed', 'generating')
      -- Only blueprints without existing cost logs
      AND NOT EXISTS (
        SELECT 1
        FROM public.api_usage_logs aul
        WHERE aul.blueprint_id = bg.id
      )
  ),
  token_estimates AS (
    SELECT
      id,
      user_id,
      created_at,
      -- Dynamic questions generation estimate
      -- Input: static answers + system prompt (~8K tokens)
      -- Output: dynamic questions (~12K tokens)
      CEIL((static_length + 8000 * 4) / 4.0)::INTEGER as dq_input_tokens,
      CEIL(dynamic_questions_length / 4.0)::INTEGER as dq_output_tokens,

      -- Blueprint generation estimate
      -- Input: static + dynamic + system prompt (~15K tokens)
      -- Output: blueprint markdown
      CEIL((static_length + dynamic_answers_length + 15000 * 4) / 4.0)::INTEGER as bp_input_tokens,
      CEIL(blueprint_length / 4.0)::INTEGER as bp_output_tokens
    FROM blueprint_stats
  ),
  cost_calculations AS (
    SELECT
      te.id,
      te.user_id,
      te.created_at,
      -- Get pricing (use current pricing as estimate)
      COALESCE(
        (SELECT input_cost_per_million_tokens
         FROM public.api_model_pricing
         WHERE provider = 'anthropic'
           AND model_id = 'claude-sonnet-4-5-20250929'
           AND is_active = true
         ORDER BY effective_from DESC
         LIMIT 1),
        300 -- Default to $3.00 if no pricing found
      ) as input_cost_per_million,
      COALESCE(
        (SELECT output_cost_per_million_tokens
         FROM public.api_model_pricing
         WHERE provider = 'anthropic'
           AND model_id = 'claude-sonnet-4-5-20250929'
           AND is_active = true
         ORDER BY effective_from DESC
         LIMIT 1),
        1500 -- Default to $15.00 if no pricing found
      ) as output_cost_per_million,
      te.dq_input_tokens + te.bp_input_tokens as total_input_tokens,
      te.dq_output_tokens + te.bp_output_tokens as total_output_tokens
    FROM token_estimates te
  )
  SELECT
    cc.id as blueprint_id,
    ROUND(
      (cc.total_input_tokens::NUMERIC / 1000000 * cc.input_cost_per_million) +
      (cc.total_output_tokens::NUMERIC / 1000000 * cc.output_cost_per_million)
    )::INTEGER as estimated_cost_cents,
    cc.total_input_tokens as estimated_input_tokens,
    cc.total_output_tokens as estimated_output_tokens,
    'content_length_estimation' as estimation_method
  FROM cost_calculations cc;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.estimate_blueprint_costs IS
  'Estimates costs for blueprints generated before cost tracking was implemented. Uses content length as proxy for token counts (1 token ≈ 4 characters).';

-- ==============================================================
-- 3. BACKFILL FUNCTION TO CREATE ESTIMATED USAGE LOGS
-- ==============================================================

CREATE OR REPLACE FUNCTION public.backfill_blueprint_costs(
  p_dry_run BOOLEAN DEFAULT true,
  p_blueprint_id UUID DEFAULT NULL
)
RETURNS TABLE (
  blueprint_id UUID,
  logs_created INTEGER,
  estimated_cost_cents INTEGER,
  status TEXT
) AS $$
DECLARE
  v_estimate RECORD;
  v_log_id UUID;
  v_logs_created INTEGER := 0;
  v_total_blueprints INTEGER := 0;
BEGIN
  -- Get estimates for blueprints
  FOR v_estimate IN
    SELECT * FROM public.estimate_blueprint_costs() e
    WHERE (p_blueprint_id IS NULL OR e.blueprint_id = p_blueprint_id)
  LOOP
    v_total_blueprints := v_total_blueprints + 1;

    IF NOT p_dry_run THEN
      -- Get user_id for this blueprint
      DECLARE
        v_user_id UUID;
        v_created_at TIMESTAMPTZ;
      BEGIN
        SELECT user_id, created_at INTO v_user_id, v_created_at
        FROM public.blueprint_generator
        WHERE id = v_estimate.blueprint_id;

        -- Create estimated log for dynamic questions generation
        INSERT INTO public.api_usage_logs (
          user_id,
          blueprint_id,
          api_provider,
          model_id,
          endpoint,
          input_tokens,
          output_tokens,
          total_tokens,
          cache_creation_input_tokens,
          cache_read_input_tokens,
          input_cost_cents,
          output_cost_cents,
          cache_creation_cost_cents,
          cache_read_cost_cents,
          total_cost_cents,
          request_metadata,
          response_metadata,
          status,
          error_message,
          request_duration_ms,
          pricing_found,
          created_at
        ) VALUES (
          v_user_id,
          v_estimate.blueprint_id,
          'anthropic',
          'claude-sonnet-4-5-20250929',
          'generate-dynamic-questions',
          v_estimate.estimated_input_tokens / 2, -- Split between 2 calls
          v_estimate.estimated_output_tokens / 2,
          (v_estimate.estimated_input_tokens + v_estimate.estimated_output_tokens) / 2,
          0, -- No cache data for historical
          0,
          ROUND((v_estimate.estimated_input_tokens / 2.0 / 1000000) * 300)::INTEGER,
          ROUND((v_estimate.estimated_output_tokens / 2.0 / 1000000) * 1500)::INTEGER,
          0,
          0,
          v_estimate.estimated_cost_cents / 2,
          jsonb_build_object('estimation_method', v_estimate.estimation_method, 'is_backfilled', true),
          jsonb_build_object('is_estimated', true),
          'success',
          NULL,
          NULL,
          true,
          v_created_at
        ) RETURNING id INTO v_log_id;

        v_logs_created := v_logs_created + 1;

        -- Create estimated log for blueprint generation
        INSERT INTO public.api_usage_logs (
          user_id,
          blueprint_id,
          api_provider,
          model_id,
          endpoint,
          input_tokens,
          output_tokens,
          total_tokens,
          cache_creation_input_tokens,
          cache_read_input_tokens,
          input_cost_cents,
          output_cost_cents,
          cache_creation_cost_cents,
          cache_read_cost_cents,
          total_cost_cents,
          request_metadata,
          response_metadata,
          status,
          error_message,
          request_duration_ms,
          pricing_found,
          created_at
        ) VALUES (
          v_user_id,
          v_estimate.blueprint_id,
          'anthropic',
          'claude-sonnet-4-5-20250929',
          'generate-blueprint',
          v_estimate.estimated_input_tokens / 2,
          v_estimate.estimated_output_tokens / 2,
          (v_estimate.estimated_input_tokens + v_estimate.estimated_output_tokens) / 2,
          0,
          0,
          ROUND((v_estimate.estimated_input_tokens / 2.0 / 1000000) * 300)::INTEGER,
          ROUND((v_estimate.estimated_output_tokens / 2.0 / 1000000) * 1500)::INTEGER,
          0,
          0,
          v_estimate.estimated_cost_cents / 2,
          jsonb_build_object('estimation_method', v_estimate.estimation_method, 'is_backfilled', true),
          jsonb_build_object('is_estimated', true),
          'success',
          NULL,
          NULL,
          true,
          v_created_at + INTERVAL '5 minutes' -- Offset by 5 minutes
        ) RETURNING id INTO v_log_id;

        v_logs_created := v_logs_created + 1;
      END;
    END IF;

    RETURN QUERY SELECT
      v_estimate.blueprint_id,
      CASE WHEN p_dry_run THEN 0 ELSE 2 END,
      v_estimate.estimated_cost_cents,
      CASE
        WHEN p_dry_run THEN 'DRY RUN - Would create 2 logs'
        ELSE 'Created 2 estimated logs'
      END;
  END LOOP;

  RAISE NOTICE 'Processed % blueprints, created % logs (dry_run: %)',
    v_total_blueprints, v_logs_created, p_dry_run;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.backfill_blueprint_costs IS
  'Backfills cost estimates for historical blueprints. Creates 2 estimated api_usage_logs per blueprint (dynamic questions + blueprint generation). Set p_dry_run = false to actually create logs.';

-- ==============================================================
-- 4. GRANT PERMISSIONS
-- ==============================================================

GRANT EXECUTE ON FUNCTION public.estimate_blueprint_costs() TO authenticated;
GRANT EXECUTE ON FUNCTION public.backfill_blueprint_costs(BOOLEAN, UUID) TO authenticated;

-- ==============================================================
-- 5. USAGE INSTRUCTIONS
-- ==============================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Historical Cost Backfill Migration Complete';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '';
  RAISE NOTICE '1. Preview what will be backfilled (DRY RUN):';
  RAISE NOTICE '   SELECT * FROM backfill_blueprint_costs(true);';
  RAISE NOTICE '';
  RAISE NOTICE '2. See cost estimates for unbilled blueprints:';
  RAISE NOTICE '   SELECT * FROM estimate_blueprint_costs();';
  RAISE NOTICE '';
  RAISE NOTICE '3. Backfill ALL historical blueprints:';
  RAISE NOTICE '   SELECT * FROM backfill_blueprint_costs(false);';
  RAISE NOTICE '';
  RAISE NOTICE '4. Backfill a specific blueprint:';
  RAISE NOTICE '   SELECT * FROM backfill_blueprint_costs(false, ''blueprint-id-here'');';
  RAISE NOTICE '';
  RAISE NOTICE 'Note: Estimated logs are marked with:';
  RAISE NOTICE '  - request_metadata: {"is_backfilled": true, "estimation_method": "content_length_estimation"}';
  RAISE NOTICE '  - response_metadata: {"is_estimated": true}';
  RAISE NOTICE '  - No cache token data (set to 0)';
  RAISE NOTICE '========================================';
END $$;
