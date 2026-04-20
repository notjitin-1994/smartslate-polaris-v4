import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/admin/alerts/bulk-action
 * Perform bulk actions on multiple alerts
 *
 * Body:
 * - alertIds: string[] (required)
 * - action: acknowledge|resolve|mute (required)
 * - notes?: string
 */
export async function POST(request: NextRequest) {
  try {
    // Create Supabase client
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is developer
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('user_role, first_name, last_name')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 });
    }

    if (profile.user_role !== 'developer') {
      return NextResponse.json({ error: 'Forbidden - Developer role required' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { alertIds, action, notes } = body;

    // Validate input
    if (!alertIds || !Array.isArray(alertIds) || alertIds.length === 0) {
      return NextResponse.json({ error: 'alertIds must be a non-empty array' }, { status: 400 });
    }

    if (!action || !['acknowledge', 'resolve', 'mute'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be: acknowledge, resolve, or mute' },
        { status: 400 }
      );
    }

    // Determine new status and update fields
    let newStatus: string;
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    switch (action) {
      case 'acknowledge':
        newStatus = 'acknowledged';
        updateData.status = newStatus;
        updateData.acknowledged_at = new Date().toISOString();
        updateData.acknowledged_by = user.id;
        break;
      case 'resolve':
        newStatus = 'resolved';
        updateData.status = newStatus;
        updateData.resolved_at = new Date().toISOString();
        updateData.resolved_by = user.id;
        break;
      case 'mute':
        newStatus = 'muted';
        updateData.status = newStatus;
        break;
      default:
        newStatus = 'active';
        updateData.status = newStatus;
    }

    // Process each alert
    const results = {
      success: 0,
      failed: 0,
      errors: [] as Array<{ alertId: string; error: string }>,
    };

    const actorName =
      `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Admin User';

    for (const alertId of alertIds) {
      try {
        // Update alert
        const { error: updateError } = await supabase
          .from('system_alerts')
          .update(updateData)
          .eq('id', alertId);

        if (updateError) {
          throw updateError;
        }

        // Create timeline entry
        const { error: timelineError } = await supabase.from('alert_timeline').insert({
          alert_id: alertId,
          action:
            action === 'acknowledge' ? 'acknowledged' : action === 'resolve' ? 'resolved' : 'muted',
          actor_id: user.id,
          actor_name: actorName,
          timestamp: new Date().toISOString(),
          notes: notes || `Bulk ${action} action`,
        });

        if (timelineError) {
          console.error('Timeline error for alert:', alertId, timelineError);
          // Don't fail on timeline error
        }

        results.success++;
      } catch (error: any) {
        console.error('Error updating alert:', alertId, error);
        results.failed++;
        results.errors.push({
          alertId,
          error: error.message || 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      success: results.success,
      failed: results.failed,
      total: alertIds.length,
      errors: results.errors.length > 0 ? results.errors : undefined,
    });
  } catch (error) {
    console.error('Unexpected error in POST /api/admin/alerts/bulk-action:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
