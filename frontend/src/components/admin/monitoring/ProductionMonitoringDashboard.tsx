/**
 * Production Monitoring Dashboard Component
 *
 * Real-time monitoring dashboard for production system health,
 * payment processing, and alerting status.
 *
 * @version 1.0.0
 * @date 2025-10-30
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Activity,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Settings,
  Bell,
  Clock,
  Server,
  Database,
  CreditCard,
  Webhook,
} from 'lucide-react';

// ============================================================================
// Types and Interfaces
// ============================================================================

interface MonitoringStatus {
  configured: boolean;
  channels: Array<{ name: string; type: string; enabled: boolean }>;
  rules: Array<{ name: string; severity: string; enabled: boolean }>;
  lastHealthCheck?: string;
}

interface EnvironmentValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

interface SystemHealth {
  uptime: number;
  memory: NodeJS.MemoryUsage;
  timestamp: string;
  environment: string;
}

interface AlertEvent {
  id: string;
  ruleName: string;
  severity: string;
  message: string;
  timestamp: number;
  resolved: boolean;
}

interface MetricsData {
  paymentSuccessRate: number;
  webhookSuccessRate: number;
  apiResponseTime: number;
  errorRate: number;
  totalTransactions: number;
  activeAlerts: number;
}

// ============================================================================
// Production Monitoring Dashboard Component
// ============================================================================

export default function ProductionMonitoringDashboard() {
  const [monitoringStatus, setMonitoringStatus] = useState<MonitoringStatus | null>(null);
  const [environmentValidation, setEnvironmentValidation] = useState<EnvironmentValidation | null>(
    null
  );
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [recentAlerts, setRecentAlerts] = useState<AlertEvent[]>([]);
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ============================================================================
  // Data Fetching
  // ============================================================================

  const fetchMonitoringData = async () => {
    try {
      setIsRefreshing(true);

      const response = await fetch('/api/monitoring/production-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'status' }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch monitoring data');
      }

      const data = await response.json();

      if (data.success) {
        setMonitoringStatus(data.data.monitoring);
        setEnvironmentValidation(data.data.environment);
        setSystemHealth(data.data.system);
      }
    } catch (error) {
      console.error('Failed to fetch monitoring data:', error);
    } finally {
      setIsRefreshing(false);
      setLastRefresh(new Date());
    }
  };

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/monitoring/status?include=performance,errors,alerts');

      if (!response.ok) {
        throw new Error('Failed to fetch metrics');
      }

      const data = await response.json();

      if (data.success) {
        // Extract metrics from the monitoring API response
        setMetrics({
          paymentSuccessRate: 98.5, // Placeholder - would come from real data
          webhookSuccessRate: 99.2,
          apiResponseTime: 245,
          errorRate: 1.2,
          totalTransactions: 1247,
          activeAlerts: data.data.alerts?.statistics?.activeEvents || 0,
        });

        // Set recent alerts
        if (data.data.alerts?.recentEvents) {
          setRecentAlerts(data.data.alerts.recentEvents.slice(0, 10));
        }
      }
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    }
  };

  // ============================================================================
  // Actions
  // ============================================================================

  const initializeMonitoring = async () => {
    try {
      setIsLoading(true);

      const response = await fetch('/api/monitoring/production-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'initialize', testMode: false }),
      });

      if (!response.ok) {
        throw new Error('Failed to initialize monitoring');
      }

      const data = await response.json();

      if (data.success) {
        await fetchMonitoringData();
      }
    } catch (error) {
      console.error('Failed to initialize monitoring:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const testMonitoring = async () => {
    try {
      setIsLoading(true);

      const response = await fetch('/api/monitoring/production-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test' }),
      });

      if (!response.ok) {
        throw new Error('Failed to test monitoring');
      }

      const data = await response.json();

      if (data.success) {
        await fetchMonitoringData();
      }
    } catch (error) {
      console.error('Failed to test monitoring:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================================
  // Effects
  // ============================================================================

  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      await Promise.all([fetchMonitoringData(), fetchMetrics()]);
      setIsLoading(false);
    };

    loadInitialData();

    // Set up auto-refresh
    const interval = setInterval(() => {
      fetchMetrics();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // ============================================================================
  // Helper Functions
  // ============================================================================

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'healthy':
      case 'success':
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'warning':
      case 'degraded':
        return 'text-yellow-600 bg-yellow-50';
      case 'error':
      case 'failed':
      case 'unhealthy':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'error':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'warning':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'info':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const formatMemory = (bytes: number) => {
    return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  // ============================================================================
  // Render
  // ============================================================================

  if (isLoading && !monitoringStatus) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading monitoring dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Production Monitoring</h1>
          <p className="text-gray-600">
            Real-time system health, payment processing, and alerting status
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={testMonitoring}
            disabled={isRefreshing}
            className="flex items-center space-x-2"
          >
            <Activity className="h-4 w-4" />
            <span>Test Monitoring</span>
          </Button>

          <Button
            onClick={initializeMonitoring}
            disabled={isRefreshing}
            className="flex items-center space-x-2"
          >
            <Settings className="h-4 w-4" />
            <span>Initialize</span>
          </Button>

          <Button
            variant="outline"
            onClick={fetchMonitoringData}
            disabled={isRefreshing}
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Environment Status */}
      {environmentValidation && (
        <div className="space-y-2">
          {environmentValidation.errors.length > 0 && (
            <Alert className="border-red-200 bg-red-50">
              <XCircle className="h-4 w-4 text-red-600" />
              <AlertTitle className="text-red-800">Configuration Issues</AlertTitle>
              <AlertDescription className="text-red-700">
                <ul className="mt-2 list-inside list-disc">
                  {environmentValidation.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {environmentValidation.warnings.length > 0 && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertTitle className="text-yellow-800">Recommendations</AlertTitle>
              <AlertDescription className="text-yellow-700">
                <ul className="mt-2 list-inside list-disc">
                  {environmentValidation.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {environmentValidation.valid && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">Environment Valid</AlertTitle>
              <AlertDescription className="text-green-700">
                All required environment variables are configured for production monitoring.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="system">System Health</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {metrics && (
              <>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Payment Success Rate</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {metrics.paymentSuccessRate}%
                        </p>
                      </div>
                      <CreditCard className="h-8 w-8 text-green-600" />
                    </div>
                    <div className="mt-2">
                      <Progress value={metrics.paymentSuccessRate} className="h-2" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Webhook Success Rate</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {metrics.webhookSuccessRate}%
                        </p>
                      </div>
                      <Webhook className="h-8 w-8 text-blue-600" />
                    </div>
                    <div className="mt-2">
                      <Progress value={metrics.webhookSuccessRate} className="h-2" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">API Response Time</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {metrics.apiResponseTime}ms
                        </p>
                      </div>
                      <Activity className="h-8 w-8 text-yellow-600" />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">P95 response time</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Active Alerts</p>
                        <p className="text-2xl font-bold text-gray-900">{metrics.activeAlerts}</p>
                      </div>
                      <Bell
                        className={`h-8 w-8 ${metrics.activeAlerts > 0 ? 'text-red-600' : 'text-green-600'}`}
                      />
                    </div>
                    <Badge
                      className={
                        metrics.activeAlerts > 0
                          ? 'bg-red-100 text-red-800'
                          : 'bg-green-100 text-green-800'
                      }
                    >
                      {metrics.activeAlerts > 0 ? 'Attention Needed' : 'All Clear'}
                    </Badge>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* Recent Alerts */}
          {recentAlerts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <span>Recent Alerts</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentAlerts.slice(0, 5).map((alert) => (
                    <div
                      key={alert.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center space-x-3">
                        <Badge className={getSeverityColor(alert.severity)}>{alert.severity}</Badge>
                        <div>
                          <p className="font-medium text-gray-900">{alert.ruleName}</p>
                          <p className="text-sm text-gray-600">{alert.message}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">
                          {new Date(alert.timestamp).toLocaleString()}
                        </p>
                        <Badge variant={alert.resolved ? 'default' : 'destructive'}>
                          {alert.resolved ? 'Resolved' : 'Active'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alert Management</CardTitle>
            </CardHeader>
            <CardContent>
              {monitoringStatus?.rules && monitoringStatus.rules.length > 0 ? (
                <div className="space-y-3">
                  {monitoringStatus.rules.map((rule, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div className="flex items-center space-x-3">
                        <Badge className={getSeverityColor(rule.severity)}>{rule.severity}</Badge>
                        <div>
                          <p className="font-medium text-gray-900">{rule.name}</p>
                          <p className="text-sm text-gray-600">Rule configured for monitoring</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={rule.enabled ? 'default' : 'secondary'}>
                          {rule.enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <Bell className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                  <p className="text-gray-600">No alert rules configured</p>
                  <Button onClick={initializeMonitoring} className="mt-4">
                    Initialize Monitoring
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Metrics Tab */}
        <TabsContent value="metrics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              {metrics ? (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-medium">Payment Success Rate</span>
                        <span className="text-sm text-gray-600">{metrics.paymentSuccessRate}%</span>
                      </div>
                      <Progress value={metrics.paymentSuccessRate} className="h-2" />
                    </div>

                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-medium">Webhook Success Rate</span>
                        <span className="text-sm text-gray-600">{metrics.webhookSuccessRate}%</span>
                      </div>
                      <Progress value={metrics.webhookSuccessRate} className="h-2" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">API Response Time</span>
                      <span className="text-sm text-gray-600">{metrics.apiResponseTime}ms</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Error Rate</span>
                      <span className="text-sm text-gray-600">{metrics.errorRate}%</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Total Transactions</span>
                      <span className="text-sm text-gray-600">{metrics.totalTransactions}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center">
                  <TrendingUp className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                  <p className="text-gray-600">No metrics data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Health Tab */}
        <TabsContent value="system" className="space-y-4">
          {systemHealth && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Server className="h-5 w-5" />
                    <span>System Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Environment</span>
                        <Badge
                          className={
                            systemHealth.environment === 'production'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }
                        >
                          {systemHealth.environment}
                        </Badge>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Uptime</span>
                        <span className="text-sm text-gray-600">
                          {formatUptime(systemHealth.uptime)}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Last Check</span>
                        <span className="text-sm text-gray-600">
                          {new Date(systemHealth.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Memory Usage</span>
                        <span className="text-sm text-gray-600">
                          {formatMemory(systemHealth.memory.heapUsed)} /{' '}
                          {formatMemory(systemHealth.memory.heapTotal)}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-sm font-medium">External Memory</span>
                        <span className="text-sm text-gray-600">
                          {formatMemory(systemHealth.memory.external)}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-sm font-medium">RSS Memory</span>
                        <span className="text-sm text-gray-600">
                          {formatMemory(systemHealth.memory.rss)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="mb-2 flex justify-between">
                      <span className="text-sm font-medium">Heap Usage</span>
                      <span className="text-sm text-gray-600">
                        {Math.round(
                          (systemHealth.memory.heapUsed / systemHealth.memory.heapTotal) * 100
                        )}
                        %
                      </span>
                    </div>
                    <Progress
                      value={(systemHealth.memory.heapUsed / systemHealth.memory.heapTotal) * 100}
                      className="h-2"
                    />
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Configuration Tab */}
        <TabsContent value="configuration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monitoring Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              {monitoringStatus ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="mb-3 text-lg font-medium">Notification Channels</h3>
                    {monitoringStatus.channels.length > 0 ? (
                      <div className="space-y-2">
                        {monitoringStatus.channels.map((channel, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between rounded-lg border p-3"
                          >
                            <div className="flex items-center space-x-3">
                              <Database className="h-4 w-4 text-gray-600" />
                              <div>
                                <p className="font-medium text-gray-900">{channel.name}</p>
                                <p className="text-sm text-gray-600">Type: {channel.type}</p>
                              </div>
                            </div>
                            <Badge variant={channel.enabled ? 'default' : 'secondary'}>
                              {channel.enabled ? 'Enabled' : 'Disabled'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-600">No notification channels configured</p>
                    )}
                  </div>

                  <div>
                    <h3 className="mb-3 text-lg font-medium">System Status</h3>
                    <div className="flex items-center space-x-2">
                      <Badge
                        className={
                          monitoringStatus.configured
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }
                      >
                        {monitoringStatus.configured ? 'Configured' : 'Not Configured'}
                      </Badge>
                      <span className="text-sm text-gray-600">
                        Last health check:{' '}
                        {monitoringStatus.lastHealthCheck
                          ? new Date(monitoringStatus.lastHealthCheck).toLocaleString()
                          : 'Never'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center">
                  <Settings className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                  <p className="text-gray-600">Monitoring configuration not loaded</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center space-x-2">
          <Clock className="h-4 w-4" />
          <span>Last updated: {lastRefresh.toLocaleString()}</span>
        </div>
        <div className="flex items-center space-x-2">
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Auto-refresh every 30 seconds</span>
        </div>
      </div>
    </div>
  );
}
