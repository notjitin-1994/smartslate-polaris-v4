/**
 * SystemStatusModal Component Tests
 * Comprehensive test coverage for accessibility, interaction, and rendering
 */

import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SystemStatusModal } from '@/components/admin/SystemStatusModal';
import type { SystemStatusData, SystemAction } from '@/types/system-status';

// Mock data fixtures
const mockHealthyStatus: SystemStatusData = {
  component: 'database',
  componentName: 'PostgreSQL Database',
  status: 'success',
  lastChecked: '2025-01-09T12:00:00Z',
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
    },
  ],
};

const mockErrorStatus: SystemStatusData = {
  component: 'ai_service',
  componentName: 'Claude AI Service',
  status: 'error',
  lastChecked: '2025-01-09T12:00:00Z',
  error: {
    code: 'API_CONNECTION_FAILED',
    message: 'Unable to establish connection to Claude API',
    details: 'Connection timeout after 30000ms',
    timestamp: '2025-01-09T12:00:00Z',
    retryable: true,
  },
  metrics: [
    {
      label: 'API Status',
      value: 'Unavailable',
      status: 'error',
    },
  ],
};

describe('SystemStatusModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    statusData: mockHealthyStatus,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render when isOpen is true', () => {
      render(<SystemStatusModal {...defaultProps} />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should not render when isOpen is false', () => {
      render(<SystemStatusModal {...defaultProps} isOpen={false} />);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should display component name in title', () => {
      render(<SystemStatusModal {...defaultProps} />);
      expect(screen.getByText('PostgreSQL Database Status')).toBeInTheDocument();
    });

    it('should display status badge', () => {
      render(<SystemStatusModal {...defaultProps} />);
      expect(screen.getByText('Operational')).toBeInTheDocument();
    });

    it('should display last checked timestamp', () => {
      render(<SystemStatusModal {...defaultProps} />);
      expect(screen.getByText(/Last checked:/)).toBeInTheDocument();
    });

    it('should display success message when provided', () => {
      render(<SystemStatusModal {...defaultProps} />);
      expect(
        screen.getByText('All database operations are functioning normally.')
      ).toBeInTheDocument();
    });

    it('should display metrics when provided', () => {
      render(<SystemStatusModal {...defaultProps} />);
      expect(screen.getByText('Connection Pool')).toBeInTheDocument();
      expect(screen.getByText('8/20 active')).toBeInTheDocument();
      expect(screen.getByText('Average Query Time')).toBeInTheDocument();
      expect(screen.getByText('12ms')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should display error details', () => {
      render(<SystemStatusModal {...defaultProps} statusData={mockErrorStatus} />);

      expect(screen.getByText('Error: API_CONNECTION_FAILED')).toBeInTheDocument();
      expect(screen.getByText('Unable to establish connection to Claude API')).toBeInTheDocument();
    });

    it('should show technical details in collapsible section', async () => {
      render(<SystemStatusModal {...defaultProps} statusData={mockErrorStatus} />);

      const detailsElement = screen.getByText('Technical details');
      expect(detailsElement).toBeInTheDocument();

      // Details should be hidden by default
      expect(screen.queryByText('Connection timeout after 30000ms')).not.toBeVisible();

      // Click to expand
      await userEvent.click(detailsElement);
      expect(screen.getByText('Connection timeout after 30000ms')).toBeVisible();
    });

    it('should show retryable message for retryable errors', () => {
      render(<SystemStatusModal {...defaultProps} statusData={mockErrorStatus} />);

      expect(screen.getByText(/This issue may be temporary/)).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('should call onClose when close button is clicked', async () => {
      const onClose = vi.fn();
      render(<SystemStatusModal {...defaultProps} onClose={onClose} />);

      const closeButton = screen.getByRole('button', { name: /close modal/i });
      await userEvent.click(closeButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when backdrop is clicked', async () => {
      const onClose = vi.fn();
      render(<SystemStatusModal {...defaultProps} onClose={onClose} />);

      // Radix UI Dialog.Overlay handles backdrop clicks
      const overlay = screen.getByRole('dialog').parentElement?.previousSibling as HTMLElement;
      if (overlay) {
        await userEvent.click(overlay);
        expect(onClose).toHaveBeenCalled();
      }
    });

    it('should call onRetry when retry button is clicked', async () => {
      const onRetry = vi.fn();
      render(
        <SystemStatusModal {...defaultProps} statusData={mockErrorStatus} onRetry={onRetry} />
      );

      const retryButton = screen.getByRole('button', { name: /retry check/i });
      await userEvent.click(retryButton);

      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('should show loading state when isRetrying is true', () => {
      render(
        <SystemStatusModal
          {...defaultProps}
          statusData={mockErrorStatus}
          onRetry={vi.fn()}
          isRetrying={true}
        />
      );

      const retryButton = screen.getByRole('button', { name: /retrying/i });
      expect(retryButton).toBeDisabled();
      expect(retryButton).toHaveAttribute('aria-busy', 'true');
    });

    it('should call onViewLogs when view logs button is clicked', async () => {
      const onViewLogs = vi.fn();
      render(<SystemStatusModal {...defaultProps} onViewLogs={onViewLogs} />);

      const logsButton = screen.getByRole('button', { name: /view logs/i });
      await userEvent.click(logsButton);

      expect(onViewLogs).toHaveBeenCalledTimes(1);
    });

    it('should render custom actions', async () => {
      const customAction1 = vi.fn();
      const customAction2 = vi.fn();

      const customActions: SystemAction[] = [
        {
          id: 'action1',
          label: 'Custom Action 1',
          variant: 'primary',
          onClick: customAction1,
        },
        {
          id: 'action2',
          label: 'Custom Action 2',
          variant: 'secondary',
          onClick: customAction2,
        },
      ];

      render(<SystemStatusModal {...defaultProps} actions={customActions} />);

      const button1 = screen.getByRole('button', { name: 'Custom Action 1' });
      const button2 = screen.getByRole('button', { name: 'Custom Action 2' });

      await userEvent.click(button1);
      expect(customAction1).toHaveBeenCalled();

      await userEvent.click(button2);
      expect(customAction2).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<SystemStatusModal {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-describedby', 'system-status-description');
    });

    it('should have accessible status badge', () => {
      render(<SystemStatusModal {...defaultProps} />);

      const statusBadge = screen.getByRole('status');
      expect(statusBadge).toHaveAttribute('aria-label', 'Status: Operational');
    });

    it('should have accessible close button', () => {
      render(<SystemStatusModal {...defaultProps} />);

      const closeButton = screen.getByRole('button', { name: /close modal/i });
      expect(closeButton).toBeInTheDocument();
    });

    it('should set alert role for error messages', () => {
      render(<SystemStatusModal {...defaultProps} statusData={mockErrorStatus} />);

      const errorAlert = screen.getByRole('alert');
      expect(errorAlert).toBeInTheDocument();
      expect(errorAlert).toHaveAttribute('aria-live', 'assertive');
    });

    it('should support keyboard navigation', async () => {
      const onClose = vi.fn();
      render(<SystemStatusModal {...defaultProps} onClose={onClose} />);

      // Tab through interactive elements
      await userEvent.tab();
      const closeButton = screen.getByRole('button', { name: /close modal/i });
      expect(closeButton).toHaveFocus();

      // Press Enter to close
      await userEvent.keyboard('{Enter}');
      expect(onClose).toHaveBeenCalled();
    });

    it('should close on Escape key', async () => {
      const onClose = vi.fn();
      render(<SystemStatusModal {...defaultProps} onClose={onClose} />);

      await userEvent.keyboard('{Escape}');
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('Status Types', () => {
    it('should render warning status correctly', () => {
      const warningStatus: SystemStatusData = {
        ...mockHealthyStatus,
        status: 'warning',
        message: 'System is experiencing degraded performance.',
      };

      render(<SystemStatusModal {...defaultProps} statusData={warningStatus} />);
      expect(screen.getByText('Degraded')).toBeInTheDocument();
    });

    it('should render checking status correctly', () => {
      const checkingStatus: SystemStatusData = {
        ...mockHealthyStatus,
        status: 'checking',
        message: 'Running system checks...',
      };

      render(<SystemStatusModal {...defaultProps} statusData={checkingStatus} />);
      expect(screen.getByText('Checking...')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty metrics array', () => {
      const statusWithoutMetrics: SystemStatusData = {
        ...mockHealthyStatus,
        metrics: [],
      };

      render(<SystemStatusModal {...defaultProps} statusData={statusWithoutMetrics} />);
      expect(screen.getByText('No additional details available')).toBeInTheDocument();
    });

    it('should handle missing optional fields', () => {
      const minimalStatus: SystemStatusData = {
        component: 'database',
        componentName: 'Database',
        status: 'success',
        lastChecked: '2025-01-09T12:00:00Z',
      };

      render(<SystemStatusModal {...defaultProps} statusData={minimalStatus} />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should handle invalid timestamp gracefully', () => {
      const statusWithInvalidTimestamp: SystemStatusData = {
        ...mockHealthyStatus,
        lastChecked: 'invalid-date',
      };

      render(<SystemStatusModal {...defaultProps} statusData={statusWithInvalidTimestamp} />);
      expect(screen.getByText(/Last checked: invalid-date/)).toBeInTheDocument();
    });

    it('should disable action buttons when specified', () => {
      const disabledAction: SystemAction = {
        id: 'disabled',
        label: 'Disabled Action',
        variant: 'primary',
        onClick: vi.fn(),
        disabled: true,
      };

      render(<SystemStatusModal {...defaultProps} actions={[disabledAction]} />);

      const button = screen.getByRole('button', { name: 'Disabled Action' });
      expect(button).toBeDisabled();
    });
  });

  describe('Responsive Design', () => {
    it('should have mobile-friendly widths', () => {
      render(<SystemStatusModal {...defaultProps} />);
      const dialog = screen.getByRole('dialog');

      // Check for responsive width classes
      expect(dialog).toHaveClass('w-[calc(100vw-2rem)]');
      expect(dialog).toHaveClass('max-w-2xl');
    });

    it('should have scrollable content area', () => {
      render(<SystemStatusModal {...defaultProps} />);
      const description = screen
        .getByRole('dialog')
        .querySelector('[id="system-status-description"]');

      expect(description).toHaveClass('overflow-y-auto');
      expect(description).toHaveClass('max-h-[60vh]');
    });
  });
});
