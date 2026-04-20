import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/admin/alerts/[id]
 * Fetch a single alert with its complete timeline
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

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
      .select('user_role')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 });
    }

    if (profile.user_role !== 'developer') {
      return NextResponse.json({ error: 'Forbidden - Developer role required' }, { status: 403 });
    }

    // Fetch alert
    const { data: alert, error: alertError } = await supabase
      .from('system_alerts')
      .select(
        `
        *,
        acknowledged_by_profile:user_profiles!acknowledged_by(first_name, last_name),
        resolved_by_profile:user_profiles!resolved_by(first_name, last_name),
        owner_profile:user_profiles!owner_id(first_name, last_name)
      `
      )
      .eq('id', id)
      .single();

    if (alertError) {
      if (alertError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
      }
      console.error('Error fetching alert:', alertError);
      return NextResponse.json({ error: 'Failed to fetch alert' }, { status: 500 });
    }

    // Fetch timeline
    const { data: timeline, error: timelineError } = await supabase
      .from('alert_timeline')
      .select('*')
      .eq('alert_id', id)
      .order('timestamp', { ascending: true });

    if (timelineError) {
      console.error('Error fetching timeline:', timelineError);
    }

    // Format response
    const formattedAlert = {
      id: alert.id,
      name: alert.name,
      description: alert.description,
      severity: alert.severity,
      type: alert.type,
      status: alert.status,
      triggeredAt: alert.triggered_at,
      acknowledgedAt: alert.acknowledged_at,
      resolvedAt: alert.resolved_at,
      owner: alert.owner_profile
        ? `${alert.owner_profile.first_name || ''} ${alert.owner_profile.last_name || ''}`.trim() ||
          'System'
        : 'System',
      affectedResources: alert.affected_resources || [],
      metadata: alert.metadata || {},
      createdAt: alert.created_at,
      updatedAt: alert.updated_at,
      timeline: (timeline || []).map((entry) => ({
        id: entry.id,
        action: entry.action,
        actor: entry.actor_name,
        timestamp: entry.timestamp,
        notes: entry.notes,
      })),
    };

    return NextResponse.json({ alert: formattedAlert });
  } catch (error) {
    console.error('Unexpected error in GET /api/admin/alerts/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/alerts/[id]
 * Update alert status (acknowledge, resolve, mute, unmute)
 *
 * Body:
 * - action: acknowledge|resolve|mute|unmute (required)
 * - notes?: string
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

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
    const { action, notes } = body;

    // Validate action
    if (!action || !['acknowledge', 'resolve', 'mute', 'unmute'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be: acknowledge, resolve, mute, or unmute' },
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
      case 'unmute':
        newStatus = 'active';
        updateData.status = newStatus;
        break;
      default:
        newStatus = 'active';
        updateData.status = newStatus;
    }

    // Update alert
    const { data: alert, error: updateError } = await supabase
      .from('system_alerts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      if (updateError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
      }
      console.error('Error updating alert:', updateError);
      return NextResponse.json({ error: 'Failed to update alert' }, { status: 500 });
    }

    // Create timeline entry
    const actorName =
      `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Admin User';

    const { error: timelineError } = await supabase.from('alert_timeline').insert({
      alert_id: id,
      action:
        action === 'unmute'
          ? 'unmuted'
          : action === 'acknowledge'
            ? 'acknowledged'
            : action === 'resolve'
              ? 'resolved'
              : 'muted',
      actor_id: user.id,
      actor_name: actorName,
      timestamp: new Date().toISOString(),
      notes: notes || null,
    });

    if (timelineError) {
      console.error('Error creating timeline entry:', timelineError);
      // Don't fail the request if timeline fails
    }

    return NextResponse.json({ alert });
  } catch (error) {
    console.error('Unexpected error in PATCH /api/admin/alerts/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/alerts/[id]
 * Delete an alert (hard delete with cascade to timeline)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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
      .select('user_role')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 });
    }

    if (profile.user_role !== 'developer') {
      return NextResponse.json({ error: 'Forbidden - Developer role required' }, { status: 403 });
    }

    // Delete alert (timeline entries will cascade delete due to ON DELETE CASCADE)
    const { error: deleteError } = await supabase.from('system_alerts').delete().eq('id', id);

    if (deleteError) {
      console.error('Error deleting alert:', deleteError);
      return NextResponse.json({ error: 'Failed to delete alert' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error in DELETE /api/admin/alerts/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
