/**
 * Toast Notification Utilities
 *
 * Wraps Sonner toast library with SmartSlate-specific configurations
 * and reusable patterns for consistent notifications across the application.
 *
 * @see https://sonner.emilkowal.ski/
 */

import { toast as sonnerToast, type ExternalToast } from 'sonner';

/**
 * Default toast options for SmartSlate
 */
const defaultOptions: ExternalToast = {
  duration: 4000,
  closeButton: true,
};

/**
 * Success toast - for successful operations
 *
 * @example
 * toast.success('User created successfully', 'The new user has been added to the system')
 */
function success(message: string, description?: string) {
  return sonnerToast.success(message, {
    ...defaultOptions,
    description,
  });
}

/**
 * Error toast - for errors and failures
 * Duration is longer (6s) to give users time to read error details
 *
 * @example
 * toast.error('Failed to delete user', 'User has active blueprints')
 */
function error(message: string, description?: string) {
  return sonnerToast.error(message, {
    ...defaultOptions,
    duration: 6000,
    description,
  });
}

/**
 * Info toast - for informational messages
 *
 * @example
 * toast.info('Processing', 'This may take a few moments')
 */
function info(message: string, description?: string) {
  return sonnerToast.info(message, {
    ...defaultOptions,
    description,
  });
}

/**
 * Warning toast - for warnings and cautions
 *
 * @example
 * toast.warning('Unsaved changes', 'You have unsaved changes that will be lost')
 */
function warning(message: string, description?: string) {
  return sonnerToast.warning(message, {
    ...defaultOptions,
    duration: 5000,
    description,
  });
}

/**
 * Loading toast - shows a loading state
 * Remember to dismiss or update this toast when the operation completes
 *
 * @example
 * const toastId = toast.loading('Creating user...')
 * // ... perform operation
 * toast.success('User created!', undefined, toastId)
 */
function loading(message: string, description?: string) {
  return sonnerToast.loading(message, {
    description,
  });
}

/**
 * Promise toast - automatically handles loading, success, and error states
 *
 * @example
 * toast.promise(
 *   createUser(userData),
 *   {
 *     loading: 'Creating user...',
 *     success: 'User created successfully!',
 *     error: 'Failed to create user'
 *   }
 * )
 */
function promise<T>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((error: Error) => string);
  },
  options?: ExternalToast
) {
  return sonnerToast.promise(promise, messages, {
    ...defaultOptions,
    ...options,
  });
}

/**
 * Custom toast - for advanced use cases
 *
 * @example
 * toast.custom('Custom message', { action: { label: 'Undo', onClick: () => {} } })
 */
function custom(message: string, options?: ExternalToast) {
  return sonnerToast(message, {
    ...defaultOptions,
    ...options,
  });
}

/**
 * Dismiss a specific toast or all toasts
 *
 * @example
 * const toastId = toast.loading('Processing...')
 * // ... later
 * toast.dismiss(toastId)
 *
 * // Or dismiss all toasts
 * toast.dismiss()
 */
function dismiss(toastId?: string | number) {
  return sonnerToast.dismiss(toastId);
}

/**
 * Centralized toast utility
 * Use this throughout the application for consistent notifications
 */
export const toast = {
  success,
  error,
  info,
  warning,
  loading,
  promise,
  custom,
  dismiss,
};

/**
 * Pre-configured toast messages for common admin operations
 */
export const adminToasts = {
  // User operations
  userCreated: () =>
    toast.success('User created successfully', 'The new user has been added to the system'),
  userUpdated: () => toast.success('User updated', 'Changes have been saved'),
  userDeleted: () => toast.success('User deleted', 'The user has been removed from the system'),
  userDeletedWithCount: (count: number) =>
    toast.success('Users deleted', `${count} user${count > 1 ? 's have' : ' has'} been removed`),

  // Bulk operations
  bulkRoleUpdated: (count: number, role: string) =>
    toast.success('Roles updated', `Updated ${count} user${count > 1 ? 's' : ''} to ${role}`),
  bulkTierUpdated: (count: number, tier: string) =>
    toast.success('Tiers updated', `Updated ${count} user${count > 1 ? 's' : ''} to ${tier}`),

  // Export operations
  exportStarted: (format: string) => toast.loading(`Preparing ${format.toUpperCase()} export...`),
  exportComplete: (format: string) =>
    toast.success('Export complete', `Your ${format.toUpperCase()} file is ready`),
  exportFailed: (format: string) =>
    toast.error('Export failed', `Failed to generate ${format.toUpperCase()} file`),

  // Error messages
  operationFailed: (operation: string) => toast.error('Operation failed', `Failed to ${operation}`),
  unauthorized: () =>
    toast.error('Unauthorized', 'You do not have permission to perform this action'),
  networkError: () => toast.error('Network error', 'Please check your connection and try again'),
};
