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
    let totalCount = 0;
    try {
      const { data, error: countError } = await supabase.rpc('get_user_activity_count', {
        p_user_id: user.id,
      });
      if (!countError) {
        totalCount = data || 0;
      } else {
        console.warn('[API Activity] RPC get_user_activity_count not available or failed:', countError.message);
      }
    } catch (e) {
      console.warn('[API Activity] Failed to call RPC get_user_activity_count');
    }

    // Get recent activity with pagination
    console.log('[API Activity] Fetching recent activity for user:', user.id, { limit, offset });
    let activities: any[] = [];
    try {
      const { data, error: activitiesError } = await supabase.rpc(
        'get_user_recent_activity',
        {
          p_user_id: user.id,
          p_limit: limit,
          p_offset: offset,
        }
      );
      if (!activitiesError) {
        activities = data || [];
      } else {
        console.warn('[API Activity] RPC get_user_recent_activity not available or failed:', activitiesError.message);
      }
    } catch (e) {
      console.warn('[API Activity] Failed to call RPC get_user_recent_activity');
    }

    // Calculate has_more flag
    const hasMore = offset + limit < totalCount;

    // Return paginated response
    return NextResponse.json({
      activities,
      pagination: {
        total: totalCount,
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
