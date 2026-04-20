import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/user/activity/recent
 * Returns paginated recent activity for the authenticated user
 *
 * Query Parameters:
 * - limit: Number of items per page (default: 10, max: 100)
 * - offset: Pagination offset (default: 0)
 *
 * Response:
 * {
 *   activities: [
 *     {
 *       id: string,
 *       action_type: string,
 *       resource_type: string,
 *       resource_id: string,
 *       metadata: object,
 *       created_at: string,
 *       actor_id: string,
 *       actor_full_name: string | null,
 *       actor_avatar_url: string | null
 *     }
 *   ],
 *   pagination: {
 *     total: number,
 *     limit: number,
 *     offset: number,
 *     has_more: boolean
 *   }
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(
      parseInt(searchParams.get('limit') || '10', 10),
      100 // Max 100 items per page
    );
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10), 0);

    // Validate pagination parameters
    if (isNaN(limit) || isNaN(offset)) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters. limit and offset must be numbers.' },
        { status: 400 }
      );
    }

    // Get total count for pagination
    console.log('[API Activity] Fetching activity count for user:', user.id);
    const { data: totalCount, error: countError } = await supabase.rpc('get_user_activity_count', {
      p_user_id: user.id,
    });

    if (countError) {
      console.error('[API Activity] Error fetching activity count:', {
        message: countError.message,
        code: countError.code,
        details: countError.details,
        userId: user.id
      });
      return NextResponse.json(
        { error: 'Failed to fetch activity count', details: countError.message },
        { status: 500 }
      );
    }

    // Get recent activity with pagination
    console.log('[API Activity] Fetching recent activity for user:', user.id, { limit, offset });
    const { data: activities, error: activitiesError } = await supabase.rpc(
      'get_user_recent_activity',
      {
        p_user_id: user.id,
        p_limit: limit,
        p_offset: offset,
      }
    );

    if (activitiesError) {
      console.error('[API Activity] Error fetching recent activity:', {
        message: activitiesError.message,
        code: activitiesError.code,
        details: activitiesError.details,
        userId: user.id
      });
      return NextResponse.json(
        { error: 'Failed to fetch recent activity', details: activitiesError.message },
        { status: 500 }
      );
    }

    // Calculate has_more flag
    const hasMore = offset + limit < (totalCount || 0);

    // Return paginated response
    return NextResponse.json({
      activities: activities || [],
      pagination: {
        total: totalCount || 0,
        limit,
        offset,
        has_more: hasMore,
      },
    });
  } catch (error) {
    console.error('Recent activity API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
