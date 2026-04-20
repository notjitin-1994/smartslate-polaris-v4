/**
 * POST /api/share/create
 * Create a new share link with advanced options
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { getServerSession } from '@/lib/supabase/server';
import bcrypt from 'bcryptjs';
import { CreateShareLinkOptions, CreateShareLinkResponse } from '@/types/share';
import { z } from 'zod';

// Validation schema
const createShareSchema = z.object({
  blueprintId: z.string().uuid(),
  permissionLevel: z.enum(['view', 'comment', 'edit']).optional().default('view'),

  // Access controls
  password: z.string().min(6).optional(),
  maxViews: z.number().int().positive().optional(),
  expiresAt: z.string().datetime().optional(),

  // Settings
  allowDownload: z.boolean().optional().default(true),
  allowPrint: z.boolean().optional().default(true),
  allowCopy: z.boolean().optional().default(false),
  showAnalytics: z.boolean().optional().default(false),
  requireEmail: z.boolean().optional().default(false),
  allowedEmails: z.array(z.string().email()).optional(),
  blockedEmails: z.array(z.string().email()).optional(),
  allowedDomains: z.array(z.string()).optional(),

  // Customization
  customSlug: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  customTitle: z.string().max(200).optional(),
  customDescription: z.string().max(500).optional(),
  customImageUrl: z.string().url().optional(),

  // Template
  templateId: z.string().uuid().optional(),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Authenticate user
    const { session } = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await req.json();
    const validationResult = createShareSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const options = validationResult.data;
    const supabase = await getSupabaseServerClient();

    // Verify user owns the blueprint
    const { data: blueprint, error: blueprintError } = await supabase
      .from('blueprint_generator')
      .select('id, title, user_id')
      .eq('id', options.blueprintId)
      .eq('user_id', session.user.id)
      .single();

    if (blueprintError || !blueprint) {
      return NextResponse.json(
        { success: false, error: 'Blueprint not found or access denied' },
        { status: 404 }
      );
    }

    // Load template if provided
    let templateSettings = {};
    if (options.templateId) {
      const { data: template } = await supabase
        .from('share_templates')
        .select('*')
        .eq('id', options.templateId)
        .eq('user_id', session.user.id)
        .single();

      if (template) {
        templateSettings = {
          permission_level: template.permission_level,
          allow_download: template.allow_download,
          allow_print: template.allow_print,
          allow_copy: template.allow_copy,
          show_analytics: template.show_analytics,
          require_email: template.require_email,
          expires_at: template.expires_after_hours
            ? new Date(Date.now() + template.expires_after_hours * 3600000).toISOString()
            : undefined,
        };
      }
    }

    // Generate share token using direct SQL
    let shareToken: string;
    const { data: tokenData, error: tokenError } = await supabase.rpc(
      'generate_secure_share_token',
      {}
    );

    if (tokenError || !tokenData) {
      console.error('Token generation error:', tokenError);
      // Fallback to generate_share_token if the secure version fails
      const { data: fallbackToken, error: fallbackError } = await supabase.rpc(
        'generate_share_token',
        {}
      );

      if (fallbackError || !fallbackToken) {
        console.error('Fallback token generation error:', fallbackError);
        return NextResponse.json(
          { success: false, error: 'Failed to generate share token' },
          { status: 500 }
        );
      }

      // Use fallback token
      shareToken = fallbackToken;
    } else {
      shareToken = tokenData;
    }

    // Generate custom slug if requested
    let shareSlug = options.customSlug;
    if (!shareSlug && options.customTitle) {
      const { data: slugData } = await supabase.rpc('generate_share_slug', {
        title: options.customTitle || blueprint.title,
      });
      shareSlug = slugData as string;
    }

    // Hash password if provided
    let passwordHash: string | undefined;
    if (options.password) {
      passwordHash = await bcrypt.hash(options.password, 10);
    }

    // Create share link
    const { data: shareLink, error: createError } = await supabase
      .from('share_links')
      .insert({
        blueprint_id: options.blueprintId,
        user_id: session.user.id,
        share_token: shareToken,
        share_slug: shareSlug,
        permission_level: options.permissionLevel,

        // Access controls
        password_hash: passwordHash,
        max_views: options.maxViews,
        expires_at: options.expiresAt,

        // Settings (merge with template)
        ...templateSettings,
        allow_download: options.allowDownload,
        allow_print: options.allowPrint,
        allow_copy: options.allowCopy,
        show_analytics: options.showAnalytics,
        require_email: options.requireEmail,
        allowed_emails: options.allowedEmails,
        blocked_emails: options.blockedEmails,
        allowed_domains: options.allowedDomains,

        // Customization
        custom_title: options.customTitle,
        custom_description: options.customDescription,
        custom_image_url: options.customImageUrl,
      })
      .select()
      .single();

    if (createError) {
      console.error('Share link creation error:', createError);
      return NextResponse.json(
        { success: false, error: 'Failed to create share link' },
        { status: 500 }
      );
    }

    // Update template usage if used
    if (options.templateId) {
      await supabase.rpc('increment', {
        table_name: 'share_templates',
        column_name: 'usage_count',
        row_id: options.templateId,
      });

      await supabase
        .from('share_templates')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', options.templateId);
    }

    // Generate share URL
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin;
    const shareUrl = shareSlug
      ? `${baseUrl}/s/${shareSlug}`
      : `${baseUrl}/share/${shareLink.share_token}`;

    // Transform response
    const response: CreateShareLinkResponse = {
      success: true,
      shareLink: {
        id: shareLink.id,
        blueprintId: shareLink.blueprint_id,
        userId: shareLink.user_id,
        shareToken: shareLink.share_token,
        shareSlug: shareLink.share_slug,
        shareUrl,
        permissionLevel: shareLink.permission_level,
        hasPassword: !!shareLink.password_hash,
        maxViews: shareLink.max_views,
        expiresAt: shareLink.expires_at ? new Date(shareLink.expires_at) : undefined,
        isActive: shareLink.is_active,
        allowDownload: shareLink.allow_download,
        allowPrint: shareLink.allow_print,
        allowCopy: shareLink.allow_copy,
        showAnalytics: shareLink.show_analytics,
        requireEmail: shareLink.require_email,
        allowedEmails: shareLink.allowed_emails,
        blockedEmails: shareLink.blocked_emails,
        allowedDomains: shareLink.allowed_domains,
        viewCount: shareLink.view_count,
        uniqueViewers: shareLink.unique_viewers,
        lastViewedAt: shareLink.last_viewed_at ? new Date(shareLink.last_viewed_at) : undefined,
        customTitle: shareLink.custom_title,
        customDescription: shareLink.custom_description,
        customImageUrl: shareLink.custom_image_url,
        createdAt: new Date(shareLink.created_at),
        updatedAt: new Date(shareLink.updated_at),
        settings: shareLink.settings || {},
        metadata: shareLink.metadata || {},
      },
      shareUrl,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error creating share link:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
