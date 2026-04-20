'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface UsageProgressBarProps {
  current: number;
  limit: number;
  label?: string;
  showPercentage?: boolean;
  showCount?: boolean;
  className?: string;
  variant?: 'default' | 'compact';
  animate?: boolean;
}

/**
 * Visual progress bar for blueprint usage
 *
 * Design System Compliance:
 * - Uses brand color palette (primary-accent, error, warning, success)
 * - Implements smooth animations with framer-motion
 * - Follows 8pt grid spacing system
 * - Provides accessible color contrast (WCAG AA)
 *
 * Features:
 * - Dynamic color based on usage percentage
 * - Smooth animation on mount and updates
 * - Compact variant for inline display
 * - Fully accessible with ARIA attributes
 */
export function UsageProgressBar({
  current,
  limit,
  label,
  showPercentage = true,
  showCount = true,
  className,
  variant = 'default',
  animate = true,
}: UsageProgressBarProps) {
  const percentage = limit > 0 ? Math.min((current / limit) * 100, 100) : 0;

  /**
   * Get progress color based on usage percentage
   * - 0-50%: Success (green) - healthy usage
   * - 50-80%: Primary (cyan) - moderate usage
   * - 80-100%: Warning (amber) - approaching limit
   * - 100%: Error (red) - limit reached
   */
  const getProgressColor = () => {
    if (percentage >= 100) return 'from-error to-rose-600';
    if (percentage >= 80) return 'from-warning to-amber-600';
    if (percentage >= 50) return 'from-primary to-cyan-600';
    return 'from-success to-teal-600';
  };

  /**
   * Get text color matching progress color
   */
  const getTextColor = () => {
    if (percentage >= 100) return 'text-error';
    if (percentage >= 80) return 'text-warning';
    if (percentage >= 50) return 'text-primary';
    return 'text-success';
  };

  const isCompact = variant === 'compact';

  return (
    <div className={cn('space-y-2', className)}>
      {/* Label and Count */}
      {(label || showCount || showPercentage) && (
        <div className="flex items-center justify-between">
          {label && <span className="text-caption text-text-secondary font-medium">{label}</span>}
          <div className="flex items-center gap-2">
            {showCount && (
              <span
                className={cn(
                  'font-bold',
                  isCompact ? 'text-caption' : 'text-body',
                  getTextColor()
                )}
              >
                {current} / {limit}
              </span>
            )}
            {showPercentage && (
              <span
                className={cn(
                  'font-medium',
                  isCompact ? 'text-small' : 'text-caption',
                  getTextColor()
                )}
              >
                {percentage.toFixed(0)}%
              </span>
            )}
          </div>
        </div>
      )}

      {/* Progress Bar Track */}
      <div
        className={cn(
          'relative overflow-hidden rounded-full bg-neutral-200',
          isCompact ? 'h-1.5' : 'h-2'
        )}
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={0}
        aria-valuemax={limit}
        aria-label={label || 'Usage progress'}
      >
        {/* Progress Bar Fill */}
        {animate ? (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{
              duration: 0.8,
              ease: [0.22, 1, 0.36, 1], // Custom easing for smooth feel
            }}
            className={cn(
              'absolute top-0 left-0 h-full rounded-full',
              'bg-gradient-to-r',
              getProgressColor()
            )}
          >
            {/* Shimmer effect for active progress */}
            {percentage > 0 && percentage < 100 && !isCompact && (
              <div className="absolute inset-0 rounded-full">
                <motion.div
                  initial={{ x: '-100%' }}
                  animate={{ x: '200%' }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                  className="h-full w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                />
              </div>
            )}

            {/* Pulse indicator at the end */}
            {percentage > 10 && !isCompact && (
              <div className="absolute top-1/2 right-2 -translate-y-1/2">
                <motion.div
                  animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className="h-1 w-1 rounded-full bg-white"
                />
              </div>
            )}
          </motion.div>
        ) : (
          <div
            className={cn(
              'absolute top-0 left-0 h-full rounded-full',
              'bg-gradient-to-r',
              getProgressColor()
            )}
            style={{ width: `${percentage}%` }}
          />
        )}
      </div>

      {/* Warning message when limit reached */}
      {percentage >= 100 && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-caption text-error flex items-center gap-1"
        >
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          Limit reached
        </motion.p>
      )}

      {/* Warning message when approaching limit (80%+) */}
      {percentage >= 80 && percentage < 100 && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-caption text-warning flex items-center gap-1"
        >
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Approaching limit
        </motion.p>
      )}
    </div>
  );
}

/**
 * Compact inline usage indicator
 * Perfect for toolbar/header display
 */
export function UsageProgressBadge({
  current,
  limit,
  type = 'creation',
}: {
  current: number;
  limit: number;
  type?: 'creation' | 'saving';
}) {
  const percentage = limit > 0 ? Math.min((current / limit) * 100, 100) : 0;
  const remaining = Math.max(0, limit - current);

  const getStatusColor = () => {
    if (percentage >= 100) return 'bg-error/10 border-error/30 text-error';
    if (percentage >= 80) return 'bg-warning/10 border-warning/30 text-warning';
    return 'bg-primary/10 border-primary/30 text-primary';
  };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1.5',
        'text-caption font-medium',
        getStatusColor()
      )}
    >
      <span className="font-bold">{remaining}</span>
      <span className="opacity-70">{type === 'creation' ? 'creations' : 'saves'} left</span>
    </div>
  );
}
