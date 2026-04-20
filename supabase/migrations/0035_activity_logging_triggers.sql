-- Migration: Activity Logging Triggers
-- Description: Automatically log user signups and blueprint operations
-- Date: 2025-11-04

-- ============================================================================
-- TRIGGER: Log user signup
-- ============================================================================

CREATE OR REPLACE FUNCTION log_user_signup()
RETURNS TRIGGER AS $$
BEGIN
  -- Log the user creation activity
  INSERT INTO activity_logs (
    user_id,
    actor_id,
    action_type,
    resource_type,
    resource_id,
    metadata,
    created_at
  ) VALUES (
    NEW.id,
    NEW.id, -- Self-action
    'user_created',
    'user',
    NEW.id,
    jsonb_build_object(
      'email', NEW.email,
      'provider', COALESCE(NEW.raw_app_meta_data->>'provider', 'email'),
      'email_confirmed', NEW.email_confirmed_at IS NOT NULL
    ),
    NEW.created_at
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for new user signups
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION log_user_signup();

-- ============================================================================
-- TRIGGER: Log blueprint creation
-- ============================================================================

CREATE OR REPLACE FUNCTION log_blueprint_creation()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log when blueprint is first created (not on updates)
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO activity_logs (
      user_id,
      actor_id,
      action_type,
      resource_type,
      resource_id,
      metadata,
      created_at
    ) VALUES (
      NEW.user_id,
      NEW.user_id,
      'blueprint_created',
      'blueprint',
      NEW.id,
      jsonb_build_object(
        'status', NEW.status,
        'title', COALESCE(NEW.static_answers->>'projectTitle', 'Untitled Blueprint')
      ),
      NEW.created_at
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_blueprint_created ON blueprint_generator;

-- Create trigger for blueprint creation
CREATE TRIGGER on_blueprint_created
  AFTER INSERT ON blueprint_generator
  FOR EACH ROW
  EXECUTE FUNCTION log_blueprint_creation();

-- ============================================================================
-- TRIGGER: Log blueprint deletion
-- ============================================================================

CREATE OR REPLACE FUNCTION log_blueprint_deletion()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO activity_logs (
    user_id,
    actor_id,
    action_type,
    resource_type,
    resource_id,
    metadata
  ) VALUES (
    OLD.user_id,
    OLD.user_id,
    'blueprint_deleted',
    'blueprint',
    OLD.id,
    jsonb_build_object(
      'status', OLD.status,
      'title', COALESCE(OLD.static_answers->>'projectTitle', 'Untitled Blueprint')
    )
  );

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_blueprint_deleted ON blueprint_generator;

-- Create trigger for blueprint deletion
CREATE TRIGGER on_blueprint_deleted
  BEFORE DELETE ON blueprint_generator
  FOR EACH ROW
  EXECUTE FUNCTION log_blueprint_deletion();

-- ============================================================================
-- ROLLBACK INSTRUCTIONS
-- ============================================================================

-- To rollback this migration, run:
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- DROP TRIGGER IF EXISTS on_blueprint_created ON blueprint_generator;
-- DROP TRIGGER IF EXISTS on_blueprint_deleted ON blueprint_generator;
-- DROP FUNCTION IF EXISTS log_user_signup();
-- DROP FUNCTION IF EXISTS log_blueprint_creation();
-- DROP FUNCTION IF EXISTS log_blueprint_deletion();
