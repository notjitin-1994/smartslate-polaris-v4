/**
 * Admin API Endpoint: Fix Stuck Blueprint
 * Fixes blueprints that have data but wrong status
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/supabase/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Authenticate user
    const { session } = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();
    const blueprintId = body.blueprintId;

    if (!blueprintId) {
      return NextResponse.json({ error: 'blueprintId is required' }, { status: 400 });
    }

    const supabase = await getSupabaseServerClient();

    console.log('[FIX_STUCK_BLUEPRINT] Fixing blueprint:', blueprintId, 'for user:', userId);

    // Get the blueprint
    const { data: blueprint, error: fetchError } = await supabase
      .from('blueprint_generator')
      .select('id, user_id, status, blueprint_json, blueprint_markdown, title')
      .eq('id', blueprintId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !blueprint) {
      console.error('[FIX_STUCK_BLUEPRINT] Blueprint not found:', fetchError);
      return NextResponse.json({ error: 'Blueprint not found or access denied' }, { status: 404 });
    }

    console.log(
      '[FIX_STUCK_BLUEPRINT] Current status:',
      blueprint.status,
      'Has data:',
      !!blueprint.blueprint_json
    );

    // Check if blueprint has data but wrong status
    if (blueprint.blueprint_json && blueprint.status !== 'completed') {
      console.log('[FIX_STUCK_BLUEPRINT] Fixing status to completed');

      // Update status to completed
      const { error: updateError } = await supabase
        .from('blueprint_generator')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', blueprintId)
        .eq('user_id', userId);

      if (updateError) {
        console.error('[FIX_STUCK_BLUEPRINT] Update error:', updateError);
        return NextResponse.json(
          { error: 'Failed to update blueprint status', details: updateError.message },
          { status: 500 }
        );
      }

      console.log('[FIX_STUCK_BLUEPRINT] Successfully fixed blueprint status');

      return NextResponse.json({
        success: true,
        message: 'Blueprint status fixed to completed',
        blueprint: {
          id: blueprint.id,
          oldStatus: blueprint.status,
          newStatus: 'completed',
          hasData: !!blueprint.blueprint_json,
          title: blueprint.title,
        },
      });
    } else if (!blueprint.blueprint_json && blueprint.status === 'completed') {
      console.log(
        '[FIX_STUCK_BLUEPRINT] Blueprint marked completed but has no data - fixing to draft'
      );

      // Update status back to draft if no data
      const { error: updateError } = await supabase
        .from('blueprint_generator')
        .update({
          status: 'draft',
          updated_at: new Date().toISOString(),
        })
        .eq('id', blueprintId)
        .eq('user_id', userId);

      if (updateError) {
        console.error('[FIX_STUCK_BLUEPRINT] Update error:', updateError);
        return NextResponse.json(
          { error: 'Failed to update blueprint status', details: updateError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Blueprint status fixed to draft (no data)',
        blueprint: {
          id: blueprint.id,
          oldStatus: blueprint.status,
          newStatus: 'draft',
          hasData: false,
        },
      });
    } else {
      console.log('[FIX_STUCK_BLUEPRINT] Blueprint status is correct, no fix needed');

      return NextResponse.json({
        success: true,
        message: 'Blueprint status is already correct',
        blueprint: {
          id: blueprint.id,
          status: blueprint.status,
          hasData: !!blueprint.blueprint_json,
        },
      });
    }
  } catch (error) {
    console.error('[FIX_STUCK_BLUEPRINT] Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'An unexpected error occurred',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
