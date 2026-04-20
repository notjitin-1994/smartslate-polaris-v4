-- Enhanced Cost Tracking: Add Cache Token Support
-- This migration adds support for Anthropic's prompt caching feature
-- Cache reads are charged at 90% discount (10% of input token rates)

-- ==============================================================
-- 1. ADD CACHE TOKEN COLUMNS TO api_usage_logs
-- ==============================================================

-- Add columns for cache token tracking
ALTER TABLE public.api_usage_logs
  ADD COLUMN IF NOT EXISTS cache_creation_input_tokens INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cache_read_input_tokens INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cache_creation_cost_cents INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cache_read_cost_cents INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pricing_found BOOLEAN NOT NULL DEFAULT true;

-- Add comments for documentation
COMMENT ON COLUMN public.api_usage_logs.cache_creation_input_tokens IS 'Tokens used to create cached content (charged at input token rates)';
COMMENT ON COLUMN public.api_usage_logs.cache_read_input_tokens IS 'Tokens read from cache (charged at 90% discount)';
COMMENT ON COLUMN public.api_usage_logs.cache_creation_cost_cents IS 'Cost for cache creation tokens in cents';
COMMENT ON COLUMN public.api_usage_logs.cache_read_cost_cents IS 'Cost for cache read tokens in cents (90% discount applied)';
COMMENT ON COLUMN public.api_usage_logs.pricing_found IS 'Whether pricing was found for this model (false indicates $0 cost due to missing pricing)';

-- ==============================================================
-- 2. ADD CACHE PRICING TO api_model_pricing
-- ==============================================================

-- Add cache read pricing column (typically 10% of input cost)
ALTER TABLE public.api_model_pricing
  ADD COLUMN IF NOT EXISTS cache_read_cost_per_million_tokens INTEGER;

COMMENT ON COLUMN public.api_model_pricing.cache_read_cost_per_million_tokens IS 'Cost per million cache read tokens in cents (90% discount from input)';

-- ==============================================================
-- 3. UPDATE EXISTING PRICING WITH CACHE RATES
-- ==============================================================

-- Set cache read costs to 10% of input costs for existing models
UPDATE public.api_model_pricing
SET cache_read_cost_per_million_tokens = ROUND(input_cost_per_million_tokens * 0.1)
WHERE cache_read_cost_per_million_tokens IS NULL
  AND is_active = true;

-- Ensure all future pricing entries have cache pricing
ALTER TABLE public.api_model_pricing
  ALTER COLUMN cache_read_cost_per_million_tokens SET NOT NULL,
  ALTER COLUMN cache_read_cost_per_million_tokens SET DEFAULT 0;

-- ==============================================================
-- 4. UPDATE log_api_usage() FUNCTION
-- ==============================================================

-- Drop existing function versions to avoid signature conflicts
DROP FUNCTION IF EXISTS public.log_api_usage(UUID, UUID, TEXT, TEXT, TEXT, INTEGER, INTEGER, JSONB, JSONB, TEXT, TEXT, INTEGER);
DROP FUNCTION IF EXISTS public.log_api_usage(UUID, UUID, TEXT, TEXT, TEXT, INTEGER, INTEGER, JSONB, JSONB, TEXT, TEXT, INTEGER, INTEGER, INTEGER);

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
  p_duration_ms INTEGER DEFAULT NULL,
  -- NEW: Cache token parameters (optional for backward compatibility)
  p_cache_creation_tokens INTEGER DEFAULT 0,
  p_cache_read_tokens INTEGER DEFAULT 0
) RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
  v_input_cost_cents INTEGER;
  v_output_cost_cents INTEGER;
  v_cache_creation_cost_cents INTEGER;
  v_cache_read_cost_cents INTEGER;
  v_pricing RECORD;
  v_pricing_found BOOLEAN;
BEGIN
  -- Get pricing for the model
  SELECT
    input_cost_per_million_tokens,
    output_cost_per_million_tokens,
    cache_read_cost_per_million_tokens
  INTO v_pricing
  FROM public.api_model_pricing
  WHERE provider = p_provider
    AND model_id = p_model_id
    AND is_active = true
  ORDER BY effective_from DESC
  LIMIT 1;

  -- Track if pricing was found
  v_pricing_found := v_pricing IS NOT NULL;

  -- Calculate costs (convert from per million to actual cost)
  -- Formula: (tokens / 1,000,000) * cost_per_million_in_cents

  -- Regular input tokens
  v_input_cost_cents := COALESCE(
    ROUND((p_input_tokens::NUMERIC / 1000000) * COALESCE(v_pricing.input_cost_per_million_tokens, 0)),
    0
  );

  -- Output tokens
  v_output_cost_cents := COALESCE(
    ROUND((p_output_tokens::NUMERIC / 1000000) * COALESCE(v_pricing.output_cost_per_million_tokens, 0)),
    0
  );

  -- Cache creation tokens (same price as input tokens)
  v_cache_creation_cost_cents := COALESCE(
    ROUND((p_cache_creation_tokens::NUMERIC / 1000000) * COALESCE(v_pricing.input_cost_per_million_tokens, 0)),
    0
  );

  -- Cache read tokens (90% discount - use cache_read_cost_per_million_tokens)
  v_cache_read_cost_cents := COALESCE(
    ROUND((p_cache_read_tokens::NUMERIC / 1000000) * COALESCE(v_pricing.cache_read_cost_per_million_tokens, 0)),
    0
  );

  -- Log warning if pricing not found
  IF NOT v_pricing_found THEN
    RAISE WARNING 'No pricing found for provider=% model=%. Cost will be $0.', p_provider, p_model_id;
  END IF;

  -- Insert the log entry
  INSERT INTO public.api_usage_logs (
    user_id, blueprint_id, api_provider, model_id, endpoint,
    input_tokens, output_tokens, total_tokens,
    cache_creation_input_tokens, cache_read_input_tokens,
    input_cost_cents, output_cost_cents,
    cache_creation_cost_cents, cache_read_cost_cents,
    total_cost_cents,
    request_metadata, response_metadata,
    status, error_message, request_duration_ms,
    pricing_found
  ) VALUES (
    p_user_id, p_blueprint_id, p_provider, p_model_id, p_endpoint,
    p_input_tokens, p_output_tokens,
    p_input_tokens + p_output_tokens + p_cache_creation_tokens + p_cache_read_tokens,
    p_cache_creation_tokens, p_cache_read_tokens,
    v_input_cost_cents, v_output_cost_cents,
    v_cache_creation_cost_cents, v_cache_read_cost_cents,
    v_input_cost_cents + v_output_cost_cents + v_cache_creation_cost_cents + v_cache_read_cost_cents,
    p_request_metadata, p_response_metadata,
    p_status, p_error_message, p_duration_ms,
    v_pricing_found
  ) RETURNING id INTO v_log_id;

  -- Update or insert daily summary
  PERFORM public.update_cost_summaries(p_user_id, CURRENT_DATE);

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.log_api_usage IS 'Logs API usage with cache token support and automatically calculates costs based on current pricing';

-- ==============================================================
-- 5. CREATE HELPER VIEW FOR MISSING PRICING
-- ==============================================================

CREATE OR REPLACE VIEW public.models_missing_pricing AS
SELECT
  api_provider,
  model_id,
  COUNT(*) as usage_count,
  MIN(created_at) as first_seen,
  MAX(created_at) as last_seen,
  SUM(input_tokens + output_tokens + cache_creation_input_tokens + cache_read_input_tokens) as total_tokens
FROM public.api_usage_logs
WHERE pricing_found = false
GROUP BY api_provider, model_id
ORDER BY usage_count DESC;

COMMENT ON VIEW public.models_missing_pricing IS 'Shows models that are being used but have no pricing configured';

-- ==============================================================
-- 6. CREATE ADMIN FUNCTION TO GET CACHE TOKEN STATISTICS
-- ==============================================================

CREATE OR REPLACE FUNCTION public.get_cache_token_stats(
  p_from_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_to_date DATE DEFAULT CURRENT_DATE
) RETURNS TABLE (
  total_cache_creation_tokens BIGINT,
  total_cache_read_tokens BIGINT,
  total_cache_savings_cents INTEGER,
  cache_hit_rate NUMERIC,
  api_calls_with_cache INTEGER,
  total_api_calls INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    SUM(l.cache_creation_input_tokens)::BIGINT as total_cache_creation,
    SUM(l.cache_read_input_tokens)::BIGINT as total_cache_read,
    -- Savings: cache reads would have cost 10x more without caching
    SUM(l.cache_read_input_tokens::NUMERIC *
        (p.input_cost_per_million_tokens - p.cache_read_cost_per_million_tokens) / 1000000
    )::INTEGER as savings_cents,
    -- Cache hit rate: cache reads / (cache reads + regular input + cache creation)
    CASE
      WHEN SUM(l.input_tokens + l.cache_creation_input_tokens + l.cache_read_input_tokens) > 0
      THEN ROUND(
        (SUM(l.cache_read_input_tokens)::NUMERIC /
         SUM(l.input_tokens + l.cache_creation_input_tokens + l.cache_read_input_tokens)::NUMERIC) * 100,
        2
      )
      ELSE 0
    END as cache_hit_rate,
    COUNT(CASE WHEN l.cache_read_input_tokens > 0 THEN 1 END)::INTEGER as calls_with_cache,
    COUNT(*)::INTEGER as total_calls
  FROM public.api_usage_logs l
  LEFT JOIN public.api_model_pricing p ON
    l.api_provider = p.provider
    AND l.model_id = p.model_id
    AND p.is_active = true
  WHERE DATE(l.created_at) BETWEEN p_from_date AND p_to_date
    AND l.status = 'success';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.get_cache_token_stats IS 'Returns cache token statistics and cost savings over a date range';

-- ==============================================================
-- 7. ADD CACHE TOKEN SUPPORT TO ADMIN DASHBOARD QUERIES
-- ==============================================================

-- Update the user_costs_overview view to show cache data
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
  COALESCE(monthly.dynamic_questions_generated, 0) as questions_this_month,
  -- NEW: Cache token metrics
  COALESCE(monthly_cache.total_cache_reads, 0) as cache_reads_this_month,
  COALESCE(monthly_cache.total_cache_savings_cents, 0) as cache_savings_this_month_cents
FROM auth.users u
LEFT JOIN public.user_profiles up ON u.id = up.user_id
LEFT JOIN public.user_cost_summaries daily ON
  u.id = daily.user_id
  AND daily.period_type = 'daily'
  AND daily.period_date = CURRENT_DATE
LEFT JOIN public.user_cost_summaries monthly ON
  u.id = monthly.user_id
  AND monthly.period_type = 'monthly'
  AND monthly.period_date = DATE_TRUNC('month', CURRENT_DATE)::DATE
LEFT JOIN LATERAL (
  SELECT
    SUM(cache_read_input_tokens)::BIGINT as total_cache_reads,
    SUM(cache_read_cost_cents)::INTEGER as total_cache_savings_cents
  FROM public.api_usage_logs
  WHERE user_id = u.id
    AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)
) monthly_cache ON true;

-- ==============================================================
-- 8. GRANT PERMISSIONS
-- ==============================================================

-- Grant execute permissions on new functions
GRANT EXECUTE ON FUNCTION public.get_cache_token_stats(DATE, DATE) TO authenticated;
GRANT SELECT ON public.models_missing_pricing TO authenticated;

-- ==============================================================
-- 9. ADD VALIDATION CHECKS
-- ==============================================================

-- Ensure token values are never negative
ALTER TABLE public.api_usage_logs
  ADD CONSTRAINT check_input_tokens_non_negative CHECK (input_tokens >= 0),
  ADD CONSTRAINT check_output_tokens_non_negative CHECK (output_tokens >= 0),
  ADD CONSTRAINT check_cache_creation_tokens_non_negative CHECK (cache_creation_input_tokens >= 0),
  ADD CONSTRAINT check_cache_read_tokens_non_negative CHECK (cache_read_input_tokens >= 0);

-- Ensure cost values are never negative
ALTER TABLE public.api_usage_logs
  ADD CONSTRAINT check_input_cost_non_negative CHECK (input_cost_cents >= 0),
  ADD CONSTRAINT check_output_cost_non_negative CHECK (output_cost_cents >= 0),
  ADD CONSTRAINT check_cache_creation_cost_non_negative CHECK (cache_creation_cost_cents >= 0),
  ADD CONSTRAINT check_cache_read_cost_non_negative CHECK (cache_read_cost_cents >= 0),
  ADD CONSTRAINT check_total_cost_non_negative CHECK (total_cost_cents >= 0);

-- ==============================================================
-- 10. MIGRATION COMPLETE
-- ==============================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Enhanced Cost Tracking Migration Complete';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Added Features:';
  RAISE NOTICE '  ✓ Cache token columns (creation & read)';
  RAISE NOTICE '  ✓ Cache cost tracking (90%% discount for reads)';
  RAISE NOTICE '  ✓ Pricing validation (pricing_found flag)';
  RAISE NOTICE '  ✓ Missing pricing alerts view';
  RAISE NOTICE '  ✓ Cache statistics function';
  RAISE NOTICE '  ✓ Updated user_costs_overview with cache metrics';
  RAISE NOTICE '';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '  1. Update application code to pass cache tokens';
  RAISE NOTICE '  2. Monitor models_missing_pricing view';
  RAISE NOTICE '  3. Update pricing when Anthropic changes rates';
  RAISE NOTICE '';
  RAISE NOTICE 'Cache Token Pricing:';
  RAISE NOTICE '  - Cache Creation: Same as input token rate';
  RAISE NOTICE '  - Cache Reads: 90%% discount (10%% of input rate)';
  RAISE NOTICE '========================================';
END $$;
