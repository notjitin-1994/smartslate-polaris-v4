import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/user/activity/recent
 * Returns recent activity for the authenticated user with pagination
 *
 * Query Parameters:
 * - limit: Number of activities to return (default: 10, max: 100)
 * - offset: Number of activities to skip (default: 0)
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
    const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 100);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Get total count
    const { data: totalCount, error: countError } = await supabase.rpc('get_user_activity_count', {
      p_user_id: user.id,
    });

    if (countError) {
      console.error('Error getting activity count:', countError);
    }

    // Call RPC function to get recent activity
    const { data: activities, error: activitiesError } = await supabase.rpc(
      'get_user_recent_activity',
      {
        p_user_id: user.id,
        p_limit: limit,
        p_offset: offset,
      }
    );

    if (activitiesError) {
      console.error('Error fetching recent activity:', activitiesError);
      return NextResponse.json(
        {
          error: 'Failed to fetch recent activity',
          details: activitiesError.message,
        },
        { status: 500 }
      );
    }

    const total = totalCount || 0;
    const hasMore = offset + limit < total;

    return NextResponse.json({
      activities: activities || [],
      pagination: {
        total,
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
