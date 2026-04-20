import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/adminAuth';
import { getUserActivities, type ActivityActionType } from '@/lib/utils/activityLogger';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';

/**
 * Admin API: Get user activity logs
 * GET /api/admin/users/[userId]/activity
 *
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Results per page (default: 10, max: 100)
 * - actionTypes: Comma-separated list of action types to filter
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    console.log('[Activity API] Starting request');

    // Verify admin access
    await requireAdmin();
    console.log('[Activity API] Admin access verified');

    const { userId } = await params;
    console.log('[Activity API] User ID:', userId);

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 100);
    const actionTypesParam = searchParams.get('actionTypes');

    // Parse action types filter
    let actionTypes: ActivityActionType[] | undefined;
    if (actionTypesParam) {
      actionTypes = actionTypesParam.split(',') as ActivityActionType[];
    }

    const offset = (page - 1) * limit;
    console.log('[Activity API] Pagination:', { page, limit, offset, actionTypes });

    // Get user basic info
    console.log('[Activity API] Fetching user profile');
    const supabase = getSupabaseAdminClient();
    const { data: user, error: userError } = await supabase
      .from('user_profiles')
      .select('user_id, full_name')
      .eq('user_id', userId)
      .single();

    if (userError) {
      console.error('[Activity API] User profile error:', userError);
    }
    console.log('[Activity API] User profile:', user);

    // Get auth user for email
    console.log('[Activity API] Fetching auth user');
    const { data: authUser } = await supabase.auth.admin.getUserById(userId);
    console.log('[Activity API] Auth user:', authUser?.user?.email);

    if (userError || !user) {
      console.error('[Activity API] User not found');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch activities using the utility function
    console.log('[Activity API] Calling getUserActivities');
    const result = await getUserActivities(userId, {
      limit,
      offset,
      actionTypes,
    });

    console.log('[Activity API] getUserActivities result:', {
      hasResult: !!result,
      count: result?.count,
      dataLength: result?.data?.length,
    });

    if (!result) {
      console.error('[Activity API] Failed to fetch user activities - result is null');
      return NextResponse.json({ error: 'Failed to fetch user activities' }, { status: 500 });
    }

    return NextResponse.json({
      user: {
        user_id: user.user_id,
        email: authUser?.user?.email || 'unknown',
        full_name: user.full_name,
      },
      activities: result.data,
      pagination: {
        page,
        limit,
        total: result.count,
        totalPages: Math.ceil(result.count / limit),
      },
    });
  } catch (error) {
    console.error('[Activity API] Caught error:', error);
    console.error('[Activity API] Error type:', typeof error);
    console.error(
      '[Activity API] Error message:',
      error instanceof Error ? error.message : 'Not an Error object'
    );
    console.error(
      '[Activity API] Error stack:',
      error instanceof Error ? error.stack : 'No stack trace'
    );

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Unauthorized', details: 'You do not have permission to view user activities' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        errorType: typeof error,
        errorString: String(error),
      },
      { status: 500 }
    );
  }
}
