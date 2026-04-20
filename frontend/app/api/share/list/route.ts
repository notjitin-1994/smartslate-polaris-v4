/**
 * Share Links List API
 * GET /api/share/list - List all share links for a blueprint
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { getServerSession } from '@/lib/supabase/server';
import type { ShareLink } from '@/types/share';

/**
 * GET /api/share/list
 * List all share links for a specific blueprint
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const blueprintId = searchParams.get('blueprintId');
    const includeRevoked = searchParams.get('includeRevoked') === 'true';
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Authenticate user
    const { session } = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await getSupabaseServerClient();

    // Build query
    let query = supabase.from('share_links').select('*').eq('user_id', session.user.id);

    // Filter by blueprint if specified
    if (blueprintId) {
      query = query.eq('blueprint_id', blueprintId);
    }

    // Filter by active status unless includeRevoked is true
    if (!includeRevoked) {
      query = query.eq('is_active', true);
    }

    // Apply sorting
    const validSortFields = ['created_at', 'view_count', 'last_viewed_at', 'expires_at'];
    if (validSortFields.includes(sortBy)) {
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: shares, error, count } = await query;

    if (error) {
      console.error('Error fetching shares:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch share links' },
        { status: 500 }
      );
    }

    // Generate share URLs
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin;
    const sharesWithUrls = (shares || []).map((share) => ({
      ...share,
      shareUrl: share.share_slug
        ? `${baseUrl}/s/${share.share_slug}`
        : `${baseUrl}/share/${share.share_token}`,
      hasPassword: !!share.password_hash,
      expiresAt: share.expires_at ? new Date(share.expires_at) : undefined,
      lastViewedAt: share.last_viewed_at ? new Date(share.last_viewed_at) : undefined,
      createdAt: new Date(share.created_at),
      updatedAt: new Date(share.updated_at),
      revokedAt: share.revoked_at ? new Date(share.revoked_at) : undefined,
    }));

    // Get total count for pagination
    const totalQuery = supabase
      .from('share_links')
      .select('count', { count: 'exact', head: true })
      .eq('user_id', session.user.id);

    if (blueprintId) {
      totalQuery.eq('blueprint_id', blueprintId);
    }

    if (!includeRevoked) {
      totalQuery.eq('is_active', true);
    }

    const { count: totalCount } = await totalQuery;

    return NextResponse.json({
      success: true,
      shares: sharesWithUrls,
      pagination: {
        total: totalCount || 0,
        limit,
        offset,
        hasMore: offset + limit < (totalCount || 0),
      },
    });
  } catch (error) {
    console.error('Error in list shares API:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
