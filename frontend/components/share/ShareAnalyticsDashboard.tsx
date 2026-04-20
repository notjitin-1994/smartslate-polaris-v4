/**
 * Share Analytics Dashboard Component
 * Comprehensive analytics visualization for shared blueprints
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Eye,
  Users,
  Clock,
  Globe,
  Monitor,
  Smartphone,
  Tablet,
  Download,
  Printer,
  Share2,
  TrendingUp,
  TrendingDown,
  MousePointer,
  ScrollText,
  BarChart3,
  PieChart,
  Activity,
  Calendar,
  MapPin,
  Chrome,
  ExternalLink,
  RefreshCw,
  FileDown,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import type { ShareAnalyticsSummary, ShareAnalyticsView } from '@/types/share';
import { cn } from '@/lib/utils';

interface ShareAnalyticsDashboardProps {
  shareId: string;
  shareLinkUrl?: string;
  className?: string;
}

export function ShareAnalyticsDashboard({
  shareId,
  shareLinkUrl,
  className,
}: ShareAnalyticsDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<ShareAnalyticsSummary | null>(null);
  const [dateRange, setDateRange] = useState('7');
  const [refreshing, setRefreshing] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, [shareId, dateRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const endDate = new Date();
      const startDate = subDays(endDate, parseInt(dateRange));

      const response = await fetch(
        `/api/share/${shareId}/analytics?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      );

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.analytics);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    setRefreshing(true);
    await loadAnalytics();
    setRefreshing(false);
  };

  const exportAnalytics = async (format: 'csv' | 'json') => {
    setExportLoading(true);
    try {
      const response = await fetch(`/api/share/${shareId}/analytics/export?format=${format}`);

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-${shareId}-${Date.now()}.${format}`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting analytics:', error);
    } finally {
      setExportLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={cn('space-y-4', className)}>
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <Card className={className}>
        <CardContent className="py-8 text-center">
          <BarChart3 className="mx-auto mb-4 h-12 w-12 text-gray-300" />
          <p className="text-gray-500">No analytics data available yet</p>
        </CardContent>
      </Card>
    );
  }

  // Prepare chart colors
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  // Calculate engagement rate
  const engagementRate =
    analytics.totalViews > 0
      ? ((analytics.averageScrollDepth / 100) * 0.3 +
          (analytics.averageViewDuration > 60 ? 0.4 : analytics.averageViewDuration / 150) +
          (analytics.averageClicksPerSession > 0 ? 0.3 : 0)) *
        100
      : 0;

  // Calculate trend
  const recentViews = analytics.viewsByDay.slice(-7);
  const previousViews = analytics.viewsByDay.slice(-14, -7);
  const recentTotal = recentViews.reduce((sum, d) => sum + d.views, 0);
  const previousTotal = previousViews.reduce((sum, d) => sum + d.views, 0);
  const viewTrend = previousTotal > 0 ? ((recentTotal - previousTotal) / previousTotal) * 100 : 0;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Share Analytics</h2>
          {shareLinkUrl && (
            <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
              <Link className="h-3 w-3" />
              {shareLinkUrl}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Last 24 Hours</SelectItem>
              <SelectItem value="7">Last 7 Days</SelectItem>
              <SelectItem value="30">Last 30 Days</SelectItem>
              <SelectItem value="90">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={refresh} disabled={refreshing}>
            <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
          </Button>
          <Button variant="outline" onClick={() => exportAnalytics('csv')} disabled={exportLoading}>
            <FileDown className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Views</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <p className="text-2xl font-bold">{analytics.totalViews.toLocaleString()}</p>
              <div
                className={cn(
                  'flex items-center gap-1 text-sm',
                  viewTrend > 0 ? 'text-green-600' : 'text-red-600'
                )}
              >
                {viewTrend > 0 ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                {Math.abs(viewTrend).toFixed(1)}%
              </div>
            </div>
            <p className="mt-1 text-xs text-gray-500">{analytics.uniqueViewers} unique viewers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Avg. Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {Math.floor(analytics.averageViewDuration / 60)}:
              {String(Math.floor(analytics.averageViewDuration % 60)).padStart(2, '0')}
            </p>
            <Progress
              value={Math.min((analytics.averageViewDuration / 300) * 100, 100)}
              className="mt-2"
            />
            <p className="mt-1 text-xs text-gray-500">Target: 5:00</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Engagement</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{engagementRate.toFixed(1)}%</p>
            <div className="mt-2 flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                <ScrollText className="mr-1 h-3 w-3" />
                {analytics.averageScrollDepth.toFixed(0)}%
              </Badge>
              <Badge variant="secondary" className="text-xs">
                <MousePointer className="mr-1 h-3 w-3" />
                {analytics.averageClicksPerSession.toFixed(1)}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Conversions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              {analytics.downloadRate > 0 && (
                <div className="flex items-center gap-1">
                  <Download className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">{analytics.downloadRate.toFixed(1)}%</span>
                </div>
              )}
              {analytics.printRate > 0 && (
                <div className="flex items-center gap-1">
                  <Printer className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">{analytics.printRate.toFixed(1)}%</span>
                </div>
              )}
              {analytics.shareRate > 0 && (
                <div className="flex items-center gap-1">
                  <Share2 className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium">{analytics.shareRate.toFixed(1)}%</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="audience">Audience</TabsTrigger>
          <TabsTrigger value="behavior">Behavior</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Views Over Time */}
          <Card>
            <CardHeader>
              <CardTitle>Views Over Time</CardTitle>
              <CardDescription>Daily views and unique viewers</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analytics.viewsByDay}>
                  <defs>
                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorUnique" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => format(new Date(value), 'MMM d')}
                  />
                  <YAxis />
                  <Tooltip labelFormatter={(value) => format(new Date(value), 'MMM d, yyyy')} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="views"
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#colorViews)"
                    name="Total Views"
                  />
                  <Area
                    type="monotone"
                    dataKey="uniqueViewers"
                    stroke="#10b981"
                    fillOpacity={1}
                    fill="url(#colorUnique)"
                    name="Unique Viewers"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Views by Hour */}
          <Card>
            <CardHeader>
              <CardTitle>Peak Activity Hours</CardTitle>
              <CardDescription>When your content is most viewed</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={analytics.viewsByHour}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" tickFormatter={(value) => `${value}:00`} />
                  <YAxis />
                  <Tooltip labelFormatter={(value) => `${value}:00 - ${value}:59`} />
                  <Bar dataKey="views" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audience" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Geographic Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Geographic Distribution</CardTitle>
                <CardDescription>Top countries by views</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analytics.viewsByCountry.slice(0, 10).map((country, index) => (
                    <div key={country.countryCode} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 text-center text-sm text-gray-500">{index + 1}</div>
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">{country.countryName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">
                          {country.percentage.toFixed(1)}%
                        </span>
                        <Badge variant="secondary">{country.views}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Device Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Device Types</CardTitle>
                <CardDescription>How viewers access your content</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <RePieChart>
                    <Pie
                      data={[
                        { name: 'Desktop', value: analytics.deviceBreakdown.desktop },
                        { name: 'Mobile', value: analytics.deviceBreakdown.mobile },
                        { name: 'Tablet', value: analytics.deviceBreakdown.tablet },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[0, 1, 2].map((index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RePieChart>
                </ResponsiveContainer>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div className="text-center">
                    <Monitor className="mx-auto mb-1 h-5 w-5 text-blue-600" />
                    <p className="text-xs text-gray-500">Desktop</p>
                    <p className="font-medium">{analytics.deviceBreakdown.desktop}</p>
                  </div>
                  <div className="text-center">
                    <Smartphone className="mx-auto mb-1 h-5 w-5 text-green-600" />
                    <p className="text-xs text-gray-500">Mobile</p>
                    <p className="font-medium">{analytics.deviceBreakdown.mobile}</p>
                  </div>
                  <div className="text-center">
                    <Tablet className="mx-auto mb-1 h-5 w-5 text-orange-600" />
                    <p className="text-xs text-gray-500">Tablet</p>
                    <p className="font-medium">{analytics.deviceBreakdown.tablet}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Browser Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Browsers</CardTitle>
                <CardDescription>Most used browsers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analytics.browserBreakdown.map((browser) => (
                    <div key={browser.browser} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Chrome className="h-4 w-4 text-gray-400" />
                        <span>{browser.browser}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-24">
                          <Progress value={browser.percentage} />
                        </div>
                        <span className="w-12 text-right text-sm text-gray-500">
                          {browser.percentage.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Traffic Sources */}
            <Card>
              <CardHeader>
                <CardTitle>Traffic Sources</CardTitle>
                <CardDescription>Where viewers come from</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={analytics.trafficSources.slice(0, 5)} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="source" type="category" width={80} />
                    <Tooltip />
                    <Bar dataKey="views" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="behavior" className="space-y-4">
          {/* Engagement Metrics */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Avg. Scroll Depth</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative h-32">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-3xl font-bold">
                        {analytics.averageScrollDepth.toFixed(0)}%
                      </p>
                      <p className="mt-1 text-xs text-gray-500">of content viewed</p>
                    </div>
                  </div>
                  <Progress
                    value={analytics.averageScrollDepth}
                    className="absolute right-0 bottom-0 left-0"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Clicks Per Session</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-3xl font-bold">
                    {analytics.averageClicksPerSession.toFixed(1)}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">interactive elements clicked</p>
                  <div className="mt-4 flex justify-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <MousePointer
                        key={i}
                        className={cn(
                          'h-4 w-4',
                          i < Math.floor(analytics.averageClicksPerSession)
                            ? 'text-blue-600'
                            : 'text-gray-300'
                        )}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Bounce Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-3xl font-bold">
                    {(
                      ((analytics.totalViews - analytics.uniqueViewers) / analytics.totalViews) *
                      100
                    ).toFixed(1)}
                    %
                  </p>
                  <p className="mt-1 text-xs text-gray-500">single-page sessions</p>
                  <Badge
                    variant="secondary"
                    className={cn(
                      'mt-4',
                      ((analytics.totalViews - analytics.uniqueViewers) / analytics.totalViews) *
                        100 <
                        50
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    )}
                  >
                    {((analytics.totalViews - analytics.uniqueViewers) / analytics.totalViews) *
                      100 <
                    50
                      ? 'Good'
                      : 'Needs Improvement'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          {/* Most Viewed Sections */}
          <Card>
            <CardHeader>
              <CardTitle>Most Viewed Sections</CardTitle>
              <CardDescription>Which parts of your content get the most attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.mostViewedSections.map((section, index) => (
                  <div key={section.sectionId} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-medium text-blue-600">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{section.sectionName}</p>
                        <p className="text-xs text-gray-500">
                          Avg. time: {Math.floor(section.averageTime / 60)}:
                          {String(Math.floor(section.averageTime % 60)).padStart(2, '0')}
                        </p>
                      </div>
                    </div>
                    <Badge>{section.views} views</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Recent Views */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Views</CardTitle>
          <CardDescription>Last 10 visitors</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64">
            <div className="space-y-2">
              {analytics.recentViews.map((view) => (
                <div
                  key={view.id}
                  className="flex items-center justify-between rounded-lg bg-gray-50 p-3 transition-colors hover:bg-gray-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200">
                      {view.deviceType === 'mobile' ? (
                        <Smartphone className="h-5 w-5 text-gray-600" />
                      ) : view.deviceType === 'tablet' ? (
                        <Tablet className="h-5 w-5 text-gray-600" />
                      ) : (
                        <Monitor className="h-5 w-5 text-gray-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {view.visitorEmail || `Visitor ${view.visitorId.substring(0, 8)}`}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{view.countryCode || 'Unknown'}</span>
                        <span>•</span>
                        <span>
                          {view.browser} {view.browserVersion}
                        </span>
                        <span>•</span>
                        <span>{format(new Date(view.accessedAt), 'MMM d, h:mm a')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {view.accessDurationSeconds && (
                      <Badge variant="secondary" className="text-xs">
                        <Clock className="mr-1 h-3 w-3" />
                        {Math.floor(view.accessDurationSeconds / 60)}:
                        {String(Math.floor(view.accessDurationSeconds % 60)).padStart(2, '0')}
                      </Badge>
                    )}
                    {view.isReturningVisitor && (
                      <Badge variant="secondary" className="text-xs">
                        Returning
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
