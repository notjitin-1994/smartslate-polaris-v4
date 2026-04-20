'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Crown, Star, Zap, Users, Ship, Anchor, Code, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getTierDisplayNameShort, type SubscriptionTier } from '@/lib/utils/tierDisplay';

/**
 * TierBadge Component
 *
 * A reusable, elegant badge for displaying subscription tiers with
 * icons, gradients, and optional animations.
 *
 * Features:
 * - Multiple sizes (sm, md, lg)
 * - Multiple variants (solid, outlined, ghost)
 * - Tier-specific colors and icons
 * - Shimmer animation for premium tiers
 * - Accessible with ARIA labels
 */

interface TierBadgeProps {
  tier: SubscriptionTier | string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'solid' | 'outlined' | 'ghost';
  showIcon?: boolean;
  showMemberSuffix?: boolean;
  animated?: boolean;
  className?: string;
}

const tierConfig: Record<
  string,
  {
    icon: React.ComponentType<{ className?: string }>;
    gradient: string;
    color: string;
    textColor: string;
  }
> = {
  free: {
    icon: Star,
    gradient: 'from-blue-500 to-cyan-500',
    color: 'bg-gradient-to-r from-blue-500 to-cyan-500',
    textColor: 'text-blue-600',
  },
  explorer: {
    icon: Sparkles,
    gradient: 'from-purple-500 to-indigo-500',
    color: 'bg-gradient-to-r from-purple-500 to-indigo-500',
    textColor: 'text-purple-600',
  },
  navigator: {
    icon: Crown,
    gradient: 'from-emerald-500 to-teal-500',
    color: 'bg-gradient-to-r from-emerald-500 to-teal-500',
    textColor: 'text-emerald-600',
  },
  voyager: {
    icon: Zap,
    gradient: 'from-yellow-500 to-amber-500',
    color: 'bg-gradient-to-r from-yellow-500 to-amber-500',
    textColor: 'text-yellow-600',
  },
  crew: {
    icon: Users,
    gradient: 'from-pink-500 to-rose-500',
    color: 'bg-gradient-to-r from-pink-500 to-rose-500',
    textColor: 'text-pink-600',
  },
  fleet: {
    icon: Ship,
    gradient: 'from-violet-500 to-purple-500',
    color: 'bg-gradient-to-r from-violet-500 to-purple-500',
    textColor: 'text-violet-600',
  },
  armada: {
    icon: Anchor,
    gradient: 'from-slate-600 to-slate-800',
    color: 'bg-gradient-to-r from-slate-600 to-slate-800',
    textColor: 'text-slate-600',
  },
  developer: {
    icon: Code,
    gradient: 'from-orange-500 to-red-500',
    color: 'bg-gradient-to-r from-orange-500 to-red-500',
    textColor: 'text-orange-600',
  },
};

const sizeClasses = {
  sm: {
    container: 'px-2 py-1 gap-1 text-xs rounded-md',
    icon: 'h-3 w-3',
    text: 'text-xs',
  },
  md: {
    container: 'px-3 py-1.5 gap-1.5 text-sm rounded-lg',
    icon: 'h-4 w-4',
    text: 'text-sm',
  },
  lg: {
    container: 'px-4 py-2 gap-2 text-base rounded-xl',
    icon: 'h-5 w-5',
    text: 'text-base',
  },
};

export function TierBadge({
  tier,
  size = 'md',
  variant = 'solid',
  showIcon = true,
  showMemberSuffix = false,
  animated = true,
  className,
}: TierBadgeProps) {
  const normalizedTier = (tier || 'free').toLowerCase();
  const config = tierConfig[normalizedTier] || tierConfig.free;
  const Icon = config.icon;
  const displayName = getTierDisplayNameShort(tier);
  const sizeConfig = sizeClasses[size];

  const isPaidTier = normalizedTier !== 'free';
  const isDeveloper = normalizedTier === 'developer';

  // Base container classes
  const containerClasses = cn(
    'inline-flex items-center justify-center font-semibold transition-all duration-300',
    sizeConfig.container,
    {
      // Solid variant - gradient background
      [cn(
        config.color,
        'text-white shadow-lg hover:scale-105 hover:shadow-xl',
        animated && isPaidTier && 'animate-shimmer bg-[length:200%_100%]'
      )]: variant === 'solid',

      // Outlined variant - gradient border
      [cn(
        'border-2 border-transparent bg-transparent',
        'bg-clip-padding',
        config.textColor,
        'hover:bg-opacity-5 hover:scale-105',
        `before:rounded-inherit before:absolute before:inset-0 before:-z-10 before:bg-gradient-to-r before:${config.gradient} before:p-[2px] before:content-['']`
      )]: variant === 'outlined',

      // Ghost variant - subtle background
      [cn(
        'bg-opacity-10 backdrop-blur-sm',
        config.textColor,
        'hover:bg-opacity-20 hover:scale-105',
        config.color.replace('bg-gradient-to-r', 'bg-opacity-10')
      )]: variant === 'ghost',
    },
    className
  );

  const BadgeContent = (
    <>
      {showIcon && <Icon className={cn(sizeConfig.icon, 'flex-shrink-0')} />}
      <span className={cn(sizeConfig.text, 'font-semibold')}>
        {displayName}
        {showMemberSuffix && !isDeveloper && ' Member'}
      </span>
    </>
  );

  if (animated && isPaidTier) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.05 }}
        transition={{ duration: 0.2 }}
        className={containerClasses}
        role="status"
        aria-label={`${displayName} tier badge`}
      >
        {BadgeContent}
      </motion.div>
    );
  }

  return (
    <div className={containerClasses} role="status" aria-label={`${displayName} tier badge`}>
      {BadgeContent}
    </div>
  );
}

// Preset variants for quick use
export function FreeTierBadge(props: Omit<TierBadgeProps, 'tier'>) {
  return <TierBadge tier="free" {...props} />;
}

export function PremiumTierBadge(props: Omit<TierBadgeProps, 'tier'>) {
  return <TierBadge tier="voyager" {...props} />;
}

export function DeveloperBadge(props: Omit<TierBadgeProps, 'tier'>) {
  return <TierBadge tier="developer" {...props} />;
}
