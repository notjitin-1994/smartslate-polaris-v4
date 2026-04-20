-- Subscription Migration Script
-- Use this script to migrate users from old plans to current plans
-- REVIEW CAREFULLY BEFORE EXECUTING

-- ============================================================================
-- MIGRATION PLAN MAPPING
-- ============================================================================

/*
OLD PLAN → NEW PLAN MAPPING:
- plan_RZGf7WWLT1bBQp (₹19) → plan_RZGmbMjd9u0qtI (₹159) - Explorer Monthly
- plan_RZGf8BFEN4OqI9 (₹190) → plan_RZGmc1LbRLGH5a (₹1,590) - Explorer Yearly
- plan_RZQZT107EESvZ0 (₹3,443) → plan_RZGf8oI6VAEW3h (₹39) - Navigator Monthly
- plan_RZQZTZpmw9zdph (₹34,430) → plan_RZGf9MME1Bs4Vd (₹390) - Navigator Yearly
- plan_RZQZUC5g7SOyR7 (₹6,975) → plan_RZGfA1SbZQnZyM (₹79) - Voyager Monthly
- plan_RZQZUoisPVoTcK (₹69,750) → plan_RZGfAdVwwRTQah (₹790) - Voyager Yearly
- plan_RZGvQW3FpIcENN (₹1,599) → plan_RZGmbMjd9u0qtI (₹159) - Explorer Monthly
- plan_RZGvR01T0u8Lrn (₹15,990) → plan_RZGmc1LbRLGH5a (₹1,590) - Explorer Yearly
- plan_RZGvRch5M4ZcNP (₹3,299) → plan_RZGf8oI6VAEW3h (₹39) - Navigator Monthly
- plan_RZGvSFS621EJ7y (₹32,990) → plan_RZGf9MME1Bs4Vd (₹390) - Navigator Yearly
- plan_RZGvSmh2Edqrf0 (₹6,699) → plan_RZGfA1SbZQnZyM (₹79) - Voyager Monthly
- plan_RZGvTO4JXI4ntt (₹66,990) → plan_RZGfAdVwwRTQah (₹790) - Voyager Yearly
*/

-- ============================================================================
-- STEP 1: IDENTIFY USERS TO MIGRATE
-- ============================================================================

-- Create a temporary table to track migration
CREATE TEMPORARY TABLE migration_tracking (
  subscription_id UUID,
  user_id UUID,
  old_plan_id TEXT,
  new_plan_id TEXT,
  old_amount INTEGER,
  new_amount INTEGER,
  subscription_tier TEXT,
  status TEXT,
  migration_date TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- STEP 2: MIGRATION QUERIES (EXAMPLE - REVIEW BEFORE RUNNING)
-- ============================================================================

/*
-- Migrate Explorer Monthly users (from old ₹19 plan to new ₹159 plan)
UPDATE subscriptions
SET
  razorpay_plan_id = 'plan_RZGmbMjd9u0qtI',
  plan_name = 'Explorer Plan - Monthly',
  plan_amount = 15900,
  updated_at = NOW()
WHERE razorpay_plan_id = 'plan_RZGf7WWLT1bBQp'
  AND subscription_tier = 'explorer'
  AND plan_period = 'monthly';

-- Migrate Navigator Monthly users (from old ₹3,443 plan to new ₹39 plan)
UPDATE subscriptions
SET
  razorpay_plan_id = 'plan_RZGf8oI6VAEW3h',
  plan_name = 'Navigator Plan - Monthly',
  plan_amount = 3900,
  updated_at = NOW()
WHERE razorpay_plan_id = 'plan_RZQZT107EESvZ0'
  AND subscription_tier = 'navigator'
  AND plan_period = 'monthly';

-- Add similar UPDATE statements for other old plans...
*/

-- ============================================================================
-- STEP 3: VERIFICATION QUERIES
-- ============================================================================

-- Verify migration results
SELECT
  razorpay_plan_id,
  plan_name,
  plan_amount,
  subscription_tier,
  COUNT(*) as user_count
FROM subscriptions
WHERE deleted_at IS NULL
  AND razorpay_plan_id IN (
    -- Current plan IDs
    'plan_RZGmbMjd9u0qtI', 'plan_RZGmc1LbRLGH5a',
    'plan_RZGf8oI6VAEW3h', 'plan_RZGf9MME1Bs4Vd',
    'plan_RZGfA1SbZQnZyM', 'plan_RZGfAdVwwRTQah'
  )
GROUP BY razorpay_plan_id, plan_name, plan_amount, subscription_tier
ORDER BY user_count DESC;

-- ============================================================================
-- STEP 4: NOTIFY USERS ABOUT PRICING CHANGES
-- ============================================================================

/*
After migration, you'll need to:
1. Send email notifications to affected users
2. Update their billing in Razorpay dashboard
3. Provide notice period for price changes
4. Handle any user complaints or requests
*/