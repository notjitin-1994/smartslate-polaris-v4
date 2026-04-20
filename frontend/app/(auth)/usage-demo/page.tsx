'use client';

export const dynamic = 'force-dynamic';
/**
 * Usage Components Demo Page
 *
 * A showcase page demonstrating all usage-related UI components.
 * This page is for development/testing purposes and shows how to integrate
 * the components in a real application.
 *
 * Remove or protect this route in production.
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TierBadge } from '@/components/ui/TierBadge';
import { EnhancedUsageStatsCard } from '@/components/dashboard/EnhancedUsageStatsCard';
import { LimitWarningModal, UpgradePromptModal } from '@/components/modals';
import { UsageDetailPanel } from '@/components/settings/UsageDetailPanel';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/GlassCard';
import { Code, Eye, Zap, Info } from 'lucide-react';

export default function UsageDemoPage() {
  const [showLimitWarning, setShowLimitWarning] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [selectedTier, setSelectedTier] = useState<string>('free');

  const tiers = [
    'free',
    'explorer',
    'navigator',
    'voyager',
    'crew',
    'fleet',
    'armada',
    'developer',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="from-primary mb-4 bg-gradient-to-r via-purple-600 to-pink-600 bg-clip-text text-5xl font-bold text-transparent">
            Usage Components Showcase
          </h1>
          <p className="text-text-secondary text-lg">
            World-class UI components for tier limits and usage information
          </p>
          <div className="text-text-secondary mt-4 flex items-center justify-center gap-2 text-sm">
            <Info className="h-4 w-4" />
            <span>Development demo page - Remove in production</span>
          </div>
        </motion.div>

        {/* TierBadge Showcase */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <GlassCard>
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600">
                <Eye className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-foreground text-2xl font-bold">TierBadge Component</h2>
                <p className="text-text-secondary text-sm">Reusable tier badges with variants</p>
              </div>
            </div>

            {/* Size Variants */}
            <div className="mb-6">
              <h3 className="text-foreground mb-3 text-sm font-semibold">Sizes</h3>
              <div className="flex flex-wrap items-center gap-3">
                <TierBadge tier="navigator" size="sm" />
                <TierBadge tier="navigator" size="md" />
                <TierBadge tier="navigator" size="lg" />
              </div>
            </div>

            {/* Style Variants */}
            <div className="mb-6">
              <h3 className="text-foreground mb-3 text-sm font-semibold">Variants</h3>
              <div className="flex flex-wrap items-center gap-3">
                <TierBadge tier="voyager" variant="solid" />
                <TierBadge tier="voyager" variant="outlined" />
                <TierBadge tier="voyager" variant="ghost" />
              </div>
            </div>

            {/* All Tiers */}
            <div>
              <h3 className="text-foreground mb-3 text-sm font-semibold">All Tiers</h3>
              <div className="flex flex-wrap items-center gap-3">
                {tiers.map((tier) => (
                  <TierBadge key={tier} tier={tier} size="md" variant="solid" showIcon animated />
                ))}
              </div>
            </div>

            {/* Code Example */}
            <div className="mt-6 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
              <div className="mb-2 flex items-center gap-2">
                <Code className="text-primary h-4 w-4" />
                <span className="text-foreground text-xs font-semibold">Usage</span>
              </div>
              <pre className="text-text-secondary overflow-x-auto text-xs">
                <code>{`<TierBadge tier="navigator" size="md" variant="solid" showIcon animated />`}</code>
              </pre>
            </div>
          </GlassCard>
        </motion.div>

        {/* EnhancedUsageStatsCard Showcase */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <GlassCard>
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-foreground text-2xl font-bold">EnhancedUsageStatsCard</h2>
                <p className="text-text-secondary text-sm">
                  Live usage dashboard card with animations
                </p>
              </div>
            </div>

            <EnhancedUsageStatsCard />

            {/* Code Example */}
            <div className="mt-6 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
              <div className="mb-2 flex items-center gap-2">
                <Code className="text-primary h-4 w-4" />
                <span className="text-foreground text-xs font-semibold">Usage</span>
              </div>
              <pre className="text-text-secondary overflow-x-auto text-xs">
                <code>{`<EnhancedUsageStatsCard />`}</code>
              </pre>
            </div>
          </GlassCard>
        </motion.div>

        {/* Modal Showcase */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <GlassCard>
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-500 to-amber-600">
                <Eye className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-foreground text-2xl font-bold">Modal Components</h2>
                <p className="text-text-secondary text-sm">Limit warnings and upgrade prompts</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Tier Selector */}
              <div>
                <label className="text-foreground mb-2 block text-sm font-medium">
                  Select Current Tier (for demo):
                </label>
                <div className="flex flex-wrap gap-2">
                  {tiers.slice(0, 4).map((tier) => (
                    <button
                      key={tier}
                      onClick={() => setSelectedTier(tier)}
                      className={`rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
                        selectedTier === tier
                          ? 'border-primary bg-primary text-white'
                          : 'text-foreground hover:border-primary border-neutral-200 bg-white'
                      }`}
                    >
                      {tier.charAt(0).toUpperCase() + tier.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Modal Triggers */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 p-4">
                  <h3 className="text-foreground mb-2 text-sm font-semibold">LimitWarningModal</h3>
                  <p className="text-text-secondary mb-4 text-xs">
                    Shows before creating/saving a starmap
                  </p>
                  <Button onClick={() => setShowLimitWarning(true)} className="btn-primary w-full">
                    Show Warning Modal
                  </Button>
                </div>

                <div className="rounded-lg border border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50 p-4">
                  <h3 className="text-foreground mb-2 text-sm font-semibold">UpgradePromptModal</h3>
                  <p className="text-text-secondary mb-4 text-xs">Shows when limit is reached</p>
                  <Button onClick={() => setShowUpgradePrompt(true)} className="btn-primary w-full">
                    Show Upgrade Modal
                  </Button>
                </div>
              </div>
            </div>

            {/* Code Example */}
            <div className="mt-6 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
              <div className="mb-2 flex items-center gap-2">
                <Code className="text-primary h-4 w-4" />
                <span className="text-foreground text-xs font-semibold">Usage</span>
              </div>
              <pre className="text-text-secondary overflow-x-auto text-xs">
                <code>{`<LimitWarningModal
  open={showWarning}
  onOpenChange={setShowWarning}
  onContinue={handleCreate}
  action="create"
/>

<UpgradePromptModal
  open={showUpgrade}
  onOpenChange={setShowUpgrade}
  currentTier="free"
  limitType="creation"
/>`}</code>
              </pre>
            </div>
          </GlassCard>
        </motion.div>

        {/* UsageDetailPanel Showcase */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600">
              <Eye className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-foreground text-2xl font-bold">UsageDetailPanel</h2>
              <p className="text-text-secondary text-sm">
                Comprehensive usage analytics with charts
              </p>
            </div>
          </div>

          <UsageDetailPanel />

          {/* Code Example */}
          <div className="mt-6">
            <GlassCard>
              <div className="mb-2 flex items-center gap-2">
                <Code className="text-primary h-4 w-4" />
                <span className="text-foreground text-xs font-semibold">Usage</span>
              </div>
              <pre className="text-text-secondary overflow-x-auto text-xs">
                <code>{`<UsageDetailPanel />`}</code>
              </pre>
            </GlassCard>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="rounded-xl border border-blue-200 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 p-6 text-center backdrop-blur-sm"
        >
          <Info className="mx-auto mb-3 h-8 w-8 text-blue-600" />
          <h3 className="text-foreground mb-2 text-lg font-semibold">Development Note</h3>
          <p className="text-text-secondary text-sm">
            This demo page showcases all usage-related components. Remove or protect this route in
            production. Refer to{' '}
            <code className="rounded bg-neutral-200 px-1 py-0.5 text-xs">
              frontend/components/usage/README.md
            </code>{' '}
            for detailed documentation.
          </p>
        </motion.div>
      </div>

      {/* Modals */}
      <LimitWarningModal
        open={showLimitWarning}
        onOpenChange={setShowLimitWarning}
        onContinue={() => {
          console.log('Continue creating starmap');
          setShowLimitWarning(false);
        }}
        action="create"
      />

      <UpgradePromptModal
        open={showUpgradePrompt}
        onOpenChange={setShowUpgradePrompt}
        currentTier={selectedTier}
        limitType="creation"
        currentCount={2}
        limitCount={2}
      />
    </div>
  );
}
