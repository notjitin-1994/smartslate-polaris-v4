-- ============================================================================
-- Migration: Create Payment History RPC Function
-- Description: Create a function to fetch user payment history with pagination
-- Version: 1.0.0
-- Date: 2025-10-29
-- ============================================================================

-- Function: Get user payment history with pagination
CREATE OR REPLACE FUNCTION get_user_payment_history(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 10,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
  payment_id UUID,
  subscription_id UUID,
  razorpay_payment_id VARCHAR(255),
  razorpay_order_id VARCHAR(255),
  amount INTEGER,
  currency VARCHAR(3),
  status VARCHAR(50),
  payment_method JSONB,
  description TEXT,
  invoice_id VARCHAR(255),
  invoice_url TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  total_count INTEGER
) AS $$
DECLARE
  v_total_count INTEGER;
BEGIN
  -- Get total count for pagination
  SELECT COUNT(*)
  INTO v_total_count
  FROM public.payments p
  WHERE p.user_id = p_user_id
    AND p.deleted_at IS NULL;

  -- Return paginated results with total count
  RETURN QUERY
  SELECT
    p.payment_id,
    p.subscription_id,
    p.razorpay_payment_id,
    p.razorpay_order_id,
    p.amount,
    p.currency,
    p.status,
    p.payment_method,
    p.description,
    p.invoice_id,
    p.invoice_url,
    p.created_at,
    p.updated_at,
    v_total_count
  FROM public.payments p
  WHERE p.user_id = p_user_id
    AND p.deleted_at IS NULL
  ORDER BY p.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get payment statistics for a user
CREATE OR REPLACE FUNCTION get_user_payment_statistics(
  p_user_id UUID
)
RETURNS TABLE(
  total_payments INTEGER,
  total_amount BIGINT,
  successful_payments INTEGER,
  successful_amount BIGINT,
  failed_payments INTEGER,
  last_payment_date TIMESTAMPTZ,
  average_payment_amount NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER AS total_payments,
    COALESCE(SUM(p.amount), 0)::BIGINT AS total_amount,
    COUNT(CASE WHEN p.status = 'captured' THEN 1 END)::INTEGER AS successful_payments,
    COALESCE(SUM(CASE WHEN p.status = 'captured' THEN p.amount ELSE 0 END), 0)::BIGINT AS successful_amount,
    COUNT(CASE WHEN p.status = 'failed' THEN 1 END)::INTEGER AS failed_payments,
    MAX(p.created_at) AS last_payment_date,
    CASE
      WHEN COUNT(CASE WHEN p.status = 'captured' THEN 1 END) > 0
      THEN ROUND(AVG(CASE WHEN p.status = 'captured' THEN p.amount END), 2)
      ELSE 0
    END AS average_payment_amount
  FROM public.payments p
  WHERE p.user_id = p_user_id
    AND p.deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_user_payment_history(UUID, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_payment_statistics(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_payment_history(UUID, INTEGER, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION get_user_payment_statistics(UUID) TO service_role;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION get_user_payment_history(UUID, INTEGER, INTEGER) IS
  'Fetch paginated payment history for a specific user with total count for pagination';

COMMENT ON FUNCTION get_user_payment_statistics(UUID) IS
  'Get payment statistics including totals, averages, and counts for a specific user';