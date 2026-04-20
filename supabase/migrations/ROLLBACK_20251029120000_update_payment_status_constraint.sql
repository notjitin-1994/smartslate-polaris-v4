-- ============================================================================
-- Rollback Migration: Update Payment Status CHECK Constraint
-- Description: Reverts payment status constraint to original version
-- Version: 1.0.0
-- Date: 2025-10-29
-- ============================================================================

-- ============================================================================
-- REVERT PAYMENT STATUS CHECK CONSTRAINT
-- ============================================================================

-- Drop the updated constraint
ALTER TABLE public.payments
DROP CONSTRAINT IF EXISTS valid_payment_status;

-- Recreate the original constraint without 'refund_initiated'
ALTER TABLE public.payments
ADD CONSTRAINT valid_payment_status CHECK (
  status IN (
    'created',
    'authorized',
    'captured',
    'refunded',
    'failed',
    'pending'
  )
);
