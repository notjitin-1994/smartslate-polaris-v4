'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  Calendar,
  Download,
  RefreshCw,
  Zap,
  Users,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/GlassCard';
import { useUserProfile } from '@/lib/hooks/useUserProfile';

export function UsageSection() {
  const { profile, loading, error, refreshProfile } = useUserProfile();
  const [selectedPeriod, setSelectedPeriod] = useState('6months');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Get current usage data from profile
  const currentUsage = useMemo(() => {
    if (!profile) {
      return {
        generations: { used: 0, limit: 0, percentage: 0, isUnlimited: false },
        savedStarmaps: { used: 0, limit: 0, percentage: 0, isUnlimited: false },
      };
    }

    // Handle unlimited limits (-1 means unlimited)
    const isGenerationUnlimited = profile.blueprint_creation_limit === -1;
    const isSavingUnlimited = profile.blueprint_saving_limit === -1;

    const generationPercentage = isGenerationUnlimited
      ? 0
      : profile.blueprint_creation_limit > 0
        ? Math.round((profile.blueprint_creation_count / profile.blueprint_creation_limit) * 100)
        : 0;

    const savingPercentage = isSavingUnlimited
      ? 0
      : profile.blueprint_saving_limit > 0
        ? Math.round((profile.blueprint_saving_count / profile.blueprint_saving_limit) * 100)
        : 0;

    return {
      generations: {
        used: profile.blueprint_creation_count,
        limit: profile.blueprint_creation_limit,
        percentage: generationPercentage,
        isUnlimited: isGenerationUnlimited,
      },
      savedStarmaps: {
        used: profile.blueprint_saving_count,
        limit: profile.blueprint_saving_limit,
        percentage: savingPercentage,
        isUnlimited: isSavingUnlimited,
      },
    };
  }, [profile]);

  // Parse usage metadata for historical data
  const usageMetadata = useMemo(() => {
    if (
      !profile?.blueprint_usage_metadata ||
      typeof profile.blueprint_usage_metadata !== 'object'
    ) {
      return null;
    }
    return profile.blueprint_usage_metadata as Record<string, any>;
  }, [profile]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshProfile();
    } catch (err) {
      console.error('Failed to refresh profile:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleExportData = async () => {
    // Create a data export
    const exportData = {
      profile: {
        user_id: profile?.user_id,
        blueprint_creation_count: profile?.blueprint_creation_count,
        blueprint_saving_count: profile?.blueprint_saving_count,
        blueprint_creation_limit: profile?.blueprint_creation_limit,
        blueprint_saving_limit: profile?.blueprint_saving_limit,
        blueprint_usage_metadata: profile?.blueprint_usage_metadata,
        subscription_tier: profile?.subscription_tier,
        created_at: profile?.created_at,
        updated_at: profile?.updated_at,
      },
      exported_at: new Date().toISOString(),
    };

    // Create and download JSON file
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `usage-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage < 50) return 'text-success';
    if (percentage < 80) return 'text-warning';
    return 'text-error';
  };

  const getProgressColor = (percentage: number) => {
    if (percentage < 50) return 'bg-success';
    if (percentage < 80) return 'bg-warning';
    return 'bg-error';
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center py-12"
      >
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-12 text-center">
        <AlertCircle className="text-error mx-auto mb-4 h-12 w-12" />
        <p className="text-error mb-4">Failed to load usage data: {error}</p>
        <Button onClick={handleRefresh} className="btn-primary">
          Retry
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/20 flex h-10 w-10 items-center justify-center rounded-xl">
            <BarChart3 className="text-primary h-5 w-5" />
          </div>
          <div>
            <h2 className="text-title text-foreground">Usage Dashboard</h2>
            <p className="text-caption text-text-secondary">
              Monitor your usage, limits, and activity history
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={handleRefresh} disabled={isRefreshing} className="btn-secondary">
            <div className="flex items-center gap-2">
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </div>
          </Button>

          <Button onClick={handleExportData} disabled={!profile} className="btn-ghost">
            <div className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export
            </div>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Current Usage Overview */}
        <div className="space-y-6">
          <GlassCard className="p-6">
            <h3 className="text-heading text-foreground mb-6">Current Usage</h3>

            <div className="space-y-6">
              {/* Generations Usage */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/20 flex h-10 w-10 items-center justify-center rounded-lg">
                      <Zap className="text-primary h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-body text-foreground font-medium">Blueprint Generations</p>
                      <p className="text-caption text-text-secondary">
                        {currentUsage.generations.used} of{' '}
                        {currentUsage.generations.isUnlimited
                          ? '∞'
                          : currentUsage.generations.limit}{' '}
                        used
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-body font-medium ${
                      currentUsage.generations.isUnlimited
                        ? 'text-success'
                        : getUsageColor(currentUsage.generations.percentage)
                    }`}
                  >
                    {currentUsage.generations.isUnlimited
                      ? 'Unlimited'
                      : `${currentUsage.generations.percentage}%`}
                  </span>
                </div>

                <div className="h-2 w-full rounded-full bg-neutral-200">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(currentUsage.generations.percentage)}`}
                    style={{ width: `${Math.min(currentUsage.generations.percentage, 100)}%` }}
                  />
                </div>
              </div>

              {/* Saved Starmaps Usage */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/20 flex h-10 w-10 items-center justify-center rounded-lg">
                      <Users className="text-primary h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-body text-foreground font-medium">Saved Starmaps</p>
                      <p className="text-caption text-text-secondary">
                        {currentUsage.savedStarmaps.used} of{' '}
                        {currentUsage.savedStarmaps.isUnlimited
                          ? '∞'
                          : currentUsage.savedStarmaps.limit}{' '}
                        saved
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-body font-medium ${
                      currentUsage.savedStarmaps.isUnlimited
                        ? 'text-success'
                        : getUsageColor(currentUsage.savedStarmaps.percentage)
                    }`}
                  >
                    {currentUsage.savedStarmaps.isUnlimited
                      ? 'Unlimited'
                      : `${currentUsage.savedStarmaps.percentage}%`}
                  </span>
                </div>

                <div className="h-2 w-full rounded-full bg-neutral-200">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(currentUsage.savedStarmaps.percentage)}`}
                    style={{ width: `${Math.min(currentUsage.savedStarmaps.percentage, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Usage Summary */}
          <GlassCard className="p-6">
            <h3 className="text-heading text-foreground mb-4">Usage Summary</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface/30 rounded-lg p-4 text-center">
                <p className="text-display text-primary font-bold">
                  {profile?.blueprint_creation_count || 0}
                </p>
                <p className="text-caption text-text-secondary">Total Generations</p>
              </div>
              <div className="bg-surface/30 rounded-lg p-4 text-center">
                <p className="text-display text-primary font-bold">
                  {profile?.blueprint_saving_count || 0}
                </p>
                <p className="text-caption text-text-secondary">Saved Starmaps</p>
              </div>
              <div className="bg-surface/30 rounded-lg p-4 text-center">
                <p className="text-display text-primary font-bold">
                  {profile?.blueprint_creation_limit || 0}
                </p>
                <p className="text-caption text-text-secondary">Generation Limit</p>
              </div>
              <div className="bg-surface/30 rounded-lg p-4 text-center">
                <p className="text-display text-primary font-bold">
                  {profile?.blueprint_saving_limit || 0}
                </p>
                <p className="text-caption text-text-secondary">Saving Limit</p>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Profile Information & Metadata */}
        <div className="space-y-6">
          <GlassCard className="p-6">
            <h3 className="text-heading text-foreground mb-4">Account Information</h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-200 py-3">
                <span className="text-body text-text-secondary">User ID</span>
                <span className="text-caption text-foreground font-mono">
                  {profile?.user_id?.slice(0, 8)}...
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-neutral-200 py-3">
                <span className="text-body text-text-secondary">Subscription Tier</span>
                <span className="text-body text-foreground font-medium capitalize">
                  {profile?.subscription_tier || 'N/A'}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-neutral-200 py-3">
                <span className="text-body text-text-secondary">User Role</span>
                <span className="text-body text-foreground font-medium capitalize">
                  {profile?.user_role || 'N/A'}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-neutral-200 py-3">
                <span className="text-body text-text-secondary">Role Assigned At</span>
                <span className="text-caption text-foreground">
                  {profile?.role_assigned_at
                    ? new Date(profile.role_assigned_at).toLocaleDateString()
                    : 'N/A'}
                </span>
              </div>

              {profile?.role_assigned_by && (
                <div className="flex items-center justify-between border-b border-neutral-200 py-3">
                  <span className="text-body text-text-secondary">Role Assigned By</span>
                  <span className="text-caption text-foreground font-mono">
                    {profile.role_assigned_by.slice(0, 8)}...
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between border-b border-neutral-200 py-3">
                <span className="text-body text-text-secondary">Account Created</span>
                <span className="text-caption text-foreground">
                  {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
                </span>
              </div>

              <div className="flex items-center justify-between py-3">
                <span className="text-body text-text-secondary">Last Updated</span>
                <span className="text-caption text-foreground">
                  {profile?.updated_at ? new Date(profile.updated_at).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </GlassCard>

          {/* Usage Metadata */}
          {usageMetadata && Object.keys(usageMetadata).length > 0 && (
            <GlassCard className="p-6">
              <h3 className="text-heading text-foreground mb-4">Usage Metadata</h3>

              <div className="space-y-3">
                {Object.entries(usageMetadata).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-start justify-between border-b border-neutral-200 py-2 last:border-0"
                  >
                    <span className="text-caption text-text-secondary capitalize">
                      {key.replace(/_/g, ' ')}
                    </span>
                    <span className="text-caption text-foreground ml-4 text-right font-mono break-all">
                      {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {/* Usage Insights */}
          <GlassCard className="p-6">
            <h3 className="text-heading text-foreground mb-4">Usage Insights</h3>

            <div className="space-y-4">
              {currentUsage.generations.percentage >= 80 && (
                <div className="bg-warning/10 border-warning/20 flex items-start gap-3 rounded-lg border p-4">
                  <BarChart3 className="text-warning mt-0.5 h-5 w-5 flex-shrink-0" />
                  <div>
                    <p className="text-body text-foreground font-medium">
                      Approaching Generation Limit
                    </p>
                    <p className="text-caption text-text-secondary">
                      You're at {currentUsage.generations.percentage}% of your generation limit.
                      Consider upgrading if you need more capacity.
                    </p>
                  </div>
                </div>
              )}

              {currentUsage.savedStarmaps.percentage >= 80 && (
                <div className="bg-warning/10 border-warning/20 flex items-start gap-3 rounded-lg border p-4">
                  <Users className="text-warning mt-0.5 h-5 w-5 flex-shrink-0" />
                  <div>
                    <p className="text-body text-foreground font-medium">
                      Approaching Storage Limit
                    </p>
                    <p className="text-caption text-text-secondary">
                      You're at {currentUsage.savedStarmaps.percentage}% of your saved starmaps
                      limit.
                    </p>
                  </div>
                </div>
              )}

              {currentUsage.generations.percentage < 50 &&
                currentUsage.savedStarmaps.percentage < 50 && (
                  <div className="bg-success/10 border-success/20 flex items-start gap-3 rounded-lg border p-4">
                    <TrendingUp className="text-success mt-0.5 h-5 w-5 flex-shrink-0" />
                    <div>
                      <p className="text-body text-foreground font-medium">Good Usage Levels</p>
                      <p className="text-caption text-text-secondary">
                        You're well within your usage limits. Keep creating!
                      </p>
                    </div>
                  </div>
                )}

              <div className="bg-info/10 border-info/20 flex items-start gap-3 rounded-lg border p-4">
                <Clock className="text-info mt-0.5 h-5 w-5 flex-shrink-0" />
                <div>
                  <p className="text-body text-foreground font-medium">Data Updates</p>
                  <p className="text-caption text-text-secondary">
                    Usage data is updated in real-time as you create and save blueprints.
                  </p>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </motion.div>
  );
}
