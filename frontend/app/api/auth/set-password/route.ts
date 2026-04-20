import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schema for password
const setPasswordSchema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password must be at most 72 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
});

/**
 * Set password for OAuth users who haven't set one yet.
 * This allows OAuth users to also login with email/password.
 */
export async function POST(request: Request) {
  try {
    const supabase = await getSupabaseServerClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = setPasswordSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid password',
          details: validation.error.errors.map((e) => e.message).join(', '),
        },
        { status: 400 }
      );
    }

    const { password } = validation.data;

    // Update user password and set metadata flag
    const { error: updateError } = await supabase.auth.updateUser({
      password,
      data: {
        has_password: true,
        password_set_at: new Date().toISOString(),
      },
    });

    if (updateError) {
      console.error('Error setting password:', updateError);
      return NextResponse.json(
        { error: updateError.message || 'Failed to set password' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Password set successfully',
    });
  } catch (error) {
    console.error('Error in set-password endpoint:', error);
    return NextResponse.json({ error: 'Failed to set password' }, { status: 500 });
  }
}
