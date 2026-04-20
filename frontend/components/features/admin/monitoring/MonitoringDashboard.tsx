/**
 * Comprehensive Monitoring Dashboard
 *
 * Real-time monitoring dashboard showing system health,
 * performance metrics, error tracking, and alerting status.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  Globe,
  Server,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  AlertCircle,
  Monitor,
  Zap,
  Users,
  BarChart3,
  LineChart,
  Info,
  XCircle,
} from 'lucide-react';

interface MonitoringData {
  timestamp: string;
  timeRange: string;
  uptime: number;
  system?: {
    nodeVersion: string;
    platform: string;
    memory: NodeJS.MemoryUsage;
    uptime: number;
  };
  health?: {
    overall: string;
    summary: {
      totalChecks: number;
      healthyChecks: number;
      degradedChecks: number;
      unhealthyChecks: number;
      availability: number;
    };
    checks: Array<{
      name: string;
      status: string;
      message?: string;
      responseTime?: number;
      lastChecked: number;
    }>;
  };
  performance?: {
    overall: string;
    summary: {
      totalMetrics: number;
      healthyCategories: number;
      warningCategories: number;
      criticalCategories: number;
    };
  };
  errors?: {
    totalErrors: number;
    errorsByCategory: Record<string, number>;
    errorsBySeverity: Record<string, number>;
    topErrors: Array<{
      message: string;
      count: number;
      category: string;
      severity: string;
    }>;
  };
  alerts?: {
    statistics: {
      totalRules: number;
      enabledRules: number;
      totalEvents: number;
      activeEvents: number;
      resolvedEvents: number;
      eventsBySeverity: Record<string, number>;
    };
    recentEvents: Array<{
      id: string;
      ruleName: string;
      severity: string;
      message: string;
      timestamp: number;
    }>;
  };
}

const MonitoringDashboard: React.FC = () => {
  const [monitoringData, setMonitoringData] = useState<MonitoringData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState('1h');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Fetch monitoring data
  const fetchMonitoringData = async () => {
    try {
      setError(null);
      const response = await fetch('/api/monitoring/status', {
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        setMonitoringData(data.data);
        setLastUpdated(new Date());
      } else {
        throw new Error(data.error?.message || 'Failed to fetch monitoring data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Failed to fetch monitoring data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Trigger health check
  const triggerHealthCheck = async (target?: string) => {
    try {
      const response = await fetch('/api/monitoring/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'health-check', target }),
      });

      if (response.ok) {
        await fetchMonitoringData(); // Refresh data
      }
    } catch (err) {
      console.error('Failed to trigger health check:', err);
    }
  };

  // Trigger alert check
  const triggerAlertCheck = async () => {
    try {
      const response = await fetch('/api/monitoring/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'alert-check' }),
      });

      if (response.ok) {
        await fetchMonitoringData(); // Refresh data
      }
    } catch (err) {
      console.error('Failed to trigger alert check:', err);
    }
  };

  // Auto-refresh effect
  useEffect(() => {
    fetchMonitoringData();

    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(fetchMonitoringData, 30000); // Refresh every 30 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, selectedTimeRange]);

  // Get health status color
  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'unhealthy':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get health status icon
  const getHealthStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4" />;
      case 'degraded':
        return <AlertTriangle className="h-4 w-4" />;
      case 'unhealthy':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'info':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <RefreshCw className="mx-auto mb-4 h-8 w-8 animate-spin" />
          <p className="text-muted-foreground">Loading monitoring data...</p>
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
              Monitoring Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchMonitoringData} className="w-full">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!monitoringData) {
    return null;
  }

  const { health, performance, errors, alerts, system } = monitoringData;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Monitoring Dashboard</h1>
          <p className="text-muted-foreground">Real-time system monitoring and alerting</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-muted-foreground text-sm">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="bg-background rounded-md border px-3 py-2"
          >
            <option value="1h">Last 1 hour</option>
            <option value="6h">Last 6 hours</option>
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
          </select>
          <Button variant="outline" size="sm" onClick={() => setAutoRefresh(!autoRefresh)}>
            <RefreshCw className={`mr-2 h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto-refresh
          </Button>
          <Button variant="outline" size="sm" onClick={fetchMonitoringData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            {getHealthStatusIcon(health?.overall || 'unknown')}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{health?.overall || 'Unknown'}</div>
            <p className="text-muted-foreground text-xs">
              {health?.summary
                ? `${health.summary.healthyChecks}/${health.summary.totalChecks} healthy`
                : 'No data'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
            <Clock className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {Math.floor(monitoringData.uptime / (1000 * 60 * 60))}h
            </div>
            <p className="text-muted-foreground text-xs">
              {health?.summary
                ? `${health.summary.availability.toFixed(1)}% availability`
                : 'No data'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Errors</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{errors?.totalErrors || 0}</div>
            <p className="text-muted-foreground text-xs">Last {selectedTimeRange}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {alerts?.statistics?.activeEvents || 0}
            </div>
            <p className="text-muted-foreground text-xs">
              {alerts?.statistics?.totalEvents || 0} total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed monitoring data */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="health">Health Checks</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="errors">Errors</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Health Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Health Summary</CardTitle>
                <CardDescription>Service health status overview</CardDescription>
              </CardHeader>
              <CardContent>
                {health?.checks && (
                  <div className="space-y-3">
                    {health.checks.map((check) => (
                      <div key={check.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className={getHealthStatusColor(check.status)}>
                            {getHealthStatusIcon(check.status)}
                            <span className="ml-1 capitalize">{check.status}</span>
                          </Badge>
                          <span className="text-sm font-medium">{check.name}</span>
                        </div>
                        {check.responseTime && (
                          <span className="text-muted-foreground text-sm">
                            {check.responseTime}ms
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Error Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Error Summary</CardTitle>
                <CardDescription>Recent error activity</CardDescription>
              </CardHeader>
              <CardContent>
                {errors && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">By Category</p>
                        {Object.entries(errors.errorsByCategory).map(([category, count]) => (
                          <div key={category} className="flex justify-between">
                            <span className="capitalize">{category}</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                      <div>
                        <p className="text-muted-foreground">By Severity</p>
                        {Object.entries(errors.errorsBySeverity).map(([severity, count]) => (
                          <div key={severity} className="flex justify-between">
                            <span className="capitalize">{severity}</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {errors.topErrors && errors.topErrors.length > 0 && (
                      <div>
                        <p className="text-muted-foreground mb-2 text-sm">Top Errors</p>
                        <div className="space-y-1">
                          {errors.topErrors.slice(0, 3).map((error, index) => (
                            <div key={index} className="bg-muted rounded p-2 text-xs">
                              <div className="truncate font-medium">{error.message}</div>
                              <div className="text-muted-foreground">
                                {error.category} • {error.count} occurrences
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Alert Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Alerts</CardTitle>
              <CardDescription>Latest alert events</CardDescription>
            </CardHeader>
            <CardContent>
              {alerts?.recentEvents && alerts.recentEvents.length > 0 ? (
                <div className="space-y-3">
                  {alerts.recentEvents.slice(0, 5).map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <Badge className={getSeverityColor(event.severity)}>
                          <span className="capitalize">{event.severity}</span>
                        </Badge>
                        <div>
                          <p className="text-sm font-medium">{event.message}</p>
                          <p className="text-muted-foreground text-xs">
                            {event.ruleName} • {new Date(event.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          /* Implement resolution */
                        }}
                      >
                        Resolve
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-muted-foreground py-8 text-center">
                  <CheckCircle className="mx-auto mb-2 h-8 w-8" />
                  <p>No recent alerts</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="health" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Health Checks</CardTitle>
              <CardDescription>Detailed service health information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex gap-4">
                <Button onClick={() => triggerHealthCheck()} variant="outline">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Run Health Checks
                </Button>
              </div>

              {health?.checks && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {health.checks.map((check) => (
                    <Card key={check.name}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">{check.name}</CardTitle>
                          <Badge className={getHealthStatusColor(check.status)}>
                            {getHealthStatusIcon(check.status)}
                            <span className="ml-1 capitalize">{check.status}</span>
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground mb-2 text-sm">{check.message}</p>
                        {check.responseTime && (
                          <div className="flex items-center text-sm">
                            <Zap className="mr-1 h-4 w-4 text-green-500" />
                            <span>{check.responseTime}ms response time</span>
                          </div>
                        )}
                        <div className="text-muted-foreground flex items-center text-xs">
                          <Clock className="mr-1 h-3 w-3" />
                          <span>Last checked: {new Date(check.lastChecked).toLocaleString()}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Information</CardTitle>
              <CardDescription>Node.js system metrics</CardDescription>
            </CardHeader>
            <CardContent>
              {system && (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <h4 className="mb-3 font-medium">Runtime</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Node Version:</span>
                        <span className="font-mono">{system.nodeVersion}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Platform:</span>
                        <span className="font-mono">{system.platform}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Architecture:</span>
                        <span className="font-mono">{system.architecture}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Process ID:</span>
                        <span className="font-mono">{system.pid}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="mb-3 font-medium">Memory Usage</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Heap Used:</span>
                        <span className="font-mono">
                          {system.memory
                            ? `${(system.memory.heapUsed / 1024 / 1024).toFixed(2)} MB`
                            : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Heap Total:</span>
                        <span className="font-mono">
                          {system.memory
                            ? `${(system.memory.heapTotal / 1024 / 1024).toFixed(2)} MB`
                            : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Uptime:</span>
                        <span className="font-mono">
                          {Math.floor(system.uptime / 60)}m {Math.floor(system.uptime % 60)}s
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MonitoringDashboard;
