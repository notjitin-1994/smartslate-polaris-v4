import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/admin/alerts
 * Fetch all system alerts with filtering, pagination, and sorting
 *
 * Query Parameters:
 * - severity: critical|high|medium|low
 * - status: active|acknowledged|resolved|muted
 * - type: system|security|performance|cost|database|api
 * - search: string (search in name/description)
 * - page: number (default 1)
 * - limit: number (default 10, max 100)
 * - sortBy: triggered_at|severity|status (default triggered_at)
 * - order: asc|desc (default desc)
 */
export async function GET(request: NextRequest) {
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

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const severity = searchParams.get('severity');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const search = searchParams.get('search');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));
    const sortBy = searchParams.get('sortBy') || 'triggered_at';
    const order = searchParams.get('order') === 'asc' ? 'asc' : 'desc';

    // Build query with filters
    let query = supabase.from('system_alerts').select(
      `
        *,
        acknowledged_by_profile:user_profiles!acknowledged_by(first_name, last_name),
        resolved_by_profile:user_profiles!resolved_by(first_name, last_name),
        owner_profile:user_profiles!owner_id(first_name, last_name)
      `,
      { count: 'exact' }
    );

    // Apply filters
    if (severity && ['critical', 'high', 'medium', 'low'].includes(severity)) {
      query = query.eq('severity', severity);
    }

    if (status && ['active', 'acknowledged', 'resolved', 'muted'].includes(status)) {
      query = query.eq('status', status);
    }

    if (type && ['system', 'security', 'performance', 'cost', 'database', 'api'].includes(type)) {
      query = query.eq('type', type);
    }

    // Apply search filter
    if (search && search.trim()) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Apply sorting
    const ascending = order === 'asc';
    if (sortBy === 'triggered_at') {
      query = query.order('triggered_at', { ascending });
    } else if (sortBy === 'severity') {
      // Custom sort for severity: critical > high > medium > low
      const severityOrder = ['critical', 'high', 'medium', 'low'];
      query = query.order('severity', {
        ascending,
        nullsFirst: false,
      });
    } else if (sortBy === 'status') {
      query = query.order('status', { ascending });
    } else {
      query = query.order('triggered_at', { ascending: false });
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    // Execute query
    const { data: alerts, error: alertsError, count } = await query;

    if (alertsError) {
      console.error('Error fetching alerts:', alertsError);
      return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 });
    }

    // Calculate stats
    const { data: statsData, error: statsError } = await supabase
      .from('system_alerts')
      .select('severity, status');

    const stats = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      active: 0,
      acknowledged: 0,
      resolved: 0,
      muted: 0,
    };

    if (!statsError && statsData) {
      statsData.forEach((alert) => {
        // Count by severity
        if (alert.severity === 'critical') stats.critical++;
        else if (alert.severity === 'high') stats.high++;
        else if (alert.severity === 'medium') stats.medium++;
        else if (alert.severity === 'low') stats.low++;

        // Count by status
        if (alert.status === 'active') stats.active++;
        else if (alert.status === 'acknowledged') stats.acknowledged++;
        else if (alert.status === 'resolved') stats.resolved++;
        else if (alert.status === 'muted') stats.muted++;
      });
    }

    // Format alerts for response
    const formattedAlerts = (alerts || []).map((alert) => ({
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
    }));

    return NextResponse.json({
      alerts: formattedAlerts,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
      stats,
    });
  } catch (error) {
    console.error('Unexpected error in GET /api/admin/alerts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/admin/alerts
 * Create a new system alert
 *
 * Body:
 * - name: string (required)
 * - description: string (required)
 * - severity: critical|high|medium|low (required)
 * - type: system|security|performance|cost|database|api (required)
 * - affectedResources?: string[]
 * - metadata?: object
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
    const { name, description, severity, type, affectedResources, metadata } = body;

    // Validate required fields
    if (!name || !description || !severity || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: name, description, severity, type' },
        { status: 400 }
      );
    }

    // Validate enums
    if (!['critical', 'high', 'medium', 'low'].includes(severity)) {
      return NextResponse.json(
        { error: 'Invalid severity. Must be: critical, high, medium, or low' },
        { status: 400 }
      );
    }

    if (!['system', 'security', 'performance', 'cost', 'database', 'api'].includes(type)) {
      return NextResponse.json(
        {
          error: 'Invalid type. Must be: system, security, performance, cost, database, or api',
        },
        { status: 400 }
      );
    }

    // Create alert
    const { data: alert, error: insertError } = await supabase
      .from('system_alerts')
      .insert({
        name,
        description,
        severity,
        type,
        status: 'active',
        owner_id: user.id,
        affected_resources: affectedResources || [],
        metadata: metadata || {},
        triggered_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating alert:', insertError);
      return NextResponse.json({ error: 'Failed to create alert' }, { status: 500 });
    }

    // Create timeline entry
    const actorName =
      `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Admin User';

    await supabase.from('alert_timeline').insert({
      alert_id: alert.id,
      action: 'created',
      actor_id: user.id,
      actor_name: actorName,
      timestamp: new Date().toISOString(),
      notes: 'Alert created manually',
    });

    return NextResponse.json({ alert }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error in POST /api/admin/alerts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
