-- Rollback Migration: Drop user sessions tracking table
-- Description: Removes session tracking infrastructure
-- Date: 2025-11-04

-- Drop triggers
DROP TRIGGER IF EXISTS trigger_update_user_sessions_timestamp ON public.user_sessions;

-- Drop functions
DROP FUNCTION IF EXISTS update_user_sessions_updated_at();
DROP FUNCTION IF EXISTS get_active_session(UUID);
DROP FUNCTION IF EXISTS update_session_activity(UUID, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN);
DROP FUNCTION IF EXISTS end_inactive_sessions();

-- Drop policies
DROP POLICY IF EXISTS "Admins can view all sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can create own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can view own sessions" ON public.user_sessions;

-- Drop indexes
DROP INDEX IF EXISTS public.idx_user_sessions_user_active;
DROP INDEX IF EXISTS public.idx_user_sessions_session_token;
DROP INDEX IF EXISTS public.idx_user_sessions_is_active;
DROP INDEX IF EXISTS public.idx_user_sessions_started_at;
DROP INDEX IF EXISTS public.idx_user_sessions_user_id;

-- Drop table
DROP TABLE IF EXISTS public.user_sessions;
