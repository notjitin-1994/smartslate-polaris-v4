'use client';

import React, { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { SwirlBackground } from './SwirlBackground';
import { DarkModeToggle } from '@/components/theme/DarkModeToggle';
import { UserAvatar } from './UserAvatar';
import { useAuth } from '@/contexts/AuthContext';
import type { User } from '@supabase/supabase-js';

export interface StandardHeaderProps {
  /**
   * Main title - can be string or custom JSX
   */
  title: string | ReactNode;

  /**
   * Subtitle/description text
   */
  subtitle?: string;

  /**
   * If provided, shows a back button that links to this href
   */
  backHref?: string;

  /**
   * Custom label for back button (default: "Back to Dashboard")
   */
  backLabel?: string;

  /**
   * Custom actions to show next to the title (e.g., rename button)
   */
  titleActions?: ReactNode;

  /**
   * Custom actions to show on the right side (before dark mode toggle and avatar)
   */
  rightActions?: ReactNode;

  /**
   * Whether to show dark mode toggle (default: true)
   */
  showDarkModeToggle?: boolean;

  /**
   * Whether to show user avatar (default: true)
   */
  showUserAvatar?: boolean;

  /**
   * Whether to show the decorative line under title (default: false)
   */
  showDecorativeLine?: boolean;

  /**
   * Whether header should be sticky (default: true)
   */
  sticky?: boolean;

  /**
   * Custom className for additional styling
   */
  className?: string;

  /**
   * Size variant for the header
   */
  size?: 'default' | 'compact';

  /**
   * Override user object (useful for SSR contexts)
   */
  user?: User | null;
}

export function StandardHeader({
  title,
  subtitle,
  backHref,
  backLabel = 'Back to Dashboard',
  titleActions,
  rightActions,
  showDarkModeToggle = true,
  showUserAvatar = true,
  showDecorativeLine = false,
  sticky = true,
  className = '',
  size = 'default',
  user: userProp,
}: StandardHeaderProps): React.JSX.Element {
  const auth = useAuth();
  const user = userProp ?? auth?.user ?? null;

  const isCompact = size === 'compact';

  return (
    <header
      className={`glass relative overflow-hidden border-b border-neutral-200/50 ${sticky ? 'sticky top-0' : ''} z-50 ${className}`}
    >
      {/* Subtle background effects */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <SwirlBackground count={12} minSize={32} maxSize={64} opacityMin={0.02} opacityMax={0.06} />
        <div className="bg-primary/[0.02] absolute inset-0" />
      </div>

      {/* Content */}
      <div
        className={`relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 ${isCompact ? 'py-2.5' : 'py-5'}`}
      >
        <div className="flex items-center justify-between gap-4">
          {/* Left side: Back button + Title (inline for compact) */}
          <div className="flex min-w-0 flex-1 items-center gap-3">
            {backHref && (
              <Link
                href={backHref}
                className={`group text-text-secondary hover:text-foreground focus-visible:ring-primary/50 inline-flex items-center justify-center transition-all duration-200 focus-visible:rounded focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none active:scale-[0.98] ${isCompact ? 'h-8 w-8 shrink-0 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10' : 'mb-4 gap-1.5'}`}
                title={backLabel}
                aria-label={backLabel}
              >
                <ArrowLeft
                  className={`transition-transform group-hover:-translate-x-0.5 ${isCompact ? 'h-3.5 w-3.5' : 'h-4 w-4'}`}
                  aria-hidden="true"
                />
                {!isCompact && <span className="text-sm font-medium">{backLabel}</span>}
              </Link>
            )}

            <div className="flex min-w-0 flex-1 items-center gap-3">
              {typeof title === 'string' ? (
                <h1
                  className={`font-heading text-foreground leading-tight font-bold tracking-tight ${isCompact ? 'text-sm sm:text-base' : 'text-2xl sm:text-3xl lg:text-4xl'}`}
                >
                  {title}
                </h1>
              ) : (
                title
              )}
              {titleActions && <div className="flex items-center gap-2">{titleActions}</div>}
            </div>

            {subtitle && !isCompact && (
              <p
                className={`text-text-secondary mt-2 max-w-3xl text-sm leading-relaxed sm:text-base`}
              >
                {subtitle}
              </p>
            )}

            {showDecorativeLine && (
              <div aria-hidden="true" className="bg-primary/60 mt-4 h-px w-12" />
            )}
          </div>

          {/* Right side: Controls */}
          <div className="flex shrink-0 items-center gap-2">
            {rightActions}
            {showDarkModeToggle && <DarkModeToggle />}
            {showUserAvatar && user && (
              <div className="rounded-full ring-1 ring-neutral-200/50">
                <UserAvatar user={user} sizeClass={isCompact ? 'w-7 h-7' : 'w-8 h-8'} />
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
