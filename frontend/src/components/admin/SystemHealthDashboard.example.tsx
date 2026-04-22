'use client';

/**
 * SystemHealthDashboard Integration Example
 * Shows how to integrate SystemStatusModal with a real admin dashboard
 */

import * as React from 'react';
import { AlertCircle, CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { SystemStatusModal } from './SystemStatusModal';
import {
  useSystemStatus,
  getOverallHealth,
  getHealthPercentage,
} from '@/lib/hooks/useSystemStatus';
import type { SystemComponentType, SystemStatusData } from '@/types/system-status';

/**
 * Status icon mapping
 */
const STATUS_ICONS = {
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
  checking: AlertCircle,
};

/**
 * Component display names
 */
const COMPONENT_NAMES: Record<SystemComponentType, string> = {
  database: 'Database',
  api: 'API Endpoints',
  ai_service: 'AI Service',
  authentication: 'Authentication',
  storage: 'Storage',
  external_service: 'External Services',
};

/**
 * Individual status card component
 */
function StatusCard({
  status,
  onClick,
  isChecking,
}: {
  status: SystemStatusData;
  onClick: () => void;
  isChecking: boolean;
}) {
  const Icon = STATUS_ICONS[status.status];
  const statusColors = {
    success: 'text-success border-success/30 bg-success/10',
    warning: 'text-warning border-warning/30 bg-warning/10',
    error: 'text-error border-error/30 bg-error/10',
    checking: 'text-info border-info/30 bg-info/10',
  };

  return (
    <button
      onClick={onClick}
      disabled={isChecking}
      className="glass-card hover-lift focus-visible:ring-primary/50 min-h-[120px] cursor-pointer p-6 text-left transition-all duration-300 focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
      aria-label={`View ${COMPONENT_NAMES[status.component]} status details`}
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-body text-primary font-semibold">
            {COMPONENT_NAMES[status.component]}
          </h3>
          <div className={`rounded-lg border p-2 ${statusColors[status.status]} `}>
            <Icon className="h-4 w-4" aria-hidden="true" />
          </div>
        </div>

        {/* Status */}
        <div className="space-y-1">
          <p className="text-caption text-secondary capitalize">
            {status.status === 'success' ? 'Operational' : status.status}
          </p>
          {status.message && (
            <p className="text-small text-disabled line-clamp-2">{status.message}</p>
          )}
          {status.error && (
            <p className="text-small text-error line-clamp-2">{status.error.message}</p>
          )}
        </div>

        {/* Loading indicator */}
        {isChecking && (
          <div className="text-small text-info flex items-center gap-2">
            <RefreshCw className="h-3 w-3 animate-spin" aria-hidden="true" />
            <span>Checking...</span>
          </div>
        )}
      </div>
    </button>
  );
}

/**
 * Overall health indicator
 */
function OverallHealthIndicator({
  statuses,
}: {
  statuses: Record<SystemComponentType, SystemStatusData | null>;
}) {
  const health = getOverallHealth(statuses);
  const percentage = getHealthPercentage(statuses);

  const healthConfig = {
    healthy: {
      label: 'All Systems Operational',
      color: 'text-success',
      bgColor: 'bg-success/10',
      borderColor: 'border-success/30',
    },
    degraded: {
      label: 'Degraded Performance',
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      borderColor: 'border-warning/30',
    },
    critical: {
      label: 'System Issues Detected',
      color: 'text-error',
      bgColor: 'bg-error/10',
      borderColor: 'border-error/30',
    },
    unknown: {
      label: 'Checking Systems...',
      color: 'text-info',
      bgColor: 'bg-info/10',
      borderColor: 'border-info/30',
    },
  };

  const config = healthConfig[health];

  return (
    <div
      className={`glass-card border-2 p-8 ${config.bgColor} ${config.borderColor} `}
      role="status"
      aria-label={`Overall system health: ${config.label}`}
    >
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h2 className="text-title text-primary font-bold">System Health</h2>
          <p className={`text-body font-semibold ${config.color}`}>{config.label}</p>
        </div>

        {/* Health percentage */}
        <div className="text-center">
          <div className={`text-display font-bold ${config.color}`}>{percentage}%</div>
          <p className="text-caption text-secondary">Health Score</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-background-dark mt-6 h-2 overflow-hidden rounded-full">
        <div
          className={`h-full transition-all duration-500 ${
            health === 'healthy'
              ? 'bg-success'
              : health === 'degraded'
                ? 'bg-warning'
                : health === 'critical'
                  ? 'bg-error'
                  : 'bg-info'
          }`}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}

/**
 * Main dashboard component
 */
export function SystemHealthDashboard() {
  const { statuses, checkStatus, checkAll, isChecking, pausePolling, resumePolling, isPolling } =
    useSystemStatus({
      autoPoll: true,
      pollInterval: 60000, // 1 minute
    });

  const [selectedComponent, setSelectedComponent] = React.useState<SystemComponentType | null>(
    null
  );

  // Get selected status data
  const selectedStatus = selectedComponent ? statuses[selectedComponent] : null;

  // Handle card click
  const handleCardClick = async (component: SystemComponentType) => {
    setSelectedComponent(component);
    // Optionally refresh on open
    await checkStatus(component);
  };

  // Handle modal close
  const handleModalClose = () => {
    setSelectedComponent(null);
  };

  // Handle retry from modal
  const handleRetry = async () => {
    if (selectedComponent) {
      await checkStatus(selectedComponent);
    }
  };

  // Handle view logs
  const handleViewLogs = () => {
    if (selectedComponent) {
      // Navigate to logs page with component filter
      console.log(`Viewing logs for ${selectedComponent}`);
      // window.location.href = `/admin/logs?component=${selectedComponent}`;
    }
  };

  return (
    <div className="bg-background-dark min-h-screen">
      {/* Header */}
      <div className="bg-background-paper/50 border-b border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-6 md:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-display text-primary mb-2 font-bold">System Status</h1>
              <p className="text-body text-secondary">
                Real-time monitoring of all system components
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => checkAll()}
                className="bg-primary text-background-dark hover:bg-primary-light focus-visible:ring-primary/50 text-caption inline-flex min-h-[44px] items-center gap-2 rounded-md px-4 py-2 font-medium transition-colors duration-200 focus-visible:ring-2 focus-visible:outline-none"
                aria-label="Refresh all system statuses"
              >
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                <span>Refresh All</span>
              </button>

              <button
                onClick={isPolling ? pausePolling : resumePolling}
                className="text-secondary focus-visible:ring-primary/50 text-caption min-h-[44px] rounded-md border border-white/20 bg-transparent px-4 py-2 font-medium transition-colors duration-200 hover:bg-white/5 focus-visible:ring-2 focus-visible:outline-none"
                aria-label={isPolling ? 'Pause auto-refresh' : 'Resume auto-refresh'}
              >
                {isPolling ? 'Pause Auto-Refresh' : 'Resume Auto-Refresh'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 md:px-8">
        {/* Overall health */}
        <OverallHealthIndicator statuses={statuses} />

        {/* Component grid */}
        <div>
          <h2 className="text-heading text-primary mb-4 font-semibold">Component Status</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(statuses).map(([component, status]) => {
              const componentType = component as SystemComponentType;

              if (!status) {
                return (
                  <div
                    key={componentType}
                    className="glass-card flex min-h-[120px] items-center justify-center p-6"
                  >
                    <p className="text-caption text-disabled">
                      Loading {COMPONENT_NAMES[componentType]}...
                    </p>
                  </div>
                );
              }

              return (
                <StatusCard
                  key={componentType}
                  status={status}
                  onClick={() => handleCardClick(componentType)}
                  isChecking={isChecking[componentType]}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Status detail modal */}
      {selectedStatus && (
        <SystemStatusModal
          isOpen={true}
          onClose={handleModalClose}
          statusData={selectedStatus}
          onRetry={handleRetry}
          onViewLogs={handleViewLogs}
          isRetrying={selectedComponent ? isChecking[selectedComponent] : false}
        />
      )}
    </div>
  );
}
