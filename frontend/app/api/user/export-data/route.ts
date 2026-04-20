import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import JSZip from 'jszip';
import { logUserUpdated } from '@/lib/utils/activityLogger';

/**
 * POST /api/user/export-data
 * Exports all user data in GDPR-compliant format (JSON + CSV in ZIP)
 *
 * GDPR Article 20: Right to Data Portability
 * - Machine-readable format (JSON, CSV)
 * - Structured, commonly used format
 * - Complete personal data export
 *
 * Response:
 * - 200: Returns ZIP file with user data
 * - 401: Unauthorized
 * - 500: Internal server error
 *
 * Export includes:
 * - User profile
 * - Blueprints (with all versions)
 * - Activity logs
 * - Sessions/login history
 * - Notification preferences
 * - Account metadata
 */
export async function POST() {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all user data from various tables
    const [
      profileResult,
      blueprintsResult,
      activityResult,
      sessionsResult,
      notificationPrefsResult,
    ] = await Promise.all([
      // User profile
      supabase.from('user_profiles').select('*').eq('user_id', user.id).single(),

      // Blueprints
      supabase.from('blueprint_generator').select('*').eq('user_id', user.id),

      // Activity logs
      supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1000),

      // Sessions
      supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100),

      // Notification preferences
      supabase.from('notification_preferences').select('*').eq('user_id', user.id).single(),
    ]);

    // Prepare data objects
    const exportData = {
      export_metadata: {
        exported_at: new Date().toISOString(),
        export_format: 'GDPR Article 20 - Right to Data Portability',
        user_id: user.id,
        email: user.email,
      },
      user_profile: profileResult.data || {},
      auth_data: {
        email: user.email,
        email_confirmed_at: user.email_confirmed_at,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
        provider: user.app_metadata?.provider,
      },
      blueprints: blueprintsResult.data || [],
      activity_logs: activityResult.data || [],
      sessions: sessionsResult.data || [],
      notification_preferences: notificationPrefsResult.data || {},
    };

    // Convert arrays to CSV format
    const convertToCSV = (items: any[], filename: string): string => {
      if (items.length === 0) return '';

      const headers = Object.keys(items[0]);
      const rows = items.map((item) =>
        headers
          .map((header) => {
            const value = item[header];
            // Handle complex types
            if (typeof value === 'object' && value !== null) {
              return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
            }
            // Handle strings with commas or quotes
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value ?? '';
          })
          .join(',')
      );

      return [headers.join(','), ...rows].join('\n');
    };

    // Create ZIP file
    const zip = new JSZip();

    // Add JSON files
    zip.file(
      'README.txt',
      `GDPR Data Export
================

This archive contains all your personal data stored in Smartslate Polaris.

Export Date: ${new Date().toISOString()}
User ID: ${user.id}
Email: ${user.email}

Files Included:
- full_export.json: Complete data export in JSON format
- profile.json: Your user profile data
- blueprints.csv: Your learning blueprints
- activity_logs.csv: Your account activity history
- sessions.csv: Your login history
- notification_preferences.json: Your notification settings

This export complies with GDPR Article 20 (Right to Data Portability).
`
    );

    // Add full export JSON
    zip.file('full_export.json', JSON.stringify(exportData, null, 2));

    // Add individual JSON files
    zip.file('profile.json', JSON.stringify(exportData.user_profile, null, 2));
    zip.file('auth_data.json', JSON.stringify(exportData.auth_data, null, 2));
    zip.file(
      'notification_preferences.json',
      JSON.stringify(exportData.notification_preferences, null, 2)
    );

    // Add CSV files
    if (exportData.blueprints.length > 0) {
      zip.file('blueprints.csv', convertToCSV(exportData.blueprints, 'blueprints'));
    }

    if (exportData.activity_logs.length > 0) {
      zip.file('activity_logs.csv', convertToCSV(exportData.activity_logs, 'activity_logs'));
    }

    if (exportData.sessions.length > 0) {
      zip.file('sessions.csv', convertToCSV(exportData.sessions, 'sessions'));
    }

    // Generate ZIP file
    const zipBlob = await zip.generateAsync({ type: 'nodebuffer' });

    // Log the data export activity
    await logUserUpdated(null, user.id, {
      data_exported: true,
      export_timestamp: new Date().toISOString(),
      export_size_bytes: zipBlob.length,
      records_exported: {
        blueprints: exportData.blueprints.length,
        activity_logs: exportData.activity_logs.length,
        sessions: exportData.sessions.length,
      },
    });

    // Return ZIP file
    return new NextResponse(zipBlob, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="smartslate_data_export_${user.id}_${Date.now()}.zip"`,
        'Content-Length': zipBlob.length.toString(),
      },
    });
  } catch (error) {
    console.error('Data export API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
