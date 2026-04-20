-- Razorpay Plan Investigation Script
-- Run this script in your Supabase SQL editor to identify plan ID references

-- ============================================================================
-- 1. CURRENT SUBSCRIPTIONS ANALYSIS
-- ============================================================================

-- Check current subscriptions and their plan IDs
SELECT
  s.subscription_id,
  s.razorpay_subscription_id,
  s.razorpay_plan_id,
  s.subscription_tier,
  s.plan_name,
  s.plan_amount,
  s.plan_currency,
  s.status,
  s.created_at,
  COUNT(*) OVER() as total_subscriptions
FROM subscriptions s
WHERE s.deleted_at IS NULL
ORDER BY s.created_at DESC;

-- ============================================================================
-- 2. ACTIVE SUBSCRIPTIONS BY PLAN ID
-- ============================================================================

-- Group by plan ID to see which plans are actively being used
SELECT
  s.razorpay_plan_id,
  s.plan_name,
  s.plan_amount,
  s.plan_currency,
  s.subscription_tier,
  COUNT(*) as active_subscriptions,
  MIN(s.created_at) as first_subscription,
  MAX(s.created_at) as latest_subscription
FROM subscriptions s
WHERE s.status IN ('active', 'authenticated', 'created')
  AND s.deleted_at IS NULL
GROUP BY s.razorpay_plan_id, s.plan_name, s.plan_amount, s.plan_currency, s.subscription_tier
ORDER BY active_subscriptions DESC;

-- ============================================================================
-- 3. USER PROFILES WITH PLAN REFERENCES
-- ============================================================================

-- Check if user_profiles table stores plan IDs
SELECT
  up.user_id,
  up.subscription_tier,
  up.user_role,
  up.blueprint_creation_limit,
  up.blueprint_saving_limit,
  COUNT(*) OVER() as total_users
FROM user_profiles up
ORDER BY up.created_at DESC;

-- ============================================================================
-- 4. IDENTIFY PROBLEMATIC SUBSCRIPTIONS
-- ============================================================================

-- Find subscriptions using old plan IDs (not matching current configuration)
SELECT
  s.subscription_id,
  s.razorpay_plan_id,
  s.plan_name,
  s.plan_amount,
  s.subscription_tier,
  s.status,
  s.created_at,
  CASE
    WHEN s.razorpay_plan_id IN (
      'plan_RZGmbMjd9u0qtI', -- Explorer Monthly (current)
      'plan_RZGmc1LbRLGH5a', -- Explorer Yearly (current)
      'plan_RZGf8oI6VAEW3h', -- Navigator Monthly (current)
      'plan_RZGf9MME1Bs4Vd', -- Navigator Yearly (current)
      'plan_RZGfA1SbZQnZyM', -- Voyager Monthly (current)
      'plan_RZGfAdVwwRTQah', -- Voyager Yearly (current)
      'plan_RZGfBEA99LRzFq', -- Crew Monthly (current)
      'plan_RZGfBkdSfXnmbj', -- Crew Yearly (current)
      'plan_RZGfCI7A2I714z', -- Fleet Monthly (current)
      'plan_RZGfCtTYD4rC1y', -- Fleet Yearly (current)
      'plan_RZGfDTm2erB6km', -- Armada Monthly (current)
      'plan_RZGfE89sNsuNMo'  -- Armada Yearly (current)
    ) THEN 'CURRENT_PLAN'
    ELSE 'OLD_PLAN'
  END as plan_status
FROM subscriptions s
WHERE s.deleted_at IS NULL
ORDER BY
  CASE
    WHEN s.razorpay_plan_id IN (
      'plan_RZGmbMjd9u0qtI', 'plan_RZGmc1LbRLGH5a', 'plan_RZGf8oI6VAEW3h',
      'plan_RZGf9MME1Bs4Vd', 'plan_RZGfA1SbZQnZyM', 'plan_RZGfAdVwwRTQah',
      'plan_RZGfBEA99LRzFq', 'plan_RZGfBkdSfXnmbj', 'plan_RZGfCI7A2I714z',
      'plan_RZGfCtTYD4rC1y', 'plan_RZGfDTm2erB6km', 'plan_RZGfE89sNsuNMo'
    ) THEN 1
    ELSE 0
  END,
  s.created_at DESC;

-- ============================================================================
-- 5. CHECK FOR ₹1 PRICING ISSUES
-- ============================================================================

-- Find subscriptions with suspicious pricing (around ₹1)
SELECT
  s.subscription_id,
  s.razorpay_plan_id,
  s.plan_name,
  s.plan_amount,
  s.plan_currency,
  s.subscription_tier,
  s.status,
  CASE
    WHEN s.plan_amount <= 200 THEN 'POTENTIAL_₹1_ISSUE'
    WHEN s.plan_amount >= 100000 THEN 'HIGH_VALUE_PLAN'
    ELSE 'NORMAL_PRICING'
  END as pricing_category,
  s.created_at
FROM subscriptions s
WHERE s.deleted_at IS NULL
  AND s.plan_amount IS NOT NULL
ORDER BY s.plan_amount ASC;

-- ============================================================================
-- 6. SUBSCRIPTION PAYMENT HISTORY
-- ============================================================================

-- Check payment history for problematic amounts
SELECT
  p.payment_id,
  p.subscription_id,
  p.amount,
  p.currency,
  p.status,
  p.payment_date,
  p.created_at,
  s.razorpay_plan_id,
  s.plan_amount,
  s.plan_currency
FROM payments p
LEFT JOIN subscriptions s ON p.subscription_id = s.subscription_id
WHERE p.amount <= 200  -- Payments ≤ ₹2
   OR p.amount >= 100000  -- Payments ≥ ₹1,000
ORDER BY p.amount ASC
LIMIT 50;