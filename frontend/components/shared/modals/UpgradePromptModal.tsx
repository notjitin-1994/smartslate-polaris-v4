'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Rocket, Zap, Sparkles, ArrowRight, Star, Crown } from 'lucide-react';
import { getTierInfo, type SubscriptionTier } from '@/lib/utils/tierDisplay';
import {
  getPlanPrice,
  formatPrice,
  type SubscriptionTier as RzSubscriptionTier,
  type BillingCycle,
} from '@/lib/config/razorpayPlans';
import Link from 'next/link';
import { cn } from '@/lib/utils';

/**
 * UpgradePromptModal Component - Brand Aligned
 *
 * Shows all available upgrade tiers in a brand-consistent design.
 * Features glass morphism, dark theme, and cyan/teal accents.
 */

interface UpgradePromptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentTier: SubscriptionTier | string;
  limitType?: 'creation' | 'saving';
  currentCount?: number;
  limitCount?: number;
}

// Tier categorization
const INDIVIDUAL_TIERS = ['explorer', 'navigator', 'voyager'];
const TEAM_TIERS = ['crew', 'fleet', 'armada'];

const tierData: Record<
  string,
  {
    generations: number;
    saved: number;
    features: string[];
    icon: any;
    popular?: boolean;
  }
> = {
  explorer: {
    generations: 5,
    saved: 5,
    icon: Sparkles,
    features: ['5 blueprints/month', '5 saved starmaps', 'Basic export formats', 'Email support'],
  },
  navigator: {
    generations: 25,
    saved: 25,
    icon: Rocket,
    popular: true,
    features: [
      '25 blueprints/month',
      '25 saved starmaps',
      'Advanced export formats',
      'Priority support',
      '12-month rollover',
    ],
  },
  voyager: {
    generations: 50,
    saved: 50,
    icon: Star,
    features: [
      '50 blueprints/month',
      '50 saved starmaps',
      'All export formats',
      'Priority chat support',
      'Custom templates',
      '12-month rollover',
    ],
  },
  crew: {
    generations: 10,
    saved: 10,
    icon: Crown,
    features: [
      '10 blueprints/month',
      '10 saved starmaps',
      'Team collaboration',
      'Shared workspace',
      'Priority support',
    ],
  },
};

export function UpgradePromptModal({
  open,
  onOpenChange,
  currentTier,
  limitType = 'creation',
  currentCount = 0,
  limitCount = 0,
}: UpgradePromptModalProps) {
  const normalizedTier = (currentTier || 'free').toLowerCase();
  const limitTypeLabel = limitType === 'creation' ? 'blueprints' : 'saved starmaps';

  // Determine if user is individual or team based on current tier
  const isTeamUser = TEAM_TIERS.includes(normalizedTier);
  const isIndividualUser = INDIVIDUAL_TIERS.includes(normalizedTier) || normalizedTier === 'free';

  // Determine which tiers to show based on current tier and user type
  const getAvailableTiers = () => {
    // Determine user category and available tier pool
    let tierPool: string[];

    if (isTeamUser) {
      // Team users only see team tiers
      tierPool = TEAM_TIERS;
    } else {
      // Individual users only see individual tiers
      tierPool = INDIVIDUAL_TIERS;
    }

    // Find current tier index in the pool
    const currentIndex = tierPool.indexOf(normalizedTier);

    if (currentIndex === -1 || normalizedTier === 'free') {
      // Free users see all tiers in their category (excluding explorer)
      if (isTeamUser) {
        return TEAM_TIERS.slice(0, 3);
      } else {
        // Show individual tiers (navigator, voyager)
        return INDIVIDUAL_TIERS.filter((tier) => tier !== 'explorer').slice(0, 3);
      }
    }

    // Show next 2-3 tiers in the same category
    return tierPool.slice(currentIndex + 1).slice(0, 3);
  };

  const availableTiers = getAvailableTiers();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl border-0 bg-transparent p-0 shadow-none">
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', duration: 0.4, bounce: 0.3 }}
              className="glass-card relative overflow-hidden"
            >
              {/* Animated background glow */}
              <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.5, 0.3],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className="bg-primary/20 absolute -top-1/2 -right-1/4 h-96 w-96 rounded-full blur-3xl"
                />
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.2, 0.4, 0.2],
                  }}
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: 1,
                  }}
                  className="bg-secondary-accent/20 absolute -bottom-1/2 -left-1/4 h-96 w-96 rounded-full blur-3xl"
                />
              </div>

              <div className="relative p-8">
                {/* Icon */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    type: 'spring',
                    duration: 0.6,
                    delay: 0.1,
                    bounce: 0.5,
                  }}
                  className="from-primary via-primary-accent-light to-primary-accent shadow-primary/30 mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br shadow-lg"
                >
                  <Rocket className="h-8 w-8 text-black" />
                </motion.div>

                {/* Header */}
                <DialogHeader className="mb-6 space-y-3 text-center">
                  <DialogTitle className="text-foreground text-2xl font-bold">
                    You've Reached Your Limit
                  </DialogTitle>
                  <DialogDescription className="text-text-secondary text-base">
                    You've used{' '}
                    <span className="text-foreground font-semibold">
                      {currentCount} of {limitCount}
                    </span>{' '}
                    {limitTypeLabel}.
                    <br />
                    Choose a plan to continue your learning journey!
                  </DialogDescription>
                </DialogHeader>

                {/* Current Usage Bar */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mb-8 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
                >
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-text-secondary">Your Usage</span>
                    <span className="text-foreground font-semibold">
                      {currentCount}/{limitCount}
                    </span>
                  </div>
                  <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 0.8, delay: 0.3 }}
                      className="from-primary to-primary-accent-light absolute inset-y-0 left-0 rounded-full bg-gradient-to-r"
                    />
                  </div>
                </motion.div>

                {/* Tier Cards Grid */}
                <div
                  className={cn(
                    'mb-6 grid gap-4',
                    availableTiers.length === 3
                      ? 'grid-cols-1 md:grid-cols-3'
                      : 'grid-cols-1 md:grid-cols-2'
                  )}
                >
                  {availableTiers.map((tierKey, index) => {
                    const tier = tierData[tierKey];
                    const tierInfo = getTierInfo(tierKey);
                    const Icon = tier.icon;

                    return (
                      <motion.div
                        key={tierKey}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + index * 0.1 }}
                        className="group border-primary/30 from-primary/10 via-primary/5 hover:border-primary/50 hover:shadow-primary/20 relative overflow-hidden rounded-xl border bg-gradient-to-br to-transparent p-6 transition-all duration-300 hover:shadow-lg"
                      >
                        {/* Popular badge */}
                        {tier.popular && (
                          <div className="absolute top-3 right-3">
                            <span className="bg-primary inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-black">
                              <Sparkles className="h-3 w-3" />
                              Popular
                            </span>
                          </div>
                        )}

                        {/* Tier Icon */}
                        <div className="from-primary via-primary-accent-light to-primary-accent mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br shadow-md">
                          <Icon className="h-6 w-6 text-black" />
                        </div>

                        {/* Tier Name & Price */}
                        <h3 className="text-foreground mb-1 text-xl font-bold">
                          {tierInfo.displayName}
                        </h3>
                        <div className="mb-4 flex items-baseline gap-1">
                          <span className="text-foreground text-3xl font-bold">
                            {formatPrice(getPlanPrice(tierKey as RzSubscriptionTier, 'monthly'))}
                          </span>
                          <span className="text-text-secondary">/month</span>
                        </div>

                        {/* Key Stats */}
                        <div className="mb-4 rounded-lg bg-white/5 p-3 backdrop-blur-sm">
                          <div className="mb-2 flex items-center justify-between text-sm">
                            <span className="text-text-secondary">Blueprints</span>
                            <span className="text-foreground font-semibold">
                              {tier.generations}/mo
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-text-secondary">Saved</span>
                            <span className="text-foreground font-semibold">{tier.saved}</span>
                          </div>
                        </div>

                        {/* Features */}
                        <div className="mb-4 space-y-2">
                          {tier.features.slice(0, 4).map((feature, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm">
                              <div className="bg-primary h-1.5 w-1.5 flex-shrink-0 rounded-full" />
                              <span className="text-text-secondary">{feature}</span>
                            </div>
                          ))}
                        </div>

                        {/* CTA Button */}
                        <Link href="/pricing" className="block">
                          <Button
                            className={cn(
                              'w-full',
                              tier.popular
                                ? 'from-primary to-primary-accent-light hover:shadow-primary/30 bg-gradient-to-r text-black hover:shadow-lg'
                                : 'text-foreground border-white/10 bg-white/5 hover:bg-white/10'
                            )}
                            variant={tier.popular ? 'default' : 'outline'}
                          >
                            Choose {tierInfo.shortName}
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Footer Actions */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex flex-col gap-3 sm:flex-row"
                >
                  <Button
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    className="text-foreground flex-1 border-white/10 bg-white/5 hover:bg-white/10"
                  >
                    Maybe Later
                  </Button>
                  <Link href="/pricing" className="flex-1">
                    <Button
                      className={cn(
                        'group relative w-full overflow-hidden',
                        'from-primary to-primary-accent-light bg-gradient-to-r',
                        'font-semibold text-black',
                        'hover:shadow-primary/30 hover:shadow-lg',
                        'transition-all duration-300'
                      )}
                    >
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        Compare All Plans
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </span>
                      <motion.div
                        className="from-primary-accent-light to-primary absolute inset-0 bg-gradient-to-r"
                        initial={{ x: '100%' }}
                        whileHover={{ x: 0 }}
                        transition={{ duration: 0.3 }}
                      />
                    </Button>
                  </Link>
                </motion.div>

                {/* Trust indicator */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="text-text-secondary mt-4 text-center text-xs"
                >
                  <Sparkles className="inline h-3 w-3" /> Upgrade anytime, cancel anytime. All plans
                  include 12-month rollover.
                </motion.p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
