-- Rollback Migration: Fix Activity Logs User Access
-- Description: Revert to original admin-only access policy

BEGIN;

-- Drop the new policies
DROP POLICY IF EXISTS "Users can view their own activity" ON activity_logs;
DROP POLICY IF EXISTS "Admins can view all activity logs" ON activity_logs;

-- Restore original policy
CREATE POLICY "Admin and developers can view all activity logs"
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
