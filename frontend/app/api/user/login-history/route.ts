import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/user/login-history
 * Returns login history for the authenticated user
 *
 * Query Parameters:
 * - limit: Number of logins to return (default: 10, max: 50)
 *
 * Response:
 * {
 *   logins: [
 *     {
 *       id: string,
 *       created_at: string,
 *       ip_address: string,
 *       user_agent: string,
 *       device_info: object,
 *       location_info: object
 *     }
 *   ],
 *   total: number
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
    const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 50);

    // Call RPC function to get login history
    const { data: logins, error: loginsError } = await supabase.rpc('get_user_login_history', {
      p_user_id: user.id,
      p_limit: limit,
    });

    if (loginsError) {
      console.error('Error fetching login history:', loginsError);
      return NextResponse.json(
        { error: 'Failed to fetch login history', details: loginsError.message },
        { status: 500 }
      );
    }

    // Get total count
    const { count, error: countError } = await supabase
      .from('user_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (countError) {
      console.error('Error counting logins:', countError);
    }

    return NextResponse.json({
      logins: logins || [],
      total: count || 0,
    });
  } catch (error) {
    console.error('Login history API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
