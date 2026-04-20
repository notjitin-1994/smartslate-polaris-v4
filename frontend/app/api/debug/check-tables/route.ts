import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

/**
 * DEBUG ENDPOINT: Check what tables exist in the database
 * Access this at: http://localhost:3000/api/debug/check-tables
 *
 * This bypasses any browser caching and queries the database directly
 */
export async function GET() {
  try {
    const supabase = await getSupabaseServerClient();

    // Try to query each table to see if it exists
    const tableChecks: Record<string, boolean> = {
      // Core tables (should exist)
      blueprint_generator: false,
      user_profiles: false,
      role_audit_log: false,

      // Removed tables (should NOT exist)
      feedback_submissions: false,
      feedback_types: false,
      feedback_responses: false,
      user_satisfaction_surveys: false,
      user_usage_history: false,
      migration_log: false,
    };

    // Check each table
    for (const tableName of Object.keys(tableChecks)) {
      try {
        const { error } = await supabase.from(tableName).select('*').limit(1);

        if (!error || error.code === 'PGRST116') {
          // Table exists (PGRST116 = no rows, but table exists)
          tableChecks[tableName] = true;
        } else if (error.code === '42P01') {
          // Table doesn't exist
          tableChecks[tableName] = false;
        } else {
          // Other error
          console.error(`Error checking ${tableName}:`, error);
        }
      } catch (err) {
        console.error(`Exception checking ${tableName}:`, err);
      }
    }

    // Separate into existing and non-existing
    const existingTables = Object.entries(tableChecks)
      .filter(([_, exists]) => exists)
      .map(([name, _]) => name);

    const nonExistingTables = Object.entries(tableChecks)
      .filter(([_, exists]) => !exists)
      .map(([name, _]) => name);

    // Determine if cleanup was successful
    const cleanupSuccessful =
      existingTables.length === 3 &&
      existingTables.includes('blueprint_generator') &&
      existingTables.includes('user_profiles') &&
      existingTables.includes('role_audit_log');

    return NextResponse.json({
      success: true,
      cleanupSuccessful,
      summary: {
        totalExisting: existingTables.length,
        totalNonExisting: nonExistingTables.length,
      },
      tables: {
        existing: existingTables,
        nonExisting: nonExistingTables,
      },
      message: cleanupSuccessful
        ? '✅ Database cleanup successful! Only 3 core tables remain.'
        : '⚠️ Database cleanup incomplete. Some tables still exist.',
    });
  } catch (error) {
    console.error('Error checking tables:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
