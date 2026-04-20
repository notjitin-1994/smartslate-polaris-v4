import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logUserUpdated } from '@/lib/utils/activityLogger';
import { meetsMinimumStrength } from '@/lib/utils/passwordStrength';

/**
 * POST /api/auth/update-password
 * Updates the authenticated user's password
 *
 * Body:
 * {
 *   currentPassword: string,
 *   newPassword: string
 * }
 *
 * Security:
 * - Requires authentication
 * - Verifies current password via Supabase Auth
 * - Enforces minimum password strength (score >= 2)
 * - Logs password change activity
 *
 * Response:
 * - 200: Password updated successfully
 * - 400: Validation error (weak password, same as current)
 * - 401: Unauthorized or incorrect current password
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
    const { currentPassword, newPassword } = body;

    // Validate required fields
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Current password and new password are required' },
        { status: 400 }
      );
    }

    // Validate new password length
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'New password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    if (newPassword.length > 128) {
      return NextResponse.json(
        { error: 'New password must not exceed 128 characters' },
        { status: 400 }
      );
    }

    // Check password strength
    if (!meetsMinimumStrength(newPassword, 2)) {
      return NextResponse.json(
        {
          error: 'Password is too weak',
          details: 'Please choose a stronger password. Use a mix of letters, numbers, and symbols.',
        },
        { status: 400 }
      );
    }

    // Verify current password matches new password (should not be same)
    if (currentPassword === newPassword) {
      return NextResponse.json(
        { error: 'New password must be different from current password' },
        { status: 400 }
      );
    }

    // Verify current password by attempting to sign in
    // This is the most secure way to validate the current password
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: currentPassword,
    });

    if (signInError) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });
    }

    // Update password using Supabase Auth
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      console.error('Password update error:', updateError);
      return NextResponse.json(
        {
          error: 'Failed to update password',
          details: updateError.message,
        },
        { status: 500 }
      );
    }

    // Log the password change activity
    await logUserUpdated(request, user.id, {
      password_changed: true,
      changed_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error) {
    console.error('Update password API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
