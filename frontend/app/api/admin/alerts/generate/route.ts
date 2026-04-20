import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateAllAlerts } from '@/lib/services/alertGenerationService';

/**
 * POST /api/admin/alerts/generate
 * Trigger alert generation based on current system metrics
 *
 * This endpoint scans the platform for anomalies and creates alerts:
 * - High API costs (daily/monthly thresholds)
 * - Database growth alerts
 * - System health issues (high failure rates, user inactivity)
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
      .select('user_role')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 });
    }

    if (profile.user_role !== 'developer') {
      return NextResponse.json({ error: 'Forbidden - Developer role required' }, { status: 403 });
    }

    // Generate alerts
    const result = await generateAllAlerts();

    return NextResponse.json({
      success: true,
      message: `Generated ${result.total} new alert(s)`,
      total: result.total,
      byType: result.byType,
    });
  } catch (error) {
    console.error('Unexpected error in POST /api/admin/alerts/generate:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
