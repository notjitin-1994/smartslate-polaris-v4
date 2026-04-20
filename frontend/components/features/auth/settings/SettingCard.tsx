'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface SettingCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  children: React.ReactNode;
}

/**
 * SettingCard - Container for grouping related settings
 * Provides consistent spacing, typography, and visual hierarchy
 */
export const SettingCard = forwardRef<HTMLDivElement, SettingCardProps>(
  ({ className, title, description, children, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={cn(
          'glass-card rounded-2xl p-6 sm:p-8',
          'border border-neutral-200/10',
          'transition-all duration-300',
          'hover:border-primary/20',
          className
        )}
        {...props}
      >
        {/* Card Header */}
        <div className="mb-6 border-b border-neutral-200/10 pb-6">
          <h3 className="text-heading text-foreground mb-2 font-bold">{title}</h3>
          {description && <p className="text-caption text-text-secondary">{description}</p>}
        </div>

        {/* Card Content */}
        <div className="space-y-6">{children}</div>
      </motion.div>
    );
  }
);

SettingCard.displayName = 'SettingCard';

interface SettingRowProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  description?: string;
  children: React.ReactNode;
  badge?: React.ReactNode;
}

/**
 * SettingRow - Individual setting item with label and control
 * Optimized for touch targets and accessibility
 */
export const SettingRow = forwardRef<HTMLDivElement, SettingRowProps>(
  ({ className, label, description, children, badge, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex items-start justify-between gap-4 sm:items-center',
          'px-0 py-4',
          'border-b border-neutral-200/5 last:border-0',
          'transition-colors duration-200',
          className
        )}
        {...props}
      >
        {/* Label Section */}
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <label className="text-body text-foreground cursor-pointer font-medium">{label}</label>
            {badge && (
              <span className="bg-primary/10 text-primary border-primary/20 inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium">
                {badge}
              </span>
            )}
          </div>
          {description && <p className="text-caption text-text-secondary mt-1">{description}</p>}
        </div>

        {/* Control Section */}
        <div className="flex-shrink-0">{children}</div>
      </div>
    );
  }
);

SettingRow.displayName = 'SettingRow';
