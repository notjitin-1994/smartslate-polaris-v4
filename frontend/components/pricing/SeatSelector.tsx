/**
 * Seat Selector Component
 */

'use client';

import React from 'react';
import { Plus, Minus } from 'lucide-react';

interface SeatSelectorProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  recommendedRange?: { min: number; max: number };
  className?: string;
}

export function SeatSelector(props: SeatSelectorProps): React.JSX.Element {
  const { value, onChange, min, max, className } = props;
  return (
    <div className={`flex items-center gap-4${className ? ` ${className}` : ''}`}>
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="text-foreground flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 transition-all hover:bg-white/20 disabled:opacity-50"
        aria-label="Decrease seats"
      >
        <Minus className="h-4 w-4" />
      </button>

      <div className="text-center">
        <div className="text-foreground text-3xl font-bold">{value}</div>
        <div className="text-text-secondary text-xs">seats</div>
      </div>

      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="text-foreground flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 transition-all hover:bg-white/20 disabled:opacity-50"
        aria-label="Increase seats"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
