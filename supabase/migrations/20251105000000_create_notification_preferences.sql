-- Migration: Create notification_preferences table
-- Description: Stores user notification preference settings
-- Author: SmartSlate Team
-- Date: 2025-11-05

BEGIN;

-- ============================================================================
-- CREATE NOTIFICATION_PREFERENCES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.notification_preferences (
  -- Primary key
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Email notification preferences
  email_blueprint_updates BOOLEAN NOT NULL DEFAULT true,
  email_security_alerts BOOLEAN NOT NULL DEFAULT true,
  email_marketing BOOLEAN NOT NULL DEFAULT false,
  email_product_updates BOOLEAN NOT NULL DEFAULT true,
  email_weekly_digest BOOLEAN NOT NULL DEFAULT false,

  -- In-app notification preferences
  in_app_notifications BOOLEAN NOT NULL DEFAULT true,
  in_app_blueprint_updates BOOLEAN NOT NULL DEFAULT true,
  in_app_comments BOOLEAN NOT NULL DEFAULT true,

  -- Push notification preferences (for future mobile app)
  push_enabled BOOLEAN NOT NULL DEFAULT false,
  push_blueprint_updates BOOLEAN NOT NULL DEFAULT false,
  push_security_alerts BOOLEAN NOT NULL DEFAULT true,

  -- Notification frequency
  notification_frequency TEXT NOT NULL DEFAULT 'realtime'
    CHECK (notification_frequency IN ('realtime', 'daily', 'weekly', 'never')),

  -- Quiet hours (JSON: {enabled: boolean, start_time: "22:00", end_time: "08:00"})
  quiet_hours JSONB DEFAULT '{"enabled": false, "start_time": "22:00", "end_time": "08:00"}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- CREATE INDEXES
-- ============================================================================

-- Index for querying by notification frequency
CREATE INDEX IF NOT EXISTS idx_notification_preferences_frequency
  ON public.notification_preferences(notification_frequency);

-- GIN index for quiet_hours JSONB searches
CREATE INDEX IF NOT EXISTS idx_notification_preferences_quiet_hours
  ON public.notification_preferences USING GIN (quiet_hours);

-- ============================================================================
-- ADD COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE public.notification_preferences IS 'User notification preference settings for email, in-app, and push notifications';
COMMENT ON COLUMN public.notification_preferences.user_id IS 'Foreign key to auth.users (one-to-one relationship)';
COMMENT ON COLUMN public.notification_preferences.email_blueprint_updates IS 'Receive email notifications when blueprints are updated';
COMMENT ON COLUMN public.notification_preferences.email_security_alerts IS 'Receive email notifications for security-related events (password changes, new logins)';
COMMENT ON COLUMN public.notification_preferences.email_marketing IS 'Receive marketing emails and promotional content';
COMMENT ON COLUMN public.notification_preferences.email_product_updates IS 'Receive emails about new features and product updates';
COMMENT ON COLUMN public.notification_preferences.email_weekly_digest IS 'Receive weekly summary of activity';
COMMENT ON COLUMN public.notification_preferences.in_app_notifications IS 'Enable all in-app notifications';
COMMENT ON COLUMN public.notification_preferences.in_app_blueprint_updates IS 'Show in-app notifications for blueprint updates';
COMMENT ON COLUMN public.notification_preferences.in_app_comments IS 'Show in-app notifications for comments on blueprints';
COMMENT ON COLUMN public.notification_preferences.push_enabled IS 'Enable push notifications (requires mobile app or web push subscription)';
COMMENT ON COLUMN public.notification_preferences.push_blueprint_updates IS 'Send push notifications for blueprint updates';
COMMENT ON COLUMN public.notification_preferences.push_security_alerts IS 'Send push notifications for security alerts';
COMMENT ON COLUMN public.notification_preferences.notification_frequency IS 'How often to send grouped notifications (realtime, daily, weekly, never)';
COMMENT ON COLUMN public.notification_preferences.quiet_hours IS 'JSONB object defining quiet hours when notifications are suppressed';

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own notification preferences
CREATE POLICY "Users can view own notification preferences"
  ON public.notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can update their own notification preferences
CREATE POLICY "Users can update own notification preferences"
  ON public.notification_preferences FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can insert their own notification preferences
CREATE POLICY "Users can insert own notification preferences"
  ON public.notification_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Service role can manage all notification preferences
CREATE POLICY "Service role can manage all notification preferences"
  ON public.notification_preferences FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- AUTO-UPDATE TIMESTAMP TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION update_notification_preferences_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_preferences_updated_at();

-- ============================================================================
-- AUTO-CREATE PREFERENCES ON USER CREATION
-- ============================================================================

CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Trigger to auto-create notification preferences when a new user is created
CREATE TRIGGER trigger_create_notification_preferences
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_notification_preferences();

-- ============================================================================
-- BACKFILL EXISTING USERS
-- ============================================================================

-- Create default notification preferences for all existing users who don't have them
INSERT INTO public.notification_preferences (user_id)
SELECT id FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM public.notification_preferences
  WHERE notification_preferences.user_id = auth.users.id
)
ON CONFLICT (user_id) DO NOTHING;

COMMIT;

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================

-- After migration, verify that all users have notification preferences:
/*
SELECT
  u.id,
  u.email,
  CASE WHEN np.user_id IS NOT NULL THEN 'Has Preferences' ELSE 'Missing' END as status
FROM auth.users u
LEFT JOIN public.notification_preferences np ON np.user_id = u.id
ORDER BY u.created_at DESC;
*/
