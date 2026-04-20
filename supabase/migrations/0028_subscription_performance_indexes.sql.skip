-- Migration: Add performance indexes for subscription queries
-- Description: Optimize database performance for subscription-related operations
-- Version: 1.0.0
-- Date: 2025-10-30

-- Create indexes for user_profiles table to improve subscription queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_status ON public.user_profiles(subscription_status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_tier ON public.user_profiles(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_id ON public.user_profiles(subscription_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_razorpay_subscription_id ON public.user_profiles(razorpay_subscription_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_updated ON public.user_profiles(subscription_updated_at DESC);

-- Composite indexes for common subscription queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_active_subscriptions
ON public.user_profiles(subscription_status, subscription_tier)
WHERE subscription_status IN ('active', 'trialing');

CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_lookup
ON public.user_profiles(razorpay_subscription_id, subscription_status);

CREATE INDEX IF NOT EXISTS idx_user_profiles_usage_monitoring
ON public.user_profiles(id, subscription_tier, blueprint_creation_count, blueprint_creation_limit);

-- Index for subscription cancellation and upgrade operations
CREATE INDEX IF NOT EXISTS idx_user_profiles_cancellation_eligible
ON public.user_profiles(subscription_status, subscription_id, updated_at DESC)
WHERE subscription_status IN ('active', 'authenticated', 'trialing');

-- Create indexes for blueprint_generator table (main subscription usage table)
CREATE INDEX IF NOT EXISTS idx_blueprint_generator_user_status ON public.blueprint_generator(user_id, status);
CREATE INDEX IF NOT EXISTS idx_blueprint_generator_user_created ON public.blueprint_generator(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blueprint_generator_status_created ON public.blueprint_generator(status, created_at DESC);

-- Index for finding user's recent blueprints (for usage calculations)
CREATE INDEX IF NOT EXISTS idx_blueprint_generator_recent_activity
ON public.blueprint_generator(user_id, created_at DESC)
WHERE created_at > NOW() - INTERVAL '30 days';

-- Index for subscription webhook processing
CREATE INDEX IF NOT EXISTS idx_blueprint_generator_subscription_webhooks
ON public.blueprint_generator(user_id, razorpay_subscription_id, updated_at DESC);

-- Create function indexes for JSONB fields if they exist
-- (For future-proofing when we add JSONB metadata columns)

DO $$
BEGIN
    -- Check if the blueprint_generator table has JSONB columns and create indexes accordingly
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'blueprint_generator'
        AND column_name = 'metadata'
        AND data_type = 'jsonb'
    ) THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_blueprint_generator_metadata_gin ON public.blueprint_generator USING gin(metadata);';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_blueprint_generator_metadata_btree ON public.blueprint_generator USING btree((metadata->>''subscription_id''));';
    END IF;

    -- Check if user_profiles has JSONB columns for additional data
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_profiles'
        AND column_name = 'usage_metadata'
        AND data_type = 'jsonb'
    ) THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_user_profiles_usage_metadata_gin ON public.user_profiles USING gin(usage_metadata);';
    END IF;
END $$;

-- Create partial indexes for common filtered queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_paying_users
ON public.user_profiles(id, subscription_tier, updated_at DESC)
WHERE subscription_tier IN ('explorer', 'navigator', 'voyager', 'crew', 'fleet', 'armada');

CREATE INDEX IF NOT EXISTS idx_user_profiles_team_subscriptions
ON public.user_profiles(id, subscription_tier, user_role)
WHERE subscription_tier IN ('crew', 'fleet', 'armada');

CREATE INDEX IF NOT EXISTS idx_user_profiles_individual_subscriptions
ON public.user_profiles(id, subscription_tier, user_role)
WHERE subscription_tier IN ('explorer', 'navigator', 'voyager');

-- Index for subscription analytics queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_analytics
ON public.user_profiles(subscription_tier, subscription_status, created_at DESC);

-- Index for usage monitoring and limit checking
CREATE INDEX IF NOT EXISTS idx_user_profiles_usage_limits
ON public.user_profiles(id, blueprint_creation_count, blueprint_creation_limit, subscription_tier);

-- Index for finding users who might exceed limits
CREATE INDEX IF NOT EXISTS idx_user_profiles_near_limits
ON public.user_profiles(id, blueprint_creation_count, blueprint_creation_limit)
WHERE blueprint_creation_count >= (blueprint_creation_limit * 0.8);

-- Create indexes for subscription status changes (for analytics)
CREATE INDEX IF NOT EXISTS idx_user_profiles_status_changes
ON public.user_profiles(id, subscription_status, subscription_updated_at DESC);

-- Index for expired subscriptions cleanup
CREATE INDEX IF NOT EXISTS idx_user_profiles_expired_cleanup
ON public.user_profiles(subscription_status, subscription_updated_at DESC)
WHERE subscription_status IN ('expired', 'cancelled');

-- Create a function-based index for subscription status categorization
CREATE OR REPLACE FUNCTION get_subscription_category(status TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN CASE
        WHEN status IN ('active', 'trialing') THEN 'active';
        WHEN status IN ('cancelled', 'expired') THEN 'inactive';
        WHEN status IN ('pending', 'created', 'authenticated') THEN 'pending';
        WHEN status IN ('paused', 'halted') THEN 'suspended';
        ELSE 'unknown';
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_category
ON public.user_profiles(get_subscription_category(subscription_status), subscription_tier);

-- Add index for subscription lifecycle tracking
CREATE INDEX IF NOT EXISTS idx_user_profiles_lifecycle
ON public.user_profiles(razorpay_subscription_id, subscription_status, subscription_created_at DESC, subscription_cancelled_at DESC);

-- Create covering index for subscription dashboard queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_dashboard_covering
ON public.user_profiles(id, subscription_tier, subscription_status, subscription_id, razorpay_subscription_id, updated_at DESC);

-- Performance optimization for frequently accessed columns
-- Add INCLUDE clause for covering indexes (PostgreSQL 11+)
DO $$
BEGIN
    -- Check PostgreSQL version
    IF EXISTS (SELECT 1 FROM version() WHERE version() LIKE '%PostgreSQL 1[1-9]%') THEN
        -- Create covering index for subscription status queries
        EXECUTE '
            CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_covering
            ON public.user_profiles(id, subscription_tier, subscription_status, subscription_id, updated_at DESC)
            INCLUDE (razorpay_subscription_id, subscription_created_at, subscription_cancelled_at, user_role);
        ';

        -- Create covering index for usage queries
        EXECUTE '
            CREATE INDEX IF NOT EXISTS idx_user_profiles_usage_covering
            ON public.user_profiles(id, blueprint_creation_count, blueprint_creation_limit)
            INCLUDE (subscription_tier, subscription_status, updated_at);
        ';
    END IF;
END $$;

-- Add index for webhook event correlation
CREATE INDEX IF NOT EXISTS idx_user_profiles_webhook_correlation
ON public.user_profiles(razorpay_subscription_id, updated_at DESC)
WHERE razorpay_subscription_id IS NOT NULL;

-- Create index for customer support queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_support_queries
ON public.user_profiles(id, email, subscription_tier, subscription_status, created_at DESC);

-- Add index for subscription renewal and expiry tracking
CREATE INDEX IF NOT EXISTS idx_user_profiles_renewal_tracking
ON public.user_profiles(subscription_status, subscription_created_at, subscription_cancelled_at DESC)
WHERE subscription_status IN ('active', 'trialing');

-- Create partition-friendly index (if using partitioning in future)
-- This index will be useful if we partition by date ranges
CREATE INDEX IF NOT EXISTS idx_user_profiles_time_series
ON public.user_profiles(created_at DESC, updated_at DESC, subscription_status);

-- Create indexes for subscription analytics reporting
CREATE INDEX IF NOT EXISTS idx_user_profiles_tier_status_analytics
ON public.user_profiles(subscription_tier, subscription_status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_profiles_monthly_analytics
ON public.user_profiles(DATE_TRUNC('month', created_at), subscription_tier, subscription_status);

-- Add index for transaction correlation
CREATE INDEX IF NOT EXISTS idx_user_profiles_transaction_id
ON public.user_profiles(id) WHERE transaction_id IS NOT NULL;

-- Create index for subscription upgrade/downgrade tracking
CREATE INDEX IF NOT EXISTS idx_user_profiles_upgrade_tracking
ON public.user_profiles(id, subscription_tier, updated_at DESC);

-- Add index for billing cycle analysis
CREATE INDEX IF NOT EXISTS idx_user_profiles_billing_cycle
ON public.user_profiles(subscription_tier, billing_cycle, subscription_status);

-- Performance monitoring index - find slow queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_performance_monitor
ON public.user_profiles(subscription_status, updated_at DESC)
WHERE updated_at > NOW() - INTERVAL '7 days';

-- Create index for subscription health monitoring
CREATE INDEX IF NOT EXISTS idx_user_profiles_health_monitoring
ON public.user_profiles(subscription_status, razorpay_subscription_id, updated_at DESC)
WHERE razorpay_subscription_id IS NOT NULL AND updated_at > NOW() - INTERVAL '30 days';

-- Add comments for documentation
COMMENT ON INDEX idx_user_profiles_subscription_status IS 'Index for filtering users by subscription status';
COMMENT ON INDEX idx_user_profiles_subscription_tier IS 'Index for filtering users by subscription tier';
COMMENT ON INDEX idx_user_profiles_active_subscriptions IS 'Optimized index for finding active/trialing subscriptions';
COMMENT ON INDEX idx_user_profiles_cancellation_eligible IS 'Index for finding subscriptions eligible for cancellation';
COMMENT ON INDEX idx_blueprint_generator_recent_activity IS 'Index for tracking recent blueprint creation activity';
COMMENT ON INDEX idx_user_profiles_usage_limits IS 'Index for monitoring usage against limits';
COMMENT ON INDEX idx_user_profiles_near_limits IS 'Index for finding users approaching their usage limits';

-- Rollback function
CREATE OR REPLACE FUNCTION rollback_subscription_performance_indexes() RETURNS void AS $$
BEGIN
    -- Drop all indexes created in this migration
    DROP INDEX IF EXISTS idx_user_profiles_health_monitoring;
    DROP INDEX IF EXISTS idx_user_profiles_performance_monitor;
    DROP INDEX IF EXISTS idx_user_profiles_billing_cycle;
    DROP INDEX IF EXISTS idx_user_profiles_upgrade_tracking;
    DROP INDEX IF EXISTS idx_user_profiles_transaction_id;
    DROP INDEX IF EXISTS idx_user_profiles_monthly_analytics;
    DROP INDEX IF EXISTS idx_user_profiles_tier_status_analytics;
    DROP INDEX IF EXISTS idx_user_profiles_time_series;
    DROP INDEX IF EXISTS idx_user_profiles_support_queries;
    DROP INDEX IF EXISTS idx_user_profiles_webhook_correlation;
    DROP INDEX IF EXISTS idx_user_profiles_lifecycle;
    DROP INDEX IF EXISTS idx_user_profiles_subscription_category;
    DROP INDEX IF EXISTS idx_user_profiles_expired_cleanup;
    DROP INDEX IF EXISTS idx_user_profiles_status_changes;
    DROP INDEX IF EXISTS idx_user_profiles_analytics;
    DROP INDEX IF EXISTS idx_user_profiles_near_limits;
    DROP INDEX IF EXISTS idx_user_profiles_usage_limits;
    DROP INDEX IF EXISTS idx_user_profiles_individual_subscriptions;
    DROP INDEX IF EXISTS idx_user_profiles_team_subscriptions;
    DROP INDEX IF EXISTS idx_user_profiles_paying_users;

    -- Drop function-based index
    DROP INDEX IF EXISTS idx_user_profiles_subscription_category;
    DROP FUNCTION IF EXISTS get_subscription_category;

    -- Drop covering indexes (PostgreSQL 11+)
    DROP INDEX IF EXISTS idx_user_profiles_usage_covering;
    DROP INDEX IF EXISTS idx_user_profiles_subscription_covering;

    -- Drop remaining basic indexes
    DROP INDEX IF EXISTS idx_user_profiles_subscription_updated;
    DROP INDEX IF EXISTS idx_user_profiles_razorpay_subscription_id;
    DROP INDEX IF EXISTS idx_user_profiles_subscription_id;
    DROP INDEX IF EXISTS idx_user_profiles_subscription_tier;
    DROP INDEX IF EXISTS idx_user_profiles_subscription_status;

    -- Drop blueprint_generator indexes
    DROP INDEX IF EXISTS idx_blueprint_generator_subscription_webhooks;
    DROP INDEX IF EXISTS idx_blueprint_generator_recent_activity;
    DROP INDEX IF EXISTS idx_blueprint_generator_status_created;
    DROP INDEX IF EXISTS idx_blueprint_generator_user_created;
    DROP INDEX IF EXISTS idx_blueprint_generator_user_status;

    RAISE NOTICE 'All subscription performance indexes have been rolled back';
END;
$$ LANGUAGE plpgsql;