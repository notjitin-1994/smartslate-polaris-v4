'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Save, AlertCircle, Crown, Sparkles, TrendingUp } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { UsageProgressBar } from './UsageProgressBar';
import { TierBadge } from './UsageBadge';
import { useUsageStats } from '@/lib/hooks/useUsageStats';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { isFreeTier as checkIsFreeTier } from '@/lib/utils/tierDisplay';

/**
 * Enhanced Usage Stats Display Component
 * Uses the useUsageStats hook for real-time data
 *
 * This replaces the old UsageStatsCard and adds:
 * - Real-time usage fetching
 * - Auto-refresh capability
 * - Loading and error states
 * - Better visual hierarchy
 */
export function UsageStatsDisplay({ className }: { className?: string }) {
  const {
    usage,
    loading,
    error,
    refreshUsage,
    isCreationLimitReached,
    isSavingLimitReached,
    creationPercentage,
    savingPercentage,
  } = useUsageStats();

  if (loading && !usage) {
    return (
      <GlassCard className={cn('h-full p-6 sm:p-8', className)}>
        <div className="animate-pulse space-y-6">
          <div>
            <div className="mb-2 h-6 w-48 rounded bg-neutral-200" />
            <div className="h-4 w-64 rounded bg-neutral-200" />
          </div>
          <div className="space-y-4">
            <div className="h-20 rounded bg-neutral-200" />
            <div className="h-20 rounded bg-neutral-200" />
          </div>
        </div>
      </GlassCard>
    );
  }

  if (error) {
    return (
      <GlassCard className={cn('h-full p-6 sm:p-8', className)}>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <AlertCircle className="text-error mb-4 h-12 w-12" />
          <h3 className="text-heading text-foreground mb-2 font-bold">Failed to Load Usage Data</h3>
          <p className="text-caption text-text-secondary mb-4">{error}</p>
          <Button onClick={refreshUsage} variant="outline" size="medium">
            Try Again
          </Button>
        </div>
      </GlassCard>
    );
  }

  if (!usage) {
    return null;
  }

  const isFreeTier = checkIsFreeTier(usage.subscriptionTier);
  const showUpgrade = isFreeTier && (isCreationLimitReached || isSavingLimitReached);

  return (
    <GlassCard className={cn('relative h-full overflow-hidden p-6 sm:p-8', className)}>
      {/* Background gradient decoration */}
      <div className="from-primary/5 to-secondary/5 absolute top-0 right-0 -z-10 h-64 w-64 rounded-full bg-gradient-to-br blur-3xl" />

      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h3 className="text-title text-foreground mb-2 font-bold">Usage Statistics</h3>
          <p className="text-caption text-text-secondary">
            {isFreeTier
              ? 'Lifetime allocation for Free Tier Members'
              : 'Your current usage and limits'}
          </p>
        </div>
        <TierBadge tier={usage.subscriptionTier} isExempt={usage.isExempt} />
      </div>

      {/* Stats Grid */}
      <div className="space-y-6">
        {/* Blueprint Creations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-3"
        >
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 shadow-lg shadow-blue-500/20">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-body text-foreground font-semibold">Blueprints Created</p>
                <p className="text-caption text-text-secondary">
                  {isFreeTier ? 'Lifetime count' : 'This period'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-heading text-foreground font-bold">
                {usage.creationCount}{' '}
                <span className="text-body text-text-secondary font-normal">
                  / {usage.creationLimit}
                </span>
              </p>
            </div>
          </div>

          <UsageProgressBar
            current={usage.creationCount}
            limit={usage.creationLimit}
            showPercentage={false}
            showCount={false}
          />
        </motion.div>

        {/* Blueprint Saves */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg shadow-purple-500/20">
                <Save className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-body text-foreground font-semibold">Blueprints Saved</p>
                <p className="text-caption text-text-secondary">
                  {isFreeTier ? 'Lifetime storage' : 'Current storage'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-heading text-foreground font-bold">
                {usage.savingCount}{' '}
                <span className="text-body text-text-secondary font-normal">
                  / {usage.savingLimit}
                </span>
              </p>
            </div>
          </div>

          <UsageProgressBar
            current={usage.savingCount}
            limit={usage.savingLimit}
            showPercentage={false}
            showCount={false}
          />
        </motion.div>
      </div>

      {/* Upgrade CTA */}
      {showUpgrade && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="from-primary/10 to-secondary/10 border-primary/20 mt-6 rounded-xl border bg-gradient-to-r p-4"
        >
          <div className="mb-3 flex items-start gap-3">
            <TrendingUp className="text-primary mt-0.5 h-5 w-5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-body text-foreground mb-1 font-semibold">
                Unlock Unlimited Access
              </h4>
              <p className="text-caption text-text-secondary">
                Upgrade to a premium membership for unlimited blueprints and advanced features.
              </p>
            </div>
          </div>
          <Link href="/pricing">
            <Button
              className={cn(
                'btn-primary w-full',
                'from-secondary to-secondary/90 bg-gradient-to-r',
                'hover:from-secondary/90 hover:to-secondary/80'
              )}
            >
              <Crown className="mr-2 h-4 w-4" />
              View Pricing Plans
            </Button>
          </Link>
        </motion.div>
      )}

      {/* Info for users with remaining slots */}
      {isFreeTier &&
        !isCreationLimitReached &&
        !isSavingLimitReached &&
        (creationPercentage > 50 || savingPercentage > 50) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-info/5 border-info/20 mt-6 rounded-lg border p-3"
          >
            <p className="text-caption text-text-secondary text-center">
              💡 Delete existing blueprints to free up slots for new ones
            </p>
          </motion.div>
        )}

      {/* Premium user message */}
      {!isFreeTier && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-success/5 border-success/20 mt-6 rounded-lg border p-3"
        >
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="text-success h-4 w-4" />
            <p className="text-caption text-success font-medium">
              You have unlimited blueprint access!
            </p>
          </div>
        </motion.div>
      )}
    </GlassCard>
  );
}

/**
 * Compact version for sidebar or header
 */
export function CompactUsageDisplay({ className }: { className?: string }) {
  const { usage, loading, creationPercentage, savingPercentage } = useUsageStats({
    autoRefresh: false,
  });

  if (loading || !usage) {
    return (
      <div className={cn('animate-pulse', className)}>
        <div className="mb-2 h-4 w-32 rounded bg-neutral-200" />
        <div className="h-2 w-full rounded bg-neutral-200" />
      </div>
    );
  }

  const isFreeTier = checkIsFreeTier(usage.subscriptionTier);

  if (!isFreeTier) {
    return (
      <div className={cn('text-caption flex items-center gap-2', className)}>
        <Crown className="text-secondary h-4 w-4" />
        <span className="text-text-secondary">Unlimited</span>
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div>
        <div className="mb-1 flex items-center justify-between">
          <span className="text-caption text-text-secondary">Creations</span>
          <span className="text-caption text-foreground font-medium">
            {usage.creationRemaining} left
          </span>
        </div>
        <UsageProgressBar
          current={usage.creationCount}
          limit={usage.creationLimit}
          variant="compact"
          showPercentage={false}
          showCount={false}
        />
      </div>
      <div>
        <div className="mb-1 flex items-center justify-between">
          <span className="text-caption text-text-secondary">Saves</span>
          <span className="text-caption text-foreground font-medium">
            {usage.savingRemaining} left
          </span>
        </div>
        <UsageProgressBar
          current={usage.savingCount}
          limit={usage.savingLimit}
          variant="compact"
          showPercentage={false}
          showCount={false}
        />
      </div>
    </div>
  );
}
