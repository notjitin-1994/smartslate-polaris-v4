-- Rollback: Create activity aggregation RPC functions
-- Description: Removes activity aggregation functions
-- Date: 2025-11-05

BEGIN;

-- Drop functions
DROP FUNCTION IF EXISTS get_user_activity_stats(UUID);
DROP FUNCTION IF EXISTS get_user_recent_activity(UUID, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS get_user_activity_count(UUID);
DROP FUNCTION IF EXISTS get_user_login_history(UUID, INTEGER);

COMMIT;
