import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/adminAuth';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { logUserCreated } from '@/lib/utils/activityLogger';

/**
 * Admin API: Create new user
 * POST /api/admin/users/create
 *
 * Body:
 * - email: User's email address (required)
 * - password: User's password (required)
 * - full_name: User's full name (required)
 * - user_role: Role to assign (default: 'user')
 * - subscription_tier: Tier to assign (default: 'explorer')
 * - send_email: Whether to send welcome email (default: false)
 * - email_confirm: Whether to auto-confirm email (default: false)
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    await requireAdmin();

    const body = await request.json();
    const {
      email,
      password,
      full_name,
      user_role = 'user',
      subscription_tier = 'explorer',
      send_email = false,
      email_confirm = false,
    } = body;

    // Validate required fields
    if (!email || !password || !full_name) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          details: 'Email, password, and full name are required',
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          error: 'Invalid email format',
          details: 'Please provide a valid email address',
        },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        {
          error: 'Password too weak',
          details: 'Password must be at least 8 characters long',
        },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ['user', 'developer', 'admin'];
    if (!validRoles.includes(user_role)) {
      return NextResponse.json(
        {
          error: 'Invalid role',
          details: `Role must be one of: ${validRoles.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Validate tier
    const validTiers = [
      'explorer',
      'navigator',
      'voyager',
      'crew',
      'fleet',
      'armada',
      'enterprise',
    ];
    if (!validTiers.includes(subscription_tier)) {
      return NextResponse.json(
        {
          error: 'Invalid subscription tier',
          details: `Tier must be one of: ${validTiers.join(', ')}`,
        },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdminClient();

    // Check if user already exists
    const { data: existingUser } = await supabase.auth.admin.listUsers();
    const userExists = existingUser?.users.some((u) => u.email === email);

    if (userExists) {
      return NextResponse.json(
        {
          error: 'User already exists',
          details: `A user with email ${email} already exists`,
        },
        { status: 409 }
      );
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm, // Auto-confirm email if requested
      user_metadata: {
        full_name,
      },
    });

    if (authError || !authData.user) {
      console.error('Auth user creation error:', authError);
      return NextResponse.json(
        {
          error: 'Failed to create auth user',
          details: authError?.message || 'Unknown error occurred',
        },
        { status: 500 }
      );
    }

    const userId = authData.user.id;

    // Set tier-based limits
    const tierLimits: Record<string, { creation: number; saving: number }> = {
      explorer: { creation: 2, saving: 2 },
      navigator: { creation: 10, saving: 10 },
      voyager: { creation: 25, saving: 25 },
      crew: { creation: 50, saving: 50 },
      fleet: { creation: 100, saving: 100 },
      armada: { creation: 200, saving: 200 },
      enterprise: { creation: 999999, saving: 999999 },
    };

    const limits = tierLimits[subscription_tier] || tierLimits.explorer;

    // Create user profile
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        user_id: userId,
        full_name,
        user_role,
        subscription_tier,
        blueprint_creation_limit: limits.creation,
        blueprint_saving_limit: limits.saving,
        blueprint_creation_count: 0,
        blueprint_saving_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (profileError) {
      console.error('Profile creation error:', profileError);

      // Rollback: Delete the auth user we just created
      await supabase.auth.admin.deleteUser(userId);

      return NextResponse.json(
        {
          error: 'Failed to create user profile',
          details: profileError.message,
        },
        { status: 500 }
      );
    }

    // Send welcome email if requested
    if (send_email && !email_confirm) {
      try {
        // Send password reset email which doubles as welcome + email confirmation
        await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${request.nextUrl.origin}/auth/callback`,
        });
      } catch (emailError) {
        // Don't fail the user creation if email fails, just log it
        console.error('Failed to send welcome email:', emailError);
      }
    }

    // Log activity
    await logUserCreated(request, userId, {
      email,
      role: user_role,
      tier: subscription_tier,
      email_confirmed: email_confirm,
      welcome_email_sent: send_email,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'User created successfully',
        user: {
          id: userId,
          email,
          full_name,
          user_role,
          subscription_tier,
          email_confirmed: email_confirm,
          profile: profileData,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create user API error:', error);

    // Check if it's an authorization error
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          details: 'You do not have permission to create users',
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
