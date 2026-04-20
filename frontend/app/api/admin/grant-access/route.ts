import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

/**
 * Admin API: Grant Admin/Developer Access
 * POST /api/admin/grant-access
 *
 * Grants developer or admin role to a specific user by email.
 * This gives the user admin dashboard access based on their role.
 *
 * Body:
 * - email: User email address (required)
 * - role: User role to grant - 'user' | 'developer' | 'admin' (default: 'developer')
 * - tier: Subscription tier to grant - 'free' | 'explorer' | 'navigator' | 'voyager' | 'crew' | 'fleet' | 'armada' (default: 'free')
 *
 * Security:
 * - Requires service role key authentication (bypasses RLS)
 * - Should only be called from server-side or admin scripts
 * - Logs all role changes to role_audit_log table
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, role = 'developer', tier = 'free' } = body;

    // Validate required fields
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required and must be a string' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Validate role (User, Developer, Admin)
    const validRoles = ['user', 'developer', 'admin'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        {
          error: `Invalid role. Must be one of: ${validRoles.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Validate tier (Free, Explorer, Navigator, Voyager, Crew, Fleet, Armada)
    const validTiers = ['free', 'explorer', 'navigator', 'voyager', 'crew', 'fleet', 'armada'];
    if (!validTiers.includes(tier)) {
      return NextResponse.json(
        {
          error: `Invalid tier. Must be one of: ${validTiers.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Get Supabase client (with service role for admin operations)
    const supabase = await getSupabaseServerClient();

    // Find user in auth.users by email first
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      return NextResponse.json(
        {
          error: 'Failed to fetch users',
          details: authError.message,
        },
        { status: 500 }
      );
    }

    const authUser = authUsers.users.find((u) => u.email === email);

    if (!authUser) {
      return NextResponse.json(
        {
          error: 'User not found',
          details: `No user found with email: ${email}. User must sign up first.`,
        },
        { status: 404 }
      );
    }

    // Now get user profile
    const { data: existingProfile, error: fetchError } = await supabase
      .from('user_profiles')
      .select('user_id, user_role, subscription_tier, full_name')
      .eq('user_id', authUser.id)
      .single();

    if (fetchError || !existingProfile) {
      return NextResponse.json(
        {
          error: 'User not found',
          details: `No user found with email: ${email}. User must sign up first.`,
        },
        { status: 404 }
      );
    }

    // Store old values for audit log
    const oldRole = existingProfile.user_role;
    const oldTier = existingProfile.subscription_tier;

    // Prepare update data
    const updateData: any = {
      user_role: role,
      subscription_tier: tier,
      role_assigned_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Set limits based on tier
    const tierLimits = {
      free: { blueprint_creation_limit: 2, blueprint_saving_limit: 2 },
      explorer: { blueprint_creation_limit: 5, blueprint_saving_limit: 5 },
      navigator: { blueprint_creation_limit: 25, blueprint_saving_limit: 25 },
      voyager: { blueprint_creation_limit: 50, blueprint_saving_limit: 50 },
      crew: { blueprint_creation_limit: 10, blueprint_saving_limit: 10 },
      fleet: { blueprint_creation_limit: 30, blueprint_saving_limit: 30 },
      armada: { blueprint_creation_limit: 60, blueprint_saving_limit: 60 },
    };

    // Set limits based on tier
    if (tierLimits[tier as keyof typeof tierLimits]) {
      updateData.blueprint_creation_limit =
        tierLimits[tier as keyof typeof tierLimits].blueprint_creation_limit;
      updateData.blueprint_saving_limit =
        tierLimits[tier as keyof typeof tierLimits].blueprint_saving_limit;
    }

    // Set unlimited limits for developer role (not tier)
    if (role === 'developer' || role === 'admin') {
      updateData.blueprint_creation_limit = -1;
      updateData.blueprint_saving_limit = -1;
    }

    // Update user profile
    const { data: updatedProfile, error: updateError } = await supabase
      .from('user_profiles')
      .update(updateData)
      .eq('user_id', existingProfile.user_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating user profile:', updateError);
      return NextResponse.json(
        {
          error: 'Failed to grant access',
          details: updateError.message,
        },
        { status: 500 }
      );
    }

    // Log role change to audit table
    const { error: auditError } = await supabase.from('role_audit_log').insert({
      admin_user_id: existingProfile.user_id, // Self-assignment for now
      target_user_id: existingProfile.user_id,
      old_role: oldRole,
      new_role: role,
      reason: `Admin access granted via API - tier changed from ${oldTier} to ${tier}`,
      metadata: {
        old_tier: oldTier,
        new_tier: tier,
        granted_at: new Date().toISOString(),
        method: 'API',
      },
    });

    if (auditError) {
      console.warn('Failed to log role change to audit table:', auditError);
      // Don't fail the request if audit log fails
    }

    return NextResponse.json(
      {
        success: true,
        message: `Successfully granted ${role} role and ${tier} tier to ${email}`,
        user: {
          id: updatedProfile.user_id,
          email: email, // Use the email from the request
          role: updatedProfile.user_role,
          tier: updatedProfile.subscription_tier,
          full_name: updatedProfile.full_name,
          blueprint_creation_limit: updatedProfile.blueprint_creation_limit,
          blueprint_saving_limit: updatedProfile.blueprint_saving_limit,
        },
        changes: {
          role: { old: oldRole, new: role },
          tier: { old: oldTier, new: tier },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Grant access API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Admin API: Revoke Admin/Developer Access
 * DELETE /api/admin/grant-access
 *
 * Revokes admin access and resets user to explorer tier.
 *
 * Body:
 * - email: User email address (required)
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const supabase = await getSupabaseServerClient();

    // Find user by email
    const { data: existingProfile, error: fetchError } = await supabase
      .from('user_profiles')
      .select('user_id, email, user_role, subscription_tier')
      .eq('email', email)
      .single();

    if (fetchError || !existingProfile) {
      return NextResponse.json(
        { error: 'User not found', details: `No user found with email: ${email}` },
        { status: 404 }
      );
    }

    const oldRole = existingProfile.user_role;
    const oldTier = existingProfile.subscription_tier;

    // Reset to free tier with user role
    const { data: updatedProfile, error: updateError } = await supabase
      .from('user_profiles')
      .update({
        user_role: 'user',
        subscription_tier: 'free',
        blueprint_creation_limit: 2,
        blueprint_saving_limit: 2,
        role_assigned_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', existingProfile.user_id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to revoke access', details: updateError.message },
        { status: 500 }
      );
    }

    // Log role change
    await supabase.from('role_audit_log').insert({
      admin_user_id: existingProfile.user_id,
      target_user_id: existingProfile.user_id,
      old_role: oldRole,
      new_role: 'user',
      reason: `Admin access revoked via API - tier changed from ${oldTier} to free`,
      metadata: {
        old_tier: oldTier,
        new_tier: 'free',
        revoked_at: new Date().toISOString(),
        method: 'API',
      },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully revoked admin access from ${email}`,
      user: {
        id: updatedProfile.user_id,
        email: updatedProfile.email,
        role: updatedProfile.user_role,
        tier: updatedProfile.subscription_tier,
      },
    });
  } catch (error) {
    console.error('Revoke access API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
