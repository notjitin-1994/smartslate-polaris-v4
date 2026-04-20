-- ============================================================================
-- Migration: Add Missing Columns to Razorpay Tables
-- Description: Adds missing columns referenced in webhook handlers
-- Version: 1.0.0
-- Date: 2025-10-29
-- ============================================================================

-- ============================================================================
-- ADD MISSING COLUMNS TO SUBSCRIPTIONS TABLE
-- ============================================================================

-- Add payment_verified_at column (referenced in subscriptionHandlers.ts:234)
ALTER TABLE public.subscriptions
ADD COLUMN IF NOT EXISTS payment_verified_at TIMESTAMPTZ;

-- Add start_at column (referenced in subscriptionHandlers.ts:112)
ALTER TABLE public.subscriptions
ADD COLUMN IF NOT EXISTS start_at TIMESTAMPTZ;

-- ============================================================================
-- ADD MISSING COLUMNS TO PAYMENTS TABLE
-- ============================================================================

-- Add payment_type column (referenced in paymentHandlers.ts:167)
ALTER TABLE public.payments
ADD COLUMN IF NOT EXISTS payment_type VARCHAR(50);

-- Add captured_at column (referenced in paymentHandlers.ts:198)
ALTER TABLE public.payments
ADD COLUMN IF NOT EXISTS captured_at TIMESTAMPTZ;

-- Add failed_at column (referenced in paymentHandlers.ts:198)
ALTER TABLE public.payments
ADD COLUMN IF NOT EXISTS failed_at TIMESTAMPTZ;

-- ============================================================================
-- ADD INDEXES FOR NEW COLUMNS
-- ============================================================================

-- Index for subscription payment verification queries
CREATE INDEX IF NOT EXISTS idx_subscriptions_payment_verified_at
ON public.subscriptions(payment_verified_at DESC)
WHERE payment_verified_at IS NOT NULL;

-- Index for subscription start date queries
CREATE INDEX IF NOT EXISTS idx_subscriptions_start_at
ON public.subscriptions(start_at DESC)
WHERE start_at IS NOT NULL;

-- Index for payment type queries
CREATE INDEX IF NOT EXISTS idx_payments_payment_type
ON public.payments(payment_type)
WHERE payment_type IS NOT NULL;

-- Index for payment capture time queries
CREATE INDEX IF NOT EXISTS idx_payments_captured_at
ON public.payments(captured_at DESC)
WHERE captured_at IS NOT NULL;

-- Index for payment failure time queries
CREATE INDEX IF NOT EXISTS idx_payments_failed_at
ON public.payments(failed_at DESC)
WHERE failed_at IS NOT NULL;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN public.subscriptions.payment_verified_at IS 'Timestamp when the subscription payment was verified (set on payment.captured event)';
COMMENT ON COLUMN public.subscriptions.start_at IS 'Timestamp when the subscription starts/started (from Razorpay payload)';
COMMENT ON COLUMN public.payments.payment_type IS 'Type of payment (e.g., subscription, one-time, etc.)';
COMMENT ON COLUMN public.payments.captured_at IS 'Timestamp when the payment was captured (successful)';
COMMENT ON COLUMN public.payments.failed_at IS 'Timestamp when the payment failed';

-- ============================================================================
-- MIGRATION NOTES
-- ============================================================================

-- These columns were referenced in the webhook handler files but were missing
-- from the original table schemas:
--
-- subscriptionHandlers.ts:234 - payment_verified_at
-- subscriptionHandlers.ts:112 - start_at
-- paymentHandlers.ts:167 - payment_type
-- paymentHandlers.ts:198 - captured_at, failed_at
--
-- Adding these columns ensures handlers can update all necessary fields
-- without encountering database errors.
