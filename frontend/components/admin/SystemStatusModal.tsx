'use client';

/**
 * SystemStatusModal Component
 * Premium glassmorphism modal for detailed system status display
 *
 * Features:
 * - Brand-compliant glassmorphism design
 * - Touch-first interaction (44px+ targets)
 * - WCAG AA accessibility compliance
 * - Smooth animations with reduced motion support
 * - Responsive mobile-first design
 * - Loading and error states
 */

import * as React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, RefreshCw, FileText, CheckCircle, AlertTriangle, XCircle, Clock } from 'lucide-react';
import type {
  SystemStatusModalProps,
  SystemStatusType,
  SystemComponentType,
  HealthMetric,
  SystemAction,
} from '@/types/system-status';

// Status configuration map
const STATUS_CONFIG: Record<
  SystemStatusType,
  {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    color: string;
    bgColor: string;
    borderColor: string;
  }
> = {
  success: {
    icon: CheckCircle,
    label: 'Operational',
    color: 'text-success',
    bgColor: 'bg-success/10',
    borderColor: 'border-success/30',
  },
  warning: {
    icon: AlertTriangle,
    label: 'Degraded',
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    borderColor: 'border-warning/30',
  },
  error: {
    icon: XCircle,
    label: 'Unavailable',
    color: 'text-error',
    bgColor: 'bg-error/10',
    borderColor: 'border-error/30',
  },
  checking: {
    icon: Clock,
    label: 'Checking...',
    color: 'text-info',
    bgColor: 'bg-info/10',
    borderColor: 'border-info/30',
  },
};

// Component name display map
const COMPONENT_LABELS: Record<SystemComponentType, string> = {
  database: 'Database',
  api: 'API',
  ai_service: 'AI Service',
  authentication: 'Authentication',
  storage: 'Storage',
  external_service: 'External Service',
};

/**
 * Status badge component
 */
function StatusBadge({ status }: { status: SystemStatusType }) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 ${config.bgColor} ${config.borderColor} border transition-colors duration-300`}
      role="status"
      aria-label={`Status: ${config.label}`}
    >
      <Icon className={`h-4 w-4 ${config.color}`} aria-hidden="true" />
      <span className={`text-caption font-medium ${config.color}`}>{config.label}</span>
    </div>
  );
}

/**
 * Health metric row component
 */
function MetricRow({ metric }: { metric: HealthMetric }) {
  const statusColor = metric.status ? STATUS_CONFIG[metric.status].color : 'text-secondary';

  return (
    <div className="flex items-start justify-between gap-4 border-b border-white/5 py-3 last:border-0">
      <div className="min-w-0 flex-1">
        <p className="text-caption text-primary truncate font-medium">{metric.label}</p>
        {metric.description && (
          <p className="text-small text-disabled mt-1">{metric.description}</p>
        )}
      </div>
      <div className={`text-caption font-semibold ${statusColor} flex-shrink-0 text-right`}>
        {metric.value}
      </div>
    </div>
  );
}

/**
 * Action button component
 */
function ActionButton({ action }: { action: SystemAction }) {
  const Icon = action.icon;

  const variantStyles = {
    primary: 'bg-primary text-background-dark hover:bg-primary-light',
    secondary: 'bg-secondary text-white hover:bg-secondary-light',
    ghost: 'bg-transparent text-secondary hover:bg-white/5',
    destructive: 'bg-error text-white hover:bg-error/90',
  };

  return (
    <button
      onClick={action.onClick}
      disabled={action.disabled || action.loading}
      className={`text-caption focus-visible:ring-primary/50 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-md px-6 py-2.5 font-medium transition-all duration-200 focus-visible:ring-2 focus-visible:outline-none active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 ${variantStyles[action.variant]} `}
      aria-label={action.label}
      aria-busy={action.loading}
    >
      {action.loading ? (
        <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : Icon ? (
        <Icon className="h-4 w-4" aria-hidden="true" />
      ) : null}
      <span>{action.label}</span>
    </button>
  );
}

/**
 * Main SystemStatusModal component
 */
export function SystemStatusModal({
  isOpen,
  onClose,
  statusData,
  actions,
  onRetry,
  onViewLogs,
  isRetrying = false,
}: SystemStatusModalProps) {
  const { component, componentName, status, lastChecked, metrics, error, message } = statusData;

  // Format timestamp
  const formattedTimestamp = React.useMemo(() => {
    try {
      const date = new Date(lastChecked);
      return new Intl.DateTimeFormat('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(date);
    } catch {
      return lastChecked;
    }
  }, [lastChecked]);

  // Default actions if not provided
  const defaultActions: SystemAction[] = React.useMemo(() => {
    const actionList: SystemAction[] = [];

    if (onRetry && (status === 'error' || status === 'warning')) {
      actionList.push({
        id: 'retry',
        label: isRetrying ? 'Retrying...' : 'Retry Check',
        variant: 'primary',
        icon: RefreshCw,
        onClick: onRetry,
        loading: isRetrying,
        disabled: isRetrying,
      });
    }

    if (onViewLogs) {
      actionList.push({
        id: 'logs',
        label: 'View Logs',
        variant: 'ghost',
        icon: FileText,
        onClick: onViewLogs,
      });
    }

    return actionList;
  }, [onRetry, onViewLogs, status, isRetrying]);

  const allActions = actions || defaultActions;

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        {/* Backdrop */}
        <Dialog.Overlay
          className="bg-background-dark/80 data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out fixed inset-0 z-50 backdrop-blur-sm"
          aria-hidden="true"
        />

        {/* Modal content */}
        <Dialog.Content
          className="data-[state=open]:animate-fade-in-up data-[state=closed]:animate-fade-out fixed top-1/2 left-1/2 z-50 max-h-[90vh] w-[calc(100vw-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-hidden focus-visible:outline-none"
          aria-describedby="system-status-description"
        >
          {/* Glass shell container */}
          <div className="glass-shell">
            {/* Header */}
            <div className="border-b border-white/10 px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <Dialog.Title className="text-title text-primary mb-2 font-semibold">
                    {componentName || COMPONENT_LABELS[component]} Status
                  </Dialog.Title>
                  <div className="flex flex-wrap items-center gap-3">
                    <StatusBadge status={status} />
                    <div className="text-small text-disabled flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Last checked: {formattedTimestamp}</span>
                    </div>
                  </div>
                </div>

                {/* Close button */}
                <Dialog.Close
                  className="text-secondary focus-visible:ring-primary/50 min-h-[44px] min-w-[44px] rounded-md p-2 transition-colors duration-200 hover:bg-white/5 focus-visible:ring-2 focus-visible:outline-none active:scale-95"
                  aria-label="Close modal"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </Dialog.Close>
              </div>
            </div>

            {/* Body - Scrollable */}
            <div
              id="system-status-description"
              className="max-h-[60vh] space-y-6 overflow-y-auto px-6 py-5"
            >
              {/* Success/Info message */}
              {message && !error && (
                <div
                  className={`rounded-lg p-4 ${STATUS_CONFIG[status].bgColor} ${STATUS_CONFIG[status].borderColor} border`}
                  role="alert"
                >
                  <p className="text-body text-primary">{message}</p>
                </div>
              )}

              {/* Error details */}
              {error && (
                <div
                  className="glass-card border-error/30 space-y-3 p-4"
                  role="alert"
                  aria-live="assertive"
                >
                  <div className="flex items-start gap-3">
                    <XCircle
                      className="text-error mt-0.5 h-5 w-5 flex-shrink-0"
                      aria-hidden="true"
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="text-body text-error mb-1 font-semibold">
                        Error: {error.code}
                      </h3>
                      <p className="text-caption text-primary mb-2">{error.message}</p>
                      {error.details && (
                        <details className="text-small text-secondary">
                          <summary className="hover:text-primary cursor-pointer transition-colors">
                            Technical details
                          </summary>
                          <pre className="bg-background-dark/50 mt-2 overflow-x-auto rounded p-3">
                            <code>{error.details}</code>
                          </pre>
                        </details>
                      )}
                      {error.retryable && (
                        <p className="text-small text-info mt-2">
                          This issue may be temporary. Try retrying the operation.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Health metrics */}
              {metrics && metrics.length > 0 && (
                <div className="glass-card p-4">
                  <h3 className="text-body text-primary mb-3 font-semibold">Health Metrics</h3>
                  <div className="space-y-0">
                    {metrics.map((metric, index) => (
                      <MetricRow key={`${metric.label}-${index}`} metric={metric} />
                    ))}
                  </div>
                </div>
              )}

              {/* Empty state */}
              {!message && !error && (!metrics || metrics.length === 0) && (
                <div className="py-8 text-center">
                  <Clock className="text-disabled mx-auto mb-3 h-12 w-12" aria-hidden="true" />
                  <p className="text-body text-secondary">No additional details available</p>
                </div>
              )}
            </div>

            {/* Footer - Actions */}
            {allActions.length > 0 && (
              <div className="bg-background-paper/30 border-t border-white/10 px-6 py-4">
                <div className="flex flex-wrap items-center justify-end gap-3">
                  {allActions.map((action) => (
                    <ActionButton key={action.id} action={action} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// Display name for debugging
SystemStatusModal.displayName = 'SystemStatusModal';
