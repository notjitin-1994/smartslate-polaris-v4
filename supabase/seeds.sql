-- ==============================================================================
-- SmartSlate Polaris v3 - Initial Database Seed Data
-- ==============================================================================
-- This file contains initial seed data for development and testing
-- Run this with: supabase db reset --copy

-- ============================================================================
-- 1. Create Test Users for Each Subscription Tier
-- ============================================================================

-- Create test users with different subscription tiers
-- NOTE: These are development users with simple passwords
-- In production, users should be created via Supabase Auth

-- Explorer Tier User (Free Tier)
INSERT INTO auth.users (
  id, email, encrypted_password, email_confirmed_at, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  'explorer@test.dev',
  crypt('Explorer123!', gen_salt('explorer')),
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'navigator@test.dev',
  crypt('Navigator123!', gen_salt('navigator')),
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'voyager@test.dev',
  crypt('Voyager123!', gen_salt('voyager')),
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'crew@test.dev',
  crypt('Crew123!', gen_salt('crew')),
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'fleet@test.dev',
  crypt('Fleet123!', gen_salt('fleet')),
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'armada@test.dev',
  crypt('Armada123!', gen_salt('armada')),
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'enterprise@test.dev',
  crypt('Enterprise123!', gen_salt('enterprise')),
  NOW(),
  NOW()
);

-- Create corresponding user_profiles
INSERT INTO public.user_profiles (
  user_id, email, subscription_tier, user_role, subscription_metadata, role_assigned_at, created_at, updated_at
) 
SELECT 
  u.id,
  u.email,
  u.subscription_tier,
  u.user_role,
  jsonb_build_object(
    'plan_id', u.subscription_tier,
      'billing_cycle', 'monthly',
      'started_at', u.created_at,
      'renewal_date', u.created_at + INTERVAL '1 month',
      'usage', jsonb_build_object(
        'generations_this_month', 0,
        'saved_starmaps', 0,
        'last_reset', NOW()
      ),
      'limits', jsonb_build_object(
        'max_generations_monthly', 
        CASE u.subscription_tier
          WHEN 'explorer' THEN 5
          WHEN 'navigator' THEN 15
          WHEN 'voyager' THEN 40
          WHEN 'crew' THEN 10
          WHEN 'fleet' THEN 25
          WHEN 'armada' THEN 50
          WHEN 'enterprise' THEN -1
          ELSE 5
        END,
        'max_saved_starmaps',
        CASE u.subscription_tier
          WHEN 'explorer' THEN 5
          WHEN 'navigator' THEN 30
          WHEN 'voyager' THEN 20
          WHEN 'crew' THEN 25
          WHEN 'fleet' THEN 75
          WHEN 'enterprise' THEN -1
          ELSE 5
        END
      )
    ),
    NOW()
  FROM auth.users u
  WHERE u.email IN ('explorer@test.dev', 'navigator@test.dev', 'voyager@test.dev', 'crew@test.dev', 'fleet@test.dev', 'armada@test.dev', 'enterprise@test.dev');

-- ============================================================================
-- 2. Create Developer User (Admin Access)
-- ============================================================================

-- Developer user with full access
INSERT INTO auth.users (
  id, email, encrypted_password, email_confirmed_at, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  'developer@smartslate.dev',
  crypt('DevAdmin123!', gen_salt('developer')),
  NOW(),
  NOW()
);

INSERT INTO public.user_profiles (
  user_id, email, subscription_tier, user_role, subscription_metadata, role_assigned_at, created_at, updated_at
) 
SELECT 
  u.id,
  u.email,
  'enterprise' as subscription_tier,
  'developer' as user_role,
  jsonb_build_object(
    'plan_id', 'enterprise',
      'billing_cycle', 'monthly',
      'started_at', u.created_at,
      'renewal_date', u.created_at + INTERVAL '1 month',
      'usage', jsonb_build_object(
        'generations_this_month', 0,
        'saved_starmaps', 0,
        'last_reset', NOW()
      ),
      'limits', jsonb_build_object(
        'max_generations_monthly', -1,
        'max_saved_starmaps', -1
      )
    ),
    NOW()
  FROM auth.users u
  WHERE u.email = 'developer@smartslate.dev';

-- ============================================================================
-- 3. Create Sample Blueprint Data
-- ============================================================================

-- Create sample blueprints for testing
INSERT INTO public.blueprint_generator (
  id, user_id, static_answers, dynamic_answers, status, created_at, updated_at, blueprint_json, blueprint_markdown
) VALUES 
(
  gen_random_uuid(),
  (SELECT id FROM auth.users WHERE email = 'explorer@test.dev'),
  jsonb_build_object(
    'organization', 'Acme Corp',
      'role', 'Learning & Development Manager',
      'industry', 'Technology',
      'team_size', '10-50',
      'current_challenges', 'Skill gaps in new technology adoption',
      'timeline', '3 months',
      'budget_range', '$10,000-50,000'
  )::jsonb,
  NULL::jsonb,
  'generating',
  NOW(),
  NOW(),
  NULL::jsonb,
  NULL::text
),
(
  gen_random_uuid(),
  (SELECT id FROM auth.users WHERE email = 'navigator@test.dev'),
  jsonb_build_object(
    'organization', 'TechStart Inc',
      'role', 'Product Manager',
      'industry', 'Software',
      'team_size', '50-200',
      'current_challenges', 'Onboarding effectiveness',
      'timeline', '6 months',
      'budget_range', '$50,000-100,000'
  )::jsonb,
  NULL::jsonb,
  'completed',
  NOW(),
  NOW(),
  NULL::jsonb,
  NULL::text
),
(
  gen_random_uuid(),
  (SELECT id FROM auth.users WHERE email = 'voyager@test.dev'),
  jsonb_build_object(
    'organization', 'GlobalTech Solutions',
      'role', 'CTO',
      'industry', 'Healthcare',
      'team_size', '200-500',
      'current_challenges', 'Digital transformation',
      'timeline', '12 months',
      'budget_range', '$100,000-500,000'
  )::jsonb,
  NULL::jsonb,
  'completed',
  NOW(),
  NOW(),
  '{"title": "Enterprise Digital Transformation", "sections": [...], "metadata": {...}}'::jsonb,
  'Sample enterprise blueprint content...'
);

-- ============================================================================
-- 4. Create Initial Usage History Records
-- ============================================================================

-- Create some usage history for testing
INSERT INTO public.user_usage_history (
  user_id, period_start, period_end, subscription_tier, starmaps_generated, starmaps_saved, exports_pdf, exports_word, api_calls, processing_time_ms, created_at, updated_at
) 
SELECT 
  u.id,
  date_trunc('month', NOW() - INTERVAL '1 month'),
  date_trunc('month', NOW()),
  u.subscription_tier,
  CASE u.subscription_tier
    WHEN 'explorer' THEN 2
    WHEN 'navigator' THEN 8
    WHEN 'voyager' THEN 15
    WHEN 'crew' THEN 5
    WHEN 'fleet' THEN 12
    WHEN 'enterprise' THEN 25
    ELSE 2
  END,
  0,
  CASE u.subscription_tier
    WHEN 'explorer' THEN 1
    WHEN 'navigator' THEN 3
    WHEN 'voyager' THEN 5
    WHEN 'crew' THEN 8
    WHEN 'enterprise' THEN 15
    ELSE 1
  END,
  2,
  3,
  0,
  1500,
  2000,
  NOW(),
  NOW()
FROM auth.users u
WHERE u.email IN ('explorer@test.dev', 'navigator@test.dev', 'voyager@test.dev');

-- ============================================================================
-- 5. Create Sample Role Audit Log Entries
-- ============================================================================

-- Add some audit log entries for testing
INSERT INTO public.role_audit_log (
  created_at, admin_user_id, target_user_id, old_role, new_role, reason, metadata
) 
SELECT 
  NOW(),
  (SELECT id FROM auth.users WHERE email = 'developer@smartslate.dev'),
  (SELECT id FROM auth.users WHERE email = 'explorer@test.dev'),
  NULL,
  'explorer',
  'Initial role assignment during user creation',
  jsonb_build_object(
    'method', 'automatic',
      'reason', 'New user registration'
  )
),
(
  NOW(),
  (SELECT id FROM auth.users WHERE email = 'developer@smartslate.dev'),
  (SELECT id FROM auth.users WHERE email = 'navigator@test.dev'),
  'explorer',
  'navigator',
  'Manual role upgrade by admin',
  jsonb_build_object(
    'method', 'admin_manual',
      'reason', 'User requested upgrade to Navigator tier'
  )
);

-- ============================================================================
-- 6. Verification Queries
-- ============================================================================

-- Verify users created
SELECT 
  u.id,
  u.email,
  up.subscription_tier,
  up.user_role,
  up.subscription_metadata
FROM auth.users u
LEFT JOIN public.user_profiles up ON u.id = up.user_id
WHERE u.email LIKE '%@test.dev'
ORDER BY u.created_at;

-- Verify user limits
SELECT 
  up.user_id,
  up.user_role,
  upl.max_generations_monthly,
  upl.max_saved_starmaps,
  upl.current_generations,
  upl.current_saved_starmaps,
  upl.generations_remaining
FROM public.user_profiles up
LEFT JOIN LATERAL public.get_user_limits(up.user_id) upl ON true;

-- ============================================================================
-- 7. Comments for Development
-- ============================================================================

-- Test users use simple passwords for development convenience
-- In production, always create users via Supabase Auth UI or API
-- These users should be removed or have passwords changed before production deployment

-- Seed data includes:
-- - 7 test users (all subscription tiers + developer)
-- - 3 sample blueprints in different states
-- - Usage history for testing quota systems
-- - Audit log entries for testing role management

-- To run this seed:
-- supabase db reset --copy
-- This will run migrations, then apply this seed data

COMMIT;
