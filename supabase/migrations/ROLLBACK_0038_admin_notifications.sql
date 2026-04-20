-- Rollback: Admin Notifications System
-- Removes all notification-related database objects

-- Drop triggers
DROP TRIGGER IF EXISTS trigger_notify_subscription_change ON public.user_profiles;
DROP TRIGGER IF EXISTS trigger_notify_blueprint_limit ON public.user_profiles;
DROP TRIGGER IF EXISTS trigger_notify_new_user ON public.user_profiles;

-- Drop trigger functions
DROP FUNCTION IF EXISTS public.notify_subscription_change();
DROP FUNCTION IF EXISTS public.notify_blueprint_limit_reached();
DROP FUNCTION IF EXISTS public.notify_new_user_registration();

-- Drop helper functions
DROP FUNCTION IF EXISTS public.cleanup_expired_notifications();
DROP FUNCTION IF EXISTS public.get_unread_notification_count();
DROP FUNCTION IF EXISTS public.mark_all_notifications_read();
DROP FUNCTION IF EXISTS public.mark_notification_read(UUID);
DROP FUNCTION IF EXISTS public.create_admin_notification(TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT, TEXT);

-- Drop table (this will cascade delete all policies and indexes)
DROP TABLE IF EXISTS public.admin_notifications CASCADE;
