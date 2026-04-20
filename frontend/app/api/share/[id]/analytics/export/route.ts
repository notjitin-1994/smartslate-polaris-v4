/**
 * Share Analytics Export API
 * GET /api/share/[id]/analytics/export - Export analytics data in various formats
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { getServerSession } from '@/lib/supabase/server';
import { format } from 'date-fns';
import { Parser } from '@json2csv/plainjs';

/**
 * GET /api/share/[id]/analytics/export
 * Export analytics data in CSV or JSON format
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const exportFormat = searchParams.get('format') || 'csv';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Validate format
    if (!['csv', 'json'].includes(exportFormat)) {
      return NextResponse.json(
        { success: false, error: 'Invalid export format. Use csv or json.' },
        { status: 400 }
      );
    }

    // Authenticate user
    const { session } = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await getSupabaseServerClient();

    // Verify ownership
    const { data: shareLink, error: linkError } = await supabase
      .from('share_links')
      .select('id, user_id, share_token, blueprint_id')
      .eq('id', id)
      .eq('user_id', session.user.id)
      .single();

    if (linkError || !shareLink) {
      return NextResponse.json(
        { success: false, error: 'Share link not found or access denied' },
        { status: 404 }
      );
    }

    // Build analytics query
    let analyticsQuery = supabase
      .from('share_analytics')
      .select('*')
      .eq('share_link_id', id)
      .order('accessed_at', { ascending: false });

    // Apply date filters
    if (startDate) {
      analyticsQuery = analyticsQuery.gte('accessed_at', startDate);
    }
    if (endDate) {
      analyticsQuery = analyticsQuery.lte('accessed_at', endDate);
    }

    const { data: analytics, error: analyticsError } = await analyticsQuery;

    if (analyticsError) {
      console.error('Analytics query error:', analyticsError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch analytics' },
        { status: 500 }
      );
    }

    // Get blueprint info for metadata
    const { data: blueprint } = await supabase
      .from('blueprint_generator')
      .select('title')
      .eq('id', shareLink.blueprint_id)
      .single();

    // Prepare export data
    const exportData = (analytics || []).map((record) => ({
      // Basic Info
      id: record.id,
      accessed_at: record.accessed_at,
      visitor_id: record.visitor_id,
      visitor_email: record.visitor_email || '',
      session_id: record.session_id,
      is_returning_visitor: record.is_returning_visitor,

      // Duration & Engagement
      access_duration_seconds: record.access_duration_seconds,
      total_scroll_depth: record.total_scroll_depth,
      clicks_count: record.clicks_count,
      sections_viewed: record.sections_viewed ? record.sections_viewed.join(', ') : '',

      // Device Info
      device_type: record.device_type,
      browser: record.browser,
      browser_version: record.browser_version,
      os: record.os,
      os_version: record.os_version,

      // Location
      country_code: record.country_code,
      region: record.region,

      // Actions
      downloaded: record.downloaded,
      printed: record.printed,
      shared: record.shared,

      // Referrer
      referrer_source: record.referrer_source,
      referrer_url: record.referrer_url,
    }));

    // Generate filename
    const timestamp = format(new Date(), 'yyyy-MM-dd-HHmmss');
    const filename = `analytics-${shareLink.share_token.substring(0, 8)}-${timestamp}.${exportFormat}`;

    // Export based on format
    if (exportFormat === 'json') {
      // JSON export
      const jsonData = {
        metadata: {
          share_link_id: id,
          blueprint_title: blueprint?.title || 'Unknown',
          export_date: new Date().toISOString(),
          total_records: exportData.length,
          date_range: {
            start: startDate || 'all',
            end: endDate || 'all',
          },
        },
        analytics: exportData,
        summary: {
          total_views: exportData.length,
          unique_visitors: new Set(exportData.map((d) => d.visitor_id)).size,
          average_duration: exportData
            .map((d) => d.access_duration_seconds)
            .filter((d) => d != null)
            .reduce((a, b, i, arr) => a + b / arr.length, 0),
          conversion_rates: {
            download:
              ((exportData.filter((d) => d.downloaded).length / exportData.length) * 100).toFixed(
                2
              ) + '%',
            print:
              ((exportData.filter((d) => d.printed).length / exportData.length) * 100).toFixed(2) +
              '%',
            share:
              ((exportData.filter((d) => d.shared).length / exportData.length) * 100).toFixed(2) +
              '%',
          },
        },
      };

      return new NextResponse(JSON.stringify(jsonData, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    } else {
      // CSV export
      if (exportData.length === 0) {
        // Return empty CSV with headers
        const headers = [
          'ID',
          'Accessed At',
          'Visitor ID',
          'Visitor Email',
          'Session ID',
          'Returning Visitor',
          'Duration (seconds)',
          'Scroll Depth (%)',
          'Clicks',
          'Sections Viewed',
          'Device',
          'Browser',
          'Browser Version',
          'OS',
          'OS Version',
          'Country',
          'Region',
          'Downloaded',
          'Printed',
          'Shared',
          'Referrer Source',
          'Referrer URL',
        ].join(',');

        return new NextResponse(headers, {
          status: 200,
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="${filename}"`,
          },
        });
      }

      const fields = [
        { label: 'ID', value: 'id' },
        { label: 'Accessed At', value: 'accessed_at' },
        { label: 'Visitor ID', value: 'visitor_id' },
        { label: 'Visitor Email', value: 'visitor_email' },
        { label: 'Session ID', value: 'session_id' },
        { label: 'Returning Visitor', value: 'is_returning_visitor' },
        { label: 'Duration (seconds)', value: 'access_duration_seconds' },
        { label: 'Scroll Depth (%)', value: 'total_scroll_depth' },
        { label: 'Clicks', value: 'clicks_count' },
        { label: 'Sections Viewed', value: 'sections_viewed' },
        { label: 'Device', value: 'device_type' },
        { label: 'Browser', value: 'browser' },
        { label: 'Browser Version', value: 'browser_version' },
        { label: 'OS', value: 'os' },
        { label: 'OS Version', value: 'os_version' },
        { label: 'Country', value: 'country_code' },
        { label: 'Region', value: 'region' },
        { label: 'Downloaded', value: 'downloaded' },
        { label: 'Printed', value: 'printed' },
        { label: 'Shared', value: 'shared' },
        { label: 'Referrer Source', value: 'referrer_source' },
        { label: 'Referrer URL', value: 'referrer_url' },
      ];

      const parser = new Parser({ fields });
      const csv = parser.parse(exportData);

      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }
  } catch (error) {
    console.error('Error exporting analytics:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
