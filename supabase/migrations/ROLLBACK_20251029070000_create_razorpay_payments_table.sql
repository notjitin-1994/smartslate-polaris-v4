-- ============================================================================
-- Rollback Migration: Drop Razorpay Payments Table
-- Rollback for: 20251029070000_create_razorpay_payments_table.sql
-- Version: 1.0.0
-- Date: 2025-10-29
-- ============================================================================

-- ============================================================================
-- DROP TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS trigger_update_payments_updated_at ON public.payments;

-- ============================================================================
-- DROP FUNCTIONS
-- ============================================================================

DROP FUNCTION IF EXISTS record_successful_payment(VARCHAR, UUID, UUID, INTEGER, VARCHAR, JSONB);
DROP FUNCTION IF EXISTS get_subscription_payment_summary(UUID);
DROP FUNCTION IF EXISTS get_user_total_revenue(UUID);
DROP FUNCTION IF EXISTS get_payment_history(UUID, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS update_payments_updated_at();

-- ============================================================================
-- DROP RLS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Service role has full access to payments" ON public.payments;
DROP POLICY IF EXISTS "Users can update own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can insert own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;

-- ============================================================================
-- DROP INDEXES
-- ============================================================================

DROP INDEX IF EXISTS idx_payments_failed;
DROP INDEX IF EXISTS idx_payments_user_history;
DROP INDEX IF EXISTS idx_payments_deleted_at;
DROP INDEX IF EXISTS idx_payments_payment_date;
DROP INDEX IF EXISTS idx_payments_method;
DROP INDEX IF EXISTS idx_payments_status;
DROP INDEX IF EXISTS idx_payments_razorpay_payment_id;
DROP INDEX IF EXISTS idx_payments_subscription_id;
DROP INDEX IF EXISTS idx_payments_user_id;

-- ============================================================================
-- DROP TABLE
-- ============================================================================

DROP TABLE IF EXISTS public.payments CASCADE;
