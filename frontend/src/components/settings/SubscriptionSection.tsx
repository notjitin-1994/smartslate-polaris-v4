'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  CreditCard,
  Crown,
  Star,
  Zap,
  Users,
  Calendar,
  ArrowUpRight,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
  Code,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/GlassCard';
import { useUserProfile } from '@/lib/hooks/useUserProfile';
import { getTierDisplayName, getTierDisplayNameShort, getTierInfo } from '@/lib/utils/tierDisplay';

// Subscription tier definitions based on the PRD tiers
const subscriptionTiers = {
  explorer: {
    name: 'Explorer',
    price: 1599,
    period: 'month',
    features: [
      '5 starmap generations per month',
      '5 saved starmaps (roll over 12 months)',
      'Basic export formats',
      'Email support',
    ],
    icon: Star,
    color: 'from-blue-500 to-cyan-500',
  },
  navigator: {
    name: 'Navigator',
    price: 3499,
    period: 'month',
    features: [
      '25 starmap generations per month',
      '25 saved starmaps (roll over 12 months)',
      'Advanced export formats',
      'Priority email support',
      'Template library access',
    ],
    icon: Crown,
    color: 'from-purple-500 to-indigo-500',
  },
  voyager: {
    name: 'Voyager',
    price: 6999,
    period: 'month',
    features: [
      '50 starmap generations per month',
      '50 saved starmaps (600/year with rollover)',
      'All export formats',
      'Priority chat support',
      'Custom template creation',
      'Advanced analytics',
    ],
    icon: Zap,
    color: 'from-emerald-500 to-teal-500',
  },
};

export function SubscriptionSection() {
  const { profile, loading, error, refreshProfile } = useUserProfile();
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Get subscription metadata from profile
  const subscriptionMetadata = useMemo(() => {
    if (!profile?.subscription_metadata || typeof profile.subscription_metadata !== 'object') {
      return null;
    }
    return profile.subscription_metadata as Record<string, any>;
  }, [profile]);

  const currentTierKey = (profile?.subscription_tier || 'free') as keyof typeof subscriptionTiers;
  const currentTier = subscriptionTiers[currentTierKey] || subscriptionTiers.explorer;
  const TierIcon = currentTier.icon;

  // Get display names using the new utility
  const currentTierDisplayName = getTierDisplayName(profile?.subscription_tier);
  const currentTierInfo = getTierInfo(profile?.subscription_tier);

  const handleUpgrade = async (targetTier: keyof typeof subscriptionTiers) => {
    if (targetTier === currentTierKey) return;

    setIsLoading(true);
    try {
      // TODO: Implement actual upgrade logic
      await new Promise((resolve) => setTimeout(resolve, 1500));
      console.log('Upgrade to:', targetTier);
      alert('Subscription upgrade feature coming soon!');
    } catch (error) {
      console.error('Failed to upgrade subscription:', error);
      alert('Failed to upgrade subscription. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription?')) {
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Implement actual cancellation logic
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log('Cancelling subscription');
      alert('Subscription cancellation feature coming soon!');
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      alert('Failed to cancel subscription. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

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
        <p className="text-error mb-4">Failed to load subscription data: {error}</p>
        <Button onClick={() => window.location.reload()} className="btn-primary">
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
            <CreditCard className="text-primary h-5 w-5" />
          </div>
          <div>
            <h2 className="text-title text-foreground">Subscription & Billing</h2>
            <p className="text-caption text-text-secondary">
              Manage your subscription, billing information, and usage limits
            </p>
          </div>
        </div>
        <Button onClick={handleRefresh} disabled={isRefreshing} className="btn-ghost">
          <div className="flex items-center gap-2">
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </div>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Current Subscription */}
        <div className="space-y-6">
          <GlassCard className="p-6">
            <h3 className="text-heading text-foreground mb-4">Current Plan</h3>

            <div className="mb-6 flex items-center gap-4">
              <div
                className={`h-12 w-12 rounded-xl bg-gradient-to-br ${currentTier.color} flex items-center justify-center`}
              >
                <TierIcon className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-title text-foreground">{currentTierDisplayName}</h4>
                </div>
                <p className="text-body text-text-secondary">
                  {currentTier.price === 0 ? 'Free' : `$${currentTier.price}`}/{currentTier.period}
                </p>
              </div>
            </div>

            {/* Subscription Status */}
            <div className="mb-6 grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-caption text-text-secondary">Membership</p>
                <div className="flex items-center gap-2">
                  <span className="text-body text-foreground font-medium">
                    {getTierDisplayNameShort(profile?.subscription_tier)}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-caption text-text-secondary">Role</p>
                <p className="text-body text-foreground">
                  {getTierDisplayNameShort(profile?.user_role)}
                </p>
              </div>
            </div>

            {/* Usage Overview */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h5 className="text-caption text-text-secondary tracking-wide uppercase">
                  {profile?.subscription_tier === 'free' ? 'Lifetime Usage' : 'Current Usage'}
                </h5>
                <div className="flex items-center gap-1.5">
                  <div className="bg-success h-2 w-2 animate-pulse rounded-full" />
                  <span className="text-text-secondary text-xs">Live</span>
                </div>
              </div>

              <div className="space-y-3">
                <motion.div
                  key={`gen-${profile?.blueprint_creation_count}`}
                  initial={{ scale: 1 }}
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 0.3 }}
                  className="bg-surface/30 flex items-center justify-between rounded-lg border border-neutral-200/10 p-3"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 shadow-lg">
                      <Zap className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-body text-foreground font-medium">Created</span>
                  </div>
                  <div className="text-right">
                    <span className="text-heading text-foreground font-bold">
                      {profile?.blueprint_creation_count ?? 0}
                    </span>
                    <span className="text-body text-text-secondary">
                      {' '}
                      /{' '}
                      {profile?.blueprint_creation_limit === -1
                        ? '∞'
                        : (profile?.blueprint_creation_limit ?? 0)}
                    </span>
                  </div>
                </motion.div>

                <motion.div
                  key={`sav-${profile?.blueprint_saving_count}`}
                  initial={{ scale: 1 }}
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 0.3 }}
                  className="bg-surface/30 flex items-center justify-between rounded-lg border border-neutral-200/10 p-3"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg">
                      <Users className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-body text-foreground font-medium">Saved</span>
                  </div>
                  <div className="text-right">
                    <span className="text-heading text-foreground font-bold">
                      {profile?.blueprint_saving_count ?? 0}
                    </span>
                    <span className="text-body text-text-secondary">
                      {' '}
                      /{' '}
                      {profile?.blueprint_saving_limit === -1
                        ? '∞'
                        : (profile?.blueprint_saving_limit ?? 0)}
                    </span>
                  </div>
                </motion.div>
              </div>

              {profile?.subscription_tier === 'free' && (
                <div className="bg-info/10 border-info/20 mt-3 rounded-lg border p-3">
                  <p className="text-caption text-text-secondary text-center">
                    💡 These are lifetime limits. Delete starmaps to create new ones.
                  </p>
                </div>
              )}
            </div>
          </GlassCard>

          {/* Subscription Metadata */}
          {subscriptionMetadata && Object.keys(subscriptionMetadata).length > 0 && (
            <GlassCard className="p-6">
              <h3 className="text-heading text-foreground mb-4">Subscription Details</h3>

              <div className="space-y-3">
                {Object.entries(subscriptionMetadata).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-start justify-between border-b border-neutral-200 py-2 last:border-0"
                  >
                    <span className="text-body text-text-secondary capitalize">
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

          {/* Account Timestamps */}
          <GlassCard className="p-6">
            <h3 className="text-heading text-foreground mb-4">Account Timeline</h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-200 py-2">
                <div className="flex items-center gap-2">
                  <Calendar className="text-text-secondary h-4 w-4" />
                  <span className="text-body text-text-secondary">Created</span>
                </div>
                <span className="text-caption text-foreground">
                  {profile?.created_at
                    ? new Date(profile.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'N/A'}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-neutral-200 py-2">
                <div className="flex items-center gap-2">
                  <Calendar className="text-text-secondary h-4 w-4" />
                  <span className="text-body text-text-secondary">Last Updated</span>
                </div>
                <span className="text-caption text-foreground">
                  {profile?.updated_at
                    ? new Date(profile.updated_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'N/A'}
                </span>
              </div>

              {profile?.role_assigned_at && (
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="text-text-secondary h-4 w-4" />
                    <span className="text-body text-text-secondary">Role Assigned</span>
                  </div>
                  <span className="text-caption text-foreground">
                    {new Date(profile.role_assigned_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              )}
            </div>
          </GlassCard>
        </div>

        {/* Plan Comparison & Actions */}
        <div className="space-y-6">
          {/* Available Plans */}
          <GlassCard className="p-6">
            <h3 className="text-heading text-foreground mb-4">Available Plans</h3>

            <div className="space-y-4">
              {Object.entries(subscriptionTiers).map(([tierKey, tier]) => {
                const isCurrentPlan = tierKey === currentTierKey;
                const TierIcon = tier.icon;

                return (
                  <div
                    key={tierKey}
                    className={`rounded-lg border p-4 transition-all duration-200 ${
                      isCurrentPlan
                        ? 'border-primary bg-primary/5'
                        : 'hover:border-primary/50 border-neutral-300'
                    }`}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-8 w-8 rounded-lg bg-gradient-to-br ${tier.color} flex items-center justify-center`}
                        >
                          <TierIcon className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <h4 className="text-body text-foreground font-medium">{tier.name}</h4>
                          <p className="text-caption text-text-secondary">
                            ${tier.price}/{tier.period}
                          </p>
                        </div>
                      </div>

                      {isCurrentPlan ? (
                        <span className="bg-primary text-primary-foreground rounded-full px-2 py-1 text-xs">
                          Current Plan
                        </span>
                      ) : (
                        <Button
                          onClick={() => handleUpgrade(tierKey as keyof typeof subscriptionTiers)}
                          disabled={isLoading}
                          className="btn-primary px-3 py-1 text-xs"
                        >
                          {isLoading ? 'Processing...' : 'Upgrade'}
                        </Button>
                      )}
                    </div>

                    <ul className="space-y-1">
                      {tier.features.slice(0, 3).map((feature, index) => (
                        <li
                          key={index}
                          className="text-caption text-text-secondary flex items-center gap-2"
                        >
                          <div className="bg-primary h-1.5 w-1.5 flex-shrink-0 rounded-full" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </GlassCard>

          {/* Subscription Actions */}
          <GlassCard className="p-6">
            <h3 className="text-heading text-foreground mb-4">Subscription Actions</h3>

            <div className="space-y-4">
              <div className="bg-info/10 border-info/20 rounded-lg border p-4">
                <div className="mb-2 flex items-center gap-2">
                  <AlertCircle className="text-info h-4 w-4" />
                  <span className="text-body text-info font-medium">Manage Subscription</span>
                </div>
                <p className="text-caption text-text-secondary mb-3">
                  To upgrade, downgrade, or cancel your subscription, please contact support or use
                  the buttons above.
                </p>
              </div>

              <Button
                onClick={handleCancelSubscription}
                disabled={isLoading}
                className="btn-secondary w-full"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Request Cancellation
                </div>
              </Button>

              <Button className="btn-ghost w-full">
                <div className="flex items-center gap-2">
                  <ArrowUpRight className="h-4 w-4" />
                  Contact Support
                </div>
              </Button>
            </div>
          </GlassCard>

          {/* Feature Comparison */}
          <GlassCard className="p-6">
            <h3 className="text-heading text-foreground mb-4">Plan Features</h3>

            <div className="space-y-3">
              <div className="bg-surface/30 rounded-lg p-3">
                <p className="text-caption text-foreground mb-1 font-medium">Generation Limits</p>
                <p className="text-caption text-text-secondary">
                  Your current plan includes{' '}
                  {profile?.blueprint_creation_limit === -1
                    ? 'unlimited'
                    : profile?.blueprint_creation_limit || 0}{' '}
                  learning design creations
                </p>
              </div>

              <div className="bg-surface/30 rounded-lg p-3">
                <p className="text-caption text-foreground mb-1 font-medium">Storage Limits</p>
                <p className="text-caption text-text-secondary">
                  Your current plan allows{' '}
                  {profile?.blueprint_saving_limit === -1
                    ? 'unlimited'
                    : profile?.blueprint_saving_limit || 0}{' '}
                  saved starmaps
                </p>
              </div>

              <div className="bg-surface/30 rounded-lg p-3">
                <p className="text-caption text-foreground mb-1 font-medium">Support Level</p>
                <p className="text-caption text-text-secondary">
                  {currentTierKey === 'voyager'
                    ? 'Priority chat support'
                    : currentTierKey === 'navigator'
                      ? 'Priority email support'
                      : 'Email support'}
                </p>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </motion.div>
  );
}
