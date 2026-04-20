'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { TierBadge } from '@/components/ui/TierBadge';
import {
  Star,
  Activity,
  TrendingUp,
  Calendar,
  Clock,
  Download,
  RefreshCw,
  Sparkles,
  Info,
  BarChart3,
  History,
  Settings,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import {
  BlueprintUsageService,
  type ComprehensiveUserLimits,
} from '@/lib/services/blueprintUsageService';
import { addMonths, format, formatDistanceToNow, subMonths } from 'date-fns';
import { hasUnlimitedAccess } from '@/lib/utils/tierDisplay';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

/**
 * UsageDetailPanel Component
 *
 * A comprehensive, multi-tabbed panel for detailed usage breakdown.
 * Designed for the settings page with analytics, history, and exports.
 *
 * Features:
 * - Tabbed interface (Current / History / Settings)
 * - Data visualization with charts
 * - Usage trend analysis
 * - Export capabilities
 * - Responsive grid layout
 * - Real-time refresh
 * - Glassmorphism design
 */

interface UsageDetailPanelProps {
  className?: string;
}

export function UsageDetailPanel({ className }: UsageDetailPanelProps) {
  const { user } = useAuth();
  const [limits, setLimits] = useState<ComprehensiveUserLimits | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('current');

  const fetchUsageData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);
      const supabase = getSupabaseBrowserClient();
      const data = await BlueprintUsageService.getComprehensiveUserLimits(supabase, user.id);
      setLimits(data);
    } catch (err) {
      console.error('Error fetching usage data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load usage data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsageData();
  }, [user?.id]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchUsageData();
    setRefreshing(false);
  };

  const handleExport = () => {
    if (!limits) return;

    const exportData = {
      exportDate: new Date().toISOString(),
      user: {
        id: user?.id,
        email: user?.email,
      },
      tier: limits.tier,
      role: limits.role,
      usage: {
        generations: {
          current: limits.currentGenerations,
          max: limits.maxGenerationsMonthly,
          remaining: limits.generationsRemaining,
        },
        saved: {
          current: limits.currentSavedStarmaps,
          max: limits.maxSavedStarmaps,
          remaining: limits.savedRemaining,
        },
      },
      carryover: {
        hasFreeTierCarryover: limits.hasFreeTierCarryover,
        expiresAt: limits.carryoverExpiresAt,
      },
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `usage-data-${format(new Date(), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Generate mock historical data for visualization
  const historicalData = useMemo(() => {
    if (!limits) return [];

    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      months.push({
        month: format(date, 'MMM'),
        generations: Math.floor(Math.random() * limits.maxGenerationsMonthly),
        saved: Math.floor(Math.random() * limits.maxSavedStarmaps),
      });
    }
    return months;
  }, [limits]);

  if (loading) {
    return (
      <GlassCard className={className}>
        <div className="flex h-[500px] items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="border-primary h-12 w-12 rounded-full border-4 border-t-transparent"
          />
        </div>
      </GlassCard>
    );
  }

  if (error || !limits) {
    return (
      <GlassCard className={className}>
        <div className="flex h-[500px] flex-col items-center justify-center gap-4 p-6">
          <Info className="h-12 w-12 text-red-500" />
          <p className="text-center text-sm text-red-600">{error || 'Failed to load usage data'}</p>
          <Button onClick={handleRefresh} className="btn-primary">
            Retry
          </Button>
        </div>
      </GlassCard>
    );
  }

  const isUnlimited = hasUnlimitedAccess(limits.role);
  const isFreeTier = limits.tier === 'free';
  const nextResetDate = addMonths(new Date(), 1);
  nextResetDate.setDate(1);

  const creationPercentage = isUnlimited
    ? 0
    : limits.maxGenerationsMonthly > 0
      ? (limits.currentGenerations / limits.maxGenerationsMonthly) * 100
      : 0;

  const savingPercentage = isUnlimited
    ? 0
    : limits.maxSavedStarmaps > 0
      ? (limits.currentSavedStarmaps / limits.maxSavedStarmaps) * 100
      : 0;

  return (
    <GlassCard className={className}>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between border-b border-neutral-200 pb-4">
        <div>
          <h2 className="text-foreground mb-1 text-2xl font-bold">Usage Analytics</h2>
          <p className="text-text-secondary text-sm">Detailed breakdown and insights</p>
        </div>
        <div className="flex items-center gap-2">
          <TierBadge tier={limits.tier} size="md" variant="solid" showIcon animated />
          <Button onClick={handleRefresh} disabled={refreshing} className="btn-ghost" size="sm">
            <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6 grid w-full grid-cols-3 bg-neutral-100">
          <TabsTrigger value="current" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Current
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            History
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Current Tab */}
        <TabsContent value="current" className="space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key="current"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Quick Stats Grid */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                  className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 p-4"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <Star className="h-5 w-5 text-blue-600" />
                    <span className="text-text-secondary text-xs">
                      {isFreeTier ? 'Lifetime' : 'This Month'}
                    </span>
                  </div>
                  <p className="text-foreground mb-1 text-2xl font-bold">
                    {limits.currentGenerations}
                  </p>
                  <p className="text-text-secondary text-xs">Starmaps Created</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50 p-4"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <Activity className="h-5 w-5 text-purple-600" />
                    <span className="text-text-secondary text-xs">
                      {isFreeTier ? 'Total' : 'Active'}
                    </span>
                  </div>
                  <p className="text-foreground mb-1 text-2xl font-bold">
                    {limits.currentSavedStarmaps}
                  </p>
                  <p className="text-text-secondary text-xs">Starmaps Saved</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-4"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <TrendingUp className="h-5 w-5 text-emerald-600" />
                    <span className="text-text-secondary text-xs">Available</span>
                  </div>
                  <p className="text-foreground mb-1 text-2xl font-bold">
                    {isUnlimited ? '∞' : limits.generationsRemaining}
                  </p>
                  <p className="text-text-secondary text-xs">Generations Left</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                  className="rounded-xl border border-yellow-200 bg-gradient-to-br from-yellow-50 to-amber-50 p-4"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <Clock className="h-5 w-5 text-yellow-600" />
                    <span className="text-text-secondary text-xs">
                      {isFreeTier ? 'Forever' : 'Resets'}
                    </span>
                  </div>
                  <p className="text-foreground mb-1 text-2xl font-bold">
                    {isFreeTier
                      ? '∞'
                      : Math.ceil((nextResetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))}
                  </p>
                  <p className="text-text-secondary text-xs">
                    {isFreeTier ? 'No Expiry' : 'Days Remaining'}
                  </p>
                </motion.div>
              </div>

              {/* Detailed Breakdown */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Generations Breakdown */}
                <div className="rounded-xl border border-neutral-200 bg-gradient-to-br from-white to-neutral-50 p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-foreground text-lg font-semibold">Generation Limits</h3>
                    <div className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-600">
                      {isUnlimited ? 'Unlimited' : `${creationPercentage.toFixed(0)}% Used`}
                    </div>
                  </div>

                  <div className="mb-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary text-sm">Current Usage</span>
                      <span className="text-foreground text-lg font-bold">
                        {limits.currentGenerations}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary text-sm">Monthly Limit</span>
                      <span className="text-foreground text-lg font-bold">
                        {isUnlimited ? '∞' : limits.maxGenerationsMonthly}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary text-sm">Remaining</span>
                      <span className="text-lg font-bold text-emerald-600">
                        {isUnlimited ? '∞' : limits.generationsRemaining}
                      </span>
                    </div>
                  </div>

                  {!isUnlimited && (
                    <div className="h-2 overflow-hidden rounded-full bg-neutral-200">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(creationPercentage, 100)}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-600"
                      />
                    </div>
                  )}
                </div>

                {/* Saved Starmaps Breakdown */}
                <div className="rounded-xl border border-neutral-200 bg-gradient-to-br from-white to-neutral-50 p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-foreground text-lg font-semibold">Storage Limits</h3>
                    <div className="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-600">
                      {isUnlimited ? 'Unlimited' : `${savingPercentage.toFixed(0)}% Used`}
                    </div>
                  </div>

                  <div className="mb-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary text-sm">Currently Saved</span>
                      <span className="text-foreground text-lg font-bold">
                        {limits.currentSavedStarmaps}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary text-sm">Storage Limit</span>
                      <span className="text-foreground text-lg font-bold">
                        {isUnlimited ? '∞' : limits.maxSavedStarmaps}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary text-sm">Available Slots</span>
                      <span className="text-lg font-bold text-emerald-600">
                        {isUnlimited ? '∞' : limits.savedRemaining}
                      </span>
                    </div>
                  </div>

                  {!isUnlimited && (
                    <div className="h-2 overflow-hidden rounded-full bg-neutral-200">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(savingPercentage, 100)}%` }}
                        transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
                        className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-600"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Carryover & Rollover Info */}
              {limits.hasFreeTierCarryover && limits.carryoverExpiresAt && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-blue-200 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 p-6"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600">
                      <Sparkles className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="mb-2 text-lg font-semibold text-blue-600">
                        Free Tier Carryover Active
                      </h4>
                      <p className="text-text-secondary mb-3 text-sm">
                        Your unused free tier starmaps have been carried over as bonus credits.
                      </p>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-blue-500" />
                        <span className="text-text-secondary">
                          Expires{' '}
                          {formatDistanceToNow(new Date(limits.carryoverExpiresAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {!isFreeTier && !isUnlimited && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 p-6"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600">
                      <Clock className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="mb-2 text-lg font-semibold text-emerald-600">
                        12-Month Rollover Active
                      </h4>
                      <p className="text-text-secondary mb-3 text-sm">
                        Unused starmaps accumulate for 12 months. Your allocation never goes to
                        waste!
                      </p>
                      <div className="flex items-center gap-2 text-sm">
                        <Info className="h-4 w-4 text-emerald-500" />
                        <span className="text-text-secondary">
                          Resets {formatDistanceToNow(nextResetDate, { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Usage Trend Chart */}
              <div className="rounded-xl border border-neutral-200 bg-gradient-to-br from-white to-neutral-50 p-6">
                <h3 className="text-foreground mb-6 text-lg font-semibold">Usage Trends</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        backdropFilter: 'blur(10px)',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="generations"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ fill: '#3b82f6', r: 4 }}
                      name="Generations"
                    />
                    <Line
                      type="monotone"
                      dataKey="saved"
                      stroke="#a855f7"
                      strokeWidth={2}
                      dot={{ fill: '#a855f7', r: 4 }}
                      name="Saved"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Monthly Breakdown */}
              <div className="rounded-xl border border-neutral-200 bg-gradient-to-br from-white to-neutral-50 p-6">
                <h3 className="text-foreground mb-6 text-lg font-semibold">Monthly Breakdown</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        backdropFilter: 'blur(10px)',
                      }}
                    />
                    <Bar dataKey="generations" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="saved" fill="#a855f7" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Lifetime Stats */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 p-6">
                  <Star className="mb-3 h-8 w-8 text-blue-600" />
                  <p className="text-foreground mb-1 text-3xl font-bold">
                    {limits.currentGenerations}
                  </p>
                  <p className="text-text-secondary text-sm">Total Starmaps Created</p>
                </div>
                <div className="rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50 p-6">
                  <Activity className="mb-3 h-8 w-8 text-purple-600" />
                  <p className="text-foreground mb-1 text-3xl font-bold">
                    {limits.currentSavedStarmaps}
                  </p>
                  <p className="text-text-secondary text-sm">Currently Saved</p>
                </div>
                <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-6">
                  <TrendingUp className="mb-3 h-8 w-8 text-emerald-600" />
                  <p className="text-foreground mb-1 text-3xl font-bold">
                    {Math.floor(
                      (limits.currentGenerations / (limits.maxGenerationsMonthly || 1)) * 100
                    )}
                    %
                  </p>
                  <p className="text-text-secondary text-sm">Average Utilization</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Export Section */}
              <div className="rounded-xl border border-neutral-200 bg-gradient-to-br from-white to-neutral-50 p-6">
                <h3 className="text-foreground mb-4 text-lg font-semibold">Export Usage Data</h3>
                <p className="text-text-secondary mb-4 text-sm">
                  Download your usage data as a JSON file for record-keeping or analysis.
                </p>
                <Button onClick={handleExport} className="btn-primary">
                  <Download className="mr-2 h-4 w-4" />
                  Export Data
                </Button>
              </div>

              {/* Preferences */}
              <div className="rounded-xl border border-neutral-200 bg-gradient-to-br from-white to-neutral-50 p-6">
                <h3 className="text-foreground mb-4 text-lg font-semibold">Usage Preferences</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-foreground text-sm font-medium">
                        Email usage notifications
                      </p>
                      <p className="text-text-secondary text-xs">
                        Get notified when approaching limits
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      className="text-primary focus:ring-primary h-5 w-5 rounded border-neutral-300 focus:ring-2"
                      defaultChecked
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-foreground text-sm font-medium">Monthly usage reports</p>
                      <p className="text-text-secondary text-xs">Receive monthly summaries</p>
                    </div>
                    <input
                      type="checkbox"
                      className="text-primary focus:ring-primary h-5 w-5 rounded border-neutral-300 focus:ring-2"
                      defaultChecked
                    />
                  </div>
                </div>
              </div>

              {/* Account Information */}
              <div className="rounded-xl border border-neutral-200 bg-gradient-to-br from-white to-neutral-50 p-6">
                <h3 className="text-foreground mb-4 text-lg font-semibold">Account Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                    <span className="text-text-secondary text-sm">Account Tier</span>
                    <TierBadge tier={limits.tier} size="sm" variant="outlined" showIcon />
                  </div>
                  <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                    <span className="text-text-secondary text-sm">User Role</span>
                    <span className="text-foreground text-sm font-medium">{limits.role}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary text-sm">Access Level</span>
                    <span className="text-foreground text-sm font-medium">
                      {isUnlimited ? 'Unlimited' : 'Standard'}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </TabsContent>
      </Tabs>
    </GlassCard>
  );
}

function cn(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
