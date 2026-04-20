/**
 * Data Export API Route
 * GDPR Article 20 - Right to Data Portability
 * Handles user data export requests
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schema for export requests
const ExportRequestSchema = z.object({
  export_format: z.enum(['json', 'csv', 'pdf']),
  export_type: z.enum(['full', 'profile', 'blueprints', 'activity', 'preferences']),
});

/**
 * POST /api/account/export
 * Request a data export
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();

    // Validate request
    const validationResult = ExportRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid export request',
          code: 'VALIDATION_ERROR',
          details: validationResult.error.format(),
        },
        { status: 400 }
      );
    }

    const { export_format, export_type } = validationResult.data;

    // Check for recent export requests to prevent abuse
    const { data: recentExports } = await supabase
      .from('data_exports')
      .select('created_at')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
      .order('created_at', { ascending: false })
      .limit(1);

    if (recentExports && recentExports.length > 0) {
      const lastExportTime = new Date(recentExports[0].created_at);
      const hoursSinceLastExport = (Date.now() - lastExportTime.getTime()) / (1000 * 60 * 60);

      if (hoursSinceLastExport < 1) {
        return NextResponse.json(
          {
            error: 'Please wait at least 1 hour between export requests',
            code: 'RATE_LIMITED',
            retryAfter: Math.ceil((1 - hoursSinceLastExport) * 60), // minutes
          },
          { status: 429 }
        );
      }
    }

    // Create export request using helper function
    const { data: exportRequest, error: exportError } = await supabase.rpc('request_data_export', {
      p_user_id: user.id,
      p_export_format: export_format,
      p_export_type: export_type,
    });

    if (exportError) {
      console.error('Failed to create export request:', exportError);
      return NextResponse.json(
        { error: 'Failed to create export request', code: 'CREATE_FAILED' },
        { status: 500 }
      );
    }

    // Trigger background processing (would use queue in production)
    // For now, just mark as processing
    await supabase.rpc('start_export_processing', {
      p_export_id: exportRequest,
    });

    // In a real implementation, trigger a background job here
    // The background job would:
    // 1. Gather the requested data
    // 2. Format it according to export_format
    // 3. Upload to storage
    // 4. Call complete_export with the file URL

    return NextResponse.json({
      success: true,
      exportId: exportRequest,
      message: 'Export request created. You will receive an email when your export is ready.',
      estimatedTimeMinutes: 5,
    });
  } catch (error) {
    console.error('Export POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/account/export
 * List export requests for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get export history
    const { data: exports, error: exportsError } = await supabase
      .from('data_exports')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (exportsError) {
      console.error('Failed to fetch exports:', exportsError);
      return NextResponse.json(
        { error: 'Failed to fetch exports', code: 'FETCH_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      exports: exports || [],
    });
  } catch (error) {
    console.error('Export GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
