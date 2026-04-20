/**
 * Blueprint Management API Endpoint
 * Handles individual blueprint operations (delete, restore, etc.)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/supabase/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { createServiceLogger } from '@/lib/logging';

const logger = createServiceLogger('api');

export const dynamic = 'force-dynamic';

/**
 * DELETE /api/blueprints/[id]
 * Soft delete a blueprint
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    // Await params (Next.js 15 requirement)
    const { id: blueprintId } = await params;

    console.log('[DELETE /api/blueprints/[id]] Request received for blueprint:', blueprintId);

    // Authenticate user
    const { session } = await getServerSession();
    if (!session?.user?.id) {
      console.error('[DELETE /api/blueprints/[id]] Unauthorized - no session');
      logger.warn('blueprints.delete.unauthorized', 'Unauthorized delete attempt', {
        timestamp: new Date().toISOString(),
      });

      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    console.log('[DELETE /api/blueprints/[id]] User authenticated:', userId);

    logger.info('blueprints.delete.request', 'Delete request received', {
      userId,
      blueprintId,
    });

    const supabase = await getSupabaseServerClient();

    console.log('[DELETE /api/blueprints/[id]] Calling soft_delete_blueprint RPC with:', {
      p_blueprint_id: blueprintId,
      p_user_id: userId,
    });

    // Soft delete the blueprint using RPC function
    const { data, error } = await supabase.rpc('soft_delete_blueprint', {
      p_blueprint_id: blueprintId,
      p_user_id: userId,
    });

    console.log('[DELETE /api/blueprints/[id]] RPC response:', { data, error });

    if (error) {
      console.error('[DELETE /api/blueprints/[id]] RPC error:', error);
      logger.error('blueprints.delete.rpc_error', 'RPC function error', {
        userId,
        blueprintId,
        error: error.message,
        errorCode: error.code,
        errorDetails: error.details,
      });

      return NextResponse.json(
        {
          success: false,
          error: `Database error: ${error.message}`,
          code: error.code,
        },
        { status: 500 }
      );
    }

    // RPC returns boolean - true if deleted, false if not found or already deleted
    if (!data) {
      logger.warn('blueprints.delete.not_found', 'Blueprint not found or already deleted', {
        userId,
        blueprintId,
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Blueprint not found or already deleted',
        },
        { status: 404 }
      );
    }

    logger.info('blueprints.delete.success', 'Blueprint soft-deleted successfully', {
      userId,
      blueprintId,
    });

    return NextResponse.json({
      success: true,
      message: 'Blueprint deleted successfully',
    });
  } catch (error) {
    logger.error('blueprints.delete.unexpected_error', 'Unexpected error during deletion', {
      error: (error as Error).message,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred while deleting the blueprint',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/blueprints/[id]?action=restore
 * Restore a soft-deleted blueprint
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    // Await params (Next.js 15 requirement)
    const { id: blueprintId } = await params;

    // Check for restore action
    const searchParams = req.nextUrl.searchParams;
    const action = searchParams.get('action');

    if (action !== 'restore') {
      return NextResponse.json(
        { error: 'Invalid action. Use ?action=restore to restore a blueprint' },
        { status: 400 }
      );
    }

    // Authenticate user
    const { session } = await getServerSession();
    if (!session?.user?.id) {
      logger.warn('blueprints.restore.unauthorized', 'Unauthorized restore attempt', {
        timestamp: new Date().toISOString(),
      });

      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    logger.info('blueprints.restore.request', 'Restore request received', {
      userId,
      blueprintId,
    });

    const supabase = await getSupabaseServerClient();

    // Restore the blueprint using RPC function
    const { data, error } = await supabase.rpc('restore_blueprint', {
      p_blueprint_id: blueprintId,
      p_user_id: userId,
    });

    if (error) {
      logger.error('blueprints.restore.rpc_error', 'RPC function error', {
        userId,
        blueprintId,
        error: error.message,
      });
      throw error;
    }

    // RPC returns boolean - true if restored, false if not found or not deleted
    if (!data) {
      logger.warn('blueprints.restore.not_found', 'Blueprint not found or not deleted', {
        userId,
        blueprintId,
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Blueprint not found or not deleted',
        },
        { status: 404 }
      );
    }

    logger.info('blueprints.restore.success', 'Blueprint restored successfully', {
      userId,
      blueprintId,
    });

    return NextResponse.json({
      success: true,
      message: 'Blueprint restored successfully',
    });
  } catch (error) {
    logger.error('blueprints.restore.unexpected_error', 'Unexpected error during restoration', {
      error: (error as Error).message,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred while restoring the blueprint',
      },
      { status: 500 }
    );
  }
}
