-- ============================================================================
-- SIMPLE BLUEPRINT MIGRATION (Step-by-step)
-- Migrate blueprints from not.jitin@gmail.com to jitin@smartslate.io
-- ============================================================================
-- Run each section separately in Supabase SQL Editor
-- ============================================================================

-- STEP 1: Find User IDs (run this first)
-- ============================================================================
SELECT
  'Source User' as account_type,
  id as user_id,
  email,
  full_name
FROM auth.users
WHERE email = 'not.jitin@gmail.com'

UNION ALL

SELECT
  'Target User' as account_type,
  id as user_id,
  email,
  full_name
FROM auth.users
WHERE email = 'jitin@smartslate.io';

-- Copy the user_id values from the results above
-- Source User ID: <paste here after running>
-- Target User ID: <paste here after running>


-- STEP 2: Count blueprints to migrate
-- ============================================================================
SELECT
  COUNT(*) as blueprints_to_migrate,
  MIN(created_at) as oldest_blueprint,
  MAX(created_at) as newest_blueprint
FROM blueprint_generator bg
JOIN auth.users au ON au.id = bg.user_id
WHERE au.email = 'not.jitin@gmail.com'
  AND bg.deleted_at IS NULL;


-- STEP 3: Preview blueprints that will be migrated
-- ============================================================================
SELECT
  bg.id,
  bg.title,
  bg.status,
  bg.created_at,
  bg.updated_at
FROM blueprint_generator bg
JOIN auth.users au ON au.id = bg.user_id
WHERE au.email = 'not.jitin@gmail.com'
  AND bg.deleted_at IS NULL
ORDER BY bg.created_at DESC;


-- STEP 4: EXECUTE MIGRATION (⚠️ This changes data!)
-- ============================================================================
-- Replace <TARGET_USER_ID> with the actual UUID from Step 1
-- ============================================================================
UPDATE blueprint_generator
SET
  user_id = (SELECT id FROM auth.users WHERE email = 'jitin@smartslate.io'),
  updated_at = NOW()
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'not.jitin@gmail.com')
  AND deleted_at IS NULL;

-- This should return something like: "UPDATE 5" (where 5 is the count)


-- STEP 5: Update usage counters for TARGET user
-- ============================================================================
UPDATE user_profiles
SET
  blueprint_creation_count = (
    SELECT COUNT(*)
    FROM blueprint_generator
    WHERE user_id = (SELECT id FROM auth.users WHERE email = 'jitin@smartslate.io')
      AND deleted_at IS NULL
  ),
  blueprint_saving_count = (
    SELECT COUNT(*)
    FROM blueprint_generator
    WHERE user_id = (SELECT id FROM auth.users WHERE email = 'jitin@smartslate.io')
      AND status = 'completed'
      AND deleted_at IS NULL
  ),
  updated_at = NOW()
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'jitin@smartslate.io');


-- STEP 6: Reset usage counters for SOURCE user
-- ============================================================================
UPDATE user_profiles
SET
  blueprint_creation_count = 0,
  blueprint_saving_count = 0,
  updated_at = NOW()
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'not.jitin@gmail.com');


-- STEP 7: VERIFICATION - Check migration results
-- ============================================================================
SELECT
  'Source User (not.jitin@gmail.com)' as account,
  COUNT(*) as blueprint_count,
  up.blueprint_creation_count as counter_creation,
  up.blueprint_saving_count as counter_saving
FROM blueprint_generator bg
JOIN auth.users au ON au.id = bg.user_id
JOIN user_profiles up ON up.user_id = au.id
WHERE au.email = 'not.jitin@gmail.com'
  AND bg.deleted_at IS NULL
GROUP BY up.blueprint_creation_count, up.blueprint_saving_count

UNION ALL

SELECT
  'Target User (jitin@smartslate.io)' as account,
  COUNT(*) as blueprint_count,
  up.blueprint_creation_count as counter_creation,
  up.blueprint_saving_count as counter_saving
FROM blueprint_generator bg
JOIN auth.users au ON au.id = bg.user_id
JOIN user_profiles up ON up.user_id = au.id
WHERE au.email = 'jitin@smartslate.io'
  AND bg.deleted_at IS NULL
GROUP BY up.blueprint_creation_count, up.blueprint_saving_count;

-- Expected Result:
-- Source User: blueprint_count = 0, counters should be 0
-- Target User: blueprint_count = (migrated count), counters should match


-- STEP 8: View all blueprints for target user
-- ============================================================================
SELECT
  bg.id,
  bg.title,
  bg.status,
  bg.created_at as originally_created,
  bg.updated_at as migrated_at,
  au.email as owner_email
FROM blueprint_generator bg
JOIN auth.users au ON au.id = bg.user_id
WHERE au.email = 'jitin@smartslate.io'
  AND bg.deleted_at IS NULL
ORDER BY bg.created_at DESC;
