/**
 * Share Link Management API
 * GET /api/share/[id] - Get share link details
 * PATCH /api/share/[id] - Update share link settings
 * DELETE /api/share/[id] - Revoke share link
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { getServerSession } from '@/lib/supabase/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import type { ShareLink, UpdateShareLinkResponse, RevokeShareLinkResponse } from '@/types/share';

// Update validation schema
const updateShareSchema = z.object({
  permissionLevel: z.enum(['view', 'comment', 'edit']).optional(),
  password: z.string().min(6).nullable().optional(),
  maxViews: z.number().int().positive().nullable().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
  isActive: z.boolean().optional(),

  // Settings
  allowDownload: z.boolean().optional(),
  allowPrint: z.boolean().optional(),
  allowCopy: z.boolean().optional(),
  showAnalytics: z.boolean().optional(),
  requireEmail: z.boolean().optional(),
  allowedEmails: z.array(z.string().email()).nullable().optional(),
  blockedEmails: z.array(z.string().email()).nullable().optional(),
  allowedDomains: z.array(z.string()).nullable().optional(),

  // Customization
  customTitle: z.string().max(200).nullable().optional(),
  customDescription: z.string().max(500).nullable().optional(),
  customImageUrl: z.string().url().nullable().optional(),
});

/**
 * GET /api/share/[id]
 * Get share link details with analytics summary
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;

    // Authenticate user
    const { session } = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await getSupabaseServerClient();

    // Get share link
    const { data: shareLink, error } = await supabase
      .from('share_links')
      .select('*')
      .eq('id', id)
      .eq('user_id', session.user.id)
      .single();

    if (error || !shareLink) {
      return NextResponse.json({ success: false, error: 'Share link not found' }, { status: 404 });
    }

    // Get basic analytics summary
    const { data: analytics } = await supabase
      .from('share_analytics')
      .select('id, accessed_at, visitor_id, country_code, device_type')
      .eq('share_link_id', id)
      .order('accessed_at', { ascending: false })
      .limit(10);

    // Generate share URL
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin;
    const shareUrl = shareLink.share_slug
      ? `${baseUrl}/s/${shareLink.share_slug}`
      : `${baseUrl}/share/${shareLink.share_token}`;

    // Transform response
    const response = {
      success: true,
      shareLink: {
        ...shareLink,
        shareUrl,
        hasPassword: !!shareLink.password_hash,
        expiresAt: shareLink.expires_at ? new Date(shareLink.expires_at) : undefined,
        lastViewedAt: shareLink.last_viewed_at ? new Date(shareLink.last_viewed_at) : undefined,
        createdAt: new Date(shareLink.created_at),
        updatedAt: new Date(shareLink.updated_at),
        revokedAt: shareLink.revoked_at ? new Date(shareLink.revoked_at) : undefined,
      },
      recentViews: analytics || [],
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching share link:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/share/[id]
 * Update share link settings
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;

    // Authenticate user
    const { session } = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await req.json();
    const validationResult = updateShareSchema.safeParse(body);

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

    const updates = validationResult.data;
    const supabase = await getSupabaseServerClient();

    // Verify ownership
    const { data: existingLink, error: fetchError } = await supabase
      .from('share_links')
      .select('id, user_id')
      .eq('id', id)
      .eq('user_id', session.user.id)
      .single();

    if (fetchError || !existingLink) {
      return NextResponse.json(
        { success: false, error: 'Share link not found or access denied' },
        { status: 404 }
      );
    }

    // Prepare updates
    const updateData: any = {};

    // Handle password update
    if ('password' in updates) {
      if (updates.password) {
        updateData.password_hash = await bcrypt.hash(updates.password, 10);
      } else {
        updateData.password_hash = null;
      }
    }

    // Map other fields
    const fieldMappings: Record<string, string> = {
      permissionLevel: 'permission_level',
      maxViews: 'max_views',
      expiresAt: 'expires_at',
      isActive: 'is_active',
      allowDownload: 'allow_download',
      allowPrint: 'allow_print',
      allowCopy: 'allow_copy',
      showAnalytics: 'show_analytics',
      requireEmail: 'require_email',
      allowedEmails: 'allowed_emails',
      blockedEmails: 'blocked_emails',
      allowedDomains: 'allowed_domains',
      customTitle: 'custom_title',
      customDescription: 'custom_description',
      customImageUrl: 'custom_image_url',
    };

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'password' && key in fieldMappings) {
        updateData[fieldMappings[key]] = value;
      }
    });

    // Update the share link
    const { data: updatedLink, error: updateError } = await supabase
      .from('share_links')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update share link' },
        { status: 500 }
      );
    }

    // Generate share URL
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin;
    const shareUrl = updatedLink.share_slug
      ? `${baseUrl}/s/${updatedLink.share_slug}`
      : `${baseUrl}/share/${updatedLink.share_token}`;

    const response: UpdateShareLinkResponse = {
      success: true,
      shareLink: {
        ...updatedLink,
        shareUrl,
        hasPassword: !!updatedLink.password_hash,
      } as ShareLink,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating share link:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/share/[id]
 * Revoke share link
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;

    // Get revoke reason from query params
    const { searchParams } = new URL(req.url);
    const reason = searchParams.get('reason') || 'User revoked';

    // Authenticate user
    const { session } = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await getSupabaseServerClient();

    // Verify ownership and revoke
    const { data: revokedLink, error } = await supabase
      .from('share_links')
      .update({
        is_active: false,
        revoked_at: new Date().toISOString(),
        revoke_reason: reason,
      })
      .eq('id', id)
      .eq('user_id', session.user.id)
      .select()
      .single();

    if (error || !revokedLink) {
      return NextResponse.json(
        { success: false, error: 'Share link not found or already revoked' },
        { status: 404 }
      );
    }

    const response: RevokeShareLinkResponse = {
      success: true,
      message: 'Share link has been revoked successfully',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error revoking share link:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
