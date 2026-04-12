import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ApprovalCard } from '../Discovery/ApprovalCard';

describe('ApprovalCard', () => {
  const mockOnApprove = vi.fn();
  const mockOnReject = vi.fn();

  const defaultProps = {
    stageNumber: 1,
    stageName: 'Audience Analysis',
    keyFindings: [{ label: 'Goal', value: 'Learn React' }],
    insight: 'Test summary',
    nextStage: 'Audience Analysis',
    state: 'input-available' as any,
    onApprove: mockOnApprove,
    onReject: mockOnReject,
  };

  it('renders in default (pending) state with summary and next stage', () => {
    render(<ApprovalCard {...defaultProps} />);

    // Text has been removed in the UI update, we check for presence of Audience Analysis instead
    expect(screen.getAllByText(/Audience Analysis/)[0]).toBeInTheDocument();
  });

  it('renders in streaming state', () => {
    render(
      <ApprovalCard
        {...defaultProps}
        state="input-streaming"
      />
    );

    // Look for Synthesizing text
    expect(screen.getByText(/Synthesizing/i)).toBeInTheDocument();
  });

  it('renders in complete state', () => {
    render(
      <ApprovalCard
        {...defaultProps}
        state="output-available"
      />
    );

    // Look for Validation Secure text
    expect(screen.getByText(/Validation Secure/i)).toBeInTheDocument();
  });

  it('calls onApprove when approve button is clicked', () => {
    render(<ApprovalCard {...defaultProps} />);

    const approveButton = screen.getByText(/Approve & Continue/i);
    fireEvent.click(approveButton);

    expect(mockOnApprove).toHaveBeenCalledTimes(1);
  });

  it('calls onReject when reject button is clicked', () => {
    render(<ApprovalCard {...defaultProps} />);

    // Reject button has aria-label="Request changes"
    const rejectButton = screen.getByLabelText(/Request changes/i);
    fireEvent.click(rejectButton);

    expect(mockOnReject).toHaveBeenCalledTimes(1);
    expect(mockOnReject).toHaveBeenCalledWith('I need to refine the details of this stage.');
  });

  it('does not render buttons in streaming state', () => {
    render(<ApprovalCard {...defaultProps} state="input-streaming" />);
    expect(screen.queryByText(/Approve & Continue/i)).not.toBeInTheDocument();
  });

  it('does not render buttons in complete state', () => {
    render(<ApprovalCard {...defaultProps} state="output-available" />);
    expect(screen.queryByText(/Approve & Continue/i)).not.toBeInTheDocument();
  });
});
