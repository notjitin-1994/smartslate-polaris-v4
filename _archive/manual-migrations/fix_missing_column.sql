-- ==============================================================
-- FIX MISSING COLUMN IN user_cost_summaries
-- ==============================================================
-- Add the missing last_updated_at column if it doesn't exist
-- ==============================================================

DO $$
BEGIN
  -- Check if last_updated_at column exists
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'user_cost_summaries'
    AND column_name = 'last_updated_at'
  ) THEN
    -- Add the column
    ALTER TABLE public.user_cost_summaries
    ADD COLUMN last_updated_at timestamptz NOT NULL DEFAULT now();

    RAISE NOTICE 'Added last_updated_at column to user_cost_summaries';
  ELSE
    RAISE NOTICE 'Column last_updated_at already exists';
  END IF;

  -- Also check for created_at
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'user_cost_summaries'
    AND column_name = 'created_at'
  ) THEN
    -- Add the column
    ALTER TABLE public.user_cost_summaries
    ADD COLUMN created_at timestamptz NOT NULL DEFAULT now();

    RAISE NOTICE 'Added created_at column to user_cost_summaries';
  ELSE
    RAISE NOTICE 'Column created_at already exists';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '✅ Columns verified/added successfully';
  RAISE NOTICE '';
END $$;

-- Recreate the update_cost_summaries function with correct column references
CREATE OR REPLACE FUNCTION public.update_cost_summaries(
  p_user_id UUID,
  p_date DATE DEFAULT CURRENT_DATE
) RETURNS VOID AS $$
DECLARE
  v_daily_data RECORD;
  v_monthly_data RECORD;
BEGIN
  -- Calculate daily summary
  SELECT
    COUNT(*) as total_calls,
    SUM(total_cost_cents) as total_cost,
    SUM(input_tokens) as total_input,
    SUM(output_tokens) as total_output,
    SUM(CASE WHEN endpoint IN ('blueprint-generation', 'generate-blueprint') THEN 1 ELSE 0 END) as blueprints,
    SUM(CASE WHEN endpoint IN ('dynamic-questions', 'generate-dynamic-questions') THEN 1 ELSE 0 END) as questions
  INTO v_daily_data
  FROM public.api_usage_logs
  WHERE user_id = p_user_id
    AND DATE(created_at) = p_date
    AND status = 'success';

  -- Upsert daily summary
  INSERT INTO public.user_cost_summaries (
    user_id, period_type, period_date,
    total_cost_cents, total_api_calls,
    total_input_tokens, total_output_tokens,
    blueprints_generated, dynamic_questions_generated,
    last_updated_at
  ) VALUES (
    p_user_id, 'daily', p_date,
    COALESCE(v_daily_data.total_cost, 0),
    COALESCE(v_daily_data.total_calls, 0),
    COALESCE(v_daily_data.total_input, 0),
    COALESCE(v_daily_data.total_output, 0),
    COALESCE(v_daily_data.blueprints, 0),
    COALESCE(v_daily_data.questions, 0),
    NOW()
  )
  ON CONFLICT (user_id, period_type, period_date)
  DO UPDATE SET
    total_cost_cents = EXCLUDED.total_cost_cents,
    total_api_calls = EXCLUDED.total_api_calls,
    total_input_tokens = EXCLUDED.total_input_tokens,
    total_output_tokens = EXCLUDED.total_output_tokens,
    blueprints_generated = EXCLUDED.blueprints_generated,
    dynamic_questions_generated = EXCLUDED.dynamic_questions_generated,
    last_updated_at = NOW();

  -- Calculate monthly summary
  SELECT
    COUNT(*) as total_calls,
    SUM(total_cost_cents) as total_cost,
    SUM(input_tokens) as total_input,
    SUM(output_tokens) as total_output,
    SUM(CASE WHEN endpoint IN ('blueprint-generation', 'generate-blueprint') THEN 1 ELSE 0 END) as blueprints,
    SUM(CASE WHEN endpoint IN ('dynamic-questions', 'generate-dynamic-questions') THEN 1 ELSE 0 END) as questions
  INTO v_monthly_data
  FROM public.api_usage_logs
  WHERE user_id = p_user_id
    AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', p_date::TIMESTAMP)
    AND status = 'success';

  -- Upsert monthly summary
  INSERT INTO public.user_cost_summaries (
    user_id, period_type, period_date,
    total_cost_cents, total_api_calls,
    total_input_tokens, total_output_tokens,
    blueprints_generated, dynamic_questions_generated,
    last_updated_at
  ) VALUES (
    p_user_id, 'monthly', DATE_TRUNC('month', p_date::TIMESTAMP)::DATE,
    COALESCE(v_monthly_data.total_cost, 0),
    COALESCE(v_monthly_data.total_calls, 0),
    COALESCE(v_monthly_data.total_input, 0),
    COALESCE(v_monthly_data.total_output, 0),
    COALESCE(v_monthly_data.blueprints, 0),
    COALESCE(v_monthly_data.questions, 0),
    NOW()
  )
  ON CONFLICT (user_id, period_type, period_date)
  DO UPDATE SET
    total_cost_cents = EXCLUDED.total_cost_cents,
    total_api_calls = EXCLUDED.total_api_calls,
    total_input_tokens = EXCLUDED.total_input_tokens,
    total_output_tokens = EXCLUDED.total_output_tokens,
    blueprints_generated = EXCLUDED.blueprints_generated,
    dynamic_questions_generated = EXCLUDED.dynamic_questions_generated,
    last_updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ Fixed update_cost_summaries function';
  RAISE NOTICE '';
  RAISE NOTICE 'You can now run the backfill script: manual_backfill_corrected.sql';
  RAISE NOTICE '';
END $$;
