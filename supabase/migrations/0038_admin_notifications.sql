-- Admin Notifications System Migration
-- Creates tables and functions for real-time admin notifications
-- Created: 2025-11-12

-- =====================================================
-- NOTIFICATIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Recipient (admin user)
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Notification content
  type TEXT NOT NULL CHECK (type IN (
    'user_registration',
    'blueprint_limit_reached',
    'subscription_upgrade',
    'subscription_downgrade',
    'payment_received',
    'payment_failed',
    'system_alert',
    'cost_threshold',
    'feedback_submitted',
    'error_alert',
    'security_alert',
    'usage_milestone'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,

  -- Notification metadata
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN (
    'users',
    'blueprints',
    'billing',
    'system',
    'security',
    'feedback'
  )),

  -- Related data (JSONB for flexibility)
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Action URL (optional)
  action_url TEXT,
  action_label TEXT,

  -- Status tracking
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ, -- Optional expiration

  -- Indexing
  CONSTRAINT valid_metadata CHECK (jsonb_typeof(metadata) = 'object')
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Index for efficient user queries
CREATE INDEX IF NOT EXISTS idx_admin_notifications_user_id
  ON public.admin_notifications(user_id);

-- Index for unread notifications
CREATE INDEX IF NOT EXISTS idx_admin_notifications_unread
  ON public.admin_notifications(user_id, is_read, created_at DESC)
  WHERE is_read = false;

-- Index for notification type filtering
CREATE INDEX IF NOT EXISTS idx_admin_notifications_type
  ON public.admin_notifications(type, created_at DESC);

-- Index for category filtering
CREATE INDEX IF NOT EXISTS idx_admin_notifications_category
  ON public.admin_notifications(category, created_at DESC);

-- Index for priority filtering
CREATE INDEX IF NOT EXISTS idx_admin_notifications_priority
  ON public.admin_notifications(priority, created_at DESC)
  WHERE priority IN ('high', 'urgent');

-- Composite index for efficient dashboard queries
CREATE INDEX IF NOT EXISTS idx_admin_notifications_dashboard
  ON public.admin_notifications(user_id, is_read, priority, created_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view their own notifications
CREATE POLICY "Admins can view own notifications"
  ON public.admin_notifications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.user_role = 'developer'
    ) AND user_id = auth.uid()
  );

-- Policy: Admins can mark their notifications as read
CREATE POLICY "Admins can update own notifications"
  ON public.admin_notifications
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.user_role = 'developer'
    ) AND user_id = auth.uid()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.user_role = 'developer'
    ) AND user_id = auth.uid()
  );

-- Policy: System can insert notifications (for triggers)
CREATE POLICY "System can create notifications"
  ON public.admin_notifications
  FOR INSERT
  WITH CHECK (true);

-- Policy: Admins can delete their old notifications
CREATE POLICY "Admins can delete own notifications"
  ON public.admin_notifications
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.user_role = 'developer'
    ) AND user_id = auth.uid()
  );

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function: Create notification for all admin users
CREATE OR REPLACE FUNCTION public.create_admin_notification(
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_priority TEXT DEFAULT 'normal',
  p_category TEXT DEFAULT 'general',
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_action_url TEXT DEFAULT NULL,
  p_action_label TEXT DEFAULT NULL
)
RETURNS SETOF UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_user_id UUID;
  notification_ids UUID[];
BEGIN
  -- Insert notification for each admin user
  FOR admin_user_id IN
    SELECT id FROM public.user_profiles
    WHERE user_role = 'developer'
  LOOP
    INSERT INTO public.admin_notifications (
      user_id,
      type,
      title,
      message,
      priority,
      category,
      metadata,
      action_url,
      action_label
    ) VALUES (
      admin_user_id,
      p_type,
      p_title,
      p_message,
      p_priority,
      p_category,
      p_metadata,
      p_action_url,
      p_action_label
    )
    RETURNING id INTO notification_ids[array_length(notification_ids, 1) + 1];
  END LOOP;

  RETURN QUERY SELECT unnest(notification_ids);
END;
$$;

-- Function: Mark notification as read
CREATE OR REPLACE FUNCTION public.mark_notification_read(notification_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.admin_notifications
  SET
    is_read = true,
    read_at = now()
  WHERE
    id = notification_id
    AND user_id = auth.uid()
    AND is_read = false;

  RETURN FOUND;
END;
$$;

-- Function: Mark all notifications as read for a user
CREATE OR REPLACE FUNCTION public.mark_all_notifications_read()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE public.admin_notifications
  SET
    is_read = true,
    read_at = now()
  WHERE
    user_id = auth.uid()
    AND is_read = false;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

-- Function: Get unread notification count
CREATE OR REPLACE FUNCTION public.get_unread_notification_count()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  unread_count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO unread_count
  FROM public.admin_notifications
  WHERE user_id = auth.uid() AND is_read = false;

  RETURN COALESCE(unread_count, 0);
END;
$$;

-- Function: Clean up expired notifications
CREATE OR REPLACE FUNCTION public.cleanup_expired_notifications()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.admin_notifications
  WHERE expires_at IS NOT NULL AND expires_at < now();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- =====================================================
-- AUTOMATIC NOTIFICATION TRIGGERS
-- =====================================================

-- Trigger: Notify on new user registration
CREATE OR REPLACE FUNCTION public.notify_new_user_registration()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM public.create_admin_notification(
    'user_registration',
    'New User Registration',
    'A new user has registered: ' || COALESCE(NEW.full_name, NEW.email),
    'normal',
    'users',
    jsonb_build_object(
      'user_id', NEW.id,
      'email', NEW.email,
      'full_name', NEW.full_name,
      'subscription_tier', NEW.subscription_tier
    ),
    '/admin/users',
    'View User'
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_new_user
  AFTER INSERT ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_user_registration();

-- Trigger: Notify on blueprint limit reached
CREATE OR REPLACE FUNCTION public.notify_blueprint_limit_reached()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_profile RECORD;
BEGIN
  -- Check if limit was just reached
  SELECT * INTO user_profile
  FROM public.user_profiles
  WHERE id = NEW.user_id;

  IF user_profile.blueprint_creation_count >= user_profile.blueprint_creation_limit THEN
    PERFORM public.create_admin_notification(
      'blueprint_limit_reached',
      'Blueprint Limit Reached',
      'User ' || COALESCE(user_profile.full_name, user_profile.email) || ' has reached their blueprint limit',
      'normal',
      'blueprints',
      jsonb_build_object(
        'user_id', NEW.user_id,
        'count', user_profile.blueprint_creation_count,
        'limit', user_profile.blueprint_creation_limit,
        'tier', user_profile.subscription_tier
      ),
      '/admin/users',
      'View User'
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_blueprint_limit
  AFTER UPDATE OF blueprint_creation_count ON public.user_profiles
  FOR EACH ROW
  WHEN (NEW.blueprint_creation_count >= OLD.blueprint_creation_count)
  EXECUTE FUNCTION public.notify_blueprint_limit_reached();

-- Trigger: Notify on subscription changes
CREATE OR REPLACE FUNCTION public.notify_subscription_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  change_type TEXT;
BEGIN
  -- Determine if upgrade or downgrade
  IF NEW.subscription_tier > OLD.subscription_tier THEN
    change_type := 'subscription_upgrade';
  ELSE
    change_type := 'subscription_downgrade';
  END IF;

  PERFORM public.create_admin_notification(
    change_type,
    'Subscription Changed',
    'User ' || COALESCE(NEW.full_name, NEW.email) || ' changed from ' || OLD.subscription_tier || ' to ' || NEW.subscription_tier,
    'normal',
    'billing',
    jsonb_build_object(
      'user_id', NEW.id,
      'old_tier', OLD.subscription_tier,
      'new_tier', NEW.subscription_tier
    ),
    '/admin/users',
    'View User'
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_subscription_change
  AFTER UPDATE OF subscription_tier ON public.user_profiles
  FOR EACH ROW
  WHEN (OLD.subscription_tier IS DISTINCT FROM NEW.subscription_tier)
  EXECUTE FUNCTION public.notify_subscription_change();

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE public.admin_notifications IS 'Real-time notifications for admin users';
COMMENT ON COLUMN public.admin_notifications.type IS 'Notification type for categorization and filtering';
COMMENT ON COLUMN public.admin_notifications.priority IS 'Notification priority level';
COMMENT ON COLUMN public.admin_notifications.metadata IS 'Flexible JSONB field for additional notification data';
COMMENT ON FUNCTION public.create_admin_notification IS 'Creates notifications for all admin users';
COMMENT ON FUNCTION public.mark_notification_read IS 'Marks a single notification as read';
COMMENT ON FUNCTION public.mark_all_notifications_read IS 'Marks all user notifications as read';
