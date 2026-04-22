'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  FileText,
  Activity,
  TrendingUp,
  Monitor,
  Globe,
  RefreshCw,
  Calendar,
  Loader2,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AreaChartCard } from '@/components/admin/analytics/AreaChartCard';
import { PieChartCard } from '@/components/admin/analytics/PieChartCard';
import { BarChartCard } from '@/components/admin/analytics/BarChartCard';
import type { PlatformAnalytics } from '@/types/analytics';

const PERIOD_OPTIONS = [
  { value: '7', label: '7 Days' },
  { value: '30', label: '30 Days' },
  { value: '90', label: '90 Days' },
];

const PIE_COLORS = ['#22d3ee', '#3b82f6', '#a855f7', '#22c55e', '#f97316', '#ef4444'];

export default function AnalyticsDashboardPage() {
  const [analytics, setAnalytics] = useState<PlatformAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('30');

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(selectedPeriod));

      const params = new URLSearchParams({
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
      });

      const response = await fetch(`/api/analytics/platform?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const data = await response.json();
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [selectedPeriod]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 md:p-8">
        <div className="text-center">
          <XCircle className="mx-auto mb-4 h-12 w-12 text-red-400" />
          <h2 className="mb-2 text-xl font-bold text-white">Error Loading Analytics</h2>
          <p className="mb-4 text-white/60">{error}</p>
          <Button onClick={() => fetchAnalytics()} className="bg-cyan-500 hover:bg-cyan-600">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Platform Analytics</h1>
            <p className="text-white/60">Comprehensive insights and metrics</p>
          </div>

          <div className="flex items-center space-x-3">
            {/* Period Selector */}
            <div className="flex space-x-2">
              {PERIOD_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSelectedPeriod(option.value)}
                  className={`rounded-lg px-4 py-2 text-sm transition-all ${
                    selectedPeriod === option.value
                      ? 'bg-cyan-500 text-white'
                      : 'bg-white/5 text-white/60 hover:bg-white/10'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <Button
              onClick={() => fetchAnalytics()}
              disabled={isLoading}
              variant="outline"
              className="border-white/10 bg-white/5 text-white hover:bg-white/10"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
          </div>
        ) : analytics ? (
          <>
            {/* Key Metrics Cards */}
            <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* Total Users */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/60">Total Users</p>
                    <p className="text-3xl font-bold text-white">{analytics.users.total}</p>
                    <p className="text-xs text-green-400">{analytics.users.active} active</p>
                  </div>
                  <div className="rounded-lg bg-cyan-500/20 p-3">
                    <Users className="h-8 w-8 text-cyan-400" />
                  </div>
                </div>
              </motion.div>

              {/* Total Blueprints */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/60">Total Blueprints</p>
                    <p className="text-3xl font-bold text-white">{analytics.blueprints.total}</p>
                    <p className="text-xs text-green-400">
                      {analytics.blueprints.completion_rate}% completed
                    </p>
                  </div>
                  <div className="rounded-lg bg-blue-500/20 p-3">
                    <FileText className="h-8 w-8 text-blue-400" />
                  </div>
                </div>
              </motion.div>

              {/* Total Sessions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/60">Total Sessions</p>
                    <p className="text-3xl font-bold text-white">{analytics.sessions.total}</p>
                    <p className="text-xs text-green-400">{analytics.sessions.active} active</p>
                  </div>
                  <div className="rounded-lg bg-purple-500/20 p-3">
                    <Activity className="h-8 w-8 text-purple-400" />
                  </div>
                </div>
              </motion.div>

              {/* Avg Session Duration */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/60">Avg Duration</p>
                    <p className="text-3xl font-bold text-white">
                      {Math.floor(analytics.sessions.avg_duration / 60)}m
                    </p>
                    <p className="text-xs text-white/60">per session</p>
                  </div>
                  <div className="rounded-lg bg-green-500/20 p-3">
                    <Clock className="h-8 w-8 text-green-400" />
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Blueprint Status Distribution */}
            <div className="mb-6 grid gap-4 md:grid-cols-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
              >
                <p className="mb-2 text-sm text-white/60">Completed</p>
                <p className="text-2xl font-bold text-green-400">
                  {analytics.blueprints.completed}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
              >
                <p className="mb-2 text-sm text-white/60">Draft</p>
                <p className="text-2xl font-bold text-gray-400">{analytics.blueprints.draft}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
              >
                <p className="mb-2 text-sm text-white/60">Generating</p>
                <p className="text-2xl font-bold text-blue-400">
                  {analytics.blueprints.generating}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
              >
                <p className="mb-2 text-sm text-white/60">Error</p>
                <p className="text-2xl font-bold text-red-400">{analytics.blueprints.error}</p>
              </motion.div>
            </div>

            {/* Top Activities Bar Chart */}
            {analytics.activities.top_actions && analytics.activities.top_actions.length > 0 && (
              <div className="mb-6">
                <BarChartCard
                  title="Top User Activities"
                  icon={BarChart3}
                  data={analytics.activities.top_actions.map((action) => ({
                    name: action.type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
                    count: action.count,
                  }))}
                  bars={[
                    {
                      dataKey: 'count',
                      fill: '#22d3ee',
                      name: 'Count',
                    },
                  ]}
                />
              </div>
            )}

            {/* Tier Distribution Pie Chart */}
            {analytics.users.by_tier && Object.keys(analytics.users.by_tier).length > 0 && (
              <div className="mb-6">
                <PieChartCard
                  title="Users by Subscription Tier"
                  icon={PieChartIcon}
                  data={Object.entries(analytics.users.by_tier).map(([tier, count]) => ({
                    name: tier.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
                    value: count as number,
                  }))}
                  colors={PIE_COLORS}
                />
              </div>
            )}

            {/* Summary Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
            >
              <h3 className="mb-4 text-lg font-semibold text-white">Activity Summary</h3>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <p className="text-sm text-white/60">Total Activities</p>
                  <p className="text-2xl font-bold text-white">{analytics.activities.total}</p>
                </div>
                <div>
                  <p className="text-sm text-white/60">Unique Activity Types</p>
                  <p className="text-2xl font-bold text-white">
                    {analytics.activities.unique_types}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-white/60">Total Page Views</p>
                  <p className="text-2xl font-bold text-white">
                    {analytics.sessions.total_page_views}
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        ) : (
          <div className="rounded-xl border border-white/10 bg-white/5 p-12 text-center backdrop-blur-sm">
            <Activity className="mx-auto mb-4 h-12 w-12 text-white/40" />
            <h3 className="mb-2 text-lg font-semibold text-white">No Data Available</h3>
            <p className="text-white/60">Analytics data will appear here once available</p>
          </div>
        )}
      </div>
    </div>
  );
}
