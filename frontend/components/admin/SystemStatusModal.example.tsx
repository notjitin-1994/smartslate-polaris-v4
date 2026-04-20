'use client';

/**
 * SystemStatusModal Usage Examples
 * Demonstrates various status scenarios
 */

import * as React from 'react';
import { SystemStatusModal } from './SystemStatusModal';
import type { SystemStatusData } from '@/types/system-status';

/**
 * Example 1: Healthy Database Status
 */
export function HealthyDatabaseExample() {
  const [isOpen, setIsOpen] = React.useState(false);

  const statusData: SystemStatusData = {
    component: 'database',
    componentName: 'PostgreSQL Database',
    status: 'success',
    lastChecked: new Date().toISOString(),
    message: 'All database operations are functioning normally.',
    metrics: [
      {
        label: 'Connection Pool',
        value: '8/20 active',
        status: 'success',
        description: 'Available connections in pool',
      },
      {
        label: 'Average Query Time',
        value: '12ms',
        status: 'success',
        description: 'Mean execution time for recent queries',
      },
      {
        label: 'Slow Queries (>100ms)',
        value: '0',
        status: 'success',
        description: 'Queries exceeding performance threshold',
      },
      {
        label: 'Active Transactions',
        value: '3',
        status: 'success',
      },
      {
        label: 'Disk Usage',
        value: '42%',
        status: 'success',
        description: 'Database storage utilization',
      },
    ],
  };

  return (
    <div>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-primary rounded-md px-4 py-2 text-white"
      >
        View Healthy Database Status
      </button>
      <SystemStatusModal isOpen={isOpen} onClose={() => setIsOpen(false)} statusData={statusData} />
    </div>
  );
}

/**
 * Example 2: Degraded API Status with Warning
 */
export function DegradedAPIExample() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isRetrying, setIsRetrying] = React.useState(false);

  const statusData: SystemStatusData = {
    component: 'api',
    componentName: 'REST API Endpoints',
    status: 'warning',
    lastChecked: new Date().toISOString(),
    message:
      'API is experiencing elevated response times. Operations are functional but slower than normal.',
    metrics: [
      {
        label: 'Average Response Time',
        value: '850ms',
        status: 'warning',
        description: 'Mean response time across all endpoints',
      },
      {
        label: 'Success Rate',
        value: '98.5%',
        status: 'success',
        description: 'Percentage of successful requests',
      },
      {
        label: 'Active Requests',
        value: '127',
        status: 'warning',
        description: 'Currently processing requests',
      },
      {
        label: 'Rate Limit Usage',
        value: '73%',
        status: 'warning',
        description: 'Current API rate limit consumption',
      },
      {
        label: 'Error Rate',
        value: '1.5%',
        status: 'warning',
      },
    ],
  };

  const handleRetry = async () => {
    setIsRetrying(true);
    // Simulate API check
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsRetrying(false);
    setIsOpen(false);
  };

  return (
    <div>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-warning rounded-md px-4 py-2 text-white"
      >
        View Degraded API Status
      </button>
      <SystemStatusModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        statusData={statusData}
        onRetry={handleRetry}
        isRetrying={isRetrying}
      />
    </div>
  );
}

/**
 * Example 3: Failed AI Service with Error
 */
export function FailedAIServiceExample() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isRetrying, setIsRetrying] = React.useState(false);

  const statusData: SystemStatusData = {
    component: 'ai_service',
    componentName: 'Gemini AI Service',
    status: 'error',
    lastChecked: new Date().toISOString(),
    error: {
      code: 'API_CONNECTION_FAILED',
      message: 'Unable to establish connection to Gemini API',
      details: `Failed to connect to https://api.anthropic.com
Status: 503 Service Unavailable
Timeout: 30000ms exceeded

Request ID: req_abc123xyz456
Retry attempts: 3/3`,
      timestamp: new Date().toISOString(),
      retryable: true,
    },
    metrics: [
      {
        label: 'API Status',
        value: 'Unavailable',
        status: 'error',
      },
      {
        label: 'Last Successful Call',
        value: '5 minutes ago',
        status: 'warning',
      },
      {
        label: 'Fallback System',
        value: 'Active',
        status: 'success',
        description: 'Ollama local model is handling requests',
      },
      {
        label: 'Queued Requests',
        value: '12',
        status: 'warning',
        description: 'Requests waiting for primary service',
      },
    ],
  };

  const handleRetry = async () => {
    setIsRetrying(true);
    await new Promise((resolve) => setTimeout(resolve, 2500));
    setIsRetrying(false);
    alert('Connection still unavailable. Fallback system remains active.');
  };

  const handleViewLogs = () => {
    console.log('Opening logs viewer...');
    // Navigate to logs page
  };

  return (
    <div>
      <button onClick={() => setIsOpen(true)} className="bg-error rounded-md px-4 py-2 text-white">
        View Failed AI Service Status
      </button>
      <SystemStatusModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        statusData={statusData}
        onRetry={handleRetry}
        onViewLogs={handleViewLogs}
        isRetrying={isRetrying}
      />
    </div>
  );
}

/**
 * Example 4: Checking Authentication Status
 */
export function CheckingAuthenticationExample() {
  const [isOpen, setIsOpen] = React.useState(false);

  const statusData: SystemStatusData = {
    component: 'authentication',
    componentName: 'Authentication Service',
    status: 'checking',
    lastChecked: new Date().toISOString(),
    message: 'Running comprehensive authentication system checks...',
    metrics: [
      {
        label: 'Check Progress',
        value: '67%',
        status: 'checking',
      },
      {
        label: 'Active Sessions',
        value: '1,247',
        status: 'success',
      },
      {
        label: 'Token Validation',
        value: 'In Progress',
        status: 'checking',
      },
    ],
  };

  return (
    <div>
      <button onClick={() => setIsOpen(true)} className="bg-info rounded-md px-4 py-2 text-white">
        View Checking Authentication Status
      </button>
      <SystemStatusModal isOpen={isOpen} onClose={() => setIsOpen(false)} statusData={statusData} />
    </div>
  );
}

/**
 * Example 5: Custom Actions
 */
export function CustomActionsExample() {
  const [isOpen, setIsOpen] = React.useState(false);

  const statusData: SystemStatusData = {
    component: 'external_service',
    componentName: 'Payment Gateway',
    status: 'warning',
    lastChecked: new Date().toISOString(),
    message: 'Payment gateway is experiencing intermittent issues.',
    metrics: [
      {
        label: 'Transaction Success Rate',
        value: '94%',
        status: 'warning',
      },
      {
        label: 'Failed Transactions',
        value: '23',
        status: 'warning',
      },
    ],
  };

  const customActions = [
    {
      id: 'refresh',
      label: 'Refresh Status',
      variant: 'primary' as const,
      onClick: async () => {
        console.log('Refreshing...');
        await new Promise((resolve) => setTimeout(resolve, 1000));
      },
    },
    {
      id: 'contact',
      label: 'Contact Support',
      variant: 'secondary' as const,
      onClick: () => {
        window.open('https://support.example.com', '_blank');
      },
    },
    {
      id: 'dismiss',
      label: 'Dismiss',
      variant: 'ghost' as const,
      onClick: () => setIsOpen(false),
    },
  ];

  return (
    <div>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-secondary rounded-md px-4 py-2 text-white"
      >
        View Custom Actions Example
      </button>
      <SystemStatusModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        statusData={statusData}
        actions={customActions}
      />
    </div>
  );
}

/**
 * Demo page showing all examples
 */
export function SystemStatusModalExamples() {
  return (
    <div className="bg-background-dark min-h-screen p-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <div>
          <h1 className="text-display text-primary mb-2 font-bold">System Status Modal Examples</h1>
          <p className="text-body text-secondary">
            Interactive examples of the SystemStatusModal component
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="glass-card space-y-4 p-6">
            <h2 className="text-heading text-primary font-semibold">Success State</h2>
            <p className="text-caption text-secondary">
              Healthy system with all metrics operational
            </p>
            <HealthyDatabaseExample />
          </div>

          <div className="glass-card space-y-4 p-6">
            <h2 className="text-heading text-primary font-semibold">Warning State</h2>
            <p className="text-caption text-secondary">Degraded performance but functional</p>
            <DegradedAPIExample />
          </div>

          <div className="glass-card space-y-4 p-6">
            <h2 className="text-heading text-primary font-semibold">Error State</h2>
            <p className="text-caption text-secondary">Service unavailable with error details</p>
            <FailedAIServiceExample />
          </div>

          <div className="glass-card space-y-4 p-6">
            <h2 className="text-heading text-primary font-semibold">Checking State</h2>
            <p className="text-caption text-secondary">Active health check in progress</p>
            <CheckingAuthenticationExample />
          </div>

          <div className="glass-card space-y-4 p-6 md:col-span-2">
            <h2 className="text-heading text-primary font-semibold">Custom Actions</h2>
            <p className="text-caption text-secondary">Modal with custom action buttons</p>
            <CustomActionsExample />
          </div>
        </div>
      </div>
    </div>
  );
}
