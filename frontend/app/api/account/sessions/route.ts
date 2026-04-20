/**
 * API Route: GET /api/account/sessions
 *
 * Retrieves all active sessions for the authenticated user.
 *
 * Security:
 * - Requires authentication
 * - Only returns sessions for the authenticated user
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import type { Database } from '@/types/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();

    // Verify authentication
    const {
      data: { session, user },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError || !session || !user) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    // Get active sessions from session_tracking table using helper function
    const { data: trackedSessions, error: trackingError } = await supabase.rpc(
      'get_active_sessions',
      {
        p_user_id: user.id,
      }
    );

    if (trackingError) {
      console.error('[GET SESSIONS] Tracking error:', trackingError);
      // Fall back to current session only if tracking fails
      const fallbackSessions = [
        {
          id: session.access_token.substring(0, 8),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          device_info: null,
          ip_address: null,
          location_city: null,
          location_country: null,
          isCurrent: true,
        },
      ];

      return NextResponse.json(
        {
          success: true,
          sessions: fallbackSessions,
        },
        { status: 200 }
      );
    }

    // Add current session flag
    const formattedSessions = (trackedSessions || []).map((s: any) => ({
      ...s,
      isCurrent: s.session_token === session.access_token,
    }));

    return NextResponse.json(
      {
        success: true,
        sessions: formattedSessions,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[GET SESSIONS] Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}

/**
 * API Route: DELETE /api/account/sessions
 *
 * Revokes a specific session or all sessions except the current one.
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();

    // Verify authentication
    const {
      data: { session, user },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError || !session || !user) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    // Parse request body
    const { sessionId, revokeAll } = await request.json();

    if (revokeAll) {
      // Find current session ID in tracking table
      const { data: currentSessionData } = await supabase
        .from('session_tracking')
        .select('id')
        .eq('user_id', user.id)
        .eq('session_token', session.access_token)
        .eq('is_active', true)
        .single();

      if (!currentSessionData) {
        console.warn('[REVOKE SESSIONS] Current session not found in tracking');
      }

      // Use helper function to revoke all other sessions
      const { error: revokeError } = await supabase.rpc('revoke_all_other_sessions', {
        p_user_id: user.id,
        p_current_session_id: currentSessionData?.id || null,
      });

      if (revokeError) {
        console.error('[REVOKE ALL SESSIONS ERROR]', revokeError);
        return NextResponse.json({ error: 'Failed to revoke sessions.' }, { status: 500 });
      }

      // Also revoke at auth level
      const { error: authRevokeError } = await supabase.auth.admin.signOut(user.id, 'others');
      if (authRevokeError) {
        console.error('[AUTH REVOKE ERROR]', authRevokeError);
        // Continue anyway since tracking was updated
      }

      console.log(`[REVOKE SESSIONS] User ${user.id} revoked all other sessions`);

      return NextResponse.json(
        {
          success: true,
          message: 'All other sessions have been revoked.',
        },
        { status: 200 }
      );
    }

    if (sessionId) {
      // Revoke specific session by marking it inactive
      const { error: revokeError } = await supabase
        .from('session_tracking')
        .update({
          is_active: false,
          ended_at: new Date().toISOString(),
        })
        .eq('id', sessionId)
        .eq('user_id', user.id); // Ensure user owns this session

      if (revokeError) {
        console.error('[REVOKE SESSION ERROR]', revokeError);
        return NextResponse.json({ error: 'Failed to revoke session.' }, { status: 500 });
      }

      console.log(`[REVOKE SESSION] User ${user.id} revoked session ${sessionId}`);

      return NextResponse.json(
        {
          success: true,
          message: 'Session revoked successfully.',
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { error: 'Invalid request. Provide sessionId or revokeAll=true.' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[REVOKE SESSIONS] Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
