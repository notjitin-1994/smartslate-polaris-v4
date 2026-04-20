/**
 * Admin API Endpoint: Sync Blueprint Counts
 * Syncs blueprint counter columns with actual database state for all users or a specific user
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/supabase/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { createServiceLogger } from '@/lib/logging';

const logger = createServiceLogger('api');

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Authenticate user
    const { session } = await getServerSession();
    if (!session?.user?.id) {
      logger.warn('admin.sync-counts.unauthorized', 'Unauthorized', {
        timestamp: new Date().toISOString(),
      });

      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get Supabase client
    const supabase = await getSupabaseServerClient();

    // Check if user is developer
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('user_role')
      .eq('user_id', userId)
      .single();

    if (!profile || profile.user_role !== 'developer') {
      logger.warn('admin.sync-counts.forbidden', 'User is not a developer', {
        userId,
        userRole: profile?.user_role,
      });

      return NextResponse.json(
        { success: false, error: 'Forbidden - Developer role required' },
        { status: 403 }
      );
    }

    // Parse request body (optional: can specify specific user)
    const body = await req.json().catch(() => ({}));
    const targetUserId = body.userId || null;

    logger.info('admin.sync-counts.request', 'Syncing blueprint counts', {
      adminUserId: userId,
      targetUserId,
    });

    // Call sync function
    const { data, error } = await supabase.rpc('sync_blueprint_counters', {
      p_user_id: targetUserId,
    });

    if (error) {
      logger.error('admin.sync-counts.error', 'Failed to sync counts', {
        error: error.message,
        adminUserId: userId,
        targetUserId,
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to sync blueprint counts',
          details: error.message,
        },
        { status: 500 }
      );
    }

    // Format results
    const results = Array.isArray(data) ? data : [];
    const totalSynced = results.length;
    const mismatched = results.filter((r) => !r.counters_matched);

    logger.info('admin.sync-counts.success', 'Blueprint counts synced successfully', {
      adminUserId: userId,
      targetUserId,
      totalSynced,
      mismatchedCount: mismatched.length,
    });

    return NextResponse.json({
      success: true,
      message: targetUserId
        ? `Synced counts for user ${targetUserId}`
        : `Synced counts for ${totalSynced} users`,
      totalSynced,
      mismatchedCount: mismatched.length,
      mismatchedUsers: mismatched.map((r) => ({
        userId: r.user_id,
        oldCreation: r.old_creation_count,
        newCreation: r.new_creation_count,
        oldSaving: r.old_saving_count,
        newSaving: r.new_saving_count,
      })),
    });
  } catch (error) {
    logger.error('admin.sync-counts.unexpected_error', 'Unexpected error', {
      error: (error as Error).message,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}
