-- ==============================================================
-- CORRECTED BACKFILL SCRIPT FOR API COST TRACKING
-- ==============================================================
-- This script backfills cost data for existing blueprints
-- Run this AFTER the migration tables are created
-- ==============================================================

DO $$
DECLARE
  v_blueprint RECORD;
  v_input_tokens INTEGER;
  v_output_tokens INTEGER;
  v_model_id TEXT;
  v_endpoint TEXT;
  v_total_backfilled INTEGER := 0;
  v_blueprints_processed INTEGER := 0;
  v_questions_processed INTEGER := 0;
  v_input_cost_cents INTEGER;
  v_output_cost_cents INTEGER;
  v_total_cost_cents INTEGER;
  v_pricing RECORD;
BEGIN

  RAISE NOTICE '========================================';
  RAISE NOTICE 'API COST BACKFILL STARTED';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

  -- ===================================================================
  -- PART 1: Backfill Blueprint Generation Costs
  -- ===================================================================
  RAISE NOTICE 'PART 1: Backfilling Blueprint Generation Costs...';
  RAISE NOTICE '';

  FOR v_blueprint IN
    SELECT
      id,
      user_id,
      static_answers,
      dynamic_answers,
      blueprint_json,
      blueprint_markdown,
      status,
      created_at,
      updated_at
    FROM public.blueprint_generator
    WHERE status IN ('completed', 'generating')
      AND blueprint_json IS NOT NULL
      AND blueprint_json::text != '{}'
      AND blueprint_json::text != 'null'
    ORDER BY created_at ASC
  LOOP
    v_blueprints_processed := v_blueprints_processed + 1;

    -- Estimate input tokens (static + dynamic answers)
    -- Average: 4 characters = 1 token
    v_input_tokens := (
      LENGTH(COALESCE(v_blueprint.static_answers::text, '{}')) +
      LENGTH(COALESCE(v_blueprint.dynamic_answers::text, '{}'))
    ) / 4;

    -- Estimate output tokens from blueprint_markdown (more accurate than JSON)
    v_output_tokens := LENGTH(COALESCE(v_blueprint.blueprint_markdown, '')) / 4;

    -- Default to Claude Sonnet 4.5 for backfill (most common model)
    -- Use small tier if total tokens < 200K
    IF (v_input_tokens + v_output_tokens) < 200000 THEN
      v_model_id := 'claude-sonnet-4-5-20250929';
    ELSE
      v_model_id := 'claude-sonnet-4-5-20250929-large';
    END IF;

    v_endpoint := 'blueprint-generation';

    -- Get pricing for the model
    SELECT input_cost_per_million_tokens, output_cost_per_million_tokens
    INTO v_pricing
    FROM public.api_model_pricing
    WHERE provider = 'anthropic'
      AND model_id = v_model_id
      AND is_active = true
    ORDER BY effective_from DESC
    LIMIT 1;

    -- Calculate costs (convert from per million to actual cost in cents)
    v_input_cost_cents := COALESCE(
      ROUND((v_input_tokens::NUMERIC / 1000000) * COALESCE(v_pricing.input_cost_per_million_tokens, 0)),
      0
    );

    v_output_cost_cents := COALESCE(
      ROUND((v_output_tokens::NUMERIC / 1000000) * COALESCE(v_pricing.output_cost_per_million_tokens, 0)),
      0
    );

    v_total_cost_cents := v_input_cost_cents + v_output_cost_cents;

    -- Insert backfilled cost log (skip if already exists for this blueprint)
    INSERT INTO public.api_usage_logs (
      user_id,
      blueprint_id,
      api_provider,
      model_id,
      endpoint,
      input_tokens,
      output_tokens,
      total_tokens,
      input_cost_cents,
      output_cost_cents,
      total_cost_cents,
      status,
      created_at,
      request_metadata,
      response_metadata
    )
    SELECT
      v_blueprint.user_id,
      v_blueprint.id,
      'anthropic',
      v_model_id,
      v_endpoint,
      v_input_tokens,
      v_output_tokens,
      v_input_tokens + v_output_tokens,
      v_input_cost_cents,
      v_output_cost_cents,
      v_total_cost_cents,
      CASE
        WHEN v_blueprint.status = 'completed' THEN 'success'
        ELSE 'error'
      END,
      COALESCE(v_blueprint.updated_at, v_blueprint.created_at),
      jsonb_build_object(
        'backfilled', true,
        'backfill_date', NOW(),
        'estimation_method', 'character_count'
      ),
      jsonb_build_object(
        'backfilled', true,
        'original_status', v_blueprint.status
      )
    WHERE NOT EXISTS (
      -- Don't insert if already backfilled for this blueprint
      SELECT 1 FROM public.api_usage_logs
      WHERE blueprint_id = v_blueprint.id
        AND endpoint = v_endpoint
        AND request_metadata->>'backfilled' = 'true'
    );

    IF FOUND THEN
      v_total_backfilled := v_total_backfilled + 1;
    END IF;

    IF v_blueprints_processed % 10 = 0 THEN
      RAISE NOTICE 'Processed % blueprints...', v_blueprints_processed;
    END IF;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '✅ Blueprint generation backfill complete';
  RAISE NOTICE 'Blueprints processed: %', v_blueprints_processed;
  RAISE NOTICE '';

  -- ===================================================================
  -- PART 2: Backfill Dynamic Question Generation Costs
  -- ===================================================================
  RAISE NOTICE 'PART 2: Backfilling Dynamic Question Generation Costs...';
  RAISE NOTICE '';

  FOR v_blueprint IN
    SELECT
      id,
      user_id,
      static_answers,
      dynamic_questions,
      dynamic_questions_metadata,
      created_at,
      updated_at
    FROM public.blueprint_generator
    WHERE dynamic_questions IS NOT NULL
      AND dynamic_questions::text != '[]'
      AND dynamic_questions::text != 'null'
    ORDER BY created_at ASC
  LOOP
    v_questions_processed := v_questions_processed + 1;

    -- Estimate input tokens from static answers
    v_input_tokens := LENGTH(COALESCE(v_blueprint.static_answers::text, '{}')) / 4;

    -- Estimate output tokens from dynamic_questions
    v_output_tokens := LENGTH(COALESCE(v_blueprint.dynamic_questions::text, '[]')) / 4;

    -- Default to Claude Sonnet 4.5 for question generation
    IF (v_input_tokens + v_output_tokens) < 200000 THEN
      v_model_id := 'claude-sonnet-4-5-20250929';
    ELSE
      v_model_id := 'claude-sonnet-4-5-20250929-large';
    END IF;

    v_endpoint := 'dynamic-questions';

    -- Get pricing for the model
    SELECT input_cost_per_million_tokens, output_cost_per_million_tokens
    INTO v_pricing
    FROM public.api_model_pricing
    WHERE provider = 'anthropic'
      AND model_id = v_model_id
      AND is_active = true
    ORDER BY effective_from DESC
    LIMIT 1;

    -- Calculate costs
    v_input_cost_cents := COALESCE(
      ROUND((v_input_tokens::NUMERIC / 1000000) * COALESCE(v_pricing.input_cost_per_million_tokens, 0)),
      0
    );

    v_output_cost_cents := COALESCE(
      ROUND((v_output_tokens::NUMERIC / 1000000) * COALESCE(v_pricing.output_cost_per_million_tokens, 0)),
      0
    );

    v_total_cost_cents := v_input_cost_cents + v_output_cost_cents;

    -- Insert backfilled cost log (skip if already exists)
    INSERT INTO public.api_usage_logs (
      user_id,
      blueprint_id,
      api_provider,
      model_id,
      endpoint,
      input_tokens,
      output_tokens,
      total_tokens,
      input_cost_cents,
      output_cost_cents,
      total_cost_cents,
      status,
      created_at,
      request_metadata,
      response_metadata
    )
    SELECT
      v_blueprint.user_id,
      v_blueprint.id,
      'anthropic',
      v_model_id,
      v_endpoint,
      v_input_tokens,
      v_output_tokens,
      v_input_tokens + v_output_tokens,
      v_input_cost_cents,
      v_output_cost_cents,
      v_total_cost_cents,
      'success',
      v_blueprint.created_at,
      jsonb_build_object(
        'backfilled', true,
        'backfill_date', NOW(),
        'estimation_method', 'character_count'
      ),
      jsonb_build_object(
        'backfilled', true,
        'has_metadata', v_blueprint.dynamic_questions_metadata IS NOT NULL
      )
    WHERE NOT EXISTS (
      -- Don't insert if already backfilled
      SELECT 1 FROM public.api_usage_logs
      WHERE blueprint_id = v_blueprint.id
        AND endpoint = v_endpoint
        AND request_metadata->>'backfilled' = 'true'
    );

    IF FOUND THEN
      v_total_backfilled := v_total_backfilled + 1;
    END IF;

    IF v_questions_processed % 10 = 0 THEN
      RAISE NOTICE 'Processed % question generations...', v_questions_processed;
    END IF;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '✅ Dynamic questions backfill complete';
  RAISE NOTICE 'Question generations processed: %', v_questions_processed;
  RAISE NOTICE '';

  -- ===================================================================
  -- PART 3: Update Cost Summaries
  -- ===================================================================
  RAISE NOTICE 'PART 3: Updating cost summaries...';
  RAISE NOTICE '';

  -- Trigger summary updates for all affected users
  PERFORM public.update_cost_summaries(user_id, DATE(created_at))
  FROM public.api_usage_logs
  WHERE request_metadata->>'backfilled' = 'true'
  GROUP BY user_id, DATE(created_at);

  RAISE NOTICE '✅ Cost summaries updated';
  RAISE NOTICE '';

  -- ===================================================================
  -- SUMMARY
  -- ===================================================================
  RAISE NOTICE '========================================';
  RAISE NOTICE 'BACKFILL COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Total API logs created: %', v_total_backfilled;
  RAISE NOTICE 'Blueprints processed: %', v_blueprints_processed;
  RAISE NOTICE 'Question generations processed: %', v_questions_processed;
  RAISE NOTICE '';
  RAISE NOTICE 'NOTE: Token counts are estimates based on character length.';
  RAISE NOTICE 'Actual costs may vary by ±20%% from estimated values.';
  RAISE NOTICE 'All backfilled logs are marked with backfilled=true in metadata.';
  RAISE NOTICE '';

END $$;

-- Create audit view
CREATE OR REPLACE VIEW public.cost_tracking_audit AS
SELECT
  user_id,
  endpoint,
  COUNT(*) as total_logs,
  COUNT(*) FILTER (WHERE request_metadata->>'backfilled' = 'true') as backfilled_logs,
  COUNT(*) FILTER (WHERE request_metadata->>'backfilled' IS NULL OR request_metadata->>'backfilled' = 'false') as realtime_logs,
  SUM(total_cost_cents) as total_cost_cents,
  SUM(total_cost_cents) FILTER (WHERE request_metadata->>'backfilled' = 'true') as backfilled_cost_cents,
  SUM(total_cost_cents) FILTER (WHERE request_metadata->>'backfilled' IS NULL OR request_metadata->>'backfilled' = 'false') as realtime_cost_cents,
  MIN(created_at) as earliest_log,
  MAX(created_at) as latest_log
FROM public.api_usage_logs
GROUP BY user_id, endpoint
ORDER BY user_id, endpoint;

COMMENT ON VIEW public.cost_tracking_audit IS
'Audit view showing breakdown of backfilled vs real-time tracked API costs per user and endpoint';

GRANT SELECT ON public.cost_tracking_audit TO authenticated;

-- Verification
DO $$
DECLARE
  v_total_users INTEGER;
  v_total_costs_cents BIGINT;
  v_backfilled_costs_cents BIGINT;
  v_realtime_costs_cents BIGINT;
  v_total_logs INTEGER;
BEGIN
  SELECT
    COUNT(DISTINCT user_id),
    COUNT(*),
    SUM(total_cost_cents),
    SUM(total_cost_cents) FILTER (WHERE request_metadata->>'backfilled' = 'true'),
    SUM(total_cost_cents) FILTER (WHERE request_metadata->>'backfilled' IS NULL OR request_metadata->>'backfilled' = 'false')
  INTO
    v_total_users,
    v_total_logs,
    v_total_costs_cents,
    v_backfilled_costs_cents,
    v_realtime_costs_cents
  FROM public.api_usage_logs;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'VERIFICATION SUMMARY';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total users with costs: %', v_total_users;
  RAISE NOTICE 'Total API logs: %', v_total_logs;
  RAISE NOTICE 'Total costs: $%.2f', COALESCE(v_total_costs_cents, 0) / 100.0;
  RAISE NOTICE 'Backfilled costs: $%.2f', COALESCE(v_backfilled_costs_cents, 0) / 100.0;
  RAISE NOTICE 'Real-time costs: $%.2f', COALESCE(v_realtime_costs_cents, 0) / 100.0;
  RAISE NOTICE '';
  RAISE NOTICE '✅ Check the admin costs page at /admin/costs to see all data!';
  RAISE NOTICE '';
END $$;
