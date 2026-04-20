/**
 * Cosmic Background Component
 * Animated background for pricing page
 */

'use client';

import React from 'react';

export function CosmicBackground(): React.JSX.Element {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      {/* Ambient background effects */}
      <div className="from-primary/[0.02] to-secondary/[0.02] absolute inset-0 bg-gradient-to-br via-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(167,218,219,0.05),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(230,184,156,0.05),transparent_50%)]" />

      {/* Animated orbs */}
      <div className="bg-primary/10 absolute -top-40 -right-40 h-80 w-80 animate-pulse rounded-full blur-3xl" />
      <div className="bg-secondary/10 absolute -bottom-40 -left-40 h-80 w-80 animate-pulse rounded-full blur-3xl delay-1000" />
      <div className="bg-primary/5 absolute top-1/2 left-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full blur-3xl delay-500" />
    </div>
  );
}
