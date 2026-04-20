-- ============================================================================
-- Rollback Migration: Drop Razorpay Subscriptions Table
-- Rollback for: 20251029060000_create_razorpay_subscriptions_table.sql
-- Version: 1.0.0
-- Date: 2025-10-29
-- ============================================================================

-- ============================================================================
-- DROP TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS trigger_sync_subscription_to_user_profile ON public.subscriptions;
DROP TRIGGER IF EXISTS trigger_update_subscriptions_updated_at ON public.subscriptions;

-- ============================================================================
-- DROP FUNCTIONS
-- ============================================================================

DROP FUNCTION IF EXISTS sync_subscription_to_user_profile();
DROP FUNCTION IF EXISTS cancel_subscription(UUID, UUID);
DROP FUNCTION IF EXISTS get_active_subscription(UUID);
DROP FUNCTION IF EXISTS update_subscriptions_updated_at();

-- ============================================================================
-- DROP RLS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Service role has full access to subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can update own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can insert own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.subscriptions;

-- ============================================================================
-- DROP INDEXES
-- ============================================================================

DROP INDEX IF EXISTS idx_subscriptions_user_active;
DROP INDEX IF EXISTS idx_subscriptions_deleted_at;
DROP INDEX IF EXISTS idx_subscriptions_next_billing_date;
DROP INDEX IF EXISTS idx_subscriptions_subscription_tier;
DROP INDEX IF EXISTS idx_subscriptions_status;
DROP INDEX IF EXISTS idx_subscriptions_razorpay_subscription_id;
DROP INDEX IF EXISTS idx_subscriptions_user_id;

-- ============================================================================
-- DROP TABLE
-- ============================================================================

DROP TABLE IF EXISTS public.subscriptions CASCADE;
