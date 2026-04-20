/**
 * API Route: POST /api/account/delete
 *
 * Schedules a user's account for deletion with a 30-day grace period.
 * DELETE /api/account/delete - Cancel scheduled deletion
 *
 * Security:
 * - Requires authentication
 * - Validates confirmation token
 * - Implements 30-day grace period for GDPR compliance
 * - Sends confirmation email
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import type { Database } from '@/types/supabase';
import { sendAndLogEmail } from '@/lib/email/logger';
import { AccountDeletionScheduledEmail } from '@/emails/templates/account-deletion-scheduled';
import { render } from '@react-email/render';

export const dynamic = 'force-dynamic';

interface ScheduleDeleteRequest {
  confirmationText: string;
}

const DELETION_GRACE_PERIOD_DAYS = 30;

export async function POST(request: NextRequest) {
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

    // Parse and validate request body
    const body: ScheduleDeleteRequest = await request.json();

    if (body.confirmationText !== 'DELETE') {
      return NextResponse.json(
        { error: 'Invalid confirmation text. Please type DELETE to confirm.' },
        { status: 400 }
      );
    }

    // Check if already scheduled
    const { data: existingDeletion } = await supabase
      .from('account_deletion_requests')
      .select('scheduled_deletion_date')
      .eq('user_id', user.id)
      .eq('status', 'scheduled')
      .single();

    if (existingDeletion) {
      return NextResponse.json(
        {
          error: 'Account deletion already scheduled',
          code: 'ALREADY_SCHEDULED',
          scheduledDate: existingDeletion.scheduled_deletion_date,
        },
        { status: 409 }
      );
    }

    // Calculate deletion date (30 days from now)
    const scheduledDate = new Date();
    scheduledDate.setDate(scheduledDate.getDate() + DELETION_GRACE_PERIOD_DAYS);

    // Create deletion request
    const { data: deletionRequest, error: createError } = await supabase
      .from('account_deletion_requests')
      .insert({
        user_id: user.id,
        requested_at: new Date().toISOString(),
        scheduled_deletion_date: scheduledDate.toISOString(),
        status: 'scheduled',
      })
      .select()
      .single();

    if (createError) {
      console.error('[SCHEDULE DELETION ERROR]', createError);
      return NextResponse.json(
        { error: 'Failed to schedule account deletion. Please try again.' },
        { status: 500 }
      );
    }

    console.log(
      `[ACCOUNT DELETION] User ${user.id} (${user.email}) scheduled deletion for ${scheduledDate.toISOString()}`
    );

    // Send confirmation email
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('full_name, email')
        .eq('id', user.id)
        .single();

      if (profile?.email) {
        const cancelUrl = `${request.headers.get('origin') || 'https://smartslate.com'}/settings?tab=account&action=cancel-deletion`;

        const emailHtml = await render(
          AccountDeletionScheduledEmail({
            userName: profile.full_name || 'User',
            scheduledDeletionDate: scheduledDate.toISOString(),
            daysRemaining: DELETION_GRACE_PERIOD_DAYS,
            cancelUrl,
          })
        );

        await sendAndLogEmail({
          to: profile.email,
          subject: 'Account Deletion Scheduled',
          html: emailHtml,
          userId: user.id,
          emailType: 'account_deletion_scheduled',
        });
      }
    } catch (emailError) {
      console.error('[DELETION EMAIL ERROR]', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json(
      {
        success: true,
        message: `Account deletion scheduled for ${scheduledDate.toLocaleDateString()}. You can cancel this anytime before then.`,
        scheduledDate: scheduledDate.toISOString(),
        daysRemaining: DELETION_GRACE_PERIOD_DAYS,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[SCHEDULE DELETION] Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again or contact support.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/account/delete
 * Cancel a scheduled account deletion
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    // Cancel the deletion request
    const { error: cancelError } = await supabase
      .from('account_deletion_requests')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .eq('status', 'scheduled');

    if (cancelError) {
      console.error('[CANCEL DELETION ERROR]', cancelError);
      return NextResponse.json(
        { error: 'Failed to cancel deletion. Please try again.' },
        { status: 500 }
      );
    }

    console.log(`[ACCOUNT DELETION] User ${user.id} cancelled account deletion`);

    return NextResponse.json({
      success: true,
      message: 'Account deletion cancelled successfully.',
    });
  } catch (error) {
    console.error('[CANCEL DELETION] Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
