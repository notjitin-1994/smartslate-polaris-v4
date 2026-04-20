-- =====================================================================
-- Backfill API Cost Tracking for Existing Blueprints
-- =====================================================================
-- This migration backfills cost data for blueprints created before
-- the cost tracking system was implemented.
--
-- Strategy:
-- 1. Estimate token counts from stored content (blueprint_json, blueprint_markdown)
-- 2. Use approximate timestamps from created_at/updated_at
-- 3. Assign costs based on the model pricing in api_model_pricing
-- =====================================================================

DO $$
DECLARE
  v_blueprint RECORD;
  v_user_id UUID;
  v_input_tokens INTEGER;
  v_output_tokens INTEGER;
  v_model_id TEXT;
  v_endpoint TEXT;
  v_log_id UUID;
  v_total_backfilled INTEGER := 0;
  v_blueprints_processed INTEGER := 0;
  v_questions_processed INTEGER := 0;
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
      v_model_id := 'claude-sonnet-4.5';
    ELSE
      v_model_id := 'claude-sonnet-4.5-large';
    END IF;

    v_endpoint := 'blueprint-generation';

    -- Insert backfilled cost log
    INSERT INTO public.api_usage_logs (
      user_id,
      blueprint_id,
      api_provider,
      model_id,
      endpoint,
      input_tokens,
      output_tokens,
      status,
      created_at,
      request_metadata,
      response_metadata
    ) VALUES (
      v_blueprint.user_id,
      v_blueprint.id,
      'anthropic',
      v_model_id,
      v_endpoint,
      v_input_tokens,
      v_output_tokens,
      CASE
        WHEN v_blueprint.status = 'completed' THEN 'success'
        ELSE 'error'
      END,
      COALESCE(v_blueprint.updated_at, v_blueprint.created_at), -- Use updated_at as best estimate
      jsonb_build_object(
        'backfilled', true,
        'backfill_date', NOW(),
        'estimation_method', 'character_count'
      ),
      jsonb_build_object(
        'backfilled', true,
        'original_status', v_blueprint.status
      )
    )
    RETURNING id INTO v_log_id;

    v_total_backfilled := v_total_backfilled + 1;

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
      v_model_id := 'claude-sonnet-4.5';
    ELSE
      v_model_id := 'claude-sonnet-4.5-large';
    END IF;

    v_endpoint := 'dynamic-questions';

    -- Insert backfilled cost log
    INSERT INTO public.api_usage_logs (
      user_id,
      blueprint_id,
      api_provider,
      model_id,
      endpoint,
      input_tokens,
      output_tokens,
      status,
      created_at,
      request_metadata,
      response_metadata
    ) VALUES (
      v_blueprint.user_id,
      v_blueprint.id,
      'anthropic',
      v_model_id,
      v_endpoint,
      v_input_tokens,
      v_output_tokens,
      'success', -- Assume success if questions exist
      v_blueprint.created_at, -- Use created_at for question generation (happens first)
      jsonb_build_object(
        'backfilled', true,
        'backfill_date', NOW(),
        'estimation_method', 'character_count'
      ),
      jsonb_build_object(
        'backfilled', true,
        'has_metadata', v_blueprint.dynamic_questions_metadata IS NOT NULL
      )
    );

    v_total_backfilled := v_total_backfilled + 1;

    IF v_questions_processed % 10 = 0 THEN
      RAISE NOTICE 'Processed % question generations...', v_questions_processed;
    END IF;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '✅ Dynamic questions backfill complete';
  RAISE NOTICE 'Question generations processed: %', v_questions_processed;
  RAISE NOTICE '';

  -- ===================================================================
  -- PART 3: Summary Updates (Automatic via Triggers)
  -- ===================================================================
  RAISE NOTICE 'PART 3: Cost summaries...';
  RAISE NOTICE '';

  -- Cost summaries are automatically updated by database triggers
  -- when rows are inserted into api_usage_logs table.
  -- No manual update needed - triggers handle this for backfilled data.

  RAISE NOTICE '✅ Cost summaries updated automatically via triggers';
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

-- =====================================================================
-- Create view to identify backfilled vs real-time tracked costs
-- =====================================================================
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

-- =====================================================================
-- Grant permissions
-- =====================================================================
GRANT SELECT ON public.cost_tracking_audit TO authenticated;

-- =====================================================================
-- Verification Query
-- =====================================================================
DO $$
DECLARE
  v_total_users INTEGER;
  v_total_costs_cents BIGINT;
  v_backfilled_costs_cents BIGINT;
  v_realtime_costs_cents BIGINT;
BEGIN
  SELECT
    COUNT(DISTINCT user_id),
    SUM(total_cost_cents),
    SUM(total_cost_cents) FILTER (WHERE request_metadata->>'backfilled' = 'true'),
    SUM(total_cost_cents) FILTER (WHERE request_metadata->>'backfilled' IS NULL OR request_metadata->>'backfilled' = 'false')
  INTO
    v_total_users,
    v_total_costs_cents,
    v_backfilled_costs_cents,
    v_realtime_costs_cents
  FROM public.api_usage_logs;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'VERIFICATION SUMMARY';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total users with costs: %', v_total_users;
  RAISE NOTICE 'Total costs: $%.2f', COALESCE(v_total_costs_cents, 0) / 100.0;
  RAISE NOTICE 'Backfilled costs: $%.2f', COALESCE(v_backfilled_costs_cents, 0) / 100.0;
  RAISE NOTICE 'Real-time costs: $%.2f', COALESCE(v_realtime_costs_cents, 0) / 100.0;
  RAISE NOTICE '';
END $$;
