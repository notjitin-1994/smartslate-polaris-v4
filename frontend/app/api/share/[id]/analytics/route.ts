/**
 * Share Analytics API
 * GET /api/share/[id]/analytics - Get comprehensive analytics for a share link
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { getServerSession } from '@/lib/supabase/server';
import type { ShareAnalyticsResponse, ShareAnalyticsSummary } from '@/types/share';

/**
 * GET /api/share/[id]/analytics
 * Get comprehensive analytics for a share link
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '100');

    // Authenticate user
    const { session } = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await getSupabaseServerClient();

    // Verify ownership
    const { data: shareLink, error: linkError } = await supabase
      .from('share_links')
      .select('id, user_id, blueprint_id, share_token, created_at')
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

    analyticsQuery = analyticsQuery.limit(limit);

    const { data: analytics, error: analyticsError } = await analyticsQuery;

    if (analyticsError) {
      console.error('Analytics query error:', analyticsError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch analytics' },
        { status: 500 }
      );
    }

    // Calculate summary statistics
    const summary = calculateAnalyticsSummary(id, analytics || []);

    const response: ShareAnalyticsResponse = {
      success: true,
      analytics: summary,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Calculate comprehensive analytics summary
 */
function calculateAnalyticsSummary(shareLinkId: string, analytics: any[]): ShareAnalyticsSummary {
  // Basic metrics
  const totalViews = analytics.length;
  const uniqueVisitors = new Set(analytics.map((a) => a.visitor_id)).size;

  // Calculate average view duration
  const durationsInSeconds = analytics
    .map((a) => a.access_duration_seconds)
    .filter((d) => d != null);
  const averageViewDuration = durationsInSeconds.length
    ? durationsInSeconds.reduce((sum, d) => sum + d, 0) / durationsInSeconds.length
    : 0;

  // Views by day
  const viewsByDayMap = new Map<string, { views: number; uniqueViewers: Set<string> }>();
  analytics.forEach((a) => {
    const date = new Date(a.accessed_at).toISOString().split('T')[0];
    if (!viewsByDayMap.has(date)) {
      viewsByDayMap.set(date, { views: 0, uniqueViewers: new Set() });
    }
    const dayData = viewsByDayMap.get(date)!;
    dayData.views++;
    dayData.uniqueViewers.add(a.visitor_id);
  });

  const viewsByDay = Array.from(viewsByDayMap.entries())
    .map(([date, data]) => ({
      date,
      views: data.views,
      uniqueViewers: data.uniqueViewers.size,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Views by hour of day
  const viewsByHourMap = new Map<number, number>();
  analytics.forEach((a) => {
    const hour = new Date(a.accessed_at).getHours();
    viewsByHourMap.set(hour, (viewsByHourMap.get(hour) || 0) + 1);
  });

  const viewsByHour = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    views: viewsByHourMap.get(hour) || 0,
  }));

  // Geographic distribution
  const countryViewsMap = new Map<string, number>();
  analytics.forEach((a) => {
    if (a.country_code) {
      countryViewsMap.set(a.country_code, (countryViewsMap.get(a.country_code) || 0) + 1);
    }
  });

  const totalCountryViews = Array.from(countryViewsMap.values()).reduce((sum, v) => sum + v, 0);
  const viewsByCountry = Array.from(countryViewsMap.entries())
    .map(([countryCode, views]) => ({
      countryCode,
      countryName: getCountryName(countryCode),
      views,
      percentage: (views / totalCountryViews) * 100,
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 10); // Top 10 countries

  // Device breakdown
  const deviceBreakdown = {
    desktop: analytics.filter((a) => a.device_type === 'desktop').length,
    mobile: analytics.filter((a) => a.device_type === 'mobile').length,
    tablet: analytics.filter((a) => a.device_type === 'tablet').length,
  };

  // Browser breakdown
  const browserMap = new Map<string, number>();
  analytics.forEach((a) => {
    if (a.browser) {
      browserMap.set(a.browser, (browserMap.get(a.browser) || 0) + 1);
    }
  });

  const browserBreakdown = Array.from(browserMap.entries())
    .map(([browser, views]) => ({
      browser,
      views,
      percentage: (views / totalViews) * 100,
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 5); // Top 5 browsers

  // OS breakdown
  const osMap = new Map<string, number>();
  analytics.forEach((a) => {
    if (a.os) {
      osMap.set(a.os, (osMap.get(a.os) || 0) + 1);
    }
  });

  const osBreakdown = Array.from(osMap.entries())
    .map(([os, views]) => ({
      os,
      views,
      percentage: (views / totalViews) * 100,
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 5); // Top 5 operating systems

  // Engagement metrics
  const scrollDepths = analytics.map((a) => a.total_scroll_depth).filter((d) => d != null);
  const averageScrollDepth = scrollDepths.length
    ? scrollDepths.reduce((sum, d) => sum + d, 0) / scrollDepths.length
    : 0;

  const clickCounts = analytics.map((a) => a.clicks_count).filter((c) => c != null);
  const averageClicksPerSession = clickCounts.length
    ? clickCounts.reduce((sum, c) => sum + c, 0) / clickCounts.length
    : 0;

  // Most viewed sections
  const sectionViewMap = new Map<string, { views: number; totalTime: number }>();
  analytics.forEach((a) => {
    if (a.sections_viewed) {
      a.sections_viewed.forEach((section: string) => {
        if (!sectionViewMap.has(section)) {
          sectionViewMap.set(section, { views: 0, totalTime: 0 });
        }
        const sectionData = sectionViewMap.get(section)!;
        sectionData.views++;
        if (a.time_per_section && a.time_per_section[section]) {
          sectionData.totalTime += a.time_per_section[section];
        }
      });
    }
  });

  const mostViewedSections = Array.from(sectionViewMap.entries())
    .map(([sectionId, data]) => ({
      sectionId,
      sectionName: getSectionName(sectionId),
      views: data.views,
      averageTime: data.views > 0 ? data.totalTime / data.views : 0,
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 10);

  // Conversion metrics
  const downloadsCount = analytics.filter((a) => a.downloaded).length;
  const printsCount = analytics.filter((a) => a.printed).length;
  const sharesCount = analytics.filter((a) => a.shared).length;

  const downloadRate = totalViews > 0 ? (downloadsCount / totalViews) * 100 : 0;
  const printRate = totalViews > 0 ? (printsCount / totalViews) * 100 : 0;
  const shareRate = totalViews > 0 ? (sharesCount / totalViews) * 100 : 0;

  // Traffic sources
  const trafficSourceMap = new Map<string, number>();
  analytics.forEach((a) => {
    const source = a.referrer_source || 'direct';
    trafficSourceMap.set(source, (trafficSourceMap.get(source) || 0) + 1);
  });

  const trafficSources = Array.from(trafficSourceMap.entries())
    .map(([source, views]) => ({
      source,
      views,
      percentage: (views / totalViews) * 100,
    }))
    .sort((a, b) => b.views - a.views);

  // Recent views (last 10)
  const recentViews = analytics.slice(0, 10).map((a) => ({
    id: a.id,
    shareLinkId: a.share_link_id,
    visitorId: a.visitor_id,
    visitorEmail: a.visitor_email,
    accessedAt: new Date(a.accessed_at),
    accessDurationSeconds: a.access_duration_seconds,
    browser: a.browser,
    browserVersion: a.browser_version,
    os: a.os,
    osVersion: a.os_version,
    deviceType: a.device_type,
    countryCode: a.country_code,
    region: a.region,
    sectionsViewed: a.sections_viewed,
    timePerSection: a.time_per_section,
    totalScrollDepth: a.total_scroll_depth,
    clicksCount: a.clicks_count,
    downloaded: a.downloaded,
    printed: a.printed,
    shared: a.shared,
    referrerSource: a.referrer_source,
    referrerUrl: a.referrer_url,
    sessionId: a.session_id,
    isReturningVisitor: a.is_returning_visitor,
  }));

  return {
    shareLinkId,
    totalViews,
    uniqueViewers,
    averageViewDuration,
    viewsByDay,
    viewsByHour,
    viewsByCountry,
    deviceBreakdown,
    browserBreakdown,
    osBreakdown,
    averageScrollDepth,
    averageClicksPerSession,
    mostViewedSections,
    downloadRate,
    printRate,
    shareRate,
    trafficSources,
    recentViews,
  };
}

/**
 * Get country name from code (simplified - in production, use a proper library)
 */
function getCountryName(code: string): string {
  const countries: Record<string, string> = {
    US: 'United States',
    GB: 'United Kingdom',
    CA: 'Canada',
    AU: 'Australia',
    DE: 'Germany',
    FR: 'France',
    JP: 'Japan',
    CN: 'China',
    IN: 'India',
    BR: 'Brazil',
    // Add more as needed
  };
  return countries[code] || code;
}

/**
 * Get section name from ID (customize based on your blueprint structure)
 */
function getSectionName(sectionId: string): string {
  const sections: Record<string, string> = {
    executive_summary: 'Executive Summary',
    objectives: 'Learning Objectives',
    content_outline: 'Content Outline',
    instructional_strategy: 'Instructional Strategy',
    assessment_strategy: 'Assessment Strategy',
    timeline: 'Timeline',
    resources: 'Resources',
    budget: 'Budget',
    risks: 'Risk Mitigation',
    sustainability: 'Sustainability Plan',
    // Add more based on your blueprint structure
  };
  return sections[sectionId] || sectionId;
}
