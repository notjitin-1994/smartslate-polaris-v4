/**
 * Performance Dashboard Component
 *
 * Real-time performance monitoring dashboard for administrators
 * Displays system health, performance metrics, and alerts.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  Globe,
  Server,
  TrendingDown,
  TrendingUp,
  RefreshCw,
  Download,
  Filter,
} from 'lucide-react';

interface PerformanceMetrics {
  systemHealth: {
    overall: 'healthy' | 'warning' | 'critical';
    summary: {
      totalMetrics: number;
      healthyCategories: number;
      warningCategories: number;
      criticalCategories: number;
    };
    generatedAt: string;
  };
  categories: Record<
    string,
    {
      health: 'healthy' | 'warning' | 'critical';
      stats: {
        count: number;
        averageDuration: number;
        p95: number;
        successRate: number;
      };
      thresholds: {
        warning: number;
        critical: number;
      };
      recommendations: string[];
    }
  >;
}

interface DetailedPerformanceReport extends PerformanceMetrics {
  detailedReports: Record<
    string,
    {
      name: string;
      stats: {
        count: number;
        totalDuration: number;
        averageDuration: number;
        minDuration: number;
        maxDuration: number;
        p50: number;
        p90: number;
        p95: number;
        p99: number;
        successRate: number;
        errorRate: number;
      };
      thresholds: {
        warning: number;
        critical: number;
      };
      health: 'healthy' | 'warning' | 'critical';
      recommendations: string[];
      generatedAt: string;
    }
  >;
}

const PerformanceDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [detailedReports, setDetailedReports] = useState<DetailedPerformanceReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Fetch performance metrics
  const fetchMetrics = async () => {
    try {
      setError(null);
      const response = await fetch('/api/performance/metrics');

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        setMetrics(data.data);
        if (data.data.detailedReports) {
          setDetailedReports(data.data as DetailedPerformanceReport);
        }
      } else {
        throw new Error(data.error?.message || 'Failed to fetch performance metrics');
      }

      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Failed to fetch performance metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  // Clear metrics
  const clearMetrics = async (category?: string) => {
    try {
      const response = await fetch('/api/performance/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category }),
      });

      if (!response.ok) {
        throw new Error(`Failed to clear metrics: ${response.statusText}`);
      }

      await fetchMetrics(); // Refresh metrics
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear metrics');
    }
  };

  // Auto-refresh effect
  useEffect(() => {
    fetchMetrics();

    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(fetchMetrics, 30000); // Refresh every 30 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  // Get health status color
  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get health icon
  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      case 'critical':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  // Prepare chart data
  const prepareCategoryData = () => {
    if (!metrics) return [];

    return Object.entries(metrics.categories).map(([name, data]) => ({
      name: name.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      averageDuration: Math.round(data.stats.averageDuration * 100) / 100,
      p95: Math.round(data.stats.p95 * 100) / 100,
      successRate: data.stats.successRate,
      count: data.stats.count,
      health: data.health,
      threshold: data.thresholds.warning,
    }));
  };

  const prepareHealthDistribution = () => {
    if (!metrics) return [];

    const { summary } = metrics.systemHealth;
    return [
      { name: 'Healthy', value: summary.healthyCategories, color: '#10b981' },
      { name: 'Warning', value: summary.warningCategories, color: '#f59e0b' },
      { name: 'Critical', value: summary.criticalCategories, color: '#ef4444' },
    ];
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <RefreshCw className="mx-auto mb-4 h-8 w-8 animate-spin" />
          <p className="text-muted-foreground">Loading performance metrics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Performance Monitoring Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchMetrics} className="w-full">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!metrics) {
    return null;
  }

  const categoryData = prepareCategoryData();
  const healthData = prepareHealthDistribution();

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Performance Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time performance monitoring and system health
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-muted-foreground text-sm">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
          <Button variant="outline" size="sm" onClick={() => setAutoRefresh(!autoRefresh)}>
            <RefreshCw className={`mr-2 h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto-refresh
          </Button>
          <Button variant="outline" size="sm" onClick={fetchMetrics}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Health Overview */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            {getHealthIcon(metrics.systemHealth.overall)}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{metrics.systemHealth.overall}</div>
            <p className="text-muted-foreground text-xs">
              {metrics.systemHealth.summary.totalMetrics} total metrics
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Healthy</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {metrics.systemHealth.summary.healthyCategories}
            </div>
            <p className="text-muted-foreground text-xs">Categories</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Warning</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {metrics.systemHealth.summary.warningCategories}
            </div>
            <p className="text-muted-foreground text-xs">Categories</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {metrics.systemHealth.summary.criticalCategories}
            </div>
            <p className="text-muted-foreground text-xs">Categories</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Details */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Health Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Health Distribution</CardTitle>
                <CardDescription>System health across all categories</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={healthData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {healthData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Response Times */}
            <Card>
              <CardHeader>
                <CardTitle>Response Times</CardTitle>
                <CardDescription>Average vs P95 response times by category</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={categoryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="averageDuration" fill="#3b82f6" name="Avg (ms)" />
                    <Bar dataKey="p95" fill="#ef4444" name="P95 (ms)" />
                    <Bar dataKey="threshold" fill="#f59e0b" name="Warning Threshold" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Success Rates */}
          <Card>
            <CardHeader>
              <CardTitle>Success Rates</CardTitle>
              <CardDescription>API success rates by category</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Bar
                    dataKey="successRate"
                    fill="#10b981"
                    name="Success Rate (%)"
                    shape={(props: any) => {
                      const { fill, x, y, width, height } = props;
                      const health = props.payload.health;
                      const color =
                        health === 'healthy'
                          ? '#10b981'
                          : health === 'warning'
                            ? '#f59e0b'
                            : '#ef4444';
                      return <rect x={x} y={y} width={width} height={height} fill={color} />;
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {Object.entries(metrics.categories).map(([name, data]) => (
              <Card key={name}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="capitalize">{name.replace(/_/g, ' ')}</CardTitle>
                    <Badge className={getHealthColor(data.health)}>
                      {getHealthIcon(data.health)}
                      <span className="ml-1">{data.health}</span>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-muted-foreground text-sm">Avg Duration</p>
                      <p className="text-lg font-semibold">
                        {Math.round(data.stats.averageDuration * 100) / 100}ms
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-sm">P95 Duration</p>
                      <p className="text-lg font-semibold">
                        {Math.round(data.stats.p95 * 100) / 100}ms
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-sm">Success Rate</p>
                      <p className="text-lg font-semibold">
                        {Math.round(data.stats.successRate * 100) / 100}%
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-sm">Total Requests</p>
                      <p className="text-lg font-semibold">{data.stats.count}</p>
                    </div>
                  </div>

                  {data.recommendations.length > 0 && (
                    <div>
                      <p className="mb-2 text-sm font-medium">Recommendations:</p>
                      <ul className="text-muted-foreground space-y-1 text-sm">
                        {data.recommendations.map((rec, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <TrendingDown className="mt-0.5 h-3 w-3 flex-shrink-0 text-yellow-500" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Recommendations</CardTitle>
              <CardDescription>Performance optimization suggestions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(metrics.categories)
                  .filter(([_, data]) => data.recommendations.length > 0)
                  .map(([name, data]) => (
                    <div key={name} className="border-l-4 border-yellow-500 pl-4">
                      <div className="mb-2 flex items-center gap-2">
                        <Badge className={getHealthColor(data.health)}>
                          {name.replace(/_/g, ' ')}
                        </Badge>
                        {data.health !== 'healthy' && (
                          <Badge variant="outline">
                            {data.recommendations.length}{' '}
                            {data.recommendations.length === 1 ? 'issue' : 'issues'}
                          </Badge>
                        )}
                      </div>
                      <ul className="space-y-2">
                        {data.recommendations.map((rec, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-yellow-500" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PerformanceDashboard;
