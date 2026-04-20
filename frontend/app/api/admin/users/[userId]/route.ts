import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/adminAuth';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { logUserUpdated, logUserDeleted } from '@/lib/utils/activityLogger';
import { getTierLimits } from '@/lib/config/tierLimits';

/**
 * Admin API: Get user details
 * GET /api/admin/users/[userId]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // Verify admin access
    await requireAdmin();

    const { userId } = await params;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User not found', details: profileError?.message },
        { status: 404 }
      );
    }

    // Get user's blueprint count
    const { count: blueprintCount } = await supabase
      .from('blueprint_generator')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Get auth user info
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.admin.getUserById(userId);

    return NextResponse.json({
      profile,
      stats: {
        blueprintCount: blueprintCount || 0,
      },
      auth: authUser
        ? {
            email: authUser.email,
            email_confirmed_at: authUser.email_confirmed_at,
            last_sign_in_at: authUser.last_sign_in_at,
            created_at: authUser.created_at,
          }
        : null,
    });
  } catch (error) {
    console.error('Get user details error:', error);
    return NextResponse.json(
      { error: 'Unauthorized or internal error' },
      { status: error instanceof Error && error.message.includes('Unauthorized') ? 403 : 500 }
    );
  }
}

/**
 * Admin API: Update user
 * PATCH /api/admin/users/[userId]
 *
 * Body:
 * - user_role: New role
 * - subscription_tier: New tier
 * - full_name: New name
 * - blueprint_creation_limit: New limit
 * - blueprint_saving_limit: New limit
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // Verify admin access
    await requireAdmin();

    const { userId } = await params;
    const body = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();

    // Get current user data to track changes
    const { data: currentUser } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Validate which fields can be updated
    const allowedFields = [
      'user_role',
      'subscription_tier',
      'full_name',
      'blueprint_creation_limit',
      'blueprint_saving_limit',
      'avatar_url',
    ];

    const updates: Record<string, any> = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    // Automatically update limits when tier changes (unless explicitly provided)
    if (updates.subscription_tier && updates.subscription_tier !== currentUser?.subscription_tier) {
      try {
        const tierLimits = await getTierLimits(supabase, updates.subscription_tier);

        // Only set limits if they weren't explicitly provided in the request
        if (body.blueprint_creation_limit === undefined) {
          updates.blueprint_creation_limit = tierLimits.creationLimit;
        }
        if (body.blueprint_saving_limit === undefined) {
          updates.blueprint_saving_limit = tierLimits.savingLimit;
        }
      } catch (error) {
        console.error('Failed to fetch tier limits:', error);
        return NextResponse.json({ error: 'Failed to fetch limits for new tier' }, { status: 500 });
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    // Add updated timestamp
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Update user error:', error);
      return NextResponse.json(
        { error: 'Failed to update user', details: error.message },
        { status: 500 }
      );
    }

    // Log activity with tracked changes
    if (currentUser) {
      const changes: Record<string, { before: unknown; after: unknown }> = {};
      for (const field of allowedFields) {
        if (updates[field] !== undefined && currentUser[field] !== updates[field]) {
          changes[field] = {
            before: currentUser[field],
            after: updates[field],
          };
        }
      }
      await logUserUpdated(request, userId, changes);
    }

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      user: data,
    });
  } catch (error) {
    console.error('Update user API error:', error);
    return NextResponse.json(
      { error: 'Unauthorized or internal error' },
      { status: error instanceof Error && error.message.includes('Unauthorized') ? 403 : 500 }
    );
  }
}

/**
 * Admin API: Delete user
 * DELETE /api/admin/users/[userId]
 *
 * Query Parameters:
 * - hard: 'true' for hard delete, otherwise soft delete (default: soft)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // Verify admin access
    await requireAdmin();

    const { userId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const hardDelete = searchParams.get('hard') === 'true';

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();

    if (hardDelete) {
      // Hard delete: Remove from auth and database
      // WARNING: This is irreversible and will cascade delete blueprints

      // Delete from auth
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);

      if (authError) {
        console.error('Auth delete error:', authError);
        return NextResponse.json(
          { error: 'Failed to delete user from auth', details: authError.message },
          { status: 500 }
        );
      }

      // Profile will cascade delete via RLS/triggers

      // Log activity
      await logUserDeleted(request, userId, { deleteType: 'hard' });

      return NextResponse.json({
        success: true,
        message: 'User permanently deleted',
        type: 'hard_delete',
      });
    } else {
      // Soft delete: Mark as deleted
      const { error } = await supabase
        .from('user_profiles')
        .update({
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (error) {
        console.error('Soft delete error:', error);
        return NextResponse.json(
          { error: 'Failed to delete user', details: error.message },
          { status: 500 }
        );
      }

      // Log activity
      await logUserDeleted(request, userId, { deleteType: 'soft' });

      return NextResponse.json({
        success: true,
        message: 'User soft deleted successfully',
        type: 'soft_delete',
      });
    }
  } catch (error) {
    console.error('Delete user API error:', error);
    return NextResponse.json(
      { error: 'Unauthorized or internal error' },
      { status: error instanceof Error && error.message.includes('Unauthorized') ? 403 : 500 }
    );
  }
}
