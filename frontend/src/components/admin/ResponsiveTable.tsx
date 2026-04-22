/**
 * ResponsiveTable Component
 * Converts tables to card layouts on mobile
 * Maintains table structure on tablet/desktop
 */

'use client';

import { useMediaQuery } from '@/lib/hooks/useMediaQuery';
import { ReactNode } from 'react';

interface ResponsiveTableProps {
  children: ReactNode;
  className?: string;
}

export function ResponsiveTableWrapper({ children, className = '' }: ResponsiveTableProps) {
  const { isMobile } = useMediaQuery();

  if (isMobile) {
    return <div className={`space-y-3 ${className}`}>{children}</div>;
  }

  return <div className={`overflow-x-auto ${className}`}>{children}</div>;
}

interface ResponsiveTableCardProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}

export function ResponsiveTableCard({
  children,
  onClick,
  className = '',
}: ResponsiveTableCardProps) {
  const { isMobile } = useMediaQuery();

  if (!isMobile) return null;

  return (
    <div
      onClick={onClick}
      className={`space-y-3 rounded-lg border border-white/10 bg-white/5 p-4 transition-colors hover:bg-white/10 ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

interface ResponsiveTableRowProps {
  label: string;
  value: ReactNode;
  className?: string;
}

export function ResponsiveTableRow({ label, value, className = '' }: ResponsiveTableRowProps) {
  return (
    <div className={`flex items-start justify-between gap-3 ${className}`}>
      <span className="min-w-[80px] text-xs font-medium tracking-wide text-[#7a8a8b] uppercase">
        {label}
      </span>
      <div className="flex-1 text-right">{value}</div>
    </div>
  );
}
