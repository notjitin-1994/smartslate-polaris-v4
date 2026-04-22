/**
 * Unified Subscription Status Mapping
 *
 * @description Provides consistent mapping between Razorpay subscription statuses
 * and internal application statuses with proper state transitions
 *
 * @version 1.0.0
 * @date 2025-10-30
 */

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Razorpay subscription statuses
 */
export type RazorpaySubscriptionStatus =
  | 'created'
  | 'authenticated'
  | 'active'
  | 'paused'
  | 'resumed'
  | 'completed'
  | 'cancelled'
  | 'halted'
  | 'pending'
  | 'expired';

/**
 * Internal application subscription statuses
 */
export type InternalSubscriptionStatus =
  | 'pending'
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'cancelled'
  | 'unpaid'
  | 'paused'
  | 'completed'
  | 'expired'
  | 'error';

/**
 * Status mapping with metadata
 */
export interface StatusMapping {
  razorpayStatus: RazorpaySubscriptionStatus;
  internalStatus: InternalSubscriptionStatus;
  userFriendly: string;
  description: string;
  isActive: boolean;
  requiresAction: boolean;
  canUpgrade: boolean;
  canCancel: boolean;
  color: 'green' | 'yellow' | 'red' | 'gray' | 'blue';
  icon?: string;
}

/**
 * Status transition validation
 */
export interface StatusTransition {
  from: RazorpaySubscriptionStatus | InternalSubscriptionStatus;
  to: RazorpaySubscriptionStatus | InternalSubscriptionStatus;
  allowed: boolean;
  reason?: string;
}

// ============================================================================
// Status Mapping Configuration
// ============================================================================

/**
 * Complete mapping between Razorpay and internal statuses
 */
export const SUBSCRIPTION_STATUS_MAPPING: Record<RazorpaySubscriptionStatus, StatusMapping> = {
  // Subscription created but not yet activated
  created: {
    razorpayStatus: 'created',
    internalStatus: 'pending',
    userFriendly: 'Pending Activation',
    description: 'Subscription has been created and is awaiting payment or activation.',
    isActive: false,
    requiresAction: true,
    canUpgrade: false,
    canCancel: true,
    color: 'yellow',
    icon: 'clock',
  },

  // Subscription has been authenticated (payment method verified)
  authenticated: {
    razorpayStatus: 'authenticated',
    internalStatus: 'pending',
    userFriendly: 'Payment Verified',
    description: 'Payment method has been verified. Subscription will be activated shortly.',
    isActive: false,
    requiresAction: false,
    canUpgrade: false,
    canCancel: true,
    color: 'blue',
    icon: 'check-circle',
  },

  // Subscription is active and billing normally
  active: {
    razorpayStatus: 'active',
    internalStatus: 'active',
    userFriendly: 'Active',
    description: 'Subscription is active and you have full access to all features.',
    isActive: true,
    requiresAction: false,
    canUpgrade: true,
    canCancel: true,
    color: 'green',
    icon: 'check-circle',
  },

  // Subscription is paused (temporary hold)
  paused: {
    razorpayStatus: 'paused',
    internalStatus: 'paused',
    userFriendly: 'Paused',
    description: 'Subscription is temporarily paused. Billing is on hold.',
    isActive: false,
    requiresAction: false,
    canUpgrade: true,
    canCancel: true,
    color: 'gray',
    icon: 'pause-circle',
  },

  // Previously paused subscription has been resumed
  resumed: {
    razorpayStatus: 'resumed',
    internalStatus: 'active',
    userFriendly: 'Resumed',
    description: 'Subscription has been resumed and is now active.',
    isActive: true,
    requiresAction: false,
    canUpgrade: true,
    canCancel: true,
    color: 'green',
    icon: 'play-circle',
  },

  // Subscription has completed all payments
  completed: {
    razorpayStatus: 'completed',
    internalStatus: 'completed',
    userFriendly: 'Completed',
    description: 'Subscription has been completed successfully.',
    isActive: false,
    requiresAction: false,
    canUpgrade: false,
    canCancel: false,
    color: 'blue',
    icon: 'flag',
  },

  // Subscription has been cancelled
  cancelled: {
    razorpayStatus: 'cancelled',
    internalStatus: 'cancelled',
    userFriendly: 'Cancelled',
    description: 'Subscription has been cancelled.',
    isActive: false,
    requiresAction: false,
    canUpgrade: false,
    canCancel: false,
    color: 'red',
    icon: 'x-circle',
  },

  // Subscription has been halted due to payment issues
  halted: {
    razorpayStatus: 'halted',
    internalStatus: 'past_due',
    userFriendly: 'Payment Issue',
    description:
      'Subscription is on hold due to payment issues. Please update your payment method.',
    isActive: false,
    requiresAction: true,
    canUpgrade: false,
    canCancel: true,
    color: 'red',
    icon: 'alert-circle',
  },

  // Subscription activation is pending
  pending: {
    razorpayStatus: 'pending',
    internalStatus: 'pending',
    userFriendly: 'Pending',
    description: 'Subscription is being processed and will be activated shortly.',
    isActive: false,
    requiresAction: false,
    canUpgrade: false,
    canCancel: true,
    color: 'yellow',
    icon: 'clock',
  },

  // Subscription has expired
  expired: {
    razorpayStatus: 'expired',
    internalStatus: 'expired',
    userFriendly: 'Expired',
    description: 'Subscription has expired. Please renew to continue using our services.',
    isActive: false,
    requiresAction: true,
    canUpgrade: false,
    canCancel: false,
    color: 'gray',
    icon: 'calendar-x',
  },
};

// ============================================================================
// Allowed Status Transitions
// ============================================================================

/**
 * Define valid status transitions for Razorpay subscriptions
 */
export const RAZORPAY_STATUS_TRANSITIONS: Record<
  RazorpaySubscriptionStatus,
  RazorpaySubscriptionStatus[]
> = {
  created: ['authenticated', 'active', 'cancelled', 'expired'],
  authenticated: ['active', 'cancelled', 'expired'],
  active: ['paused', 'cancelled', 'completed', 'halted', 'expired'],
  paused: ['resumed', 'cancelled', 'expired'],
  resumed: ['active', 'paused', 'cancelled', 'expired'],
  completed: [], // Terminal state
  cancelled: [], // Terminal state
  halted: ['active', 'cancelled', 'expired'],
  pending: ['active', 'cancelled', 'expired'],
  expired: [], // Terminal state
};

/**
 * Define valid status transitions for internal statuses
 */
export const INTERNAL_STATUS_TRANSITIONS: Record<
  InternalSubscriptionStatus,
  InternalSubscriptionStatus[]
> = {
  pending: ['active', 'cancelled', 'expired', 'past_due'],
  active: ['paused', 'cancelled', 'completed', 'past_due', 'expired'],
  trialing: ['active', 'cancelled', 'past_due', 'expired'],
  past_due: ['active', 'cancelled', 'paused', 'expired'],
  cancelled: [], // Terminal state
  unpaid: ['active', 'cancelled', 'expired'],
  paused: ['active', 'cancelled', 'expired'],
  completed: [], // Terminal state
  expired: [], // Terminal state
  error: ['pending', 'active', 'cancelled'],
};

// ============================================================================
// Mapping Functions
// ============================================================================

/**
 * Map Razorpay status to internal status
 */
export function mapRazorpayToInternal(
  razorpayStatus: RazorpaySubscriptionStatus
): InternalSubscriptionStatus {
  return SUBSCRIPTION_STATUS_MAPPING[razorpayStatus]?.internalStatus || 'error';
}

/**
 * Map internal status to Razorpay status (reverse mapping)
 */
export function mapInternalToRazorpay(
  internalStatus: InternalSubscriptionStatus
): RazorpaySubscriptionStatus | null {
  for (const [razorpayStatus, mapping] of Object.entries(SUBSCRIPTION_STATUS_MAPPING)) {
    if (mapping.internalStatus === internalStatus) {
      return razorpayStatus as RazorpaySubscriptionStatus;
    }
  }
  return null;
}

/**
 * Get complete status mapping for a Razorpay status
 */
export function getStatusMapping(razorpayStatus: RazorpaySubscriptionStatus): StatusMapping {
  return (
    SUBSCRIPTION_STATUS_MAPPING[razorpayStatus] || {
      razorpayStatus,
      internalStatus: 'error',
      userFriendly: 'Unknown Status',
      description: 'Subscription status is unknown. Please contact support.',
      isActive: false,
      requiresAction: true,
      canUpgrade: false,
      canCancel: false,
      color: 'red',
      icon: 'alert-triangle',
    }
  );
}

/**
 * Check if a status transition is allowed
 */
export function isValidStatusTransition(
  fromStatus: RazorpaySubscriptionStatus,
  toStatus: RazorpaySubscriptionStatus
): boolean {
  return RAZORPAY_STATUS_TRANSITIONS[fromStatus]?.includes(toStatus) || false;
}

/**
 * Check if a status is considered active
 */
export function isStatusActive(
  razorpayStatus: RazorpaySubscriptionStatus | InternalSubscriptionStatus
): boolean {
  if (
    typeof razorpayStatus === 'string' &&
    Object.keys(SUBSCRIPTION_STATUS_MAPPING).includes(razorpayStatus)
  ) {
    return (
      SUBSCRIPTION_STATUS_MAPPING[razorpayStatus as RazorpaySubscriptionStatus]?.isActive || false
    );
  }

  // For internal statuses
  const activeInternalStatuses: InternalSubscriptionStatus[] = ['active', 'trialing'];
  return activeInternalStatuses.includes(razorpayStatus as InternalSubscriptionStatus);
}

/**
 * Check if subscription requires user action
 */
export function requiresUserAction(razorpayStatus: RazorpaySubscriptionStatus): boolean {
  return SUBSCRIPTION_STATUS_MAPPING[razorpayStatus]?.requiresAction || false;
}

/**
 * Get user-friendly status description
 */
export function getStatusDescription(razorpayStatus: RazorpaySubscriptionStatus): string {
  return SUBSCRIPTION_STATUS_MAPPING[razorpayStatus]?.description || 'Unknown status';
}

/**
 * Get status color for UI display
 */
export function getStatusColor(
  razorpayStatus: RazorpaySubscriptionStatus
): 'green' | 'yellow' | 'red' | 'gray' | 'blue' {
  return SUBSCRIPTION_STATUS_MAPPING[razorpayStatus]?.color || 'gray';
}

/**
 * Get status icon for UI display
 */
export function getStatusIcon(razorpayStatus: RazorpaySubscriptionStatus): string {
  return SUBSCRIPTION_STATUS_MAPPING[razorpayStatus]?.icon || 'help-circle';
}

// ============================================================================
// Status Filtering and Queries
// ============================================================================

/**
 * Get all active statuses
 */
export function getActiveStatuses(): RazorpaySubscriptionStatus[] {
  return Object.entries(SUBSCRIPTION_STATUS_MAPPING)
    .filter(([_, mapping]) => mapping.isActive)
    .map(([status, _]) => status as RazorpaySubscriptionStatus);
}

/**
 * Get all statuses that require user action
 */
export function getActionRequiredStatuses(): RazorpaySubscriptionStatus[] {
  return Object.entries(SUBSCRIPTION_STATUS_MAPPING)
    .filter(([_, mapping]) => mapping.requiresAction)
    .map(([status, _]) => status as RazorpaySubscriptionStatus);
}

/**
 * Get all terminal statuses (no further transitions possible)
 */
export function getTerminalStatuses(): RazorpaySubscriptionStatus[] {
  return Object.entries(RAZORPAY_STATUS_TRANSITIONS)
    .filter(([_, allowed]) => allowed.length === 0)
    .map(([status, _]) => status as RazorpaySubscriptionStatus);
}

/**
 * Get all statuses that allow cancellation
 */
export function getCancellableStatuses(): RazorpaySubscriptionStatus[] {
  return Object.entries(SUBSCRIPTION_STATUS_MAPPING)
    .filter(([_, mapping]) => mapping.canCancel)
    .map(([status, _]) => status as RazorpaySubscriptionStatus);
}

/**
 * Get all statuses that allow upgrade
 */
export function getUpgradableStatuses(): RazorpaySubscriptionStatus[] {
  return Object.entries(SUBSCRIPTION_STATUS_MAPPING)
    .filter(([_, mapping]) => mapping.canUpgrade)
    .map(([status, _]) => status as RazorpaySubscriptionStatus);
}

// ============================================================================
// Utility Functions for Status Handling
// ============================================================================

/**
 * Validate subscription status and return normalized status
 */
export function validateAndNormalizeStatus(status: string): {
  valid: boolean;
  razorpayStatus: RazorpaySubscriptionStatus | null;
  internalStatus: InternalSubscriptionStatus;
  mapping?: StatusMapping;
} {
  const razorpayStatus = status as RazorpaySubscriptionStatus;

  if (razorpayStatus in SUBSCRIPTION_STATUS_MAPPING) {
    const mapping = SUBSCRIPTION_STATUS_MAPPING[razorpayStatus];
    return {
      valid: true,
      razorpayStatus,
      internalStatus: mapping.internalStatus,
      mapping,
    };
  }

  return {
    valid: false,
    razorpayStatus: null,
    internalStatus: 'error',
  };
}

/**
 * Process webhook event and determine new status
 */
export function processWebhookStatusChange(
  currentStatus: RazorpaySubscriptionStatus,
  eventPayload: any
): {
  newStatus: RazorpaySubscriptionStatus;
  isValidTransition: boolean;
  requiresAttention: boolean;
} {
  const eventType = eventPayload.event;

  // Map webhook events to expected status changes
  const eventToStatusMap: Record<string, RazorpaySubscriptionStatus> = {
    'subscription.created': 'created',
    'subscription.authenticated': 'authenticated',
    'subscription.activated': 'active',
    'subscription.paused': 'paused',
    'subscription.resumed': 'resumed',
    'subscription.completed': 'completed',
    'subscription.cancelled': 'cancelled',
    'subscription.halted': 'halted',
    'subscription.pending': 'pending',
    'subscription.expired': 'expired',
  };

  const expectedNewStatus = eventToStatusMap[eventType] || currentStatus;
  const isValidTransition = isValidStatusTransition(currentStatus, expectedNewStatus);

  return {
    newStatus: expectedNewStatus,
    isValidTransition,
    requiresAttention: requiresUserAction(expectedNewStatus) || !isValidTransition,
  };
}

/**
 * Get status priority for sorting (higher priority first)
 */
export function getStatusPriority(status: RazorpaySubscriptionStatus): number {
  const priorityMap: Record<RazorpaySubscriptionStatus, number> = {
    active: 100,
    resumed: 90,
    authenticated: 80,
    completed: 70,
    pending: 60,
    created: 50,
    paused: 40,
    halted: 30,
    cancelled: 20,
    expired: 10,
  };

  return priorityMap[status] || 0;
}

/**
 * Sort subscriptions by status priority
 */
export function sortByStatusPriority<T extends { status: RazorpaySubscriptionStatus }>(
  subscriptions: T[]
): T[] {
  return subscriptions.sort((a, b) => {
    const priorityA = getStatusPriority(a.status);
    const priorityB = getStatusPriority(b.status);
    return priorityB - priorityA; // Higher priority first
  });
}

// ============================================================================
// Export for use in components
// ============================================================================

export default {
  SUBSCRIPTION_STATUS_MAPPING,
  mapRazorpayToInternal,
  mapInternalToRazorpay,
  getStatusMapping,
  isValidStatusTransition,
  isStatusActive,
  requiresUserAction,
  getStatusDescription,
  getStatusColor,
  getStatusIcon,
  getActiveStatuses,
  getActionRequiredStatuses,
  getTerminalStatuses,
  getCancellableStatuses,
  getUpgradableStatuses,
  validateAndNormalizeStatus,
  processWebhookStatusChange,
  sortByStatusPriority,
};

// Alias for backward compatibility
export const getSubscriptionStatusMapping = getStatusMapping;
