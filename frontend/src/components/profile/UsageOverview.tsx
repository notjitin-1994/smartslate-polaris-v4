'use client';

import { motion } from 'framer-motion';
import { FileText, Save, TrendingUp, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { GlassCard } from '@/components/ui/GlassCard';
import { cn } from '@/lib/utils';
import { getTierInfo } from '@/lib/utils/tierDisplay';
import type { Database } from '@/types/supabase';

type UserProfile = Database['public']['Tables']['user_profiles']['Row'];

interface UsageOverviewProps {
  profile: UserProfile | null;
  loading?: boolean;
}

/**
 * UsageOverview - Simplified usage dashboard with progress bars
 * Features:
 * - Blueprint creation progress bar
 * - Blueprint saving progress bar
 * - Visual percentage indicators
 * - Upgrade CTA when approaching limits
 */
export function UsageOverview({ profile, loading = false }: UsageOverviewProps) {
  if (loading) {
    return (
      <GlassCard className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="bg-text-disabled/20 h-5 w-32 rounded" />
          <div className="space-y-3">
            <div className="bg-text-disabled/10 h-20 rounded-lg" />
            <div className="bg-text-disabled/10 h-20 rounded-lg" />
          </div>
        </div>
      </GlassCard>
    );
  }

  // Calculate usage percentages
  const creationUsage = profile?.blueprint_creation_limit
    ? (profile.blueprint_creation_count / profile.blueprint_creation_limit) * 100
    : 0;

  const savingUsage = profile?.blueprint_saving_limit
    ? (profile.blueprint_saving_count / profile.blueprint_saving_limit) * 100
    : 0;

  // Check if approaching limits (>80%)
  const approachingCreationLimit = creationUsage >= 80;
  const approachingSavingLimit = savingUsage >= 80;
  const showUpgradeCTA = approachingCreationLimit || approachingSavingLimit;

  // Get tier info for upgrade messaging
  const tierInfo = getTierInfo(profile?.subscription_tier);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      <GlassCard className="p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-heading text-text-primary font-semibold">Usage Overview</h2>
            <p className="text-caption text-text-secondary mt-1">Your monthly limits</p>
          </div>
          <div
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5',
              'border-primary-accent/20 bg-primary-accent/10 border'
            )}
          >
            <TrendingUp className="text-primary-accent h-4 w-4" />
            <span className="text-caption text-primary-accent font-medium">
              {tierInfo.shortName}
            </span>
          </div>
        </div>

        {/* Usage Metrics */}
        <div className="space-y-6">
          {/* Blueprint Creation */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="text-primary-accent h-4 w-4" />
                <span className="text-body text-text-primary font-medium">Blueprint Creation</span>
              </div>
              <span className="text-caption text-text-secondary font-medium">
                {profile?.blueprint_creation_count || 0} / {profile?.blueprint_creation_limit || 0}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="bg-background-surface relative h-3 w-full overflow-hidden rounded-full">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(creationUsage, 100)}%` }}
                transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
                className={cn(
                  'h-full rounded-full',
                  creationUsage >= 100
                    ? 'bg-error'
                    : creationUsage >= 80
                      ? 'bg-warning'
                      : 'from-primary-accent to-primary-accent-light bg-gradient-to-r'
                )}
              />
              {/* Percentage label */}
              <div
                className={cn(
                  'absolute inset-0 flex items-center justify-center',
                  'text-small font-semibold',
                  creationUsage > 50 ? 'text-white' : 'text-text-primary'
                )}
              >
                {Math.round(creationUsage)}%
              </div>
            </div>
          </motion.div>

          {/* Blueprint Saving */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
            className="space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Save className="text-secondary-accent h-4 w-4" />
                <span className="text-body text-text-primary font-medium">Blueprint Saving</span>
              </div>
              <span className="text-caption text-text-secondary font-medium">
                {profile?.blueprint_saving_count || 0} / {profile?.blueprint_saving_limit || 0}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="bg-background-surface relative h-3 w-full overflow-hidden rounded-full">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(savingUsage, 100)}%` }}
                transition={{ duration: 0.8, delay: 0.5, ease: 'easeOut' }}
                className={cn(
                  'h-full rounded-full',
                  savingUsage >= 100
                    ? 'bg-error'
                    : savingUsage >= 80
                      ? 'bg-warning'
                      : 'from-secondary-accent to-secondary-accent-light bg-gradient-to-r'
                )}
              />
              {/* Percentage label */}
              <div
                className={cn(
                  'absolute inset-0 flex items-center justify-center',
                  'text-small font-semibold',
                  savingUsage > 50 ? 'text-white' : 'text-text-primary'
                )}
              >
                {Math.round(savingUsage)}%
              </div>
            </div>
          </motion.div>
        </div>

        {/* Upgrade CTA */}
        {showUpgradeCTA && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.6 }}
            className="border-warning/30 bg-warning/5 mt-6 rounded-lg border p-4"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="text-warning mt-0.5 h-5 w-5 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <p className="text-body text-text-primary font-medium">Approaching Your Limit</p>
                <p className="text-caption text-text-secondary">
                  You're using {Math.max(Math.round(creationUsage), Math.round(savingUsage))}% of
                  your monthly allocation. Upgrade to continue creating blueprints.
                </p>
                <Link
                  href="/pricing"
                  className={cn(
                    'inline-flex items-center gap-2 rounded-lg px-4 py-2',
                    'from-primary-accent to-primary-accent-light bg-gradient-to-r',
                    'text-caption font-semibold text-white',
                    'hover:scale-105 hover:shadow-lg',
                    'transition-all duration-200',
                    'focus-visible:ring-primary-accent focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none'
                  )}
                >
                  <TrendingUp className="h-4 w-4" />
                  View Upgrade Options
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </GlassCard>
    </motion.div>
  );
}
