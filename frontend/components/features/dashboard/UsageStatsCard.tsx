'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Save, TrendingUp, AlertCircle, Crown, Sparkles, Star, Activity } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { getTierDisplayNameShort, isFreeTier } from '@/lib/utils/tierDisplay';

interface UsageStatsCardProps {
  creationCount: number;
  creationLimit: number;
  savingCount: number;
  savingLimit: number;
  subscriptionTier: string;
  isLifetime?: boolean;
}

export function UsageStatsCard({
  creationCount,
  creationLimit,
  savingCount,
  savingLimit,
  subscriptionTier,
  isLifetime = true,
}: UsageStatsCardProps) {
  // Handle unlimited limits (-1 means unlimited)
  const isCreationUnlimited = creationLimit === -1;
  const isSavingUnlimited = savingLimit === -1;

  const creationPercentage = isCreationUnlimited
    ? 0
    : creationLimit > 0
      ? (creationCount / creationLimit) * 100
      : 0;
  const savingPercentage = isSavingUnlimited
    ? 0
    : savingLimit > 0
      ? (savingCount / savingLimit) * 100
      : 0;

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'from-primary to-primary';
    if (percentage >= 80) return 'from-primary to-primary';
    if (percentage >= 50) return 'from-primary to-primary';
    return 'from-primary to-primary';
  };

  const getStatusMessage = () => {
    // Check for unlimited access first (highest priority)
    if (subscriptionTier === 'developer' || isCreationUnlimited || isSavingUnlimited) {
      return {
        icon: Sparkles,
        text: 'Unlimited Access',
        color: 'text-orange-600',
        bgColor: 'bg-gradient-to-r from-orange-500/10 to-red-500/10',
      };
    }

    if (isFreeTier(subscriptionTier)) {
      const totalUsed = creationCount + savingCount;
      const totalLimit = creationLimit + savingLimit;

      if (totalUsed >= totalLimit) {
        return {
          icon: AlertCircle,
          text: "You've reached your lifetime limit",
          color: 'text-error',
          bgColor: 'bg-error/10',
        };
      } else if (totalUsed >= totalLimit * 0.8) {
        return {
          icon: AlertCircle,
          text: `${totalLimit - totalUsed} starmap${totalLimit - totalUsed !== 1 ? 's' : ''} remaining`,
          color: 'text-warning',
          bgColor: 'bg-warning/10',
        };
      } else {
        return {
          icon: Sparkles,
          text: getTierDisplayNameShort(subscriptionTier),
          color: 'text-success',
          bgColor: 'bg-success/10',
        };
      }
    }
    return {
      icon: Crown,
      text: getTierDisplayNameShort(subscriptionTier),
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    };
  };

  const status = getStatusMessage();
  const StatusIcon = status.icon;

  return (
    <GlassCard className="relative h-full overflow-hidden p-6 sm:p-8">
      {/* Background gradient decoration */}
      <div className="from-primary/5 to-primary/10 absolute top-0 right-0 -z-10 h-64 w-64 rounded-full bg-gradient-to-br blur-3xl" />

      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h3 className="text-title text-foreground mb-2 font-bold">Usage Statistics</h3>
          <p className="text-caption text-text-secondary">
            {isLifetime && isFreeTier(subscriptionTier)
              ? 'Lifetime allocation for Free Tier Members'
              : 'Your current usage and limits'}
          </p>
        </div>
        <div className={`rounded-full px-3 py-1.5 ${status.bgColor} flex items-center gap-2`}>
          <StatusIcon className={`h-4 w-4 ${status.color}`} />
          <span className={`text-caption font-medium ${status.color}`}>{status.text}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="space-y-6">
        {/* Created Starmaps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="from-primary to-primary shadow-primary/20 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br shadow-lg">
                <Star className="h-5 w-5 text-black" />
              </div>
              <div>
                <p className="text-body text-foreground font-semibold">Starmaps Created</p>
                <p className="text-caption text-text-secondary">
                  {isLifetime ? 'Lifetime count' : 'This period'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-heading text-foreground font-bold">
                {creationCount}{' '}
                <span className="text-body text-text-secondary font-normal">
                  / {isCreationUnlimited ? '∞' : creationLimit}
                </span>
              </p>
              <p
                className={`text-caption font-medium ${
                  isCreationUnlimited
                    ? 'text-success'
                    : creationPercentage >= 100
                      ? 'text-error'
                      : creationPercentage >= 80
                        ? 'text-warning'
                        : 'text-success'
                }`}
              >
                {isCreationUnlimited ? 'Unlimited' : `${creationPercentage.toFixed(0)}% used`}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="relative h-2 overflow-hidden rounded-full bg-neutral-200">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(creationPercentage, 100)}%` }}
              transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
              className={`absolute top-0 left-0 h-full bg-gradient-to-r ${getProgressColor(creationPercentage)} rounded-full`}
            >
              {creationPercentage > 10 && (
                <div className="absolute top-1/2 right-2 -translate-y-1/2">
                  <div className="h-1 w-1 animate-pulse rounded-full bg-white" />
                </div>
              )}
            </motion.div>
          </div>
        </motion.div>

        {/* Saved Starmaps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="from-primary to-primary shadow-primary/20 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br shadow-lg">
                <Activity className="h-5 w-5 text-black" />
              </div>
              <div>
                <p className="text-body text-foreground font-semibold">Starmaps Saved</p>
                <p className="text-caption text-text-secondary">
                  {isLifetime ? 'Lifetime storage' : 'Current storage'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-heading text-foreground font-bold">
                {savingCount}{' '}
                <span className="text-body text-text-secondary font-normal">
                  / {isSavingUnlimited ? '∞' : savingLimit}
                </span>
              </p>
              <p
                className={`text-caption font-medium ${
                  isSavingUnlimited
                    ? 'text-success'
                    : savingPercentage >= 100
                      ? 'text-error'
                      : savingPercentage >= 80
                        ? 'text-warning'
                        : 'text-success'
                }`}
              >
                {isSavingUnlimited ? 'Unlimited' : `${savingPercentage.toFixed(0)}% used`}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="relative h-2 overflow-hidden rounded-full bg-neutral-200">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(savingPercentage, 100)}%` }}
              transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
              className={`absolute top-0 left-0 h-full bg-gradient-to-r ${getProgressColor(savingPercentage)} rounded-full`}
            >
              {savingPercentage > 10 && (
                <div className="absolute top-1/2 right-2 -translate-y-1/2">
                  <div className="h-1 w-1 animate-pulse rounded-full bg-white" />
                </div>
              )}
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Action Section */}
      {isFreeTier(subscriptionTier) &&
        (creationCount >= creationLimit || savingCount >= savingLimit) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="from-primary/10 to-primary/20 border-primary/30 mt-6 rounded-xl border bg-gradient-to-r p-4"
          >
            <div className="mb-3 flex items-start gap-3">
              <TrendingUp className="text-primary mt-0.5 h-5 w-5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="text-body text-foreground mb-1 font-semibold">
                  Unlock More Starmaps
                </h4>
                <p className="text-caption text-text-secondary">
                  Upgrade to a premium membership for unlimited starmaps and advanced features.
                </p>
              </div>
            </div>
            <Link href="/pricing">
              <Button className="btn-primary w-full">
                <Crown className="mr-2 h-4 w-4" />
                View Plans
              </Button>
            </Link>
          </motion.div>
        )}

      {/* Info for free users with available slots */}
      {isFreeTier(subscriptionTier) && creationCount < creationLimit && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-info/5 border-info/20 mt-6 rounded-lg border p-3"
        >
          <p className="text-caption text-text-secondary text-center">
            💡 Delete existing starmaps to free up slots for new ones
          </p>
        </motion.div>
      )}
    </GlassCard>
  );
}
