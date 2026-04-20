'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Crown, Sparkles, TrendingUp, Zap, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface UpgradeCTAProps {
  variant?: 'card' | 'banner' | 'inline';
  title?: string;
  description?: string;
  benefits?: string[];
  className?: string;
  compact?: boolean;
}

/**
 * Upgrade Call-to-Action Component
 *
 * Design System Compliance:
 * - Glass morphism with gradient overlays
 * - Brand colors for accents and CTAs
 * - Smooth hover animations
 * - Accessible focus states
 *
 * Variants:
 * - card: Full-featured card with benefits list
 * - banner: Horizontal banner for page headers
 * - inline: Compact inline prompt
 */
export function UpgradeCTA({
  variant = 'card',
  title,
  description,
  benefits,
  className,
  compact = false,
}: UpgradeCTAProps) {
  const defaultBenefits = [
    'Unlimited blueprint creations',
    'Unlimited blueprint saves',
    'Advanced analytics & insights',
    'Priority support',
    'Early access to new features',
  ];

  const displayBenefits = benefits || defaultBenefits.slice(0, compact ? 3 : 5);

  if (variant === 'card') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={cn('glass-card group relative overflow-hidden p-6', className)}
      >
        {/* Background gradient decoration */}
        <div className="from-primary/10 to-secondary/10 absolute top-0 right-0 -z-10 h-48 w-48 rounded-full bg-gradient-to-br blur-3xl transition-transform duration-700 group-hover:scale-110" />
        <div className="from-secondary/5 to-primary/5 absolute bottom-0 left-0 -z-10 h-32 w-32 rounded-full bg-gradient-to-tr blur-2xl transition-transform duration-700 group-hover:scale-110" />

        {/* Header */}
        <div className="mb-6 flex items-start gap-4">
          <div className="from-secondary to-secondary/80 shadow-secondary/20 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br shadow-lg">
            <Crown className="h-6 w-6 text-white" strokeWidth={2} />
          </div>
          <div className="flex-1">
            <h3 className="text-heading text-foreground mb-2 font-bold">
              {title || 'Unlock Premium Features'}
            </h3>
            <p className="text-caption text-text-secondary leading-relaxed">
              {description ||
                'Get unlimited access to all features and take your learning to the next level.'}
            </p>
          </div>
        </div>

        {/* Benefits List */}
        <ul className="mb-6 space-y-3">
          {displayBenefits.map((benefit, index) => (
            <motion.li
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + index * 0.05, duration: 0.3 }}
              className="flex items-start gap-3"
            >
              <div className="bg-primary/20 mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full">
                <Sparkles className="text-primary h-3 w-3" />
              </div>
              <span className="text-body text-text-secondary">{benefit}</span>
            </motion.li>
          ))}
        </ul>

        {/* CTA Button */}
        <Link href="/pricing">
          <Button
            className={cn(
              'btn-primary w-full',
              'from-secondary to-secondary/90 bg-gradient-to-r',
              'hover:from-secondary/90 hover:to-secondary/80',
              'shadow-secondary/20 shadow-lg',
              'hover:shadow-secondary/30 hover:shadow-xl',
              'transition-all duration-300',
              'group/btn'
            )}
            size="large"
          >
            <Crown className="mr-2 h-4 w-4" />
            View Pricing Plans
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
          </Button>
        </Link>
      </motion.div>
    );
  }

  if (variant === 'banner') {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={cn(
          'relative overflow-hidden rounded-xl p-4',
          'from-secondary/10 via-primary/10 to-secondary/10 bg-gradient-to-r',
          'border-primary/20 border',
          'group hover:border-primary/30 transition-colors duration-300',
          className
        )}
      >
        {/* Shimmer effect on hover */}
        <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
          <motion.div
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="h-full w-1/3 bg-gradient-to-r from-transparent via-white/10 to-transparent"
          />
        </div>

        <div className="relative flex items-center justify-between gap-4">
          <div className="flex flex-1 items-center gap-4">
            <div className="from-secondary to-secondary/80 shadow-secondary/20 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br shadow-lg">
              <TrendingUp className="h-5 w-5 text-white" strokeWidth={2} />
            </div>
            <div className="flex-1">
              <h4 className="text-body text-foreground mb-0.5 font-semibold">
                {title || 'Ready to unlock more?'}
              </h4>
              <p className="text-caption text-text-secondary">
                {description || 'Upgrade to premium for unlimited blueprints and advanced features'}
              </p>
            </div>
          </div>
          <Link href="/pricing">
            <Button
              variant="ghost"
              size="medium"
              className="border-primary/30 hover:border-primary/50 hover:bg-primary/5 flex-shrink-0 border"
            >
              <Crown className="mr-2 h-4 w-4" />
              Upgrade
            </Button>
          </Link>
        </div>
      </motion.div>
    );
  }

  // Inline variant
  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      <Zap className="text-warning h-4 w-4" />
      <span className="text-caption text-text-secondary">
        {description || 'Upgrade for unlimited access'}
      </span>
      <Link href="/pricing">
        <Button
          variant="link"
          size="small"
          className="text-primary hover:text-primary-dark h-auto p-0"
        >
          View Plans
          <ArrowRight className="ml-1 h-3 w-3" />
        </Button>
      </Link>
    </div>
  );
}

/**
 * Compact upgrade prompt for settings or profile pages
 */
export function UpgradePrompt({
  currentTier = 'free',
  className,
}: {
  currentTier?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'from-secondary/5 to-primary/5 border-primary/20 rounded-xl border bg-gradient-to-br p-6',
        className
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <div className="text-caption text-text-secondary rounded-md bg-neutral-100 px-2 py-1 font-medium">
              Current: {currentTier.charAt(0).toUpperCase() + currentTier.slice(1)}
            </div>
          </div>
          <h3 className="text-heading text-foreground mb-1 font-bold">Upgrade to Premium</h3>
          <p className="text-caption text-text-secondary">
            Unlock unlimited blueprints and advanced features
          </p>
        </div>
        <Crown className="text-secondary h-8 w-8 opacity-50" />
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-white/10 bg-white/5 p-3">
          <div className="text-title text-primary mb-1 font-bold">∞</div>
          <div className="text-caption text-text-secondary">Blueprints</div>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 p-3">
          <div className="text-title text-primary mb-1 font-bold">24/7</div>
          <div className="text-caption text-text-secondary">Support</div>
        </div>
      </div>

      <Link href="/pricing">
        <Button
          className="from-secondary to-secondary/90 hover:from-secondary/90 hover:to-secondary/80 w-full bg-gradient-to-r"
          size="large"
        >
          <Crown className="mr-2 h-4 w-4" />
          View Plans
        </Button>
      </Link>
    </div>
  );
}
