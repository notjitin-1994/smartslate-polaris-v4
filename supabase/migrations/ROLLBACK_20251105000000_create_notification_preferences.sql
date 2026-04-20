-- Rollback: Create notification_preferences table
-- Description: Removes notification_preferences table and related functions
-- Date: 2025-11-05

BEGIN;

-- Drop triggers
DROP TRIGGER IF EXISTS trigger_create_notification_preferences ON auth.users;
DROP TRIGGER IF EXISTS trigger_update_notification_preferences_updated_at ON public.notification_preferences;

-- Drop functions
DROP FUNCTION IF EXISTS create_default_notification_preferences();
DROP FUNCTION IF EXISTS update_notification_preferences_updated_at();

-- Drop indexes
DROP INDEX IF EXISTS public.idx_notification_preferences_frequency;
DROP INDEX IF EXISTS public.idx_notification_preferences_quiet_hours;

-- Drop RLS policies
DROP POLICY IF EXISTS "Users can view own notification preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Users can update own notification preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Users can insert own notification preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Service role can manage all notification preferences" ON public.notification_preferences;

-- Drop table
DROP TABLE IF EXISTS public.notification_preferences;

COMMIT;
