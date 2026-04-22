'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { useResponsiveContent } from '@/lib/hooks/useResponsiveContent';

export interface DashboardGridProps {
  /**
   * Grid items to render
   */
  children: React.ReactNode;

  /**
   * Custom gap between grid items
   */
  gap?: 'tight' | 'normal' | 'loose';

  /**
   * Minimum column width for auto-fit grids
   */
  minColumnWidth?: number;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Test ID for testing purposes
   */
  'data-testid'?: string;
}

/**
 * Responsive dashboard grid component that adapts to different breakpoints
 */
export function DashboardGrid({
  children,
  gap,
  minColumnWidth = 280,
  className,
  'data-testid': testId = 'dashboard-grid',
}: DashboardGridProps) {
  const responsive = useResponsiveContent();

  // Determine grid configuration based on current breakpoint
  const gridConfig = React.useMemo(() => {
    const baseColumns = responsive.layout.columns;

    // Calculate responsive gap
    const gapValue = gap || responsive.layout.spacing;
    const gapSize = gapValue === 'tight' ? '8px' : gapValue === 'normal' ? '16px' : '24px';

    return {
      columns: baseColumns,
      gap: gapSize,
      minColumnWidth: `${minColumnWidth}px`,
    };
  }, [responsive.layout.columns, responsive.layout.spacing, gap, minColumnWidth]);

  return (
    <div
      className={cn('grid w-full', className)}
      style={{
        gridTemplateColumns: `repeat(${gridConfig.columns}, minmax(${gridConfig.minColumnWidth}, 1fr))`,
        gap: gridConfig.gap,
      }}
      data-testid={testId}
    >
      {children}
    </div>
  );
}

export interface DashboardCardProps {
  /**
   * Card content
   */
  children: React.ReactNode;

  /**
   * Card title
   */
  title?: string;

  /**
   * Card description
   */
  description?: string;

  /**
   * Whether to show hover effects
   */
  hoverable?: boolean;

  /**
   * Custom padding
   */
  padding?: 'none' | 'tight' | 'normal' | 'loose';

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Test ID for testing purposes
   */
  'data-testid'?: string;
}

/**
 * Responsive dashboard card component with adaptive padding and shadows
 */
export function DashboardCard({
  children,
  title,
  description,
  hoverable = true,
  padding = 'normal',
  className,
  'data-testid': testId = 'dashboard-card',
}: DashboardCardProps) {
  const responsive = useResponsiveContent();

  // Responsive padding based on breakpoint and setting
  const cardPadding = React.useMemo(() => {
    if (padding === 'none') return '';

    const basePadding = padding === 'tight' ? 'p-3' : padding === 'normal' ? 'p-4' : 'p-6';

    // Adjust padding for mobile compact screens
    if (responsive.breakpoint === 'mobile-compact') {
      return padding === 'tight' ? 'p-2' : 'p-3';
    }

    return basePadding;
  }, [padding, responsive.breakpoint]);

  return (
    <div
      className={cn(
        'bg-background rounded-lg border border-neutral-200 shadow-sm',
        hoverable && 'transition-shadow duration-200 hover:shadow-md',
        cardPadding,
        className
      )}
      data-testid={testId}
    >
      {(title || description) && (
        <div className="mb-4">
          {title && (
            <h3
              className={cn(
                'text-foreground mb-1 font-semibold',
                responsive.breakpoint === 'mobile-compact' ? 'text-sm' : 'text-base'
              )}
              data-testid={`${testId}-title`}
            >
              {title}
            </h3>
          )}
          {description && (
            <p
              className={cn(
                'text-text-secondary',
                responsive.breakpoint === 'mobile-compact' ? 'text-xs' : 'text-sm'
              )}
              data-testid={`${testId}-description`}
            >
              {description}
            </p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

export interface DashboardSectionProps {
  /**
   * Section title
   */
  title: string;

  /**
   * Section description
   */
  description?: string;

  /**
   * Section content
   */
  children: React.ReactNode;

  /**
   * Whether this section should be collapsible on mobile
   */
  collapsible?: boolean;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Test ID for testing purposes
   */
  'data-testid'?: string;
}

/**
 * Responsive dashboard section component for grouping related cards
 */
export function DashboardSection({
  title,
  description,
  children,
  collapsible = false,
  className,
  'data-testid': testId = 'dashboard-section',
}: DashboardSectionProps) {
  const responsive = useResponsiveContent();
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  // Auto-collapse on mobile compact if enabled
  React.useEffect(() => {
    if (collapsible && responsive.breakpoint === 'mobile-compact') {
      setIsCollapsed(true);
    } else {
      setIsCollapsed(false);
    }
  }, [collapsible, responsive.breakpoint]);

  const toggleCollapsed = React.useCallback(() => {
    if (collapsible) {
      setIsCollapsed(!isCollapsed);
    }
  }, [collapsible, isCollapsed]);

  return (
    <div className={cn('space-y-4', className)} data-testid={testId}>
      <div className="flex items-center justify-between">
        <div>
          <h2
            className={cn(
              'text-foreground font-semibold',
              responsive.breakpoint === 'mobile-compact' ? 'text-base' : 'text-lg'
            )}
            data-testid={`${testId}-title`}
          >
            {title}
          </h2>
          {description && (
            <p
              className={cn(
                'text-text-secondary mt-1',
                responsive.breakpoint === 'mobile-compact' ? 'text-xs' : 'text-sm'
              )}
              data-testid={`${testId}-description`}
            >
              {description}
            </p>
          )}
        </div>
        {collapsible && responsive.isMobile && (
          <button
            onClick={toggleCollapsed}
            className="text-text-secondary hover:text-foreground p-1 transition-colors"
            data-testid={`${testId}-toggle`}
            aria-label={isCollapsed ? `Expand ${title}` : `Collapse ${title}`}
          >
            <svg
              className={cn(
                'h-4 w-4 transition-transform duration-200',
                isCollapsed && 'rotate-180'
              )}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        )}
      </div>

      {(!collapsible || !isCollapsed) && (
        <div
          className={cn(
            'transition-all duration-300',
            isCollapsed && 'max-h-0 overflow-hidden opacity-0'
          )}
          data-testid={`${testId}-content`}
        >
          {children}
        </div>
      )}
    </div>
  );
}
