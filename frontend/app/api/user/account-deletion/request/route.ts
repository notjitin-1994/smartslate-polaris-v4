import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/user/account-deletion/request
 * Requests account deletion with 30-day grace period
 *
 * Body:
 * {
 *   reason?: string,
 *   feedback?: object
 * }
 *
 * GDPR Article 17: Right to Erasure
 * - 30-day grace period for user to cancel
 * - Complete data deletion after grace period
 * - User notified of scheduled deletion date
 *
 * Response:
 * - 200: Deletion request created successfully
 * - 400: Active deletion request already exists
 * - 401: Unauthorized
 * - 500: Internal server error
 */
export async function POST(request: NextRequest) {
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

    // Parse request body
    const body = await request.json();
    const { reason, feedback } = body;

    // Check for existing pending deletion request
    const { data: existingRequest } = await supabase
      .from('account_deletion_requests')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .single();

    if (existingRequest) {
      return NextResponse.json(
        {
          error: 'Active deletion request already exists',
          scheduled_deletion_at: existingRequest.scheduled_deletion_at,
          can_cancel: true,
        },
        { status: 400 }
      );
    }

    // Create deletion request using Supabase RPC function
    const { data: requestId, error: requestError } = await supabase.rpc(
      'request_account_deletion',
      {
        p_user_id: user.id,
        p_reason: reason || null,
        p_feedback: feedback || {},
      }
    );

    if (requestError) {
      console.error('Error creating deletion request:', requestError);
      return NextResponse.json(
        {
          error: 'Failed to create deletion request',
          details: requestError.message,
        },
        { status: 500 }
      );
    }

    // Get the created request details
    const { data: deletionRequest } = await supabase
      .from('account_deletion_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    return NextResponse.json({
      success: true,
      message: 'Account deletion requested successfully',
      deletion_request: {
        id: requestId,
        scheduled_deletion_at: deletionRequest?.scheduled_deletion_at,
        grace_period_days: 30,
        can_cancel: true,
      },
    });
  } catch (error) {
    console.error('Account deletion request API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
