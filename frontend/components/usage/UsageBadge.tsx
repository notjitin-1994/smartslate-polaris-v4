'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Save, AlertCircle, CheckCircle, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getTierDisplayNameShort, getTierInfo } from '@/lib/utils/tierDisplay';

interface UsageBadgeProps {
  current: number;
  limit: number;
  type: 'creation' | 'saving';
  variant?: 'default' | 'compact' | 'minimal';
  showIcon?: boolean;
  showLabel?: boolean;
  animate?: boolean;
  className?: string;
}

/**
 * Small inline badge for displaying usage counts
 *
 * Design System Compliance:
 * - Uses semantic color system (success, warning, error)
 * - Matches existing badge patterns
 * - Accessible color contrast
 * - Touch-friendly sizing
 *
 * Variants:
 * - default: Full badge with icon and count
 * - compact: Count only with minimal padding
 * - minimal: Just the count, no background
 */
export function UsageBadge({
  current,
  limit,
  type,
  variant = 'default',
  showIcon = true,
  showLabel = true,
  animate = true,
  className,
}: UsageBadgeProps) {
  const remaining = Math.max(0, limit - current);
  const percentage = limit > 0 ? (current / limit) * 100 : 0;

  // Determine status and styling based on usage
  const getStatus = () => {
    if (percentage >= 100) {
      return {
        color: 'text-error',
        bg: 'bg-error/10',
        border: 'border-error/30',
        icon: AlertCircle,
        label: 'Limit reached',
      };
    }
    if (percentage >= 80) {
      return {
        color: 'text-warning',
        bg: 'bg-warning/10',
        border: 'border-warning/30',
        icon: AlertCircle,
        label: 'Almost full',
      };
    }
    if (percentage >= 50) {
      return {
        color: 'text-primary',
        bg: 'bg-primary/10',
        border: 'border-primary/30',
        icon: type === 'creation' ? Zap : Save,
        label: 'Good',
      };
    }
    return {
      color: 'text-success',
      bg: 'bg-success/10',
      border: 'border-success/30',
      icon: CheckCircle,
      label: 'Healthy',
    };
  };

  const status = getStatus();
  const Icon = status.icon;

  if (variant === 'minimal') {
    return (
      <span className={cn('text-caption font-medium', status.color, className)}>
        {current}/{limit}
      </span>
    );
  }

  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-1.5 rounded-md px-2 py-1',
          'text-caption font-medium',
          status.bg,
          status.color,
          className
        )}
      >
        {showIcon && <Icon className="h-3.5 w-3.5" />}
        <span className="font-bold">{remaining}</span>
        <span className="opacity-70">left</span>
      </div>
    );
  }

  // Default variant
  const BadgeContent = (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1.5',
        'text-caption font-medium',
        status.bg,
        status.border,
        status.color,
        'transition-all duration-200',
        'hover:scale-105',
        className
      )}
    >
      {showIcon && <Icon className="h-4 w-4 flex-shrink-0" />}
      <div className="flex items-center gap-1.5">
        <span className="font-bold">{current}</span>
        <span className="opacity-50">/</span>
        <span className="opacity-70">{limit}</span>
        {showLabel && (
          <>
            <span className="opacity-50">·</span>
            <span className="opacity-70">{type === 'creation' ? 'created' : 'saved'}</span>
          </>
        )}
      </div>
    </div>
  );

  if (!animate) {
    return BadgeContent;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      {BadgeContent}
    </motion.div>
  );
}

/**
 * Tier badge for subscription display
 */
export function TierBadge({
  tier,
  isExempt = false,
  className,
}: {
  tier: string;
  isExempt?: boolean;
  className?: string;
}) {
  const tierDisplayInfo = getTierInfo(tier);
  const displayLabel = isExempt ? 'Lifetime Access' : tierDisplayInfo.shortName;

  // Icon selection based on tier
  const Icon = isExempt || tierDisplayInfo.isPaid ? Crown : Zap;

  // Color scheme based on tier
  const colorScheme = isExempt
    ? {
        color: 'text-primary',
        bg: 'bg-primary/10',
        border: 'border-primary/30',
      }
    : tierDisplayInfo.isPaid
      ? {
          color: 'text-secondary',
          bg: 'bg-secondary/10',
          border: 'border-secondary/30',
        }
      : {
          color: 'text-text-secondary',
          bg: 'bg-neutral-100',
          border: 'border-neutral-200',
        };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1.5',
        'text-caption font-medium',
        colorScheme.bg,
        colorScheme.border,
        colorScheme.color,
        className
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      <span>{displayLabel}</span>
    </div>
  );
}

/**
 * Status badge for blueprint states
 */
export function StatusBadge({
  status,
  className,
}: {
  status: 'draft' | 'generating' | 'completed' | 'error';
  className?: string;
}) {
  const getStatusInfo = () => {
    switch (status) {
      case 'completed':
        return {
          label: 'Completed',
          color: 'text-success',
          bg: 'bg-success/10',
          border: 'border-success/30',
          icon: CheckCircle,
          pulse: false,
        };
      case 'generating':
        return {
          label: 'Generating',
          color: 'text-primary',
          bg: 'bg-primary/10',
          border: 'border-primary/30',
          icon: Zap,
          pulse: true,
        };
      case 'error':
        return {
          label: 'Error',
          color: 'text-error',
          bg: 'bg-error/10',
          border: 'border-error/30',
          icon: AlertCircle,
          pulse: false,
        };
      case 'draft':
      default:
        return {
          label: 'Draft',
          color: 'text-text-secondary',
          bg: 'bg-neutral-100',
          border: 'border-neutral-200',
          icon: Save,
          pulse: false,
        };
    }
  };

  const statusInfo = getStatusInfo();
  const Icon = statusInfo.icon;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-md border px-2.5 py-1',
        'text-caption font-medium',
        statusInfo.bg,
        statusInfo.border,
        statusInfo.color,
        className
      )}
    >
      <Icon className={cn('h-3.5 w-3.5', statusInfo.pulse && 'animate-pulse')} />
      <span>{statusInfo.label}</span>
    </div>
  );
}

/**
 * Remaining count badge with emphasis
 */
export function RemainingBadge({
  remaining,
  total,
  type = 'creation',
  emphasis = false,
  className,
}: {
  remaining: number;
  total: number;
  type?: 'creation' | 'saving';
  emphasis?: boolean;
  className?: string;
}) {
  const percentage = total > 0 ? ((total - remaining) / total) * 100 : 0;
  const isLow = remaining <= Math.ceil(total * 0.2); // 20% or less remaining

  if (emphasis) {
    return (
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 20,
        }}
        className={cn(
          'inline-flex flex-col items-center justify-center',
          'rounded-xl border px-4 py-3',
          isLow
            ? 'bg-error/10 border-error/30 text-error'
            : 'bg-primary/10 border-primary/30 text-primary',
          className
        )}
      >
        <div className="text-display mb-1 leading-none font-bold">{remaining}</div>
        <div className="text-caption opacity-70">
          {type === 'creation' ? 'creations' : 'saves'} left
        </div>
      </motion.div>
    );
  }

  return (
    <div
      className={cn(
        'inline-flex items-baseline gap-1',
        isLow ? 'text-error' : 'text-text-secondary',
        className
      )}
    >
      <span className="text-heading font-bold">{remaining}</span>
      <span className="text-caption opacity-70">
        / {total} {type === 'creation' ? 'creations' : 'saves'}
      </span>
    </div>
  );
}
