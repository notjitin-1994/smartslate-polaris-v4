'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star,
  Activity,
  Clock,
  Calendar,
  TrendingUp,
  Sparkles,
  AlertCircle,
  Info,
  Crown,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { TierBadge } from '@/components/ui/TierBadge';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import {
  BlueprintUsageService,
  type ComprehensiveUserLimits,
} from '@/lib/services/blueprintUsageService';
import { formatDistanceToNow, addMonths } from 'date-fns';
import { getTierDisplayNameShort, hasUnlimitedAccess } from '@/lib/utils/tierDisplay';

/**
 * EnhancedUsageStatsCard Component
 *
 * A premium, modern usage statistics card that displays:
 * - Current month usage vs limits
 * - Free tier carryover with expiry date
 * - Reset countdown for paid tiers
 * - Rollover status (12-month pool)
 * - Animated progress indicators
 * - Upgrade CTAs
 *
 * Features:
 * - Glassmorphism design
 * - Micro-interactions and smooth animations
 * - Color-coded status indicators
 * - Responsive layout
 * - Accessibility compliant
 * - Loading and error states
 */

interface EnhancedUsageStatsCardProps {
  className?: string;
}

export function EnhancedUsageStatsCard({ className }: EnhancedUsageStatsCardProps) {
  const { user } = useAuth();
  const [limits, setLimits] = useState<ComprehensiveUserLimits | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const fetchLimits = async () => {
      try {
        setLoading(true);
        setError(null);
        const supabase = getSupabaseBrowserClient();
        const data = await BlueprintUsageService.getComprehensiveUserLimits(supabase, user.id);
        setLimits(data);
      } catch (err) {
        console.error('Error fetching usage limits:', err);
        setError(err instanceof Error ? err.message : 'Failed to load usage data');
      } finally {
        setLoading(false);
      }
    };

    fetchLimits();
  }, [user?.id]);

  if (loading) {
    return (
      <GlassCard className={className}>
        <div className="flex h-[400px] items-center justify-center">
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
        <div className="flex h-[400px] flex-col items-center justify-center gap-4 p-6">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <p className="text-center text-sm text-red-600">{error || 'Failed to load usage data'}</p>
          <Button onClick={() => window.location.reload()} className="btn-primary">
            Retry
          </Button>
        </div>
      </GlassCard>
    );
  }

  const isUnlimited = hasUnlimitedAccess(limits.role);
  const isFreeTier = limits.tier === 'free';
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

  // Calculate reset date (first day of next month for paid tiers)
  const nextResetDate = addMonths(new Date(), 1);
  nextResetDate.setDate(1);
  const daysUntilReset = formatDistanceToNow(nextResetDate, { addSuffix: true });

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'from-red-500 to-rose-600';
    if (percentage >= 75) return 'from-yellow-500 to-amber-600';
    if (percentage >= 50) return 'from-blue-500 to-cyan-600';
    return 'from-emerald-500 to-teal-600';
  };

  const getStatusMessage = () => {
    if (isUnlimited) {
      return {
        icon: Sparkles,
        text: 'Unlimited Access',
        color: 'text-orange-600',
        bgColor: 'bg-gradient-to-r from-orange-500/10 to-red-500/10',
      };
    }

    const totalPercentage = (creationPercentage + savingPercentage) / 2;
    if (totalPercentage >= 90) {
      return {
        icon: AlertCircle,
        text: 'Near Limit',
        color: 'text-red-600',
        bgColor: 'bg-gradient-to-r from-red-500/10 to-rose-500/10',
      };
    }
    if (totalPercentage >= 75) {
      return {
        icon: TrendingUp,
        text: 'Approaching Limit',
        color: 'text-yellow-600',
        bgColor: 'bg-gradient-to-r from-yellow-500/10 to-amber-500/10',
      };
    }
    return {
      icon: Star,
      text: 'On Track',
      color: 'text-emerald-600',
      bgColor: 'bg-gradient-to-r from-emerald-500/10 to-teal-500/10',
    };
  };

  const status = getStatusMessage();
  const StatusIcon = status.icon;

  return (
    <GlassCard className={className}>
      {/* Background decoration */}
      <div className="from-primary/5 to-primary/10 absolute top-0 right-0 -z-10 h-64 w-64 rounded-full bg-gradient-to-br blur-3xl" />
      <div className="absolute bottom-0 left-0 -z-10 h-64 w-64 rounded-full bg-gradient-to-tr from-purple-500/5 to-pink-500/10 blur-3xl" />

      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h3 className="text-foreground mb-2 text-xl font-bold">Usage Overview</h3>
          <p className="text-text-secondary text-sm">
            {isFreeTier ? 'Lifetime allocation' : 'Current billing period'}
          </p>
        </div>
        <TierBadge tier={limits.tier} size="md" variant="solid" showIcon animated />
      </div>

      {/* Status Badge */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn('mb-6 flex items-center gap-3 rounded-xl p-4', status.bgColor)}
      >
        <div
          className={cn('flex h-10 w-10 items-center justify-center rounded-lg', status.bgColor)}
        >
          <StatusIcon className={cn('h-5 w-5', status.color)} />
        </div>
        <div className="flex-1">
          <p className={cn('text-sm font-semibold', status.color)}>{status.text}</p>
          <p className="text-text-secondary text-xs">
            {isUnlimited
              ? 'No usage restrictions'
              : isFreeTier
                ? 'Delete starmaps to create new ones'
                : `Resets ${daysUntilReset}`}
          </p>
        </div>
        {!isFreeTier && !isUnlimited && (
          <div className="flex items-center gap-2 rounded-lg bg-white/50 px-3 py-1.5 backdrop-blur-sm">
            <Calendar className="text-text-secondary h-4 w-4" />
            <span className="text-foreground text-xs font-medium">
              {Math.ceil((nextResetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days
            </span>
          </div>
        )}
      </motion.div>

      {/* Usage Stats */}
      <div className="space-y-6">
        {/* Generations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onHoverStart={() => setHoveredSection('generations')}
          onHoverEnd={() => setHoveredSection(null)}
          className="group relative"
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 shadow-lg shadow-blue-500/20">
                <Star className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-foreground text-base font-semibold">Starmaps Created</p>
                <p className="text-text-secondary text-xs">
                  {isFreeTier ? 'Lifetime' : 'This month'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-foreground text-2xl font-bold">
                {limits.currentGenerations}
                <span className="text-text-secondary text-base font-normal">
                  {' '}
                  / {isUnlimited ? '∞' : limits.maxGenerationsMonthly}
                </span>
              </p>
              <p
                className={cn('text-xs font-medium', {
                  'text-emerald-600': creationPercentage < 75,
                  'text-yellow-600': creationPercentage >= 75 && creationPercentage < 90,
                  'text-red-600': creationPercentage >= 90,
                })}
              >
                {isUnlimited ? 'Unlimited' : `${creationPercentage.toFixed(0)}% used`}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          {!isUnlimited && (
            <div className="relative h-2.5 overflow-hidden rounded-full bg-neutral-200/50 backdrop-blur-sm">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(creationPercentage, 100)}%` }}
                transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
                className={cn(
                  'absolute top-0 left-0 h-full rounded-full bg-gradient-to-r',
                  getProgressColor(creationPercentage)
                )}
              >
                <motion.div
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                />
              </motion.div>
            </div>
          )}

          {/* Tooltip on hover */}
          <AnimatePresence>
            {hoveredSection === 'generations' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute -top-16 right-0 left-0 z-10 rounded-lg border border-neutral-200 bg-white p-3 shadow-xl backdrop-blur-sm"
              >
                <p className="text-foreground text-xs font-medium">
                  {limits.generationsRemaining} generations remaining
                </p>
                <p className="text-text-secondary mt-1 text-xs">
                  {isFreeTier
                    ? 'Create new starmaps by deleting unused ones'
                    : 'Limit resets at the start of next month'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Saved Starmaps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onHoverStart={() => setHoveredSection('saved')}
          onHoverEnd={() => setHoveredSection(null)}
          className="group relative"
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg shadow-purple-500/20">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-foreground text-base font-semibold">Starmaps Saved</p>
                <p className="text-text-secondary text-xs">
                  {isFreeTier ? 'Total storage' : 'Current storage'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-foreground text-2xl font-bold">
                {limits.currentSavedStarmaps}
                <span className="text-text-secondary text-base font-normal">
                  {' '}
                  / {isUnlimited ? '∞' : limits.maxSavedStarmaps}
                </span>
              </p>
              <p
                className={cn('text-xs font-medium', {
                  'text-emerald-600': savingPercentage < 75,
                  'text-yellow-600': savingPercentage >= 75 && savingPercentage < 90,
                  'text-red-600': savingPercentage >= 90,
                })}
              >
                {isUnlimited ? 'Unlimited' : `${savingPercentage.toFixed(0)}% used`}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          {!isUnlimited && (
            <div className="relative h-2.5 overflow-hidden rounded-full bg-neutral-200/50 backdrop-blur-sm">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(savingPercentage, 100)}%` }}
                transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                className={cn(
                  'absolute top-0 left-0 h-full rounded-full bg-gradient-to-r',
                  getProgressColor(savingPercentage)
                )}
              >
                <motion.div
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                />
              </motion.div>
            </div>
          )}

          {/* Tooltip on hover */}
          <AnimatePresence>
            {hoveredSection === 'saved' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute -top-16 right-0 left-0 z-10 rounded-lg border border-neutral-200 bg-white p-3 shadow-xl backdrop-blur-sm"
              >
                <p className="text-foreground text-xs font-medium">
                  {limits.savedRemaining} slots available
                </p>
                <p className="text-text-secondary mt-1 text-xs">
                  {isFreeTier
                    ? 'Maximum saved starmaps for free tier'
                    : 'Saved starmaps roll over for 12 months'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Carryover Information */}
      {limits.hasFreeTierCarryover && limits.carryoverExpiresAt && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6 rounded-xl border border-blue-200/50 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 p-4 backdrop-blur-sm"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-blue-600">Free Tier Bonus Active</p>
              <p className="text-text-secondary mt-1 text-xs">
                Your unused free tier starmaps carry over!{' '}
                <span className="font-medium">
                  Expires{' '}
                  {formatDistanceToNow(new Date(limits.carryoverExpiresAt), { addSuffix: true })}
                </span>
              </p>
            </div>
            <Info className="h-4 w-4 flex-shrink-0 text-blue-500" />
          </div>
        </motion.div>
      )}

      {/* Rollover Info for Paid Tiers */}
      {!isFreeTier && !isUnlimited && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6 rounded-xl border border-emerald-200/50 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 p-4 backdrop-blur-sm"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
              <Clock className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-emerald-600">12-Month Rollover Active</p>
              <p className="text-text-secondary mt-1 text-xs">
                Unused starmaps roll over and remain available for 12 months. Maximize your value!
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Upgrade CTA */}
      {isFreeTier && (creationPercentage >= 75 || savingPercentage >= 75) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="border-primary/30 from-primary/10 to-primary/20 mt-6 rounded-xl border bg-gradient-to-r p-4 backdrop-blur-sm"
        >
          <div className="mb-3 flex items-start gap-3">
            <TrendingUp className="text-primary mt-0.5 h-5 w-5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-foreground text-sm font-semibold">Unlock More Starmaps</h4>
              <p className="text-text-secondary mt-1 text-xs">
                Upgrade to a premium tier for more starmaps, rollover benefits, and advanced
                features.
              </p>
            </div>
          </div>
          <Link href="/pricing">
            <Button className="btn-primary w-full">
              <Crown className="mr-2 h-4 w-4" />
              View Upgrade Options
            </Button>
          </Link>
        </motion.div>
      )}
    </GlassCard>
  );
}

function cn(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
