'use client';

import React, { useEffect, useMemo, useState } from 'react';

interface SwirlItem {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
}

interface SwirlBackgroundProps {
  count?: number;
  minSize?: number;
  maxSize?: number;
  opacityMin?: number;
  opacityMax?: number;
  className?: string;
}

export function SwirlBackground({
  count = 48,
  minSize = 24,
  maxSize = 56,
  opacityMin = 0.6,
  opacityMax = 1,
  className = '',
}: SwirlBackgroundProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  // Generate static swirl positions (memoized so they don't change on re-renders)
  const swirls = useMemo<SwirlItem[]>(() => {
    if (!mounted) return [];
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: minSize + Math.random() * (maxSize - minSize),
      opacity: opacityMin + Math.random() * (opacityMax - opacityMin),
    }));
  }, [mounted, count, minSize, maxSize, opacityMin, opacityMax]);

  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden="true"
      suppressHydrationWarning
    >
      {swirls.map((swirl) => (
        <img
          key={swirl.id}
          src="/logo-swirl.png"
          alt=""
          className="absolute"
          style={{
            left: `${swirl.x}%`,
            top: `${swirl.y}%`,
            width: `${swirl.size}px`,
            height: `${swirl.size}px`,
            opacity: swirl.opacity,
            transform: 'translate(-50%, -50%)',
            filter:
              'saturate(1) drop-shadow(0 0 10px rgba(167, 218, 219, 0.12)) drop-shadow(0 0 26px rgba(167, 218, 219, 0.08))',
          }}
        />
      ))}
    </div>
  );
}
