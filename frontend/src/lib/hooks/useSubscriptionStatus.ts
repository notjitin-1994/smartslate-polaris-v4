/**
 * useSubscriptionStatus Hook
 *
 * @description Custom hook for managing subscription status with unified mapping
 * and user-friendly status information
 *
 * @version 1.0.0
 * @date 2025-10-30
 */

import { useMemo, useCallback } from 'react';
import {
  mapRazorpayToInternal,
  mapInternalToRazorpay,
  getStatusMapping,
  isStatusActive,
  requiresUserAction,
  getStatusDescription,
  getStatusColor,
  getStatusIcon,
  isValidStatusTransition,
  type RazorpaySubscriptionStatus,
  type InternalSubscriptionStatus,
  type StatusMapping,
} from '@/lib/razorpay/subscriptionStatusMapping';

// ============================================================================
// Hook Interface
// ============================================================================

export interface UseSubscriptionStatusOptions {
  /** Initial status to use */
  initialStatus?: RazorpaySubscriptionStatus | InternalSubscriptionStatus;
  /** Custom status mappings */
  customMappings?: Record<string, Partial<StatusMapping>>;
  /** Enable automatic status updates */
  autoUpdate?: boolean;
}

export interface UseSubscriptionStatusReturn {
  /** Current Razorpay status */
  razorpayStatus: RazorpaySubscriptionStatus | null;
  /** Current internal status */
  internalStatus: InternalSubscriptionStatus;
  /** Complete status mapping */
  statusMapping: StatusMapping | null;
  /** Whether subscription is active */
  isActive: boolean;
  /** Whether user action is required */
  requiresAction: boolean;
  /** User-friendly status description */
  description: string;
  /** Status color for UI */
  color: 'green' | 'yellow' | 'red' | 'gray' | 'blue';
  /** Status icon name */
  icon: string;
  /** Can upgrade subscription */
  canUpgrade: boolean;
  /** Can cancel subscription */
  canCancel: boolean;
  /** Update status */
  updateStatus: (status: RazorpaySubscriptionStatus | InternalSubscriptionStatus) => void;
  /** Reset status */
  resetStatus: () => void;
  /** Check if status transition is valid */
  canTransitionTo: (status: RazorpaySubscriptionStatus) => boolean;
  /** Get formatted status text */
  getFormattedStatus: (options?: { includeIcon?: boolean; includeColor?: boolean }) => string;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * useSubscriptionStatus hook
 */
export function useSubscriptionStatus(
  status?: RazorpaySubscriptionStatus | InternalSubscriptionStatus,
  options: UseSubscriptionStatusOptions = {}
): UseSubscriptionStatusReturn {
  const { initialStatus = status, customMappings = {}, autoUpdate = false } = options;

  // Determine the type of initial status
  const getInitialStatus = useCallback((): {
    razorpayStatus: RazorpaySubscriptionStatus | null;
    internalStatus: InternalSubscriptionStatus;
  } => {
    if (!initialStatus) {
      return { razorpayStatus: null, internalStatus: 'pending' };
    }

    // Check if it's a Razorpay status
    if (
      [
        'created',
        'authenticated',
        'active',
        'paused',
        'resumed',
        'completed',
        'cancelled',
        'halted',
        'pending',
        'expired',
      ].includes(initialStatus as string)
    ) {
      const razorpayStatus = initialStatus as RazorpaySubscriptionStatus;
      return {
        razorpayStatus,
        internalStatus: mapRazorpayToInternal(razorpayStatus),
      };
    }

    // Assume it's an internal status
    return {
      razorpayStatus: mapInternalToRazorpay(initialStatus as InternalSubscriptionStatus),
      internalStatus: initialStatus as InternalSubscriptionStatus,
    };
  }, [initialStatus]);

  const initial = useMemo(getInitialStatus, [getInitialStatus]);

  // Get status mapping with custom overrides
  const statusMapping = useMemo(() => {
    if (!initial.razorpayStatus) return null;

    const baseMapping = getStatusMapping(initial.razorpayStatus);
    const customMapping = customMappings[initial.razorpayStatus];

    if (customMapping) {
      return { ...baseMapping, ...customMapping };
    }

    return baseMapping;
  }, [initial.razorpayStatus, customMappings]);

  // Computed values
  const isActive = useMemo(() => {
    if (!initial.razorpayStatus) return false;
    return isStatusActive(initial.razorpayStatus);
  }, [initial.razorpayStatus]);

  const requiresAction = useMemo(() => {
    if (!initial.razorpayStatus) return true;
    return requiresUserAction(initial.razorpayStatus);
  }, [initial.razorpayStatus]);

  const description = useMemo(() => {
    if (!initial.razorpayStatus) return 'Status unknown';
    return getStatusDescription(initial.razorpayStatus);
  }, [initial.razorpayStatus]);

  const color = useMemo(() => {
    if (!initial.razorpayStatus) return 'gray';
    return getStatusColor(initial.razorpayStatus);
  }, [initial.razorpayStatus]);

  const icon = useMemo(() => {
    if (!initial.razorpayStatus) return 'help-circle';
    return getStatusIcon(initial.razorpayStatus);
  }, [initial.razorpayStatus]);

  const canUpgrade = useMemo(() => {
    return statusMapping?.canUpgrade || false;
  }, [statusMapping]);

  const canCancel = useMemo(() => {
    return statusMapping?.canCancel || false;
  }, [statusMapping]);

  // Status update functions
  const updateStatus = useCallback(
    (newStatus: RazorpaySubscriptionStatus | InternalSubscriptionStatus) => {
      // In a real implementation, this would update state and potentially trigger side effects
      console.log('Updating subscription status to:', newStatus);
    },
    []
  );

  const resetStatus = useCallback(() => {
    updateStatus('pending');
  }, [updateStatus]);

  const canTransitionTo = useCallback(
    (targetStatus: RazorpaySubscriptionStatus): boolean => {
      if (!initial.razorpayStatus) return false;

      return isValidStatusTransition(initial.razorpayStatus, targetStatus);
    },
    [initial.razorpayStatus]
  );

  const getFormattedStatus = useCallback(
    (options: { includeIcon?: boolean; includeColor?: boolean } = {}): string => {
      const { includeIcon = true, includeColor = false } = options;
      let formatted = statusMapping?.userFriendly || 'Unknown Status';

      if (includeIcon && statusMapping?.icon) {
        formatted = `${statusMapping.icon} ${formatted}`;
      }

      if (includeColor && statusMapping?.color) {
        formatted = `${formatted} (${statusMapping.color})`;
      }

      return formatted;
    },
    [statusMapping]
  );

  return {
    razorpayStatus: initial.razorpayStatus,
    internalStatus: initial.internalStatus,
    statusMapping,
    isActive,
    requiresAction,
    description,
    color,
    icon,
    canUpgrade,
    canCancel,
    updateStatus,
    resetStatus,
    canTransitionTo,
    getFormattedStatus,
  };
}

// ============================================================================
// Utility Hooks for Specific Use Cases
// ============================================================================

/**
 * Hook for checking if user needs to take action on subscription
 */
export function useSubscriptionActionRequired(
  status: RazorpaySubscriptionStatus | InternalSubscriptionStatus
): {
  requiresAction: boolean;
  actionText: string;
  actionUrl?: string;
  actionPriority: 'high' | 'medium' | 'low';
} {
  const { requiresAction, statusMapping } = useSubscriptionStatus(status);

  const actionText = useMemo(() => {
    if (!statusMapping) return 'Check subscription status';

    const actionMap: Record<string, string> = {
      created: 'Complete payment to activate subscription',
      authenticated: 'Subscription activating soon',
      halted: 'Update payment method',
      expired: 'Renew subscription to continue',
      pending: 'Check subscription status',
    };

    return actionMap[statusMapping.razorpayStatus] || 'No action required';
  }, [statusMapping]);

  const actionPriority = useMemo(() => {
    if (!statusMapping) return 'low';

    const priorityMap: Record<string, 'high' | 'medium' | 'low'> = {
      halted: 'high',
      expired: 'high',
      created: 'medium',
      pending: 'medium',
      authenticated: 'low',
    };

    return priorityMap[statusMapping.razorpayStatus] || 'low';
  }, [statusMapping]);

  return {
    requiresAction,
    actionText,
    actionPriority,
  };
}

/**
 * Hook for subscription status notifications
 */
export function useSubscriptionNotifications(
  status: RazorpaySubscriptionStatus | InternalSubscriptionStatus
): {
  notifications: Array<{
    id: string;
    type: 'info' | 'warning' | 'error' | 'success';
    title: string;
    message: string;
    persistent: boolean;
  }>;
} {
  const { statusMapping, isActive } = useSubscriptionStatus(status);

  const notifications = useMemo(() => {
    if (!statusMapping) return [];

    const notifs = [];

    // Add notification based on status
    switch (statusMapping.razorpayStatus) {
      case 'created':
        notifs.push({
          id: 'payment-required',
          type: 'info' as const,
          title: 'Payment Required',
          message: 'Complete your payment to activate the subscription.',
          persistent: true,
        });
        break;

      case 'halted':
        notifs.push({
          id: 'payment-issue',
          type: 'error' as const,
          title: 'Payment Issue',
          message: 'Update your payment method to continue service.',
          persistent: true,
        });
        break;

      case 'expired':
        notifs.push({
          id: 'subscription-expired',
          type: 'warning' as const,
          title: 'Subscription Expired',
          message: 'Renew your subscription to continue using our services.',
          persistent: false,
        });
        break;

      case 'active':
        notifs.push({
          id: 'subscription-active',
          type: 'success' as const,
          title: 'Subscription Active',
          message: 'Your subscription is active and all features are available.',
          persistent: false,
        });
        break;

      case 'cancelled':
        notifs.push({
          id: 'subscription-cancelled',
          type: 'info' as const,
          title: 'Subscription Cancelled',
          message: 'Your subscription has been cancelled.',
          persistent: false,
        });
        break;
    }

    return notifs;
  }, [statusMapping, isActive]);

  return { notifications };
}

export default useSubscriptionStatus;
