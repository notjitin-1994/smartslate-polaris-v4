/**
 * API Route: POST /api/account/password/change
 *
 * Changes the user's password.
 *
 * Security:
 * - Requires authentication
 * - Validates current password
 * - Enforces password strength requirements
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import type { Database } from '@/types/supabase';
import { sendAndLogEmail } from '@/lib/email/logger';
import { PasswordChangedEmail } from '@/emails/templates/password-changed';
import { render } from '@react-email/render';

export const dynamic = 'force-dynamic';

interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// Password validation rules
const MIN_PASSWORD_LENGTH = 8;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;

function validatePassword(password: string): { valid: boolean; error?: string } {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      valid: false,
      error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`,
    };
  }

  if (!PASSWORD_REGEX.test(password)) {
    return {
      valid: false,
      error:
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&).',
    };
  }

  return { valid: true };
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();

    // Verify authentication
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    // Parse and validate request body
    const body: ChangePasswordRequest = await request.json();

    if (!body.currentPassword || !body.newPassword) {
      return NextResponse.json(
        { error: 'Current password and new password are required.' },
        { status: 400 }
      );
    }

    // Validate new password strength
    const passwordValidation = validatePassword(body.newPassword);
    if (!passwordValidation.valid) {
      return NextResponse.json({ error: passwordValidation.error }, { status: 400 });
    }

    // Ensure new password is different from current
    if (body.currentPassword === body.newPassword) {
      return NextResponse.json(
        { error: 'New password must be different from current password.' },
        { status: 400 }
      );
    }

    // Verify current password by attempting to sign in
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: session.user.email!,
      password: body.currentPassword,
    });

    if (verifyError) {
      return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 401 });
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: body.newPassword,
    });

    if (updateError) {
      console.error('[PASSWORD CHANGE ERROR]', updateError);
      return NextResponse.json(
        { error: 'Failed to update password. Please try again.' },
        { status: 500 }
      );
    }

    console.log(`[PASSWORD CHANGE] User ${session.user.id} successfully changed password`);

    // Send security notification email
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('full_name, email')
        .eq('id', session.user.id)
        .single();

      if (profile?.email) {
        const ipAddress =
          request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip');

        const emailHtml = await render(
          PasswordChangedEmail({
            userName: profile.full_name || 'User',
            changedAt: new Date().toISOString(),
            ipAddress: ipAddress || undefined,
          })
        );

        await sendAndLogEmail({
          to: profile.email,
          subject: 'Your Password Has Been Changed',
          html: emailHtml,
          userId: session.user.id,
          emailType: 'password_changed',
        });
      }
    } catch (emailError) {
      console.error('[PASSWORD CHANGE EMAIL ERROR]', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Password successfully updated.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[PASSWORD CHANGE] Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
