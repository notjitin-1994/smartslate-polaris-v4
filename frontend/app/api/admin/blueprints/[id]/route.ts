import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/adminAuth';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { logActivity } from '@/lib/utils/activityLogger';

/**
 * Admin API: Get Blueprint by ID
 * GET /api/admin/starmaps/[id]
 *
 * Allows admins to view any blueprint regardless of ownership
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Verify admin access
    await requireAdmin();

    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Blueprint ID is required' }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();

    // Fetch blueprint data (bypasses RLS as admin)
    const { data: blueprint, error: blueprintError } = await supabase
      .from('blueprint_generator')
      .select('*')
      .eq('id', id)
      .single();

    if (blueprintError) {
      console.error('Blueprint fetch error:', blueprintError);
      return NextResponse.json({ error: 'Blueprint not found' }, { status: 404 });
    }

    if (!blueprint) {
      return NextResponse.json({ error: 'Blueprint not found' }, { status: 404 });
    }

    // Fetch user info
    const { data: authUser } = await supabase.auth.admin.getUserById(blueprint.user_id);
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('full_name')
      .eq('user_id', blueprint.user_id)
      .single();

    return NextResponse.json({
      success: true,
      blueprint: {
        ...blueprint,
        user: {
          user_id: blueprint.user_id,
          email: authUser?.user?.email || 'unknown',
          full_name: userProfile?.full_name || null,
        },
      },
    });
  } catch (error) {
    console.error('Get blueprint API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch blueprint',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: error instanceof Error && error.message.includes('Unauthorized') ? 403 : 500 }
    );
  }
}

/**
 * Admin API: Delete Blueprint by ID
 * DELETE /api/admin/starmaps/[id]
 *
 * Allows admins to delete any blueprint regardless of ownership
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin access
    const adminUser = await requireAdmin();

    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Blueprint ID is required' }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();

    // First, fetch the blueprint to get user info for logging
    const { data: blueprint, error: fetchError } = await supabase
      .from('blueprint_generator')
      .select('id, user_id')
      .eq('id', id)
      .single();

    if (fetchError || !blueprint) {
      console.error('Blueprint fetch error:', fetchError);
      return NextResponse.json({ error: 'Blueprint not found' }, { status: 404 });
    }

    // Delete the blueprint (bypasses RLS as admin)
    const { error: deleteError } = await supabase.from('blueprint_generator').delete().eq('id', id);

    if (deleteError) {
      console.error('Blueprint delete error:', deleteError);
      return NextResponse.json({ error: 'Failed to delete blueprint' }, { status: 500 });
    }

    // Log the deletion activity
    try {
      await logActivity({
        userId: blueprint.user_id,
        actorId: adminUser.id,
        actionType: 'blueprint_deleted',
        resourceType: 'blueprint',
        resourceId: blueprint.id,
        metadata: {
          deleted_by_admin: true,
          admin_user_id: adminUser.id,
          admin_email: adminUser.email,
        },
      });
    } catch (logError) {
      console.error('Failed to log blueprint deletion:', logError);
      // Don't fail the request if logging fails
    }

    return NextResponse.json({
      success: true,
      message: 'Blueprint deleted successfully',
    });
  } catch (error) {
    console.error('Delete blueprint API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete blueprint',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: error instanceof Error && error.message.includes('Unauthorized') ? 403 : 500 }
    );
  }
}
