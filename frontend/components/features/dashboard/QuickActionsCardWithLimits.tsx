'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, FileText, Rocket } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useBlueprintLimits } from '@/lib/hooks/useBlueprintLimits';
import { UpgradePromptModal } from '@/components/modals/UpgradePromptModal';
import { cn } from '@/lib/utils';

const quickActions = [
  {
    icon: Plus,
    title: 'Create New Starmap',
    description: 'Start a new learning journey',
    href: '/static-wizard',
    color: 'from-primary to-primary',
    bgColor: 'bg-primary/10',
    borderColor: 'border-primary/20',
    requiresLimitCheck: true, // Check blueprint creation limit before navigating
  },
  {
    icon: FileText,
    title: 'My Starmaps',
    description: 'View your saved blueprints',
    href: '/my-starmaps',
    color: 'from-primary to-primary',
    bgColor: 'bg-primary/10',
    borderColor: 'border-primary/20',
  },
  {
    icon: FileText,
    title: 'Learn More',
    description: 'About Smartslate ecosystem',
    href: '/features',
    color: 'from-primary to-primary',
    bgColor: 'bg-primary/10',
    borderColor: 'border-primary/20',
  },
  {
    icon: Rocket,
    title: 'Explore Solara Learning Engine',
    description: 'Discover AI-powered learning',
    href: 'https://solara.smartslate.io',
    color: 'from-primary to-primary',
    bgColor: 'bg-primary/10',
    borderColor: 'border-primary/20',
    isExternal: true,
  },
];

export function QuickActionsCardWithLimits() {
  const router = useRouter();
  const { user } = useAuth();
  const { isAtCreationLimit, loading, limits, checkBeforeCreate } = useBlueprintLimits();
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  // Debug logging
  console.log('🔍 QuickActionsCardWithLimits state:', {
    isAtCreationLimit,
    loading,
    generationsRemaining: limits?.generationsRemaining,
    maxGenerationsMonthly: limits?.maxGenerations,
    showUpgradePrompt,
  });

  // Track modal state changes
  React.useEffect(() => {
    console.log('🔔 Modal state changed:', { showUpgradePrompt });
  }, [showUpgradePrompt]);

  const handleActionClick = async (action: (typeof quickActions)[0]) => {
    console.log('🖱️ Button clicked:', action.title, {
      requiresLimitCheck: action.requiresLimitCheck,
      loading,
      isAtCreationLimit,
    });

    // Don't check limit while still loading
    if (loading || isChecking) {
      console.log('⏳ Still loading limits, please wait...');
      return;
    }

    // If this action requires limit check, do a fresh server-side check
    if (action.requiresLimitCheck) {
      setIsChecking(true);

      try {
        const result = await checkBeforeCreate();
        setIsChecking(false);

        console.log('🔍 Server-side limit check result:', result);
        console.log('🔍 Result type:', typeof result);
        console.log('🔍 Result.allowed:', result?.allowed);

        if (!result || !result.allowed) {
          console.log('🚫 At creation limit! Showing upgrade modal');
          console.log('🚫 Setting showUpgradePrompt to true');
          setShowUpgradePrompt(true);
          return;
        }

        console.log('✅ Allowed to create, navigating to:', action.href);
        router.push(action.href);
      } catch (error) {
        console.error('❌ Error checking limits:', error);
        setIsChecking(false);
        // Show modal on error to be safe
        console.log('🚫 Error occurred, showing upgrade modal as safety measure');
        setShowUpgradePrompt(true);
      }
      return;
    }

    // For actions that don't require limit check, navigate directly
    console.log('✅ No limit check required, navigating to:', action.href);
    router.push(action.href);
  };

  return (
    <>
      <GlassCard className="h-full p-6 sm:p-8">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="from-primary to-primary flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br">
            <Rocket className="h-5 w-5 text-black" />
          </div>
          <div>
            <h3 className="text-title text-foreground font-bold">Quick Actions</h3>
            <p className="text-caption text-text-secondary">Get started quickly</p>
          </div>
        </div>

        {/* Actions Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            const isDisabled =
              (action.requiresLimitCheck && isAtCreationLimit) ||
              (action.requiresLimitCheck && isChecking);

            const content = (
              <div
                className={cn(
                  'group h-full rounded-xl border p-4 transition-all duration-200',
                  action.borderColor,
                  action.bgColor,
                  isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:scale-105'
                )}
                title={
                  isDisabled
                    ? `You've reached your limit. Upgrade to create more starmaps.`
                    : undefined
                }
              >
                <div className="flex h-full items-start gap-3">
                  <div
                    className={cn(
                      'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br shadow-lg',
                      action.color,
                      !isDisabled && 'transition-shadow group-hover:shadow-xl'
                    )}
                  >
                    <Icon className="h-5 w-5 text-black" />
                  </div>
                  <div className="flex flex-1 flex-col">
                    <h4
                      className={cn(
                        'text-body mb-1 font-semibold transition-colors',
                        isDisabled
                          ? 'text-foreground/50'
                          : 'text-foreground group-hover:text-primary'
                      )}
                    >
                      {action.title}
                    </h4>
                    <p className="text-caption text-text-secondary">
                      {action.requiresLimitCheck && isChecking
                        ? 'Checking limits...'
                        : isDisabled && action.requiresLimitCheck
                          ? 'Limit reached - Upgrade required'
                          : action.description}
                    </p>
                  </div>
                </div>
              </div>
            );

            return (
              <motion.div
                key={action.title}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                {action.requiresLimitCheck ? (
                  <div onClick={() => handleActionClick(action)}>{content}</div>
                ) : action.isExternal ? (
                  <a href={action.href} target="_blank" rel="noopener noreferrer">
                    {content}
                  </a>
                ) : (
                  <Link href={action.href}>{content}</Link>
                )}
              </motion.div>
            );
          })}
        </div>
      </GlassCard>

      {/* Upgrade Prompt Modal */}
      <UpgradePromptModal
        open={showUpgradePrompt}
        onOpenChange={setShowUpgradePrompt}
        currentTier={(limits?.tier as any) || 'explorer'}
        limitType="creation"
        currentCount={limits?.currentGenerations}
        limitCount={limits?.maxGenerationsMonthly}
      />
    </>
  );
}
