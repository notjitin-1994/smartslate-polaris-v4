-- API Cost Tracking System Migration
-- Tracks API usage, costs, and billing for each user and blueprint generation

-- 1. Create API cost tracking table
CREATE TABLE IF NOT EXISTS public.api_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blueprint_id UUID REFERENCES public.blueprint_generator(id) ON DELETE SET NULL,

  -- API call details
  api_provider TEXT NOT NULL, -- 'anthropic', 'openai', 'perplexity', 'ollama'
  model_id TEXT NOT NULL, -- 'claude-sonnet-4-5', 'claude-sonnet-4', 'claude-opus-4', etc.
  endpoint TEXT NOT NULL, -- 'generate-dynamic-questions', 'generate-blueprint', etc.

  -- Token usage
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER NOT NULL DEFAULT 0,

  -- Cost calculations (stored in cents to avoid floating point issues)
  input_cost_cents INTEGER NOT NULL DEFAULT 0, -- Cost for input tokens in cents
  output_cost_cents INTEGER NOT NULL DEFAULT 0, -- Cost for output tokens in cents
  total_cost_cents INTEGER NOT NULL DEFAULT 0,

  -- Additional metadata
  request_metadata JSONB DEFAULT '{}', -- Store request details, parameters, etc.
  response_metadata JSONB DEFAULT '{}', -- Store response details, usage stats from provider

  -- Status and error tracking
  status TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'error', 'timeout', 'rate_limited')),
  error_message TEXT,

  -- Timing information
  request_duration_ms INTEGER, -- Time taken for the API call in milliseconds
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Indexing columns for common queries
  month_year TEXT
);

-- 2. Create model pricing configuration table
CREATE TABLE IF NOT EXISTS public.api_model_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  model_id TEXT NOT NULL,

  -- Pricing in cents per million tokens (to avoid floating point)
  -- Claude Sonnet 4.5: $3/MTok input, $15/MTok output
  input_cost_per_million_tokens INTEGER NOT NULL, -- e.g., 300 cents = $3
  output_cost_per_million_tokens INTEGER NOT NULL, -- e.g., 1500 cents = $15

  -- Special pricing tiers (for models with different pricing based on prompt size)
  pricing_tiers JSONB DEFAULT '[]', -- Array of {threshold, input_cost, output_cost}

  -- Metadata
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  effective_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  effective_until TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create a unique index for active model pricing
CREATE UNIQUE INDEX unique_active_model_pricing
ON public.api_model_pricing (provider, model_id)
WHERE is_active = true;

-- 3. Create aggregated cost summaries table for performance
CREATE TABLE IF NOT EXISTS public.user_cost_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Time period
  period_type TEXT NOT NULL CHECK (period_type IN ('daily', 'monthly', 'yearly')),
  period_date DATE NOT NULL,

  -- Aggregated costs by provider
  costs_by_provider JSONB DEFAULT '{}', -- {anthropic: {cents: 1500, calls: 10}, ...}
  costs_by_model JSONB DEFAULT '{}', -- {claude-sonnet-4-5: {cents: 1000, calls: 5}, ...}
  costs_by_endpoint JSONB DEFAULT '{}', -- {generate-blueprint: {cents: 800, calls: 3}, ...}

  -- Total metrics
  total_api_calls INTEGER NOT NULL DEFAULT 0,
  total_cost_cents INTEGER NOT NULL DEFAULT 0,
  total_input_tokens INTEGER NOT NULL DEFAULT 0,
  total_output_tokens INTEGER NOT NULL DEFAULT 0,

  -- Blueprint specific metrics
  blueprints_generated INTEGER NOT NULL DEFAULT 0,
  dynamic_questions_generated INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique constraint to prevent duplicate summaries
  CONSTRAINT unique_user_period_summary UNIQUE (user_id, period_type, period_date)
);

-- Create trigger to populate month_year column
CREATE OR REPLACE FUNCTION populate_month_year() RETURNS TRIGGER AS $$
BEGIN
  NEW.month_year := TO_CHAR(NEW.created_at AT TIME ZONE 'UTC', 'YYYY-MM');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_month_year
BEFORE INSERT OR UPDATE ON public.api_usage_logs
FOR EACH ROW
EXECUTE FUNCTION populate_month_year();

-- 4. Create indexes for performance
CREATE INDEX idx_api_usage_logs_user_id ON public.api_usage_logs(user_id);
CREATE INDEX idx_api_usage_logs_blueprint_id ON public.api_usage_logs(blueprint_id);
CREATE INDEX idx_api_usage_logs_created_at ON public.api_usage_logs(created_at);
CREATE INDEX idx_api_usage_logs_month_year ON public.api_usage_logs(month_year);
CREATE INDEX idx_api_usage_logs_user_month ON public.api_usage_logs(user_id, month_year);
CREATE INDEX idx_api_usage_logs_provider_model ON public.api_usage_logs(api_provider, model_id);

CREATE INDEX idx_user_cost_summaries_user_id ON public.user_cost_summaries(user_id);
CREATE INDEX idx_user_cost_summaries_period ON public.user_cost_summaries(period_type, period_date);
CREATE INDEX idx_user_cost_summaries_user_period ON public.user_cost_summaries(user_id, period_type, period_date);

-- 5. Insert default pricing for Claude models
INSERT INTO public.api_model_pricing (provider, model_id, input_cost_per_million_tokens, output_cost_per_million_tokens, description)
VALUES
  -- Claude Sonnet 4.5 (with tiered pricing)
  ('anthropic', 'claude-sonnet-4-5-20250929', 300, 1500, 'Claude Sonnet 4.5 - Standard tier (≤200K tokens)'),
  ('anthropic', 'claude-sonnet-4-5-20250929-large', 600, 2250, 'Claude Sonnet 4.5 - Large tier (>200K tokens)'),

  -- Claude Sonnet 4
  ('anthropic', 'claude-sonnet-4-20250929', 300, 1500, 'Claude Sonnet 4'),

  -- Claude Opus 4
  ('anthropic', 'claude-opus-4-1-20250805', 1500, 7500, 'Claude Opus 4.1'),

  -- Perplexity models (example pricing - adjust as needed)
  ('perplexity', 'llama-3.1-sonar-huge-128k-online', 500, 500, 'Perplexity Sonar Huge'),

  -- Local Ollama (free)
  ('ollama', 'llama2', 0, 0, 'Local Ollama Llama 2'),
  ('ollama', 'mistral', 0, 0, 'Local Ollama Mistral')
ON CONFLICT DO NOTHING;

-- 6. Create function to log API usage
CREATE OR REPLACE FUNCTION public.log_api_usage(
  p_user_id UUID,
  p_blueprint_id UUID,
  p_provider TEXT,
  p_model_id TEXT,
  p_endpoint TEXT,
  p_input_tokens INTEGER,
  p_output_tokens INTEGER,
  p_request_metadata JSONB DEFAULT '{}',
  p_response_metadata JSONB DEFAULT '{}',
  p_status TEXT DEFAULT 'success',
  p_error_message TEXT DEFAULT NULL,
  p_duration_ms INTEGER DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
  v_input_cost_cents INTEGER;
  v_output_cost_cents INTEGER;
  v_pricing RECORD;
BEGIN
  -- Get pricing for the model
  SELECT input_cost_per_million_tokens, output_cost_per_million_tokens
  INTO v_pricing
  FROM public.api_model_pricing
  WHERE provider = p_provider
    AND model_id = p_model_id
    AND is_active = true
  ORDER BY effective_from DESC
  LIMIT 1;

  -- Calculate costs (convert from per million to actual cost)
  -- Formula: (tokens / 1,000,000) * cost_per_million_in_cents
  v_input_cost_cents := COALESCE(
    ROUND((p_input_tokens::NUMERIC / 1000000) * COALESCE(v_pricing.input_cost_per_million_tokens, 0)),
    0
  );

  v_output_cost_cents := COALESCE(
    ROUND((p_output_tokens::NUMERIC / 1000000) * COALESCE(v_pricing.output_cost_per_million_tokens, 0)),
    0
  );

  -- Insert the log entry
  INSERT INTO public.api_usage_logs (
    user_id, blueprint_id, api_provider, model_id, endpoint,
    input_tokens, output_tokens, total_tokens,
    input_cost_cents, output_cost_cents, total_cost_cents,
    request_metadata, response_metadata,
    status, error_message, request_duration_ms
  ) VALUES (
    p_user_id, p_blueprint_id, p_provider, p_model_id, p_endpoint,
    p_input_tokens, p_output_tokens, p_input_tokens + p_output_tokens,
    v_input_cost_cents, v_output_cost_cents, v_input_cost_cents + v_output_cost_cents,
    p_request_metadata, p_response_metadata,
    p_status, p_error_message, p_duration_ms
  ) RETURNING id INTO v_log_id;

  -- Update or insert daily summary
  PERFORM public.update_cost_summaries(p_user_id, CURRENT_DATE);

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

-- 7. Create function to update cost summaries
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
    SUM(CASE WHEN endpoint = 'generate-blueprint' THEN 1 ELSE 0 END) as blueprints,
    SUM(CASE WHEN endpoint = 'generate-dynamic-questions' THEN 1 ELSE 0 END) as questions,
    jsonb_object_agg(
      api_provider,
      jsonb_build_object('cents', SUM(total_cost_cents), 'calls', COUNT(*))
    ) FILTER (WHERE api_provider IS NOT NULL) as by_provider,
    jsonb_object_agg(
      model_id,
      jsonb_build_object('cents', SUM(total_cost_cents), 'calls', COUNT(*))
    ) FILTER (WHERE model_id IS NOT NULL) as by_model,
    jsonb_object_agg(
      endpoint,
      jsonb_build_object('cents', SUM(total_cost_cents), 'calls', COUNT(*))
    ) FILTER (WHERE endpoint IS NOT NULL) as by_endpoint
  INTO v_daily_data
  FROM public.api_usage_logs
  WHERE user_id = p_user_id
    AND DATE(created_at) = p_date
    AND status = 'success';

  -- Upsert daily summary
  INSERT INTO public.user_cost_summaries (
    user_id, period_type, period_date,
    total_api_calls, total_cost_cents,
    total_input_tokens, total_output_tokens,
    blueprints_generated, dynamic_questions_generated,
    costs_by_provider, costs_by_model, costs_by_endpoint
  ) VALUES (
    p_user_id, 'daily', p_date,
    COALESCE(v_daily_data.total_calls, 0),
    COALESCE(v_daily_data.total_cost, 0),
    COALESCE(v_daily_data.total_input, 0),
    COALESCE(v_daily_data.total_output, 0),
    COALESCE(v_daily_data.blueprints, 0),
    COALESCE(v_daily_data.questions, 0),
    COALESCE(v_daily_data.by_provider, '{}'::jsonb),
    COALESCE(v_daily_data.by_model, '{}'::jsonb),
    COALESCE(v_daily_data.by_endpoint, '{}'::jsonb)
  )
  ON CONFLICT (user_id, period_type, period_date)
  DO UPDATE SET
    total_api_calls = EXCLUDED.total_api_calls,
    total_cost_cents = EXCLUDED.total_cost_cents,
    total_input_tokens = EXCLUDED.total_input_tokens,
    total_output_tokens = EXCLUDED.total_output_tokens,
    blueprints_generated = EXCLUDED.blueprints_generated,
    dynamic_questions_generated = EXCLUDED.dynamic_questions_generated,
    costs_by_provider = EXCLUDED.costs_by_provider,
    costs_by_model = EXCLUDED.costs_by_model,
    costs_by_endpoint = EXCLUDED.costs_by_endpoint,
    updated_at = NOW();

  -- Calculate and upsert monthly summary
  WITH monthly_logs AS (
    SELECT
      COUNT(*) as total_calls,
      SUM(total_cost_cents) as total_cost,
      SUM(input_tokens) as total_input,
      SUM(output_tokens) as total_output,
      SUM(CASE WHEN endpoint = 'generate-blueprint' THEN 1 ELSE 0 END) as blueprints,
      SUM(CASE WHEN endpoint = 'generate-dynamic-questions' THEN 1 ELSE 0 END) as questions,
      jsonb_object_agg(
        api_provider,
        jsonb_build_object('cents', SUM(total_cost_cents), 'calls', COUNT(*))
      ) FILTER (WHERE api_provider IS NOT NULL) as by_provider,
      jsonb_object_agg(
        model_id,
        jsonb_build_object('cents', SUM(total_cost_cents), 'calls', COUNT(*))
      ) FILTER (WHERE model_id IS NOT NULL) as by_model,
      jsonb_object_agg(
        endpoint,
        jsonb_build_object('cents', SUM(total_cost_cents), 'calls', COUNT(*))
      ) FILTER (WHERE endpoint IS NOT NULL) as by_endpoint
    FROM public.api_usage_logs
    WHERE user_id = p_user_id
      AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', p_date)
      AND status = 'success'
  )
  INSERT INTO public.user_cost_summaries (
    user_id, period_type, period_date,
    total_api_calls, total_cost_cents,
    total_input_tokens, total_output_tokens,
    blueprints_generated, dynamic_questions_generated,
    costs_by_provider, costs_by_model, costs_by_endpoint
  )
  SELECT
    p_user_id, 'monthly', DATE_TRUNC('month', p_date)::DATE,
    COALESCE(total_calls, 0),
    COALESCE(total_cost, 0),
    COALESCE(total_input, 0),
    COALESCE(total_output, 0),
    COALESCE(blueprints, 0),
    COALESCE(questions, 0),
    COALESCE(by_provider, '{}'::jsonb),
    COALESCE(by_model, '{}'::jsonb),
    COALESCE(by_endpoint, '{}'::jsonb)
  FROM monthly_logs
  ON CONFLICT (user_id, period_type, period_date)
  DO UPDATE SET
    total_api_calls = EXCLUDED.total_api_calls,
    total_cost_cents = EXCLUDED.total_cost_cents,
    total_input_tokens = EXCLUDED.total_input_tokens,
    total_output_tokens = EXCLUDED.total_output_tokens,
    blueprints_generated = EXCLUDED.blueprints_generated,
    dynamic_questions_generated = EXCLUDED.dynamic_questions_generated,
    costs_by_provider = EXCLUDED.costs_by_provider,
    costs_by_model = EXCLUDED.costs_by_model,
    costs_by_endpoint = EXCLUDED.costs_by_endpoint,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- 8. Create view for easy cost querying
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

-- 9. RLS Policies
ALTER TABLE public.api_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_model_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_cost_summaries ENABLE ROW LEVEL SECURITY;

-- Users can see their own API usage logs
CREATE POLICY "Users can view own api usage logs"
  ON public.api_usage_logs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admins and developers can see all API usage logs
CREATE POLICY "Admins can view all api usage logs"
  ON public.api_usage_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND user_role IN ('admin', 'developer')
    )
  );

-- Everyone can view model pricing (public information)
CREATE POLICY "Everyone can view model pricing"
  ON public.api_model_pricing FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can modify model pricing
CREATE POLICY "Only admins can modify model pricing"
  ON public.api_model_pricing FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND user_role IN ('admin', 'developer')
    )
  );

-- Users can see their own cost summaries
CREATE POLICY "Users can view own cost summaries"
  ON public.user_cost_summaries FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admins can see all cost summaries
CREATE POLICY "Admins can view all cost summaries"
  ON public.user_cost_summaries FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND user_role IN ('admin', 'developer')
    )
  );

-- 10. Create helper functions for admin dashboard
CREATE OR REPLACE FUNCTION public.get_user_cost_details(
  p_user_id UUID,
  p_from_date DATE DEFAULT NULL,
  p_to_date DATE DEFAULT NULL
) RETURNS TABLE (
  total_cost_cents INTEGER,
  total_api_calls INTEGER,
  total_input_tokens BIGINT,
  total_output_tokens BIGINT,
  costs_by_provider JSONB,
  costs_by_model JSONB,
  costs_by_endpoint JSONB,
  daily_costs JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH date_range AS (
    SELECT
      COALESCE(p_from_date, CURRENT_DATE - INTERVAL '30 days')::DATE as from_date,
      COALESCE(p_to_date, CURRENT_DATE)::DATE as to_date
  ),
  aggregated_data AS (
    SELECT
      SUM(l.total_cost_cents)::INTEGER as total_cost,
      COUNT(*)::INTEGER as total_calls,
      SUM(l.input_tokens)::BIGINT as total_input,
      SUM(l.output_tokens)::BIGINT as total_output,
      jsonb_object_agg(
        l.api_provider,
        jsonb_build_object(
          'cents', SUM(l.total_cost_cents),
          'calls', COUNT(*),
          'input_tokens', SUM(l.input_tokens),
          'output_tokens', SUM(l.output_tokens)
        )
      ) FILTER (WHERE l.api_provider IS NOT NULL) as by_provider,
      jsonb_object_agg(
        l.model_id,
        jsonb_build_object(
          'cents', SUM(l.total_cost_cents),
          'calls', COUNT(*),
          'input_tokens', SUM(l.input_tokens),
          'output_tokens', SUM(l.output_tokens)
        )
      ) FILTER (WHERE l.model_id IS NOT NULL) as by_model,
      jsonb_object_agg(
        l.endpoint,
        jsonb_build_object(
          'cents', SUM(l.total_cost_cents),
          'calls', COUNT(*),
          'input_tokens', SUM(l.input_tokens),
          'output_tokens', SUM(l.output_tokens)
        )
      ) FILTER (WHERE l.endpoint IS NOT NULL) as by_endpoint
    FROM public.api_usage_logs l, date_range dr
    WHERE l.user_id = p_user_id
      AND DATE(l.created_at) BETWEEN dr.from_date AND dr.to_date
      AND l.status = 'success'
  ),
  daily_breakdown AS (
    SELECT jsonb_object_agg(
      TO_CHAR(DATE(l.created_at), 'YYYY-MM-DD'),
      jsonb_build_object(
        'cents', SUM(l.total_cost_cents),
        'calls', COUNT(*),
        'input_tokens', SUM(l.input_tokens),
        'output_tokens', SUM(l.output_tokens)
      )
    ) as daily_data
    FROM public.api_usage_logs l, date_range dr
    WHERE l.user_id = p_user_id
      AND DATE(l.created_at) BETWEEN dr.from_date AND dr.to_date
      AND l.status = 'success'
    GROUP BY DATE(l.created_at)
  )
  SELECT
    COALESCE(a.total_cost, 0),
    COALESCE(a.total_calls, 0),
    COALESCE(a.total_input, 0),
    COALESCE(a.total_output, 0),
    COALESCE(a.by_provider, '{}'::jsonb),
    COALESCE(a.by_model, '{}'::jsonb),
    COALESCE(a.by_endpoint, '{}'::jsonb),
    COALESCE(d.daily_data, '{}'::jsonb)
  FROM aggregated_data a
  CROSS JOIN daily_breakdown d;
END;
$$ LANGUAGE plpgsql;

-- Add comment for documentation
COMMENT ON TABLE public.api_usage_logs IS 'Tracks all API calls, their token usage, and associated costs';
COMMENT ON TABLE public.api_model_pricing IS 'Configuration table for API model pricing per provider';
COMMENT ON TABLE public.user_cost_summaries IS 'Pre-aggregated cost summaries for performance optimization';
COMMENT ON FUNCTION public.log_api_usage IS 'Logs API usage and automatically calculates costs based on current pricing';
COMMENT ON FUNCTION public.update_cost_summaries IS 'Updates aggregated cost summaries for a user';
COMMENT ON FUNCTION public.get_user_cost_details IS 'Returns detailed cost breakdown for a specific user within a date range';