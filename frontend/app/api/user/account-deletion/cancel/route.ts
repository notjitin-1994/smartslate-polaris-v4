import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/user/account-deletion/cancel
 * Cancels a pending account deletion request
 *
 * Body:
 * {
 *   cancellation_reason?: string
 * }
 *
 * Response:
 * - 200: Deletion request cancelled successfully
 * - 400: No pending deletion request found
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
    const { cancellation_reason } = body;

    // Cancel deletion request using Supabase RPC function
    const { data: cancelled, error: cancelError } = await supabase.rpc('cancel_account_deletion', {
      p_user_id: user.id,
      p_cancellation_reason: cancellation_reason || null,
    });

    if (cancelError) {
      console.error('Error cancelling deletion request:', cancelError);
      return NextResponse.json(
        {
          error: 'Failed to cancel deletion request',
          details: cancelError.message,
        },
        { status: 500 }
      );
    }

    if (!cancelled) {
      return NextResponse.json(
        {
          error: 'No pending deletion request found',
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Account deletion request cancelled successfully',
    });
  } catch (error) {
    console.error('Cancel deletion request API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
