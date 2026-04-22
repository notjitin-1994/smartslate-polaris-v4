/**
 * System Status Types
 * Comprehensive type definitions for system monitoring
 */

export type SystemStatusType = 'success' | 'warning' | 'error' | 'checking';

export type SystemComponentType =
  | 'database'
  | 'api'
  | 'ai_service'
  | 'authentication'
  | 'storage'
  | 'external_service';

/**
 * Base health metric interface
 */
export interface HealthMetric {
  label: string;
  value: string | number;
  status?: SystemStatusType;
  description?: string;
}

/**
 * Detailed error information
 */
export interface SystemError {
  code: string;
  message: string;
  details?: string;
  timestamp: string;
  stack?: string;
  retryable: boolean;
}

/**
 * Action button configuration
 */
export interface SystemAction {
  id: string;
  label: string;
  variant: 'primary' | 'secondary' | 'ghost' | 'destructive';
  icon?: React.ComponentType<{ className?: string }>;
  onClick: () => void | Promise<void>;
  disabled?: boolean;
  loading?: boolean;
}

/**
 * Complete system status data structure
 */
export interface SystemStatusData {
  component: SystemComponentType;
  componentName: string;
  status: SystemStatusType;
  lastChecked: string;

  // Metrics
  metrics?: HealthMetric[];

  // Error information
  error?: SystemError;

  // Success/warning messages
  message?: string;

  // Additional context
  metadata?: Record<string, unknown>;
}

/**
 * Modal component props
 */
export interface SystemStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  statusData: SystemStatusData;
  actions?: SystemAction[];
  onRetry?: () => void | Promise<void>;
  onViewLogs?: () => void;
  isRetrying?: boolean;
}
