import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/adminAuth';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';

/**
 * GET /api/admin/database
 * Returns list of all database tables with metadata
 *
 * Security: Developer/Admin role required
 * Uses admin client to bypass RLS and access all data
 */
export async function GET() {
  try {
    // Verify admin access
    await requireAdmin();

    // Use admin client to bypass RLS
    const supabase = getSupabaseAdminClient();

    // List of known public tables (simpler approach without information_schema access)
    const knownTables = [
      'user_profiles',
      'blueprint_generator',
      'api_usage_logs',
      'user_cost_summaries',
      'api_model_pricing',
      'activity_logs',
      'user_sessions',
      'feedback',
      'role_audit_log',
      'razorpay_subscriptions',
      'razorpay_payments',
      'razorpay_webhook_events',
      'tier_config',
      'security_audit_log',
      'notification_preferences',
      'account_deletion_requests',
      'data_exports',
      'email_notifications_log',
    ];

    // Get row counts for each table
    const tables = await Promise.all(
      knownTables.map(async (tableName) => {
        try {
          const { count, error: countError } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true });

          if (countError) {
            // Table might not exist, skip it
            return null;
          }

          return {
            tableName,
            schema: 'public',
            rowCount: count || 0,
            estimatedSize: null,
          };
        } catch (error) {
          // Table doesn't exist or access denied, skip it
          return null;
        }
      })
    );

    // Filter out null values (tables that don't exist)
    const validTables = tables.filter((t) => t !== null);

    // Calculate total rows
    const totalRows = validTables.reduce((sum, t) => sum + (t?.rowCount || 0), 0);

    // Determine database health based on successful connections
    const databaseHealth = validTables.length > 0 ? 'healthy' : 'degraded';

    return NextResponse.json({
      tables: validTables,
      totalTables: validTables.length,
      totalRows,
      databaseHealth,
    });
  } catch (error) {
    console.error('Error in GET /api/admin/database:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
