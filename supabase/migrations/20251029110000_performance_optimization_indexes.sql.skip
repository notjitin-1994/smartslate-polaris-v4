-- Performance Optimization Indexes
-- Migration: 20251029110000_performance_optimization_indexes.sql
-- Purpose: Add composite indexes to improve query performance

-- Composite index for user blueprint queries with status filtering
-- This improves the performance of queries like:
-- SELECT * FROM blueprint_generator WHERE user_id = $1 AND status = $2
CREATE INDEX IF NOT EXISTS idx_blueprint_user_status ON blueprint_generator (user_id, status);

-- Composite index for user blueprint queries with ordering by creation date
-- This improves the performance of queries like:
-- SELECT * FROM blueprint_generator WHERE user_id = $1 ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_blueprint_user_created_at ON blueprint_generator (user_id, created_at DESC);

-- Composite index for user blueprint queries with status and creation date
-- This improves the performance of queries like:
-- SELECT * FROM blueprint_generator WHERE user_id = $1 AND status = $2 ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_blueprint_user_status_created_at ON blueprint_generator (user_id, status, created_at DESC);

-- Index for blueprint version queries
-- This improves the performance of queries that filter by blueprint ID and version
CREATE INDEX IF NOT EXISTS idx_blueprint_id_version ON blueprint_generator (id, version DESC);

-- Index for subscription queries by user and status
-- This improves the performance of queries like:
-- SELECT * FROM subscriptions WHERE user_id = $1 AND status = $2
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status ON subscriptions (user_id, status);

-- Index for subscription queries by user with creation date ordering
-- This improves the performance of queries like:
-- SELECT * FROM subscriptions WHERE user_id = $1 ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_created_at ON subscriptions (user_id, created_at DESC);

-- Index for razorpay subscription lookups
-- This improves the performance of queries like:
-- SELECT * FROM subscriptions WHERE razorpay_subscription_id = $1
CREATE INDEX IF NOT EXISTS idx_subscriptions_razorpay_id ON subscriptions (razorpay_subscription_id);

-- Index for webhook event queries
-- This improves the performance of queries like:
-- SELECT * FROM razorpay_webhook_events WHERE event_type = $1 ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_webhook_events_type_created_at ON razorpay_webhook_events (event_type, created_at DESC);

-- Index for payment queries by user and status
-- This improves the performance of queries like:
-- SELECT * FROM razorpay_payments WHERE user_id = $1 AND status = $2
CREATE INDEX IF NOT EXISTS idx_payments_user_status ON razorpay_payments (user_id, status);

-- Partial index for active subscriptions only (smaller, faster index)
-- This creates a more efficient index for common queries on active subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_active ON subscriptions (user_id, status) WHERE status IN ('active', 'trialing', 'authenticated');

-- Partial index for completed blueprints only
-- This creates a more efficient index for common queries on completed blueprints
CREATE INDEX IF NOT EXISTS idx_blueprints_completed ON blueprint_generator (user_id, created_at DESC) WHERE status = 'completed';

-- GIN index for JSONB fields (used for searching questionnaire data)
-- This improves the performance of queries that search within JSONB columns
CREATE INDEX IF NOT EXISTS idx_blueprint_static_answers_gin ON blueprint_generator USING GIN (static_answers);

-- GIN index for dynamic questions JSONB field
-- This improves the performance of queries that search within dynamic questions
CREATE INDEX IF NOT EXISTS idx_blueprint_dynamic_questions_gin ON blueprint_generator USING GIN (dynamic_questions);

-- GIN index for dynamic answers JSONB field
-- This improves the performance of queries that search within dynamic answers
CREATE INDEX IF NOT EXISTS idx_blueprint_dynamic_answers_gin ON blueprint_generator USING GIN (dynamic_answers);

-- Add comments to document the purpose of each index
COMMENT ON INDEX idx_blueprint_user_status IS 'Optimizes user blueprint queries with status filtering';
COMMENT ON INDEX idx_blueprint_user_created_at IS 'Optimizes user blueprint queries ordered by creation date';
COMMENT ON INDEX idx_blueprint_user_status_created_at IS 'Optimizes user blueprint queries with status filtering and ordering';
COMMENT ON INDEX idx_blueprint_id_version IS 'Optimizes blueprint version queries';
COMMENT ON INDEX idx_subscriptions_user_status IS 'Optimizes subscription queries by user and status';
COMMENT ON INDEX idx_subscriptions_user_created_at IS 'Optimizes subscription queries ordered by creation date';
COMMENT ON INDEX idx_subscriptions_razorpay_id IS 'Optimizes Razorpay subscription lookups';
COMMENT ON INDEX idx_webhook_events_type_created_at IS 'Optimizes webhook event queries with ordering';
COMMENT ON INDEX idx_payments_user_status IS 'Optimizes payment queries by user and status';
COMMENT ON INDEX idx_subscriptions_active IS 'Efficient index for active subscriptions only';
COMMENT ON INDEX idx_blueprints_completed IS 'Efficient index for completed blueprints only';
COMMENT ON INDEX idx_blueprint_static_answers_gin IS 'Optimizes searches within static_answers JSONB';
COMMENT ON INDEX idx_blueprint_dynamic_questions_gin IS 'Optimizes searches within dynamic_questions JSONB';
COMMENT ON INDEX idx_blueprint_dynamic_answers_gin IS 'Optimizes searches within dynamic_answers JSONB';

-- Analyze tables to update query planner statistics
ANALYZE blueprint_generator;
ANALYZE subscriptions;
ANALYZE razorpay_webhook_events;
ANALYZE razorpay_payments;

-- Create a function to check index usage (for monitoring)
CREATE OR REPLACE FUNCTION get_index_usage_stats()
RETURNS TABLE (
  schemaname TEXT,
  tablename TEXT,
  indexname TEXT,
  idx_scan BIGINT,
  idx_tup_read BIGINT,
  idx_tup_fetch BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    nspname AS schemaname,
    relname AS tablename,
    indexrelname AS indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
  FROM pg_stat_user_indexes
  WHERE schemaname = 'public'
    AND indexrelname LIKE ANY(ARRAY[
      'idx_blueprint_%',
      'idx_subscriptions_%',
      'idx_webhook_events_%',
      'idx_payments_%'
    ])
  ORDER BY idx_scan DESC;
END;
$$ LANGUAGE plpgsql;

-- Create a view for monitoring index effectiveness
CREATE OR REPLACE VIEW performance_index_stats AS
SELECT
  nspname AS schema_name,
  relname AS table_name,
  indexrelname AS index_name,
  idx_scan AS index_scans,
  idx_tup_read AS tuples_read,
  idx_tup_fetch AS tuples_fetched,
  CASE
    WHEN idx_scan = 0 THEN 'UNUSED'
    WHEN idx_scan < 10 THEN 'LOW_USAGE'
    WHEN idx_scan < 100 THEN 'MEDIUM_USAGE'
    ELSE 'HIGH_USAGE'
  END AS usage_level
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND indexrelname LIKE ANY(ARRAY[
    'idx_blueprint_%',
    'idx_subscriptions_%',
    'idx_webhook_events_%',
    'idx_payments_%'
  ]);

-- Grant access to monitoring functions
GRANT SELECT ON performance_index_stats TO authenticated, anon;