import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateSessionActivity, endSession } from '@/lib/utils/sessionTracker';
import type { SessionActivity } from '@/types/session';

/**
 * Update session activity
 * PATCH /api/sessions/[sessionId]
 *
 * Body:
 * - page_view: boolean
 * - action: boolean
 * - blueprint_created: boolean
 * - blueprint_viewed: boolean
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId } = await params;

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Verify session belongs to user
    const { data: session, error: sessionError } = await supabase
      .from('user_sessions')
      .select('user_id, is_active')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (session.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!session.is_active) {
      return NextResponse.json({ error: 'Session is not active' }, { status: 400 });
    }

    // Parse activity from request body
    const body = await request.json();
    const activity: SessionActivity = {
      page_view: body.page_view || false,
      action: body.action || false,
      blueprint_created: body.blueprint_created || false,
      blueprint_viewed: body.blueprint_viewed || false,
    };

    const success = await updateSessionActivity(sessionId, activity);

    if (!success) {
      return NextResponse.json({ error: 'Failed to update session activity' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Session activity updated successfully' });
  } catch (error) {
    console.error('Update session activity API error:', error);
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
 * End a specific session
 * DELETE /api/sessions/[sessionId]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId } = await params;

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Verify session belongs to user
    const { data: session, error: sessionError } = await supabase
      .from('user_sessions')
      .select('user_id')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (session.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const success = await endSession(sessionId);

    if (!success) {
      return NextResponse.json({ error: 'Failed to end session' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Session ended successfully' });
  } catch (error) {
    console.error('End session API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
