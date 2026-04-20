import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/auth/sessions
 * Lists all active sessions for the authenticated user
 *
 * Query Parameters:
 * - limit: Number of sessions to return (default: 10, max: 50)
 *
 * Response:
 * {
 *   sessions: [
 *     {
 *       id: string,
 *       user_id: string,
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

    // Get user sessions from database
    const {
      data: sessions,
      error: sessionsError,
      count,
    } = await supabase
      .from('user_sessions')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError);
      return NextResponse.json(
        { error: 'Failed to fetch sessions', details: sessionsError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      sessions: sessions || [],
      total: count || 0,
    });
  } catch (error) {
    console.error('Sessions API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
