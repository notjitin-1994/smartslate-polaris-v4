import { NextResponse } from 'next/server';
import { createClient, getSupabaseAdminClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schema
const signupSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().trim().min(1, 'First name is required'),
  lastName: z.string().trim().min(1, 'Last name is required'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate input
    const validationResult = signupSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: validationResult.error.errors[0].message,
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      );
    }

    const { email, password, firstName, lastName } = validationResult.data;
    // Note: email is already normalized (trimmed and lowercased) by Zod schema

    // Use admin client to check if user exists
    const adminClient = getSupabaseAdminClient();

    // Check if user already exists using listUsers API
    const { data: listResult, error: lookupError } = await adminClient.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    if (lookupError) {
      console.error('Error checking existing user:', lookupError);
      return NextResponse.json(
        {
          error: 'Failed to verify email availability',
          code: 'LOOKUP_ERROR',
        },
        { status: 500 }
      );
    }

    // Search for matching email (case-insensitive)
    const existingUser = listResult?.users?.find(
      (user) => user.email?.toLowerCase() === email.toLowerCase()
    );

    if (existingUser) {
      // User already exists
      const user = existingUser;

      // Check if user signed up via OAuth (Google, GitHub, etc.)
      const oauthProvider = user.app_metadata?.provider;
      const hasPasswordIdentity = user.identities?.some(
        (identity) => identity.provider === 'email'
      );

      if (oauthProvider && !hasPasswordIdentity) {
        // User signed up with OAuth provider
        return NextResponse.json(
          {
            error: 'An account with this email already exists',
            code: 'USER_EXISTS',
            reason: 'oauth',
            provider: oauthProvider,
            message: `An account with this email already exists. Please sign in using ${
              oauthProvider === 'google' ? 'Google' : oauthProvider
            }.`,
          },
          { status: 409 }
        );
      }

      // Check if user email is confirmed
      const isConfirmed = user.email_confirmed_at || user.confirmed_at;

      if (!isConfirmed) {
        // User exists but hasn't confirmed email
        return NextResponse.json(
          {
            error: 'An account with this email already exists but is not confirmed',
            code: 'USER_EXISTS',
            reason: 'unconfirmed',
            message:
              'An account with this email already exists but hasn\'t been confirmed. Please check your email for the confirmation link or click "Resend confirmation email" below.',
          },
          { status: 409 }
        );
      }

      // User exists and is confirmed
      return NextResponse.json(
        {
          error: 'An account with this email already exists',
          code: 'USER_EXISTS',
          reason: 'password',
          message:
            'An account with this email already exists. Please sign in or use the forgot password link to recover your account.',
        },
        { status: 409 }
      );
    }

    // User doesn't exist, proceed with signup
    const supabase = await createClient();

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${new URL(request.url).origin}/auth/callback`,
        data: {
          first_name: firstName,
          last_name: lastName,
          full_name: `${firstName} ${lastName}`,
        },
      },
    });

    if (signUpError) {
      console.error('Signup error:', signUpError);

      // Handle specific signup errors
      return NextResponse.json(
        {
          error: signUpError.message || 'Sign up failed',
          code: 'SIGNUP_ERROR',
        },
        { status: 400 }
      );
    }

    // Check if user was actually created (edge case: duplicate within race condition)
    if (signUpData.user && signUpData.user.identities && signUpData.user.identities.length === 0) {
      // User already exists (race condition)
      return NextResponse.json(
        {
          error: 'An account with this email already exists',
          code: 'USER_EXISTS',
          reason: 'password',
          message:
            'An account with this email already exists. Please sign in or use the forgot password link.',
        },
        { status: 409 }
      );
    }

    // Create user profile
    if (signUpData.user) {
      const { error: profileError } = await supabase.from('user_profiles').upsert({
        user_id: signUpData.user.id,
        first_name: firstName,
        last_name: lastName,
        full_name: `${firstName} ${lastName}`,
      });

      if (profileError) {
        console.error('Error creating user profile:', profileError);
        // Don't fail the signup if profile creation fails
      }
    }

    // Success response
    return NextResponse.json(
      {
        success: true,
        user: signUpData.user,
        session: signUpData.session,
        message: 'Account created successfully. Please check your email to confirm your account.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup API error:', error);
    return NextResponse.json(
      {
        error: 'An unexpected error occurred. Please try again later.',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}
