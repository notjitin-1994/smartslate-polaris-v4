import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/auth/send-verification-email
 * Sends email verification to the authenticated user
 *
 * Response:
 * - 200: Verification email sent successfully
 * - 400: Email already verified
 * - 401: Unauthorized
 * - 429: Rate limit exceeded (max 1 request per minute)
 * - 500: Internal server error
 */
export async function POST() {
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

    // Check if email is already verified
    if (user.email_confirmed_at) {
      return NextResponse.json({ error: 'Email is already verified' }, { status: 400 });
    }

    // Send verification email using Supabase Auth
    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email: user.email!,
    });

    if (resendError) {
      console.error('Email verification send error:', resendError);

      // Handle rate limit errors
      if (resendError.message.includes('rate limit')) {
        return NextResponse.json(
          {
            error: 'Too many requests',
            details: 'Please wait a minute before requesting another verification email',
          },
          { status: 429 }
        );
      }

      return NextResponse.json(
        {
          error: 'Failed to send verification email',
          details: resendError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Verification email sent successfully',
      email: user.email,
    });
  } catch (error) {
    console.error('Send verification email API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
