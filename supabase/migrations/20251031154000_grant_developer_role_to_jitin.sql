-- Update auto_exempt_developer_user function to include jitin@smartslate.io and jitin@testslate.io as developers
-- This grants unlimited blueprint generations and developer role

CREATE OR REPLACE FUNCTION public.auto_exempt_developer_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-exempt not.jitin@gmail.com from blueprint limits
  IF NEW.user_id IN (
    SELECT id FROM auth.users
    WHERE email = 'not.jitin@gmail.com'
  ) THEN
    NEW.blueprint_usage_metadata = jsonb_set(
      NEW.blueprint_usage_metadata,
      '{exempt_from_limits}',
      'true'::jsonb
    );
    NEW.blueprint_usage_metadata = jsonb_set(
      NEW.blueprint_usage_metadata,
      '{exemption_reason}',
      '"Developer exemption - not.jitin@gmail.com"'::jsonb
    );
  END IF;

  -- Auto-grant developer role to jitin@smartslate.io with unlimited blueprints
  IF NEW.user_id IN (
    SELECT id FROM auth.users
    WHERE email = 'jitin@smartslate.io'
  ) THEN
    -- Set user role to developer
    NEW.user_role = 'developer';

    -- Grant unlimited blueprint generations
    NEW.blueprint_creation_limit = -1;  -- -1 indicates unlimited
    NEW.blueprint_saving_limit = -1;    -- -1 indicates unlimited

    -- Set exemption metadata
    NEW.blueprint_usage_metadata = jsonb_set(
      NEW.blueprint_usage_metadata,
      '{exempt_from_limits}',
      'true'::jsonb
    );

    NEW.blueprint_usage_metadata = jsonb_set(
      NEW.blueprint_usage_metadata,
      '{exemption_reason}',
      '"Developer - jitin@smartslate.io - Unlimited blueprint access"'::jsonb
    );

    -- Set role assignment metadata
    NEW.role_assigned_by = NEW.user_id;  -- Self-assigned
    NEW.role_assigned_at = NOW();

    -- Log the automatic role assignment
    RAISE LOG 'Developer role automatically assigned to jitin@smartslate.io with unlimited blueprint access';
  END IF;

  -- Auto-grant developer role to jitin@testslate.io with unlimited blueprints
  IF NEW.user_id IN (
    SELECT id FROM auth.users
    WHERE email = 'jitin@testslate.io'
  ) THEN
    -- Set user role to developer
    NEW.user_role = 'developer';

    -- Grant unlimited blueprint generations
    NEW.blueprint_creation_limit = -1;  -- -1 indicates unlimited
    NEW.blueprint_saving_limit = -1;    -- -1 indicates unlimited

    -- Set exemption metadata
    NEW.blueprint_usage_metadata = jsonb_set(
      NEW.blueprint_usage_metadata,
      '{exempt_from_limits}',
      'true'::jsonb
    );

    NEW.blueprint_usage_metadata = jsonb_set(
      NEW.blueprint_usage_metadata,
      '{exemption_reason}',
      '"Developer - jitin@testslate.io - Unlimited blueprint access"'::jsonb
    );

    -- Set role assignment metadata
    NEW.role_assigned_by = NEW.user_id;  -- Self-assigned
    NEW.role_assigned_at = NOW();

    -- Log the automatic role assignment
    RAISE LOG 'Developer role automatically assigned to jitin@testslate.io with unlimited blueprint access';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a comment to document this function
COMMENT ON FUNCTION public.auto_exempt_developer_user() IS 'Automatically grants developer role and unlimited blueprint access to specified email addresses (jitin@smartslate.io, jitin@testslate.io, not.jitin@gmail.com)';