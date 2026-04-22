'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Crown, Star, Award } from 'lucide-react';
import type { SubscriptionTier } from '@/types/subscription';
import { getSubscriptionCTA } from '@/lib/utils/subscriptionCTA';

interface SubscriptionCTAProps {
  tier: SubscriptionTier | undefined | null;
  collapsed?: boolean;
}

/**
 * Subscription CTA Component
 *
 * Displays tier-appropriate upgrade/subscribe messaging in the sidebar
 * - Free tier: "Subscribe to Polaris"
 * - Personal tiers (explorer, navigator): "Upgrade to [next tier]"
 * - Voyager tier: "Max Tier" badge + "Upgrade to Teams" button
 * - Team tiers (crew, fleet): "Upgrade to [next tier]"
 * - Max tiers (armada, enterprise): Badge display (not clickable)
 */
export function SubscriptionCTA({ tier, collapsed = false }: SubscriptionCTAProps) {
  const router = useRouter();
  const config = getSubscriptionCTA(tier);

  // Select icon based on config
  const IconComponent = config.icon === 'crown' ? Crown : config.icon === 'star' ? Star : Award;

  // Max tier badge (not clickable) - with optional secondary button for Voyager
  if (!config.isButton) {
    const SecondaryIcon =
      config.secondaryButton?.icon === 'crown'
        ? Crown
        : config.secondaryButton?.icon === 'star'
          ? Star
          : Award;

    return collapsed ? (
      <div className="flex flex-col items-center space-y-2">
        {/* Max Tier Badge */}
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500/20 to-yellow-500/20 text-amber-400"
          title={config.message}
          aria-label={config.message}
        >
          <IconComponent className="h-4 w-4" />
        </div>

        {/* Secondary Upgrade Button (for Voyager) */}
        {config.secondaryButton && (
          <button
            type="button"
            onClick={() => router.push('/pricing')}
            title={config.secondaryButton.message}
            aria-label={config.secondaryButton.message}
            className="group relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-indigo-400 transition-all duration-200 hover:bg-indigo-500/10 hover:text-indigo-300 focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-2 active:scale-95"
          >
            <SecondaryIcon className="h-4 w-4" />
          </button>
        )}
      </div>
    ) : (
      <div className="space-y-2">
        {/* Max Tier Badge */}
        <div className="flex w-full items-center justify-between gap-3 rounded-lg bg-gradient-to-br from-amber-500/10 to-yellow-500/10 px-3 py-2.5 text-sm font-medium text-amber-400 shadow-sm">
          <span className="flex-1 text-left font-semibold">{config.message}</span>
          <IconComponent className="h-5 w-5 shrink-0" />
        </div>

        {/* Secondary Upgrade Button (for Voyager) */}
        {config.secondaryButton && (
          <button
            type="button"
            onClick={() => router.push('/pricing')}
            className="group flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-indigo-400 transition-all duration-200 hover:bg-indigo-500/10 hover:text-indigo-300 focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-2 active:scale-[0.98]"
          >
            <span className="flex-1 text-left font-semibold">{config.secondaryButton.message}</span>
            <SecondaryIcon className="h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110" />
          </button>
        )}
      </div>
    );
  }

  // Clickable upgrade/subscribe button
  return collapsed ? (
    <button
      type="button"
      onClick={() => router.push('/pricing')}
      title={config.message}
      aria-label={config.message}
      className="group relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-indigo-400 transition-all duration-200 hover:bg-indigo-500/10 hover:text-indigo-300 focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-2 active:scale-95"
    >
      <IconComponent className="h-4 w-4" />
    </button>
  ) : (
    <button
      type="button"
      onClick={() => router.push('/pricing')}
      className="group flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-indigo-400 transition-all duration-200 hover:bg-indigo-500/10 hover:text-indigo-300 focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-2 active:scale-[0.98]"
    >
      <span className="flex-1 text-left font-semibold">{config.message}</span>
      <IconComponent className="h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110" />
    </button>
  );
}
