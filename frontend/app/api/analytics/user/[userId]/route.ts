import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import type { UserAnalytics } from '@/types/analytics';

/**
 * Get user analytics
 * GET /api/analytics/user/[userId]
 *
 * Query Parameters:
 * - start_date: Start date for analytics (ISO string, default: 30 days ago)
 * - end_date: End date for analytics (ISO string, default: now)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await params;

    // Only allow users to view their own analytics, unless they're admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('user_role')
      .eq('user_id', user.id)
      .single();

    const isAdmin = ['developer', 'enterprise', 'armada', 'fleet'].includes(
      profile?.user_role || ''
    );

    if (userId !== user.id && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden', details: 'You can only view your own analytics' },
        { status: 403 }
      );
    }

    // Parse date range
    const searchParams = request.nextUrl.searchParams;
    const startDate =
      searchParams.get('start_date') ||
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = searchParams.get('end_date') || new Date().toISOString();

    // Use admin client for RPC call
    const adminSupabase = getSupabaseAdminClient();
    const { data, error } = await adminSupabase.rpc('get_user_analytics', {
      p_user_id: userId,
      p_start_date: startDate,
      p_end_date: endDate,
    });

    if (error) {
      console.error('Failed to fetch user analytics:', error);
      return NextResponse.json(
        { error: 'Failed to fetch analytics', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data as UserAnalytics);
  } catch (error) {
    console.error('User analytics API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
