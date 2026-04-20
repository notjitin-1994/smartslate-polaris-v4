-- =============================================
-- Allow Comments on View Permission
-- =============================================
-- Updates the share_comments RLS policy to allow comments
-- on share links with 'view' permission, not just 'comment' and 'edit'

-- Drop the old policy
DROP POLICY IF EXISTS "Anyone with link can create comments if permitted" ON public.share_comments;

-- Create new policy that allows view, comment, and edit permissions
CREATE POLICY "Anyone with link can create comments if permitted"
  ON public.share_comments
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    share_link_id IN (
      SELECT id FROM share_links
      WHERE is_active = true
        AND permission_level IN ('view', 'comment', 'edit')
    )
  );

-- Also add a policy to allow public viewing of comments
-- (so viewers can see existing comments on shared blueprints)
CREATE POLICY "Anyone with link can view comments"
  ON public.share_comments
  FOR SELECT
  TO anon, authenticated
  USING (
    share_link_id IN (
      SELECT id FROM share_links
      WHERE is_active = true
    )
  );

-- =============================================
-- Migration Complete
-- =============================================
