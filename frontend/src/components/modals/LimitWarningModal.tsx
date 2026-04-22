'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TierBadge } from '@/components/ui/TierBadge';
import {
  Star,
  Activity,
  AlertCircle,
  TrendingUp,
  Calendar,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import {
  BlueprintUsageService,
  type ComprehensiveUserLimits,
} from '@/lib/services/blueprintUsageService';
import { addMonths, formatDistanceToNow } from 'date-fns';
import { hasUnlimitedAccess } from '@/lib/utils/tierDisplay';
import Link from 'next/link';

/**
 * LimitWarningModal Component
 *
 * A beautiful, informative modal shown before creating a new starmap.
 * Displays remaining allocations and prompts upgrade when near/at limits.
 *
 * Features:
 * - Smooth entrance/exit animations
 * - Clear usage breakdown
 * - Reset date countdown
 * - Upgrade prompt when needed
 * - Fully accessible (keyboard navigation, ARIA)
 * - Gradient border and backdrop blur
 */

interface LimitWarningModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContinue: () => void;
  action?: 'create' | 'save';
}

export function LimitWarningModal({
  open,
  onOpenChange,
  onContinue,
  action = 'create',
}: LimitWarningModalProps) {
  const { user } = useAuth();
  const [limits, setLimits] = useState<ComprehensiveUserLimits | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open || !user?.id) {
      return;
    }

    const fetchLimits = async () => {
      try {
        setLoading(true);
        const supabase = getSupabaseBrowserClient();
        const data = await BlueprintUsageService.getComprehensiveUserLimits(supabase, user.id);
        setLimits(data);
      } catch (err) {
        console.error('Error fetching limits:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLimits();
  }, [open, user?.id]);

  if (!limits) {
    return null;
  }

  const isUnlimited = hasUnlimitedAccess(limits.role);
  const isFreeTier = limits.tier === 'free';
  const isCreate = action === 'create';

  const currentCount = isCreate ? limits.currentGenerations : limits.currentSavedStarmaps;
  const maxCount = isCreate ? limits.maxGenerationsMonthly : limits.maxSavedStarmaps;
  const remaining = isCreate ? limits.generationsRemaining : limits.savedRemaining;

  const percentage = isUnlimited ? 0 : maxCount > 0 ? (currentCount / maxCount) * 100 : 0;
  const isNearLimit = percentage >= 75;
  const isAtLimit = percentage >= 90;

  // Calculate reset date
  const nextResetDate = addMonths(new Date(), 1);
  nextResetDate.setDate(1);
  const daysUntilReset = Math.ceil((nextResetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  const handleContinue = () => {
    onContinue();
    onOpenChange(false);
  };

  const getIcon = () => {
    if (isAtLimit) return AlertCircle;
    if (isNearLimit) return TrendingUp;
    return isCreate ? Star : Activity;
  };

  const Icon = getIcon();

  const getStatusColor = () => {
    if (isAtLimit) return 'from-red-500 to-rose-600';
    if (isNearLimit) return 'from-yellow-500 to-amber-600';
    return 'from-blue-500 to-cyan-600';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-0 bg-white/95 p-0 shadow-2xl backdrop-blur-xl">
        {/* Gradient Border Effect */}
        <div className="from-primary/20 absolute inset-0 -z-10 rounded-lg bg-gradient-to-br via-purple-500/20 to-pink-500/20 p-[2px]">
          <div className="h-full w-full rounded-lg bg-white/95 backdrop-blur-xl" />
        </div>

        {/* Decorative Background */}
        <div className="from-primary/10 absolute top-0 right-0 -z-10 h-48 w-48 rounded-full bg-gradient-to-br to-purple-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 -z-10 h-48 w-48 rounded-full bg-gradient-to-tr from-pink-500/10 to-blue-500/10 blur-3xl" />

        <div className="p-6">
          <DialogHeader className="mb-6">
            {/* Icon */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', duration: 0.6 }}
              className="from-primary shadow-primary/30 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br to-purple-600 shadow-lg"
            >
              <Icon className="h-8 w-8 text-white" />
            </motion.div>

            <DialogTitle className="text-center text-2xl font-bold">
              {isAtLimit ? 'Limit Reached' : isNearLimit ? 'Almost There!' : 'Ready to Continue?'}
            </DialogTitle>
            <DialogDescription className="text-center">
              {isAtLimit
                ? `You've used all your ${isCreate ? 'generations' : 'saved starmaps'} for this ${isFreeTier ? 'account' : 'month'}.`
                : isNearLimit
                  ? `You're approaching your ${isCreate ? 'generation' : 'storage'} limit.`
                  : `You're about to ${isCreate ? 'create' : 'save'} a new starmap.`}
            </DialogDescription>
          </DialogHeader>

          {/* Loading State */}
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex h-32 items-center justify-center"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="border-primary h-8 w-8 rounded-full border-4 border-t-transparent"
                />
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                {/* Tier Badge */}
                <div className="flex items-center justify-center">
                  <TierBadge tier={limits.tier} size="md" variant="solid" showIcon animated />
                </div>

                {/* Usage Stats */}
                <div className="rounded-xl border border-neutral-200 bg-gradient-to-br from-neutral-50 to-white p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-text-secondary text-sm font-medium">
                      {isCreate ? 'Generations' : 'Saved Starmaps'}
                    </p>
                    <p className="text-text-secondary text-xs">
                      {isFreeTier ? 'Lifetime' : 'This month'}
                    </p>
                  </div>

                  <div className="mb-2 flex items-baseline gap-2">
                    <p className="text-foreground text-3xl font-bold">
                      {currentCount + (isAtLimit ? 0 : 1)}
                    </p>
                    <p className="text-text-secondary text-lg">/ {isUnlimited ? '∞' : maxCount}</p>
                  </div>

                  {/* Progress Bar */}
                  {!isUnlimited && (
                    <div className="mb-3 h-2 overflow-hidden rounded-full bg-neutral-200">
                      <motion.div
                        initial={{ width: `${percentage}%` }}
                        animate={{
                          width: `${Math.min(percentage + (isAtLimit ? 0 : 100 / maxCount), 100)}%`,
                        }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                        className={cn('h-full rounded-full bg-gradient-to-r', getStatusColor())}
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs">
                    <span
                      className={cn('font-medium', {
                        'text-red-600': isAtLimit,
                        'text-yellow-600': isNearLimit && !isAtLimit,
                        'text-emerald-600': !isNearLimit,
                      })}
                    >
                      {isUnlimited
                        ? 'Unlimited'
                        : isAtLimit
                          ? 'No slots remaining'
                          : `${remaining - 1} remaining after this`}
                    </span>
                    {!isFreeTier && !isUnlimited && (
                      <span className="text-text-secondary flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Resets in {daysUntilReset}d
                      </span>
                    )}
                  </div>
                </div>

                {/* Carryover Notice */}
                {limits.hasFreeTierCarryover && limits.carryoverExpiresAt && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="rounded-lg border border-blue-200 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 p-3"
                  >
                    <div className="flex items-start gap-2">
                      <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600" />
                      <div className="flex-1">
                        <p className="text-xs font-medium text-blue-600">Free Tier Bonus Active</p>
                        <p className="text-text-secondary mt-0.5 text-xs">
                          Expires{' '}
                          {formatDistanceToNow(new Date(limits.carryoverExpiresAt), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Upgrade Prompt */}
                {isFreeTier && isNearLimit && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="border-primary/30 from-primary/10 rounded-lg border bg-gradient-to-r to-purple-500/10 p-3"
                  >
                    <div className="mb-2 flex items-start gap-2">
                      <TrendingUp className="text-primary mt-0.5 h-4 w-4 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-foreground text-xs font-semibold">
                          Unlock More Starmaps
                        </p>
                        <p className="text-text-secondary mt-0.5 text-xs">
                          Upgrade for {isCreate ? '20+ generations' : '20+ saved starmaps'} per
                          month
                        </p>
                      </div>
                    </div>
                    <Link href="/pricing" className="block">
                      <Button variant="outline" size="sm" className="w-full">
                        View Plans
                        <ArrowRight className="ml-2 h-3 w-3" />
                      </Button>
                    </Link>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Actions */}
          <DialogFooter className="mt-6 gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleContinue}
              disabled={loading || (isAtLimit && !isUnlimited)}
              className={cn('flex-1', {
                'btn-primary': !isAtLimit,
                'cursor-not-allowed opacity-50': isAtLimit && !isUnlimited,
              })}
            >
              {isAtLimit && !isUnlimited ? 'Limit Reached' : 'Continue'}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function cn(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
