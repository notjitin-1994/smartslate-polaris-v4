import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/adminAuth';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';

/**
 * Admin API: Get user blueprints
 * GET /api/admin/users/[userId]/blueprints
 *
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Results per page (default: 20, max: 100)
 * - status: Filter by status (draft, generating, completed, error)
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

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const statusFilter = searchParams.get('status');

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

    // Build query for blueprints
    let query = supabase
      .from('blueprint_generator')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Apply status filter if provided
    if (statusFilter && ['draft', 'generating', 'completed', 'error'].includes(statusFilter)) {
      query = query.eq('status', statusFilter);
    }

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data: blueprints, error: blueprintsError, count } = await query;

    if (blueprintsError) {
      console.error('Failed to fetch blueprints:', blueprintsError);
      return NextResponse.json(
        { error: 'Failed to fetch blueprints', details: blueprintsError.message },
        { status: 500 }
      );
    }

    // Get blueprint statistics
    const { data: stats } = await supabase
      .from('blueprint_generator')
      .select('status')
      .eq('user_id', userId);

    const statusCounts = {
      draft: stats?.filter((b) => b.status === 'draft').length || 0,
      generating: stats?.filter((b) => b.status === 'generating').length || 0,
      completed: stats?.filter((b) => b.status === 'completed').length || 0,
      error: stats?.filter((b) => b.status === 'error').length || 0,
    };

    return NextResponse.json({
      user: {
        user_id: user.user_id,
        email: authUser?.user?.email || 'unknown',
        full_name: user.full_name,
      },
      blueprints: blueprints || [],
      stats: statusCounts,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Get user blueprints API error:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Unauthorized', details: 'You do not have permission to view user blueprints' },
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
