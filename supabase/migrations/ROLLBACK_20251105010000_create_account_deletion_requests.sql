-- Rollback: Create account_deletion_requests table
-- Description: Removes account_deletion_requests table and related functions
-- Date: 2025-11-05

BEGIN;

-- Drop triggers
DROP TRIGGER IF EXISTS trigger_update_account_deletion_requests_updated_at ON public.account_deletion_requests;

-- Drop functions
DROP FUNCTION IF EXISTS update_account_deletion_requests_updated_at();
DROP FUNCTION IF EXISTS request_account_deletion(UUID, TEXT, JSONB);
DROP FUNCTION IF EXISTS cancel_account_deletion(UUID, TEXT);
DROP FUNCTION IF EXISTS get_deletions_ready_to_process();

-- Drop indexes
DROP INDEX IF EXISTS public.idx_account_deletion_requests_user_id;
DROP INDEX IF EXISTS public.idx_account_deletion_requests_status;
DROP INDEX IF EXISTS public.idx_account_deletion_requests_scheduled;
DROP INDEX IF EXISTS public.idx_account_deletion_requests_created_at;
DROP INDEX IF EXISTS public.idx_account_deletion_requests_feedback;
DROP INDEX IF EXISTS public.idx_account_deletion_requests_completion_metadata;

-- Drop RLS policies
DROP POLICY IF EXISTS "Users can view own deletion requests" ON public.account_deletion_requests;
DROP POLICY IF EXISTS "Users can create own deletion requests" ON public.account_deletion_requests;
DROP POLICY IF EXISTS "Users can update own pending deletion requests" ON public.account_deletion_requests;
DROP POLICY IF EXISTS "Service role can manage all deletion requests" ON public.account_deletion_requests;
DROP POLICY IF EXISTS "Admins can view all deletion requests" ON public.account_deletion_requests;

-- Drop table
DROP TABLE IF EXISTS public.account_deletion_requests;

COMMIT;
