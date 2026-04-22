/**
 * Grace Period Hook
 *
 * @description React hook for managing subscription grace periods
 * in frontend components
 *
 * @version 1.0.0
 * @date 2025-10-30
 */

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createBrowserClient } from '@/lib/supabase/client';
import {
  getGracePeriodStatus,
  checkGracePeriodRestrictions,
  type GracePeriodStatus,
} from '@/lib/subscription/gracePeriodManager';

// ============================================================================
// Hook Types
// ============================================================================

export interface UseGracePeriodOptions {
  /** Whether to automatically refetch grace period status */
  autoRefetch?: boolean;
  /** Refetch interval in milliseconds */
  refetchInterval?: number;
  /** Whether to show grace period UI */
  showUI?: boolean;
}

export interface GracePeriodUI {
  isVisible: boolean;
  type: 'banner' | 'modal' | 'toast' | 'none';
  severity: 'info' | 'warning' | 'error';
  title: string;
  message: string;
  actions: Array<{
    label: string;
    action: () => void;
    variant: 'primary' | 'secondary' | 'outline';
  }>;
  dismissible: boolean;
}

// ============================================================================
// Grace Period Hook
// ============================================================================

/**
 * Hook for managing subscription grace periods
 */
export function useGracePeriod(options: UseGracePeriodOptions = {}) {
  const {
    autoRefetch = true,
    refetchInterval = 5 * 60 * 1000, // 5 minutes
    showUI = true,
  } = options;

  const [showGracePeriodUI, setShowGracePeriodUI] = useState(false);
  const [dismissedWarnings, setDismissedWarnings] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  // Get grace period status
  const {
    data: gracePeriodStatus,
    isLoading: isLoadingGracePeriod,
    error: gracePeriodError,
    refetch: refetchGracePeriod,
  } = useQuery({
    queryKey: ['grace-period-status'],
    queryFn: async () => {
      const supabase = createBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      return getGracePeriodStatus(user.id);
    },
    enabled: autoRefetch,
    refetchInterval,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Check action restrictions
  const checkActionRestriction = useCallback(
    async (action: 'create_blueprint' | 'save_blueprint' | 'access_premium_features') => {
      const supabase = createBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return { allowed: false, reason: 'User not authenticated' };
      }

      return checkGracePeriodRestrictions(user.id, action);
    },
    []
  );

  // Generate grace period UI
  const gracePeriodUI: GracePeriodUI = (() => {
    if (!showUI || !gracePeriodStatus || !gracePeriodStatus.isInGracePeriod) {
      return {
        isVisible: false,
        type: 'none',
        severity: 'info',
        title: '',
        message: '',
        actions: [],
        dismissible: true,
      };
    }

    const { daysRemaining, restrictions, nextAction } = gracePeriodStatus;
    const warningKey = `${daysRemaining}-days`;

    // Check if warning has been dismissed
    if (dismissedWarnings.has(warningKey)) {
      return {
        isVisible: false,
        type: 'none',
        severity: 'info',
        title: '',
        message: '',
        actions: [],
        dismissible: true,
      };
    }

    let title = '';
    let message = '';
    let severity: GracePeriodUI['severity'] = 'warning';
    let type: GracePeriodUI['type'] = 'banner';
    const actions: GracePeriodUI['actions'] = [];

    if (daysRemaining !== undefined) {
      if (daysRemaining <= 1) {
        title = 'Grace Period Ending Soon';
        message = `Your subscription grace period ends in ${daysRemaining} day. Your account will be downgraded to the free tier.`;
        severity = 'error';
        type = 'modal';
      } else if (daysRemaining <= 3) {
        title = 'Action Required: Subscription Grace Period';
        message = `Your subscription grace period ends in ${daysRemaining} days. Please update your payment method to continue enjoying premium features.`;
        severity = 'error';
        type = 'banner';
      } else if (daysRemaining <= 7) {
        title = 'Subscription Grace Period Active';
        message = `Your subscription is in a ${daysRemaining}-day grace period. Some features may be restricted.`;
        severity = 'warning';
        type = 'banner';
      } else {
        title = 'Payment Issue Detected';
        message = `We couldn't process your recent payment. You have ${daysRemaining} days to update your payment method.`;
        severity = 'warning';
        type = 'banner';
      }
    }

    // Add actions based on days remaining and restrictions
    if (daysRemaining !== undefined && daysRemaining <= 7) {
      actions.push({
        label: 'Update Payment Method',
        action: () => {
          window.location.href = '/settings/subscription';
        },
        variant: 'primary',
      });
    }

    if (restrictions.canCreateBlueprints && restrictions.canSaveBlueprints) {
      actions.push({
        label: 'View Usage Limits',
        action: () => {
          window.location.href = '/settings/usage';
        },
        variant: 'secondary',
      });
    }

    if (type === 'banner' && daysRemaining !== undefined && daysRemaining > 3) {
      actions.push({
        label: 'Dismiss',
        action: () => {
          setDismissedWarnings((prev) => new Set(prev).add(warningKey));
          setShowGracePeriodUI(false);
        },
        variant: 'outline',
      });
    }

    return {
      isVisible: true,
      type,
      severity,
      title,
      message,
      actions,
      dismissible: type === 'banner',
    };
  })();

  // Show/hide grace period UI based on status
  useEffect(() => {
    if (gracePeriodUI.isVisible && showUI) {
      setShowGracePeriodUI(true);
    } else {
      setShowGracePeriodUI(false);
    }
  }, [gracePeriodUI.isVisible, showUI]);

  // Mutation to dismiss warnings
  const { mutate: dismissWarning } = useMutation({
    mutationFn: async (warningKey: string) => {
      setDismissedWarnings((prev) => new Set(prev).add(warningKey));
      setShowGracePeriodUI(false);
    },
  });

  return {
    // Grace period status
    gracePeriodStatus,
    isLoadingGracePeriod,
    gracePeriodError,

    // UI controls
    showGracePeriodUI,
    gracePeriodUI,
    dismissWarning,

    // Actions
    refetchGracePeriod,
    checkActionRestriction,

    // Convenience methods
    isInGracePeriod: gracePeriodStatus?.isInGracePeriod || false,
    daysRemaining: gracePeriodStatus?.daysRemaining,
    restrictions: gracePeriodStatus?.restrictions || {
      canCreateBlueprints: false,
      canSaveBlueprints: false,
      canAccessPremiumFeatures: false,
      maxBlueprintsPerMonth: 0,
    },
  };
}

// ============================================================================
// Action-specific Hooks
// ============================================================================

/**
 * Hook for checking blueprint creation restrictions
 */
export function useBlueprintCreationRestrictions() {
  const { checkActionRestriction, isInGracePeriod, daysRemaining } = useGracePeriod();

  const {
    data: canCreate,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['blueprint-creation-restriction'],
    queryFn: () => checkActionRestriction('create_blueprint'),
    enabled: isInGracePeriod,
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  return {
    canCreateBlueprint: canCreate?.allowed || !isInGracePeriod,
    restrictionReason: canCreate?.reason,
    isLoading,
    refetch,
    daysRemaining,
  };
}

/**
 * Hook for checking blueprint saving restrictions
 */
export function useBlueprintSavingRestrictions() {
  const { checkActionRestriction, isInGracePeriod, daysRemaining } = useGracePeriod();

  const {
    data: canSave,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['blueprint-saving-restriction'],
    queryFn: () => checkActionRestriction('save_blueprint'),
    enabled: isInGracePeriod,
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  return {
    canSaveBlueprint: canSave?.allowed || !isInGracePeriod,
    restrictionReason: canSave?.reason,
    isLoading,
    refetch,
    daysRemaining,
  };
}

/**
 * Hook for checking premium feature access
 */
export function usePremiumFeatureRestrictions() {
  const { checkActionRestriction, isInGracePeriod, daysRemaining } = useGracePeriod();

  const {
    data: canAccess,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['premium-feature-restriction'],
    queryFn: () => checkActionRestriction('access_premium_features'),
    enabled: isInGracePeriod,
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  return {
    canAccessPremiumFeatures: canAccess?.allowed || !isInGracePeriod,
    restrictionReason: canAccess?.reason,
    isLoading,
    refetch,
    daysRemaining,
  };
}

// ============================================================================
// Grace Period Components Hook
// ============================================================================

/**
 * Hook for grace period banner component
 */
export function useGracePeriodBanner() {
  const { gracePeriodUI, dismissWarning } = useGracePeriod({
    showUI: true,
  });

  return {
    isVisible: gracePeriodUI.isVisible && gracePeriodUI.type === 'banner',
    title: gracePeriodUI.title,
    message: gracePeriodUI.message,
    severity: gracePeriodUI.severity,
    actions: gracePeriodUI.actions,
    onDismiss: gracePeriodUI.dismissible ? () => dismissWarning('banner') : undefined,
  };
}

/**
 * Hook for grace period modal component
 */
export function useGracePeriodModal() {
  const { gracePeriodUI } = useGracePeriod({
    showUI: true,
  });

  return {
    isVisible: gracePeriodUI.isVisible && gracePeriodUI.type === 'modal',
    title: gracePeriodUI.title,
    message: gracePeriodUI.message,
    severity: gracePeriodUI.severity,
    actions: gracePeriodUI.actions,
    dismissible: gracePeriodUI.dismissible,
  };
}

// ============================================================================
// Utility Hooks
// ============================================================================

/**
 * Hook to get grace period status for debugging
 */
export function useGracePeriodDebug() {
  const { gracePeriodStatus, isLoadingGracePeriod, gracePeriodError } = useGracePeriod();

  return {
    status: gracePeriodStatus,
    isLoading: isLoadingGracePeriod,
    error: gracePeriodError,
    // Computed values for debugging
    isCurrentlyInGracePeriod: gracePeriodStatus?.isInGracePeriod || false,
    currentDaysRemaining: gracePeriodStatus?.daysRemaining,
    currentRestrictions: gracePeriodStatus?.restrictions,
    nextAction: gracePeriodStatus?.nextAction,
    // Timestamp
    lastChecked: new Date().toISOString(),
  };
}

export default {
  useGracePeriod,
  useBlueprintCreationRestrictions,
  useBlueprintSavingRestrictions,
  usePremiumFeatureRestrictions,
  useGracePeriodBanner,
  useGracePeriodModal,
  useGracePeriodDebug,
};
