'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('glass-card rounded-2xl p-6', className)} {...props}>
        {children}
      </div>
    );
  }
);

GlassCard.displayName = 'GlassCard';
