-- Migration: Fix Activity Logs User Access
-- Description: Allow users to view their own activity logs
-- Date: 2025-11-12

BEGIN;

-- Drop the restrictive policy that only allows admins/developers
DROP POLICY IF EXISTS "Admin and developers can view all activity logs" ON activity_logs;

-- Create new policies:
-- 1. Users can view their own activity
CREATE POLICY "Users can view their own activity"
  ON activity_logs
  FOR SELECT
  USING (user_id = auth.uid());

-- 2. Admins and developers can view all activity logs
CREATE POLICY "Admins can view all activity logs"
  ON activity_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.user_role IN ('admin', 'developer')
    )
  );

COMMIT;
