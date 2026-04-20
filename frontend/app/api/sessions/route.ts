import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createSession, getActiveSession, endUserSessions } from '@/lib/utils/sessionTracker';
import { headers } from 'next/headers';

/**
 * Get current user's sessions
 * GET /api/sessions
 *
 * Query Parameters:
 * - is_active: Filter by active status (true/false)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const isActiveFilter = searchParams.get('is_active');

    // Build query
    let query = supabase
      .from('user_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('started_at', { ascending: false });

    // Apply is_active filter if provided
    if (isActiveFilter !== null) {
      query = query.eq('is_active', isActiveFilter === 'true');
    }

    const { data: sessions, error } = await query;

    if (error) {
      console.error('Failed to fetch sessions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch sessions', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ sessions: sessions || [] });
  } catch (error) {
    console.error('Get sessions API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Create a new session or get existing active session
 * POST /api/sessions
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user agent and IP from headers
    const headersList = await headers();
    const userAgent = headersList.get('user-agent') || undefined;
    const ipAddress =
      headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || undefined;

    // Check for existing active session
    const existingSession = await getActiveSession(user.id);

    if (existingSession) {
      return NextResponse.json({
        session: existingSession,
        message: 'Active session already exists',
      });
    }

    // Create new session
    const session = await createSession({
      user_id: user.id,
      user_agent: userAgent,
      ip_address: ipAddress,
      session_token: crypto.randomUUID(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }

    return NextResponse.json({ session, message: 'Session created successfully' });
  } catch (error) {
    console.error('Create session API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * End all active sessions for current user
 * DELETE /api/sessions
 */
export async function DELETE() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const success = await endUserSessions(user.id);

    if (!success) {
      return NextResponse.json({ error: 'Failed to end sessions' }, { status: 500 });
    }

    return NextResponse.json({ message: 'All sessions ended successfully' });
  } catch (error) {
    console.error('End sessions API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
