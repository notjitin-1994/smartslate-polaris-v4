import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/adminAuth';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';

/**
 * GET /api/admin/database/[tableName]/schema
 * Returns schema information for a specific table
 *
 * Security: Developer/Admin role required
 * Uses admin client to bypass RLS and access all data
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tableName: string }> }
) {
  try {
    // Verify admin access
    await requireAdmin();

    const { tableName } = await params;

    // Use admin client to bypass RLS
    const supabase = getSupabaseAdminClient();

    // Validate table name
    if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
      return NextResponse.json({ error: 'Invalid table name' }, { status: 400 });
    }

    // Get basic schema info by querying the table itself
    // This is a simplified approach without needing stored procedures
    const { data: sampleRow, error: sampleError } = await supabase
      .from(tableName)
      .select('*')
      .limit(1)
      .single();

    let columns: any[] = [];

    if (sampleRow) {
      // Infer columns from the sample row
      columns = Object.keys(sampleRow).map((columnName) => ({
        column_name: columnName,
        data_type: typeof sampleRow[columnName],
        is_nullable: 'unknown',
        column_default: null,
      }));
    } else if (sampleError && !sampleError.message.includes('0 rows')) {
      console.error(`Error fetching schema for ${tableName}:`, sampleError);
      return NextResponse.json(
        { error: `Failed to fetch schema: ${sampleError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      tableName,
      columns,
      primaryKeys: [], // Would need stored procedure
      foreignKeys: [], // Would need stored procedure
      indexes: [], // Would need stored procedure
    });
  } catch (error) {
    console.error('Error in GET /api/admin/database/[tableName]/schema:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
