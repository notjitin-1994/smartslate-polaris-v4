-- =============================================
-- Advanced Share System Migration
-- =============================================
-- This migration upgrades the sharing system to industry-leading standards
-- with features inspired by Notion, Figma, and Google Docs

-- 1. Enhanced share_links table for advanced sharing features
-- =============================================
CREATE TABLE IF NOT EXISTS public.share_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL REFERENCES blueprint_generator(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Share identification
  share_token TEXT UNIQUE NOT NULL,
  share_slug TEXT UNIQUE, -- Optional custom slug for branded URLs

  -- Permission levels
  permission_level TEXT NOT NULL DEFAULT 'view' CHECK (permission_level IN ('view', 'comment', 'edit')),

  -- Access controls
  password_hash TEXT, -- Optional password protection
  max_views INTEGER, -- Limit number of views
  expires_at TIMESTAMPTZ, -- Expiration date
  is_active BOOLEAN DEFAULT true,

  -- Advanced settings
  allow_download BOOLEAN DEFAULT true,
  allow_print BOOLEAN DEFAULT true,
  allow_copy BOOLEAN DEFAULT false,
  show_analytics BOOLEAN DEFAULT false,
  require_email BOOLEAN DEFAULT false, -- Require email to view
  allowed_emails TEXT[], -- Whitelist specific emails
  blocked_emails TEXT[], -- Blacklist specific emails
  allowed_domains TEXT[], -- Whitelist email domains

  -- Analytics
  view_count INTEGER DEFAULT 0,
  unique_viewers INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMPTZ,

  -- Social media optimizations
  custom_title TEXT,
  custom_description TEXT,
  custom_image_url TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  revoke_reason TEXT,

  -- Tracking
  settings JSONB DEFAULT '{}'::jsonb, -- Flexible settings storage
  metadata JSONB DEFAULT '{}'::jsonb -- Additional metadata
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_share_links_blueprint_id ON public.share_links(blueprint_id);
CREATE INDEX IF NOT EXISTS idx_share_links_user_id ON public.share_links(user_id);
CREATE INDEX IF NOT EXISTS idx_share_links_share_token ON public.share_links(share_token);
CREATE INDEX IF NOT EXISTS idx_share_links_share_slug ON public.share_links(share_slug) WHERE share_slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_share_links_expires_at ON public.share_links(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_share_links_is_active ON public.share_links(is_active);

-- 2. Share analytics tracking table
-- =============================================
CREATE TABLE IF NOT EXISTS public.share_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  share_link_id UUID NOT NULL REFERENCES share_links(id) ON DELETE CASCADE,

  -- Visitor information (anonymized)
  visitor_id TEXT NOT NULL, -- Hashed visitor identifier
  visitor_email TEXT, -- If provided
  ip_hash TEXT, -- Hashed IP for uniqueness without storing actual IP

  -- Access details
  accessed_at TIMESTAMPTZ DEFAULT NOW(),
  access_duration_seconds INTEGER,

  -- User agent data (parsed)
  browser TEXT,
  browser_version TEXT,
  os TEXT,
  os_version TEXT,
  device_type TEXT, -- desktop, mobile, tablet

  -- Location (country/region level only for privacy)
  country_code TEXT,
  region TEXT,

  -- Engagement metrics
  sections_viewed TEXT[],
  time_per_section JSONB,
  total_scroll_depth INTEGER,
  clicks_count INTEGER,

  -- Actions taken
  downloaded BOOLEAN DEFAULT false,
  printed BOOLEAN DEFAULT false,
  shared BOOLEAN DEFAULT false,

  -- Referrer
  referrer_source TEXT, -- google, linkedin, direct, etc.
  referrer_url TEXT,

  -- Session data
  session_id UUID DEFAULT gen_random_uuid(),
  is_returning_visitor BOOLEAN DEFAULT false
);

-- Create indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_share_analytics_share_link_id ON public.share_analytics(share_link_id);
CREATE INDEX IF NOT EXISTS idx_share_analytics_accessed_at ON public.share_analytics(accessed_at);
CREATE INDEX IF NOT EXISTS idx_share_analytics_visitor_id ON public.share_analytics(visitor_id);
CREATE INDEX IF NOT EXISTS idx_share_analytics_country_code ON public.share_analytics(country_code);

-- 3. Share comments table (for comment permissions)
-- =============================================
CREATE TABLE IF NOT EXISTS public.share_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  share_link_id UUID NOT NULL REFERENCES share_links(id) ON DELETE CASCADE,
  blueprint_id UUID NOT NULL REFERENCES blueprint_generator(id) ON DELETE CASCADE,

  -- Commenter info
  commenter_email TEXT NOT NULL,
  commenter_name TEXT,

  -- Comment data
  comment_text TEXT NOT NULL,
  section_id TEXT, -- Which section of blueprint
  selection_text TEXT, -- Highlighted text if any

  -- Status
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),

  -- Threading
  parent_comment_id UUID REFERENCES share_comments(id),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_share_comments_share_link_id ON public.share_comments(share_link_id);
CREATE INDEX IF NOT EXISTS idx_share_comments_blueprint_id ON public.share_comments(blueprint_id);
CREATE INDEX IF NOT EXISTS idx_share_comments_parent_id ON public.share_comments(parent_comment_id);

-- 4. Share templates table
-- =============================================
CREATE TABLE IF NOT EXISTS public.share_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Template details
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT false,

  -- Template settings (copied to share_links)
  permission_level TEXT NOT NULL DEFAULT 'view',
  expires_after_hours INTEGER, -- Auto-expiry duration
  require_password BOOLEAN DEFAULT false,
  allow_download BOOLEAN DEFAULT true,
  allow_print BOOLEAN DEFAULT true,
  allow_copy BOOLEAN DEFAULT false,
  show_analytics BOOLEAN DEFAULT false,
  require_email BOOLEAN DEFAULT false,

  -- Usage tracking
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_share_templates_user_id ON public.share_templates(user_id);

-- 5. Helper functions
-- =============================================

-- Generate secure share token with collision detection
CREATE OR REPLACE FUNCTION public.generate_secure_share_token()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  characters TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  token TEXT;
  max_attempts INTEGER := 10;
  attempt INTEGER := 0;
BEGIN
  LOOP
    -- Generate 24-character URL-safe token
    token := '';
    FOR i IN 1..24 LOOP
      token := token || substr(characters, floor(random() * length(characters) + 1)::integer, 1);
    END LOOP;

    -- Check uniqueness
    IF NOT EXISTS (SELECT 1 FROM share_links WHERE share_token = token) THEN
      RETURN token;
    END IF;

    attempt := attempt + 1;
    IF attempt >= max_attempts THEN
      -- Add timestamp to ensure uniqueness
      token := token || '_' || extract(epoch from now())::text;
      RETURN token;
    END IF;
  END LOOP;
END;
$$;

-- Generate custom share slug
CREATE OR REPLACE FUNCTION public.generate_share_slug(title TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Create base slug from title
  base_slug := lower(regexp_replace(title, '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);
  base_slug := substring(base_slug from 1 for 50); -- Limit length

  final_slug := base_slug;

  -- Ensure uniqueness
  LOOP
    IF NOT EXISTS (SELECT 1 FROM share_links WHERE share_slug = final_slug) THEN
      RETURN final_slug;
    END IF;

    counter := counter + 1;
    final_slug := base_slug || '-' || counter;

    IF counter > 100 THEN
      -- Fallback to random suffix
      final_slug := base_slug || '-' || substring(md5(random()::text) from 1 for 6);
      RETURN final_slug;
    END IF;
  END LOOP;
END;
$$;

-- Track share view with analytics
CREATE OR REPLACE FUNCTION public.track_share_view(
  p_share_token TEXT,
  p_visitor_id TEXT,
  p_visitor_email TEXT DEFAULT NULL,
  p_ip_hash TEXT DEFAULT NULL,
  p_user_agent JSONB DEFAULT NULL,
  p_location JSONB DEFAULT NULL,
  p_referrer JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_share_link share_links;
  v_blueprint blueprint_generator;
  v_is_returning BOOLEAN;
  v_analytics_id UUID;
BEGIN
  -- Get share link
  SELECT * INTO v_share_link
  FROM share_links
  WHERE share_token = p_share_token
    AND is_active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or inactive share link');
  END IF;

  -- Check expiration
  IF v_share_link.expires_at IS NOT NULL AND v_share_link.expires_at < NOW() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Share link has expired');
  END IF;

  -- Check max views
  IF v_share_link.max_views IS NOT NULL AND v_share_link.view_count >= v_share_link.max_views THEN
    RETURN jsonb_build_object('success', false, 'error', 'Maximum views reached');
  END IF;

  -- Check if returning visitor
  v_is_returning := EXISTS (
    SELECT 1 FROM share_analytics
    WHERE share_link_id = v_share_link.id
      AND visitor_id = p_visitor_id
  );

  -- Insert analytics record
  INSERT INTO share_analytics (
    share_link_id,
    visitor_id,
    visitor_email,
    ip_hash,
    browser,
    browser_version,
    os,
    os_version,
    device_type,
    country_code,
    region,
    referrer_source,
    referrer_url,
    is_returning_visitor
  ) VALUES (
    v_share_link.id,
    p_visitor_id,
    p_visitor_email,
    p_ip_hash,
    p_user_agent->>'browser',
    p_user_agent->>'browser_version',
    p_user_agent->>'os',
    p_user_agent->>'os_version',
    p_user_agent->>'device_type',
    p_location->>'country_code',
    p_location->>'region',
    p_referrer->>'source',
    p_referrer->>'url',
    v_is_returning
  ) RETURNING id INTO v_analytics_id;

  -- Update share link stats
  UPDATE share_links
  SET
    view_count = view_count + 1,
    unique_viewers = CASE
      WHEN NOT v_is_returning THEN unique_viewers + 1
      ELSE unique_viewers
    END,
    last_viewed_at = NOW()
  WHERE id = v_share_link.id;

  -- Get blueprint data based on permission level
  SELECT * INTO v_blueprint
  FROM blueprint_generator
  WHERE id = v_share_link.blueprint_id;

  -- Return appropriate data based on permissions
  RETURN jsonb_build_object(
    'success', true,
    'analytics_id', v_analytics_id,
    'permission_level', v_share_link.permission_level,
    'settings', jsonb_build_object(
      'allow_download', v_share_link.allow_download,
      'allow_print', v_share_link.allow_print,
      'allow_copy', v_share_link.allow_copy,
      'show_analytics', v_share_link.show_analytics
    ),
    'blueprint', jsonb_build_object(
      'id', v_blueprint.id,
      'title', COALESCE(v_share_link.custom_title, v_blueprint.title),
      'description', v_share_link.custom_description,
      'blueprint_json', v_blueprint.blueprint_json,
      'blueprint_markdown', CASE
        WHEN v_share_link.permission_level IN ('view', 'comment', 'edit')
        THEN v_blueprint.blueprint_markdown
        ELSE NULL
      END,
      'created_at', v_blueprint.created_at
    )
  );
END;
$$;

-- 7. Row Level Security Policies
-- =============================================

-- Enable RLS on new tables
ALTER TABLE public.share_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.share_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.share_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.share_templates ENABLE ROW LEVEL SECURITY;

-- Share links policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage their own share links') THEN
    CREATE POLICY "Users can manage their own share links"
      ON public.share_links
      FOR ALL
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can view active share links') THEN
    CREATE POLICY "Public can view active share links"
      ON public.share_links
      FOR SELECT
      TO anon
      USING (is_active = true);
  END IF;
END $$;

-- Share analytics policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view analytics for their shares') THEN
    CREATE POLICY "Users can view analytics for their shares"
      ON public.share_analytics
      FOR SELECT
      TO authenticated
      USING (
        share_link_id IN (
          SELECT id FROM share_links WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Share comments policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone with link can create comments if permitted') THEN
    CREATE POLICY "Anyone with link can create comments if permitted"
      ON public.share_comments
      FOR INSERT
      TO anon, authenticated
      WITH CHECK (
        share_link_id IN (
          SELECT id FROM share_links
          WHERE is_active = true
            AND permission_level IN ('comment', 'edit')
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Blueprint owners can view all comments') THEN
    CREATE POLICY "Blueprint owners can view all comments"
      ON public.share_comments
      FOR SELECT
      TO authenticated
      USING (
        blueprint_id IN (
          SELECT id FROM blueprint_generator WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Share templates policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage their own templates') THEN
    CREATE POLICY "Users can manage their own templates"
      ON public.share_templates
      FOR ALL
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

-- 8. Migrate existing share tokens
-- =============================================
-- Migrate any existing share_token to new system
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'blueprint_generator'
    AND column_name = 'share_token'
  ) THEN
    INSERT INTO share_links (
      blueprint_id,
      user_id,
      share_token,
      permission_level,
      created_at
    )
    SELECT
      bg.id,
      bg.user_id,
      bg.share_token,
      'view',
      bg.created_at
    FROM blueprint_generator bg
    WHERE bg.share_token IS NOT NULL
    ON CONFLICT (share_token) DO NOTHING;
  END IF;
END $$;

-- 9. Add triggers for updated_at
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_share_links_updated_at') THEN
    CREATE TRIGGER update_share_links_updated_at
      BEFORE UPDATE ON public.share_links
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_share_comments_updated_at') THEN
    CREATE TRIGGER update_share_comments_updated_at
      BEFORE UPDATE ON public.share_comments
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_share_templates_updated_at') THEN
    CREATE TRIGGER update_share_templates_updated_at
      BEFORE UPDATE ON public.share_templates
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;
