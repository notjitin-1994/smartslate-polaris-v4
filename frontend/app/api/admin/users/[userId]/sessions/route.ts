import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/adminAuth';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import type { SessionStats } from '@/types/session';

/**
 * Admin API: Get user sessions
 * GET /api/admin/users/[userId]/sessions
 *
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Results per page (default: 20, max: 100)
 * - is_active: Filter by active status (true/false)
 * - device_type: Filter by device type (desktop/mobile/tablet)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // Verify admin access
    await requireAdmin();

    const { userId } = await params;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const isActiveFilter = searchParams.get('is_active');
    const deviceTypeFilter = searchParams.get('device_type');

    const supabase = getSupabaseAdminClient();

    // Get user basic info
    const { data: user, error: userError } = await supabase
      .from('user_profiles')
      .select('user_id, full_name')
      .eq('user_id', userId)
      .single();

    // Get auth user for email
    const { data: authUser } = await supabase.auth.admin.getUserById(userId);

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Build query for sessions
    let query = supabase
      .from('user_sessions')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('started_at', { ascending: false });

    // Apply is_active filter if provided
    if (isActiveFilter !== null) {
      query = query.eq('is_active', isActiveFilter === 'true');
    }

    // Apply device_type filter if provided
    if (deviceTypeFilter && ['desktop', 'mobile', 'tablet'].includes(deviceTypeFilter)) {
      query = query.eq('device_type', deviceTypeFilter);
    }

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data: sessions, error: sessionsError, count } = await query;

    if (sessionsError) {
      console.error('Failed to fetch sessions:', sessionsError);
      return NextResponse.json(
        { error: 'Failed to fetch sessions', details: sessionsError.message },
        { status: 500 }
      );
    }

    // Get session statistics
    const { data: allSessions } = await supabase
      .from('user_sessions')
      .select(
        'is_active, duration_seconds, page_views, actions_count, blueprints_created, blueprints_viewed'
      )
      .eq('user_id', userId);

    const stats: SessionStats = {
      total_sessions: allSessions?.length || 0,
      active_sessions: allSessions?.filter((s) => s.is_active).length || 0,
      total_duration_seconds:
        allSessions?.reduce((sum, s) => sum + (s.duration_seconds || 0), 0) || 0,
      average_duration_seconds:
        allSessions && allSessions.length > 0
          ? Math.round(
              allSessions.reduce((sum, s) => sum + (s.duration_seconds || 0), 0) /
                allSessions.length
            )
          : 0,
      total_page_views: allSessions?.reduce((sum, s) => sum + (s.page_views || 0), 0) || 0,
      total_actions: allSessions?.reduce((sum, s) => sum + (s.actions_count || 0), 0) || 0,
      total_blueprints_created:
        allSessions?.reduce((sum, s) => sum + (s.blueprints_created || 0), 0) || 0,
      total_blueprints_viewed:
        allSessions?.reduce((sum, s) => sum + (s.blueprints_viewed || 0), 0) || 0,
    };

    return NextResponse.json({
      user: {
        user_id: user.user_id,
        email: authUser?.user?.email || 'unknown',
        full_name: user.full_name,
      },
      sessions: sessions || [],
      stats,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Get user sessions API error:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          details: 'You do not have permission to view user sessions',
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
