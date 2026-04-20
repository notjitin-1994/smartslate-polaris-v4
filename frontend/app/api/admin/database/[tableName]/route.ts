import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/adminAuth';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';

/**
 * GET /api/admin/database/[tableName]
 * Returns paginated data from a specific table
 *
 * Query params:
 * - page: Page number (default: 1)
 * - limit: Rows per page (default: 50, max: 100)
 * - search: Search term (optional)
 * - sortBy: Column to sort by (optional)
 * - sortOrder: 'asc' or 'desc' (default: 'asc')
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

    // Validate table name (only allow alphanumeric and underscore)
    if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
      return NextResponse.json({ error: 'Invalid table name' }, { status: 400 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || null; // Don't default to 'id' - let Supabase use natural order
    const sortOrder = (searchParams.get('sortOrder') || 'asc') as 'asc' | 'desc';

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Build query
    let query = supabase.from(tableName).select('*', { count: 'exact' });

    // Apply sorting only if explicitly requested
    if (sortBy) {
      try {
        query = query.order(sortBy, { ascending: sortOrder === 'asc' });
      } catch (err) {
        console.warn(`Failed to sort by ${sortBy}, using natural order`);
      }
    }

    // Apply pagination
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error(`Error fetching data from ${tableName}:`, error);
      return NextResponse.json(
        { error: `Failed to fetch data: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Error in GET /api/admin/database/[tableName]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
