-- ============================================================================
-- Rollback Migration: Add Missing Columns to Razorpay Tables
-- Description: Removes the missing columns added in the forward migration
-- Version: 1.0.0
-- Date: 2025-10-29
-- ============================================================================

-- ============================================================================
-- DROP INDEXES
-- ============================================================================

DROP INDEX IF EXISTS public.idx_subscriptions_payment_verified_at;
DROP INDEX IF EXISTS public.idx_subscriptions_start_at;
DROP INDEX IF EXISTS public.idx_payments_payment_type;
DROP INDEX IF EXISTS public.idx_payments_captured_at;
DROP INDEX IF EXISTS public.idx_payments_failed_at;

-- ============================================================================
-- DROP COLUMNS FROM PAYMENTS TABLE
-- ============================================================================

ALTER TABLE public.payments
DROP COLUMN IF EXISTS failed_at;

ALTER TABLE public.payments
DROP COLUMN IF EXISTS captured_at;

ALTER TABLE public.payments
DROP COLUMN IF EXISTS payment_type;

-- ============================================================================
-- DROP COLUMNS FROM SUBSCRIPTIONS TABLE
-- ============================================================================

ALTER TABLE public.subscriptions
DROP COLUMN IF EXISTS start_at;

ALTER TABLE public.subscriptions
DROP COLUMN IF EXISTS payment_verified_at;
