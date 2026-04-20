-- ============================================================================
-- Migration: Update Payment Status CHECK Constraint
-- Description: Adds 'refund_initiated' status to payment status constraint
-- Version: 1.0.0
-- Date: 2025-10-29
-- ============================================================================

-- ============================================================================
-- UPDATE PAYMENT STATUS CHECK CONSTRAINT
-- ============================================================================

-- Drop the existing constraint
ALTER TABLE public.payments
DROP CONSTRAINT IF EXISTS valid_payment_status;

-- Recreate the constraint with the additional 'refund_initiated' status
ALTER TABLE public.payments
ADD CONSTRAINT valid_payment_status CHECK (
  status IN (
    'created',
    'authorized',
    'captured',
    'refunded',
    'refund_initiated',  -- New status for refund processing
    'failed',
    'pending'
  )
);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON CONSTRAINT valid_payment_status ON public.payments IS 'Valid payment statuses including refund_initiated for payments being refunded';

-- ============================================================================
-- MIGRATION NOTES
-- ============================================================================

-- This migration adds the 'refund_initiated' status to the payment status
-- CHECK constraint. This status is referenced in:
--
-- - paymentHandlers.ts - handleRefundCreated function
-- - Razorpay refund webhook events (refund.created, refund.processed)
--
-- The refund lifecycle is:
-- 1. payment.captured -> captured (payment successful)
-- 2. refund.created -> refund_initiated (refund request created)
-- 3. refund.processed -> refunded (refund completed)
--
-- This ensures the database schema supports the full refund workflow.
