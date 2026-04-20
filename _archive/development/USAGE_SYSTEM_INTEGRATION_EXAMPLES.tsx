/**
 * Blueprint Usage System - Integration Examples
 *
 * This file provides complete, copy-paste ready examples for integrating
 * the usage system into various parts of your application.
 */

// ============================================================================
// Example 1: Dashboard Page with Usage Stats
// ============================================================================

'use client';

import { UsageStatsDisplay } from '@/components/usage/UsageStatsDisplay';
import { QuickActionsCard } from '@/components/dashboard/QuickActionsCard';
import { RecentBlueprintsCard } from '@/components/dashboard/RecentBlueprintsCard';

export function DashboardWithUsage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* Top Row - Stats and Actions (Equal Width) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Real-time Usage Stats */}
        <UsageStatsDisplay />

        {/* Quick Actions */}
        <QuickActionsCard />
      </div>

      {/* Bottom Row - Recent Blueprints (Full Width) */}
      <RecentBlueprintsCard />
    </div>
  );
}

// ============================================================================
// Example 2: Questionnaire Page with Limit Handling
// ============================================================================

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUsageStats } from '@/lib/hooks/useUsageStats';
import { useUsageErrorHandler } from '@/lib/utils/usageErrorHandler';
import { LimitReachedModal } from '@/components/usage/LimitReachedModal';
import { ApproachingLimitBanner } from '@/components/usage/LimitReachedModal';
import { Button } from '@/components/ui/button';

export function QuestionnairePageWithLimits() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  // Usage tracking
  const {
    usage,
    refreshUsage,
    isCreationLimitReached,
    creationPercentage,
  } = useUsageStats();

  // Error handling
  const { handleError, showModal, limitType, closeModal } = useUsageErrorHandler();

  const handleSaveQuestionnaire = async (formData: any) => {
    // Preemptive check
    if (isCreationLimitReached) {
      handleError({
        limitExceeded: true,
        error: `You've reached your limit of ${usage?.creationLimit} blueprint creations. Upgrade to create more.`,
      });
      return;
    }

    setSaving(true);

    try {
      const response = await fetch('/api/questionnaire/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staticAnswers: formData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();

        // Check for limit exceeded error
        if (errorData.limitExceeded || response.status === 429) {
          handleError(errorData);
          return;
        }

        throw new Error(errorData.error || 'Failed to save questionnaire');
      }

      const data = await response.json();

      // Success - refresh usage and navigate
      await refreshUsage();
      router.push(`/questionnaire/dynamic?blueprintId=${data.blueprintId}`);
    } catch (error: any) {
      console.error('Save error:', error);
      // Only handle if not already handled
      if (!error.limitExceeded) {
        alert(error.message || 'An error occurred while saving');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Show warning when approaching limit (80%+) */}
      {usage && creationPercentage >= 80 && creationPercentage < 100 && (
        <div className="mb-6">
          <ApproachingLimitBanner
            limitType="creation"
            remaining={usage.creationRemaining}
            onUpgradeClick={() => router.push('/pricing')}
          />
        </div>
      )}

      {/* Questionnaire Form */}
      <form onSubmit={(e) => {
        e.preventDefault();
        const formData = {}; // Extract form data
        handleSaveQuestionnaire(formData);
      }}>
        {/* Form fields here */}

        <div className="flex justify-end gap-4 mt-8">
          <Button
            type="submit"
            variant="primary"
            size="large"
            disabled={saving || isCreationLimitReached}
          >
            {saving ? 'Saving...' : isCreationLimitReached ? 'Limit Reached' : 'Save & Continue'}
          </Button>
        </div>
      </form>

      {/* Limit Reached Modal */}
      <LimitReachedModal
        isOpen={showModal}
        onClose={closeModal}
        limitType={limitType}
        currentCount={usage?.creationCount || 0}
        limit={usage?.creationLimit || 2}
      />
    </div>
  );
}

// ============================================================================
// Example 3: Blueprint Generation with Save Limit Checks
// ============================================================================

'use client';

import { useState, useEffect } from 'react';
import { useUsageStats } from '@/lib/hooks/useUsageStats';
import { useUsageErrorHandler } from '@/lib/utils/usageErrorHandler';
import { LimitReachedModal } from '@/components/usage/LimitReachedModal';
import { UsageBadge } from '@/components/usage/UsageBadge';
import { Button } from '@/components/ui/button';

export function BlueprintGenerationWithLimits({ blueprintId }: { blueprintId: string }) {
  const [generating, setGenerating] = useState(false);

  // Usage tracking
  const { usage, refreshUsage, isSavingLimitReached } = useUsageStats();

  // Error handling
  const { handleError, showModal, limitType, closeModal } = useUsageErrorHandler();

  const handleGenerate = async () => {
    // Preemptive check
    if (isSavingLimitReached) {
      handleError({
        limitExceeded: true,
        error: `You've reached your limit of ${usage?.savingLimit} blueprint saves. Upgrade to save more.`,
      });
      return;
    }

    setGenerating(true);

    try {
      const response = await fetch('/api/blueprints/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blueprintId }),
      });

      if (!response.ok) {
        const errorData = await response.json();

        // Check for limit exceeded error
        if (errorData.limitExceeded || response.status === 429) {
          handleError(errorData);
          return;
        }

        throw new Error(errorData.error || 'Failed to generate blueprint');
      }

      // Success - refresh usage
      await refreshUsage();

      // Navigate to results or show success
      alert('Blueprint generated successfully!');
    } catch (error: any) {
      console.error('Generation error:', error);
      if (!error.limitExceeded) {
        alert(error.message || 'An error occurred during generation');
      }
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header with usage badge */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-title font-bold">Generate Blueprint</h1>
        {usage && (
          <UsageBadge
            current={usage.savingCount}
            limit={usage.savingLimit}
            type="saving"
            variant="compact"
          />
        )}
      </div>

      {/* Content */}
      <div className="space-y-6">
        <p className="text-body text-text-secondary">
          Ready to generate your learning blueprint based on your answers.
        </p>

        <Button
          onClick={handleGenerate}
          variant="primary"
          size="large"
          disabled={generating || isSavingLimitReached}
          className="w-full"
        >
          {generating ? 'Generating...' : isSavingLimitReached ? 'Save Limit Reached' : 'Generate Blueprint'}
        </Button>

        {isSavingLimitReached && (
          <p className="text-caption text-error text-center">
            You've reached your save limit. Please upgrade to continue.
          </p>
        )}
      </div>

      {/* Limit Reached Modal */}
      <LimitReachedModal
        isOpen={showModal}
        onClose={closeModal}
        limitType={limitType}
        currentCount={usage?.savingCount || 0}
        limit={usage?.savingLimit || 2}
      />
    </div>
  );
}

// ============================================================================
// Example 4: Settings Page with Usage Section
// ============================================================================

'use client';

import { UsageStatsDisplay } from '@/components/usage/UsageStatsDisplay';
import { UpgradePrompt } from '@/components/usage/UpgradeCTA';
import { useUsageStats } from '@/lib/hooks/useUsageStats';

export function SettingsPageWithUsage() {
  const { usage, refreshUsage } = useUsageStats();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Profile Section */}
      <section>
        <h2 className="text-heading font-bold mb-4">Profile Settings</h2>
        {/* Profile form fields */}
      </section>

      {/* Usage & Limits Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-heading font-bold">Usage & Limits</h2>
          <Button onClick={refreshUsage} variant="ghost" size="small">
            Refresh
          </Button>
        </div>
        <UsageStatsDisplay />
      </section>

      {/* Upgrade Section (only for free tier) */}
      {usage?.subscriptionTier === 'free' && (
        <section>
          <h2 className="text-heading font-bold mb-4">Upgrade Your Plan</h2>
          <UpgradePrompt currentTier={usage.subscriptionTier} />
        </section>
      )}
    </div>
  );
}

// ============================================================================
// Example 5: Sidebar with Compact Usage Display
// ============================================================================

'use client';

import { CompactUsageDisplay } from '@/components/usage/UsageStatsDisplay';
import { Home, FileText, Settings, LogOut } from 'lucide-react';
import Link from 'next/link';

export function SidebarWithUsage() {
  return (
    <aside className="w-64 h-screen bg-paper border-r border-neutral-200 flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-neutral-200">
        <h1 className="text-title font-bold">Polaris</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-neutral-100">
          <Home className="w-5 h-5" />
          <span>Dashboard</span>
        </Link>
        <Link href="/blueprints" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-neutral-100">
          <FileText className="w-5 h-5" />
          <span>My Blueprints</span>
        </Link>
        <Link href="/settings" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-neutral-100">
          <Settings className="w-5 h-5" />
          <span>Settings</span>
        </Link>
      </nav>

      {/* Usage Display at Bottom */}
      <div className="p-4 border-t border-neutral-200">
        <CompactUsageDisplay />
      </div>

      {/* Logout */}
      <div className="p-4">
        <button className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-neutral-100 w-full text-left">
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

// ============================================================================
// Example 6: Header with Usage Badge
// ============================================================================

'use client';

import { UsageProgressBadge } from '@/components/usage/UsageProgressBar';
import { useUsageStats } from '@/lib/hooks/useUsageStats';
import Link from 'next/link';

export function HeaderWithUsageBadge() {
  const { usage } = useUsageStats();

  return (
    <header className="bg-paper border-b border-neutral-200 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/dashboard">
          <h1 className="text-heading font-bold">Polaris</h1>
        </Link>

        {/* Usage Badge */}
        {usage && (
          <div className="flex items-center gap-4">
            <UsageProgressBadge
              current={usage.creationCount}
              limit={usage.creationLimit}
              type="creation"
            />
            <Link href="/pricing">
              <Button variant="ghost" size="small">
                Upgrade
              </Button>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

// ============================================================================
// Example 7: Complete Flow with All Components
// ============================================================================

'use client';

import { useState } from 'react';
import { useUsageStats } from '@/lib/hooks/useUsageStats';
import { useUsageErrorHandler } from '@/lib/utils/usageErrorHandler';
import { UsageStatsDisplay } from '@/components/usage/UsageStatsDisplay';
import { LimitReachedModal } from '@/components/usage/LimitReachedModal';
import { UpgradeCTA } from '@/components/usage/UpgradeCTA';
import { ApproachingLimitBanner } from '@/components/usage/LimitReachedModal';
import { UsageBadge } from '@/components/usage/UsageBadge';
import { Button } from '@/components/ui/button';

export function CompleteUsageFlow() {
  const [action, setAction] = useState<'create' | 'save' | null>(null);

  // Usage tracking with auto-refresh
  const {
    usage,
    loading,
    refreshUsage,
    isCreationLimitReached,
    isSavingLimitReached,
    creationPercentage,
    savingPercentage,
  } = useUsageStats({
    autoRefresh: true,
    refreshInterval: 60000, // 1 minute
  });

  // Error handling with modal state
  const { handleError, showModal, limitType, closeModal } = useUsageErrorHandler();

  const handleCreateBlueprint = async () => {
    if (isCreationLimitReached) {
      handleError({
        limitExceeded: true,
        error: 'Creation limit reached',
      });
      return;
    }

    setAction('create');

    try {
      // API call here
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate

      await refreshUsage(); // Refresh after success
      alert('Blueprint created!');
    } catch (error) {
      handleError(error);
    } finally {
      setAction(null);
    }
  };

  const handleSaveBlueprint = async () => {
    if (isSavingLimitReached) {
      handleError({
        limitExceeded: true,
        error: 'Save limit reached',
      });
      return;
    }

    setAction('save');

    try {
      // API call here
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate

      await refreshUsage(); // Refresh after success
      alert('Blueprint saved!');
    } catch (error) {
      handleError(error);
    } finally {
      setAction(null);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header with badges */}
      <div className="flex items-center justify-between">
        <h1 className="text-display font-bold">My Blueprints</h1>
        {usage && (
          <div className="flex items-center gap-3">
            <UsageBadge
              current={usage.creationCount}
              limit={usage.creationLimit}
              type="creation"
              variant="compact"
            />
            <UsageBadge
              current={usage.savingCount}
              limit={usage.savingLimit}
              type="saving"
              variant="compact"
            />
          </div>
        )}
      </div>

      {/* Approaching limit banner */}
      {usage && (creationPercentage >= 80 || savingPercentage >= 80) && (
        <ApproachingLimitBanner
          limitType={creationPercentage >= savingPercentage ? 'creation' : 'saving'}
          remaining={
            creationPercentage >= savingPercentage
              ? usage.creationRemaining
              : usage.savingRemaining
          }
        />
      )}

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stats */}
        <div className="lg:col-span-2">
          <UsageStatsDisplay />
        </div>

        {/* Actions */}
        <div className="space-y-4">
          <Button
            onClick={handleCreateBlueprint}
            variant="primary"
            size="large"
            disabled={isCreationLimitReached || action === 'create'}
            className="w-full"
          >
            {action === 'create' ? 'Creating...' : 'Create New Blueprint'}
          </Button>

          <Button
            onClick={handleSaveBlueprint}
            variant="secondary"
            size="large"
            disabled={isSavingLimitReached || action === 'save'}
            className="w-full"
          >
            {action === 'save' ? 'Saving...' : 'Save Blueprint'}
          </Button>
        </div>
      </div>

      {/* Upgrade CTA */}
      {usage?.subscriptionTier === 'free' && (
        <UpgradeCTA variant="card" />
      )}

      {/* Limit Reached Modal */}
      <LimitReachedModal
        isOpen={showModal}
        onClose={closeModal}
        limitType={limitType}
        currentCount={
          limitType === 'creation'
            ? usage?.creationCount || 0
            : usage?.savingCount || 0
        }
        limit={
          limitType === 'creation'
            ? usage?.creationLimit || 2
            : usage?.savingLimit || 2
        }
      />
    </div>
  );
}
