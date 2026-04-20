import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/adminAuth';
import { logActivity } from '@/lib/utils/activityLogger';

/**
 * Test endpoint to create a sample activity log
 * POST /api/admin/users/[userId]/activity/test-log
 */
export async function POST(
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

    // Get the current admin user who's creating the test log
    const adminUser = await requireAdmin();

    // Create a test activity log
    const success = await logActivity({
      userId,
      actorId: adminUser.id,
      actionType: 'user_updated',
      resourceType: 'user',
      resourceId: userId,
      metadata: {
        changes: {
          test: {
            before: 'old_value',
            after: 'new_value',
          },
        },
        note: 'This is a test activity log entry',
      },
    });

    if (!success) {
      return NextResponse.json({ error: 'Failed to create test activity log' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Test activity log created successfully',
    });
  } catch (error) {
    console.error('Test log creation error:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
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
