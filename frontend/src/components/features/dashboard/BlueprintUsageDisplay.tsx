'use client';

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Save, Crown, AlertCircle, RefreshCw } from 'lucide-react';
import { useUserUsage } from '@/lib/hooks/useUserUsage';
import { isFreeTier } from '@/lib/utils/tierDisplay';

interface BlueprintUsageDisplayProps {
  className?: string;
}

export function BlueprintUsageDisplay({
  className,
}: BlueprintUsageDisplayProps): React.JSX.Element {
  const { usage, loading, refreshUsage } = useUserUsage();

  // Listen for storage events to refresh when blueprint operations complete
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'blueprint_operation_completed') {
        refreshUsage();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [refreshUsage]);

  if (loading || !usage) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-pulse rounded-full bg-white/20"></div>
          <div className="h-4 w-4 animate-pulse rounded-full bg-white/20"></div>
        </div>
      </div>
    );
  }

  // Get values from usage API (actual database counts)
  const creationCount = usage.creationCount;
  const creationLimit = usage.creationLimit;
  const savingCount = usage.savingCount;
  const savingLimit = usage.savingLimit;
  const subscriptionTier = usage.subscriptionTier;

  // Handle unlimited limits (-1 means unlimited)
  const isCreationUnlimited = creationLimit === -1;
  const isSavingUnlimited = savingLimit === -1;

  const creationRemaining = isCreationUnlimited ? 999 : Math.max(0, creationLimit - creationCount);
  const savingRemaining = isSavingUnlimited ? 999 : Math.max(0, savingLimit - savingCount);

  // If user is exempt or has unlimited access, show unlimited indicator
  if (isCreationUnlimited || isSavingUnlimited) {
    return (
      <motion.div
        className={`flex items-center gap-3 ${className}`}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="bg-primary/10 border-primary/20 flex items-center gap-2 rounded-xl border px-3 py-2">
          <Crown className="text-primary h-4 w-4" />
          <span className="text-primary text-sm font-medium">Unlimited Access</span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className={`flex items-center gap-3 ${className}`}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Creation Counter */}
      <div className="flex items-center gap-2">
        <div className="relative">
          <FileText className="h-4 w-4 text-white/80" />
          <div
            className="absolute -right-1 -bottom-1 h-2 w-2 rounded-full border border-white/20"
            style={{
              backgroundColor:
                creationRemaining <= 1 ? '#ef4444' : creationRemaining <= 3 ? '#f59e0b' : '#10b981',
            }}
          />
        </div>
        <div className="flex flex-col">
          <div className="text-xs text-white/60">Create</div>
          <div className="text-sm font-medium text-white">
            {isFreeTier(subscriptionTier)
              ? `${creationRemaining} of ${creationLimit}`
              : isCreationUnlimited
                ? 'Unlimited'
                : `${creationRemaining} left`}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="h-6 w-px bg-white/20"></div>

      {/* Saving Counter */}
      <div className="flex items-center gap-2">
        <div className="relative">
          <Save className="h-4 w-4 text-white/80" />
          <div
            className="absolute -right-1 -bottom-1 h-2 w-2 rounded-full border border-white/20"
            style={{
              backgroundColor:
                savingRemaining <= 1 ? '#ef4444' : savingRemaining <= 3 ? '#f59e0b' : '#10b981',
            }}
          />
        </div>
        <div className="flex flex-col">
          <div className="text-xs text-white/60">Save</div>
          <div className="text-sm font-medium text-white">
            {isFreeTier(subscriptionTier)
              ? `${savingRemaining} of ${savingLimit}`
              : isSavingUnlimited
                ? 'Unlimited'
                : `${savingRemaining} left`}
          </div>
        </div>
      </div>

      {/* Manual refresh button */}
      <motion.button
        onClick={refreshUsage}
        className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-white/60 transition-colors hover:bg-white/20 hover:text-white"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        title="Refresh usage data"
      >
        <RefreshCw className="h-3 w-3" />
      </motion.button>

      {/* Warning for low limits */}
      {(creationRemaining <= 1 || savingRemaining <= 1) && (
        <motion.div
          className="bg-warning/10 border-warning/20 flex items-center gap-1 rounded-lg border px-2 py-1"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        >
          <AlertCircle className="text-warning h-3 w-3" />
          <span className="text-warning text-xs font-medium">
            {creationRemaining <= 1 && savingRemaining <= 1
              ? 'Limits low'
              : creationRemaining <= 1
                ? 'Creation limit low'
                : 'Saving limit low'}
          </span>
        </motion.div>
      )}
    </motion.div>
  );
}
