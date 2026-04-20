import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/adminAuth';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';

/**
 * Admin API: Update dynamic answers for a blueprint
 * PATCH /api/admin/users/[userId]/blueprints/[blueprintId]/dynamic-answers
 */
export async function PATCH(
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

    const body = await request.json();
    const { dynamicAnswers } = body;

    if (!dynamicAnswers || typeof dynamicAnswers !== 'object') {
      return NextResponse.json({ error: 'Invalid dynamic answers format' }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();

    // Verify the blueprint belongs to the user
    const { data: blueprint, error: fetchError } = await supabase
      .from('blueprint_generator')
      .select('id, user_id')
      .eq('id', blueprintId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !blueprint) {
      console.error('Blueprint not found:', fetchError);
      return NextResponse.json(
        { error: 'Blueprint not found or does not belong to user' },
        { status: 404 }
      );
    }

    // Update the dynamic answers
    const { error: updateError } = await supabase
      .from('blueprint_generator')
      .update({
        dynamic_answers: dynamicAnswers,
        updated_at: new Date().toISOString(),
      })
      .eq('id', blueprintId);

    if (updateError) {
      console.error('Failed to update dynamic answers:', updateError);
      return NextResponse.json(
        {
          error: 'Failed to update dynamic answers',
          details: updateError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Dynamic answers updated successfully',
    });
  } catch (error) {
    console.error('Update dynamic answers API error:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Unauthorized', details: 'You do not have permission to update this blueprint' },
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
