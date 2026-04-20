-- ==============================================================
-- SAFE MIGRATION SCRIPT FOR COST TRACKING
-- ==============================================================
-- This script checks for existing objects before creating them
-- Run this in your Supabase SQL Editor (Dashboard)
-- ==============================================================

-- Step 1: Create tables if they don't exist
-- ==============================================================

-- api_usage_logs table
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'api_usage_logs') THEN
    CREATE TABLE public.api_usage_logs (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      blueprint_id uuid REFERENCES public.blueprint_generator(id) ON DELETE SET NULL,
      provider text NOT NULL,
      model_id text NOT NULL,
      endpoint text NOT NULL,
      input_tokens integer NOT NULL DEFAULT 0,
      output_tokens integer NOT NULL DEFAULT 0,
      total_cost_cents bigint NOT NULL DEFAULT 0,
      request_metadata jsonb DEFAULT '{}'::jsonb,
      response_metadata jsonb DEFAULT '{}'::jsonb,
      status text DEFAULT 'success',
      error_message text,
      duration_ms integer,
      created_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS idx_api_usage_user_created ON public.api_usage_logs(user_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_api_usage_blueprint ON public.api_usage_logs(blueprint_id);
    CREATE INDEX IF NOT EXISTS idx_api_usage_endpoint ON public.api_usage_logs(endpoint);
    CREATE INDEX IF NOT EXISTS idx_api_usage_created_at ON public.api_usage_logs(created_at DESC);

    RAISE NOTICE 'Created api_usage_logs table';
  ELSE
    RAISE NOTICE 'Table api_usage_logs already exists, skipping';
  END IF;
END $$;

-- api_model_pricing table
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'api_model_pricing') THEN
    CREATE TABLE public.api_model_pricing (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      provider text NOT NULL,
      model_id text NOT NULL,
      input_cost_per_million_tokens bigint NOT NULL,
      output_cost_per_million_tokens bigint NOT NULL,
      description text,
      is_active boolean NOT NULL DEFAULT true,
      effective_from timestamptz NOT NULL DEFAULT now(),
      created_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS idx_model_pricing_active ON public.api_model_pricing(provider, model_id, is_active)
      WHERE is_active = true;

    RAISE NOTICE 'Created api_model_pricing table';
  ELSE
    RAISE NOTICE 'Table api_model_pricing already exists, skipping';
  END IF;
END $$;

-- Create unique constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'unique_active_model_pricing'
  ) THEN
    CREATE UNIQUE INDEX unique_active_model_pricing
      ON public.api_model_pricing(provider, model_id)
      WHERE is_active = true;
    RAISE NOTICE 'Created unique_active_model_pricing constraint';
  ELSE
    RAISE NOTICE 'Constraint unique_active_model_pricing already exists, skipping';
  END IF;
END $$;

-- user_cost_summaries table
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_cost_summaries') THEN
    CREATE TABLE public.user_cost_summaries (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      period_type text NOT NULL CHECK (period_type IN ('daily', 'monthly')),
      period_date date NOT NULL,
      total_cost_cents bigint NOT NULL DEFAULT 0,
      total_api_calls integer NOT NULL DEFAULT 0,
      total_input_tokens bigint NOT NULL DEFAULT 0,
      total_output_tokens bigint NOT NULL DEFAULT 0,
      blueprints_generated integer NOT NULL DEFAULT 0,
      dynamic_questions_generated integer NOT NULL DEFAULT 0,
      costs_by_provider jsonb DEFAULT '{}'::jsonb,
      costs_by_model jsonb DEFAULT '{}'::jsonb,
      costs_by_endpoint jsonb DEFAULT '{}'::jsonb,
      last_updated_at timestamptz NOT NULL DEFAULT now(),
      created_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE(user_id, period_type, period_date)
    );

    CREATE INDEX IF NOT EXISTS idx_cost_summaries_user_period ON public.user_cost_summaries(user_id, period_type, period_date DESC);
    CREATE INDEX IF NOT EXISTS idx_cost_summaries_period_date ON public.user_cost_summaries(period_date DESC);

    RAISE NOTICE 'Created user_cost_summaries table';
  ELSE
    RAISE NOTICE 'Table user_cost_summaries already exists, skipping';
  END IF;
END $$;

-- Step 2: Insert default model pricing (only if not exists)
-- ==============================================================

DO $$
BEGIN
  INSERT INTO public.api_model_pricing (provider, model_id, input_cost_per_million_tokens, output_cost_per_million_tokens, description, is_active)
  VALUES
    ('anthropic', 'claude-sonnet-4-5-20250929', 300, 1500, 'Claude Sonnet 4.5 - Standard tier (<200K tokens)', true),
    ('anthropic', 'claude-sonnet-4-5-20250929-large', 300, 1500, 'Claude Sonnet 4.5 - Large tier (>200K tokens)', true),
    ('anthropic', 'claude-sonnet-4-20250929', 300, 1500, 'Claude Sonnet 4', true),
    ('anthropic', 'claude-opus-4-1-20250805', 1500, 7500, 'Claude Opus 4', true),
    ('perplexity', 'llama-3.1-sonar-huge-128k-online', 500, 500, 'Perplexity Sonar Huge 128k', true),
    ('ollama', 'llama2', 0, 0, 'Ollama Llama2 (Local - Free)', true),
    ('ollama', 'mistral', 0, 0, 'Ollama Mistral (Local - Free)', true)
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Inserted model pricing data (or skipped if exists)';
END $$;

-- Step 3: Create or replace the view
-- ==============================================================

DO $$
BEGIN
  CREATE OR REPLACE VIEW public.user_costs_overview AS
  SELECT
    u.id as user_id,
    u.email,
    up.first_name,
    up.last_name,
    up.subscription_tier,
    up.user_role,
    COALESCE(daily.total_cost_cents, 0) as today_cost_cents,
    COALESCE(monthly.total_cost_cents, 0) as this_month_cost_cents,
    COALESCE(daily.total_api_calls, 0) as today_api_calls,
    COALESCE(monthly.total_api_calls, 0) as this_month_api_calls,
    COALESCE(monthly.blueprints_generated, 0) as blueprints_this_month,
    COALESCE(monthly.dynamic_questions_generated, 0) as questions_this_month
  FROM auth.users u
  LEFT JOIN public.user_profiles up ON u.id = up.user_id
  LEFT JOIN public.user_cost_summaries daily ON
    u.id = daily.user_id
    AND daily.period_type = 'daily'
    AND daily.period_date = CURRENT_DATE
  LEFT JOIN public.user_cost_summaries monthly ON
    u.id = monthly.user_id
    AND monthly.period_type = 'monthly'
    AND monthly.period_date = DATE_TRUNC('month', CURRENT_DATE)::DATE;

  RAISE NOTICE 'Created or replaced user_costs_overview view';
END $$;

-- Step 4: Create RLS policies if they don't exist
-- ==============================================================

DO $$
BEGIN
  -- Enable RLS
  ALTER TABLE public.api_usage_logs ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.api_model_pricing ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.user_cost_summaries ENABLE ROW LEVEL SECURITY;

  -- Drop existing policies if they exist (to avoid conflicts)
  DROP POLICY IF EXISTS "Users can view own api usage logs" ON public.api_usage_logs;
  DROP POLICY IF EXISTS "Admins can view all api usage logs" ON public.api_usage_logs;
  DROP POLICY IF EXISTS "Everyone can view model pricing" ON public.api_model_pricing;
  DROP POLICY IF EXISTS "Users can view own cost summaries" ON public.user_cost_summaries;
  DROP POLICY IF EXISTS "Admins can view all cost summaries" ON public.user_cost_summaries;

  -- Create policies
  CREATE POLICY "Users can view own api usage logs"
    ON public.api_usage_logs FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

  CREATE POLICY "Admins can view all api usage logs"
    ON public.api_usage_logs FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE user_id = auth.uid()
        AND user_role IN ('admin', 'developer')
      )
    );

  CREATE POLICY "Everyone can view model pricing"
    ON public.api_model_pricing FOR SELECT
    TO authenticated
    USING (true);

  CREATE POLICY "Users can view own cost summaries"
    ON public.user_cost_summaries FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

  CREATE POLICY "Admins can view all cost summaries"
    ON public.user_cost_summaries FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE user_id = auth.uid()
        AND user_role IN ('admin', 'developer')
      )
    );

  RAISE NOTICE 'Created RLS policies';
END $$;

-- Step 5: Create functions
-- ==============================================================

-- Function to calculate cost from tokens
DO $$
BEGIN
  CREATE OR REPLACE FUNCTION public.calculate_api_cost(
    p_provider text,
    p_model_id text,
    p_input_tokens integer,
    p_output_tokens integer
  ) RETURNS bigint AS $func$
  DECLARE
    v_input_cost_per_million bigint;
    v_output_cost_per_million bigint;
    v_total_cost_cents bigint;
  BEGIN
    SELECT
      input_cost_per_million_tokens,
      output_cost_per_million_tokens
    INTO v_input_cost_per_million, v_output_cost_per_million
    FROM public.api_model_pricing
    WHERE provider = p_provider
      AND model_id = p_model_id
      AND is_active = true
    ORDER BY effective_from DESC
    LIMIT 1;

    IF v_input_cost_per_million IS NULL THEN
      RETURN 0;
    END IF;

    v_total_cost_cents :=
      ((p_input_tokens::numeric / 1000000.0) * v_input_cost_per_million) +
      ((p_output_tokens::numeric / 1000000.0) * v_output_cost_per_million);

    RETURN CEIL(v_total_cost_cents);
  END;
  $func$ LANGUAGE plpgsql STABLE;

  RAISE NOTICE 'Created calculate_api_cost function';
END $$;

-- ==============================================================
-- VERIFICATION
-- ==============================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'MIGRATION COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Tables created:';
  RAISE NOTICE '  - api_usage_logs';
  RAISE NOTICE '  - api_model_pricing';
  RAISE NOTICE '  - user_cost_summaries';
  RAISE NOTICE '';
  RAISE NOTICE 'Views created:';
  RAISE NOTICE '  - user_costs_overview';
  RAISE NOTICE '';
  RAISE NOTICE 'Next step: Run the backfill migration to populate historical data';
  RAISE NOTICE '';
END $$;
