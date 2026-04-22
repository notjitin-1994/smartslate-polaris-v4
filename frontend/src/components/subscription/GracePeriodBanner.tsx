/**
 * Grace Period Banner Component
 *
 * @description Displays grace period warnings and information to users
 * with different severity levels and actions
 *
 * @version 1.0.0
 * @date 2025-10-30
 */

'use client';

import React from 'react';
import { useGracePeriodBanner } from '@/lib/hooks/useGracePeriod';
import { AlertTriangle, X, CreditCard, Settings, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export interface GracePeriodBannerProps {
  /** Custom className for styling */
  className?: string;
  /** Whether to show the banner automatically */
  autoShow?: boolean;
  /** Callback when banner is dismissed */
  onDismiss?: () => void;
  /** Custom actions to override default actions */
  customActions?: React.ReactNode;
}

/**
 * Grace period banner component that shows warnings and actions
 */
export function GracePeriodBanner({
  className = '',
  autoShow = true,
  onDismiss,
  customActions,
}: GracePeriodBannerProps) {
  const {
    isVisible,
    title,
    message,
    severity,
    actions,
    onDismiss: handleDismiss,
  } = useGracePeriodBanner({ showUI: autoShow });

  if (!isVisible) {
    return null;
  }

  const handleDismissClick = () => {
    handleDismiss?.();
    onDismiss?.();
  };

  // Map severity to alert variant
  const alertVariant = severity === 'error' ? 'destructive' : 'default';

  // Get icon based on severity
  const getIcon = () => {
    switch (severity) {
      case 'error':
        return <AlertTriangle className="h-4 w-4" />;
      case 'warning':
        return <Clock className="h-4 w-4" />;
      case 'info':
        return <CreditCard className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  // Get color classes based on severity
  const getColorClasses = () => {
    switch (severity) {
      case 'error':
        return 'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200';
      case 'warning':
        return 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200';
      case 'info':
        return 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200';
      default:
        return 'border-gray-200 bg-gray-50 text-gray-800 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200';
    }
  };

  // Render custom actions if provided
  if (customActions) {
    return (
      <Alert className={`${getColorClasses()} ${className}`}>
        <div className="flex items-start gap-3">
          {getIcon()}
          <div className="flex-1">
            <AlertTitle className="font-semibold">{title}</AlertTitle>
            <AlertDescription className="mt-1">{message}</AlertDescription>
            <div className="mt-3">{customActions}</div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismissClick}
            className="h-6 w-6 p-0 hover:bg-black/10 dark:hover:bg-white/10"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </Alert>
    );
  }

  // Default actions rendering
  return (
    <Alert className={`${getColorClasses()} ${className}`}>
      <div className="flex items-start gap-3">
        {getIcon()}
        <div className="min-w-0 flex-1">
          <AlertTitle className="font-semibold">{title}</AlertTitle>
          <AlertDescription className="mt-1">{message}</AlertDescription>

          {actions.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {actions.map((action, index) => (
                <Button
                  key={index}
                  variant={
                    action.variant === 'primary'
                      ? 'default'
                      : action.variant === 'secondary'
                        ? 'secondary'
                        : 'outline'
                  }
                  size="sm"
                  onClick={action.action}
                  className={
                    action.variant === 'primary'
                      ? 'bg-primary-600 hover:bg-primary-700 text-white'
                      : ''
                  }
                >
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </div>

        {handleDismiss && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismissClick}
            className="h-6 w-6 flex-shrink-0 p-0 hover:bg-black/10 dark:hover:bg-white/10"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    </Alert>
  );
}

/**
 * Compact grace period indicator for smaller spaces
 */
export function GracePeriodIndicator({
  className = '',
  showText = true,
}: {
  className?: string;
  showText?: boolean;
}) {
  const { gracePeriodStatus } = useGracePeriodBanner({ showUI: false });

  if (!gracePeriodStatus?.isInGracePeriod) {
    return null;
  }

  const { daysRemaining } = gracePeriodStatus;
  const isUrgent = daysRemaining !== undefined && daysRemaining <= 3;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <AlertTriangle className={`h-4 w-4 ${isUrgent ? 'text-red-500' : 'text-amber-500'}`} />
      {showText && (
        <span
          className={`text-sm font-medium ${isUrgent ? 'text-red-700 dark:text-red-300' : 'text-amber-700 dark:text-amber-300'}`}
        >
          {daysRemaining !== undefined ? `${daysRemaining} days left` : 'Grace period active'}
        </span>
      )}
    </div>
  );
}

/**
 * Grace period modal for critical warnings
 */
export function GracePeriodModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { isVisible, title, message, severity, actions } = useGracePeriodBanner({ showUI: false });

  const shouldShow = isOpen && isVisible;

  if (!shouldShow) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 mx-4 w-full max-w-md">
        <div className="rounded-lg border border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900">
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-gray-200 p-6 dark:border-gray-800">
            <div
              className={`rounded-full p-2 ${
                severity === 'error'
                  ? 'bg-red-100 dark:bg-red-900'
                  : severity === 'warning'
                    ? 'bg-amber-100 dark:bg-amber-900'
                    : 'bg-blue-100 dark:bg-blue-900'
              }`}
            >
              <AlertTriangle
                className={`h-5 w-5 ${
                  severity === 'error'
                    ? 'text-red-600 dark:text-red-400'
                    : severity === 'warning'
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-blue-600 dark:text-blue-400'
                }`}
              />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
          </div>

          {/* Body */}
          <div className="p-6">
            <p className="text-gray-700 dark:text-gray-300">{message}</p>
          </div>

          {/* Actions */}
          {actions.length > 0 && (
            <div className="flex gap-3 p-6 pt-0">
              {actions.map((action, index) => (
                <Button
                  key={index}
                  variant={
                    action.variant === 'primary'
                      ? 'default'
                      : action.variant === 'secondary'
                        ? 'secondary'
                        : 'outline'
                  }
                  onClick={action.action}
                  className={
                    action.variant === 'primary'
                      ? 'bg-primary-600 hover:bg-primary-700 flex-1 text-white'
                      : 'flex-1'
                  }
                >
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default {
  GracePeriodBanner,
  GracePeriodIndicator,
  GracePeriodModal,
};
