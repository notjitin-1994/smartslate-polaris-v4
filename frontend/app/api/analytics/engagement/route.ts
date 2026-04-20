import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/adminAuth';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import type { UserEngagementMetrics } from '@/types/analytics';

/**
 * Admin API: Get user engagement metrics
 * GET /api/analytics/engagement
 *
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Results per page (default: 50, max: 100)
 * - tier: Filter by subscription tier
 * - min_score: Minimum engagement score
 * - sort_by: Field to sort by (engagement_score, total_blueprints, last_activity_at, etc.)
 * - sort_order: Sort order (asc/desc, default: desc)
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    await requireAdmin();

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    const tierFilter = searchParams.get('tier');
    const minScore = searchParams.get('min_score');
    const sortBy = searchParams.get('sort_by') || 'engagement_score';
    const sortOrder = searchParams.get('sort_order') || 'desc';

    const supabase = getSupabaseAdminClient();

    // Build query
    let query = supabase.from('user_engagement_metrics').select('*', { count: 'exact' });

    // Apply filters
    if (tierFilter) {
      query = query.eq('subscription_tier', tierFilter);
    }

    if (minScore) {
      query = query.gte('engagement_score', parseInt(minScore, 10));
    }

    // Apply sorting
    const validSortFields = [
      'engagement_score',
      'total_blueprints',
      'completed_blueprints',
      'total_sessions',
      'total_page_views',
      'last_activity_at',
      'user_created_at',
    ];

    if (validSortFields.includes(sortBy)) {
      query = query.order(sortBy as any, {
        ascending: sortOrder === 'asc',
      });
    }

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data: metrics, error, count } = await query;

    if (error) {
      console.error('Failed to fetch engagement metrics:', error);
      return NextResponse.json(
        { error: 'Failed to fetch metrics', details: error.message },
        { status: 500 }
      );
    }

    // Calculate aggregate statistics
    const { data: allMetrics } = await supabase
      .from('user_engagement_metrics')
      .select('engagement_score, total_blueprints, completed_blueprints, total_sessions');

    const aggregates = {
      avg_engagement_score:
        allMetrics && allMetrics.length > 0
          ? Math.round(
              allMetrics.reduce((sum, m) => sum + m.engagement_score, 0) / allMetrics.length
            )
          : 0,
      total_blueprints: allMetrics?.reduce((sum, m) => sum + m.total_blueprints, 0) || 0,
      total_completed: allMetrics?.reduce((sum, m) => sum + m.completed_blueprints, 0) || 0,
      total_sessions: allMetrics?.reduce((sum, m) => sum + m.total_sessions, 0) || 0,
    };

    return NextResponse.json({
      metrics: (metrics || []) as UserEngagementMetrics[],
      aggregates,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Engagement metrics API error:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          details: 'You do not have permission to view engagement metrics',
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
