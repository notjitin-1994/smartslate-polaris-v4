import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/server';
import { sendTemplateEmail } from '@/lib/email/resend';
import { PasswordResetEmail } from '@/emails/templates/password-reset';
import React from 'react';

/**
 * POST /api/auth/reset-request
 * World-class password reset flow:
 * 1. Zero-knowledge feedback (always success)
 * 2. Branded email delivery via Resend
 * 3. Secure transient session links
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    
    // REDIRECTION FIX: Prioritize NEXT_PUBLIC_APP_URL for the recovery link
    // This ensures that even in local testing, you can point to a public staging/prod URL if configured
    const origin = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;

    // 1. Get user profile (if exists)
    const { data: userData } = await supabase
      .from('user_profiles')
      .select('full_name, user_id')
      .eq('email', email)
      .single();

    // 2. Generate recovery link using Supabase Admin API
    const { data, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: `${origin}/auth/callback?type=recovery`,
      },
    });

    // 3. If user exists and link generated, send branded email
    if (!linkError && data?.properties?.action_link) {
      await sendTemplateEmail(
        email,
        'Reset your Smartslate Polaris password',
        React.createElement(PasswordResetEmail, {
          userName: userData?.full_name || 'there',
          resetLink: data.properties.action_link,
          expiresInHours: 1,
        })
      );
    } else if (linkError) {
      console.error('[Reset Request] Link generation error:', linkError);
      // We don't throw here to maintain zero-knowledge response
    }

    // 4. Always return success
    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, a reset link has been sent.',
    });
  } catch (error) {
    console.error('[Reset Request] Unexpected error:', error);
    // Even on error, we return success to the client but log the failure
    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, a reset link has been sent.',
    });
  }
}
