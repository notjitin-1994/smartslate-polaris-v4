import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/adminAuth';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';

/**
 * Admin API: Get a specific blueprint for a user
 * GET /api/admin/users/[userId]/blueprints/[blueprintId]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string; blueprintId: string }> }
) {
  try {
    // Verify admin access
    await requireAdmin();

    const { userId, blueprintId } = await params;

    if (!userId || !blueprintId) {
      return NextResponse.json({ error: 'User ID and Blueprint ID are required' }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();

    // Get user basic info
    const { data: user, error: userError } = await supabase
      .from('user_profiles')
      .select('user_id, full_name')
      .eq('user_id', userId)
      .single();

    // Get auth user for email
    const { data: authUser } = await supabase.auth.admin.getUserById(userId);

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get the specific blueprint
    const { data: blueprint, error: blueprintError } = await supabase
      .from('blueprint_generator')
      .select('*')
      .eq('id', blueprintId)
      .eq('user_id', userId)
      .single();

    if (blueprintError || !blueprint) {
      console.error('Failed to fetch blueprint:', blueprintError);
      return NextResponse.json(
        {
          error: 'Blueprint not found',
          details: blueprintError?.message || 'Blueprint does not exist or does not belong to user',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user: {
        user_id: user.user_id,
        email: authUser?.user?.email || 'unknown',
        full_name: user.full_name,
      },
      blueprint: blueprint,
    });
  } catch (error) {
    console.error('Get blueprint API error:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Unauthorized', details: 'You do not have permission to view this blueprint' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
