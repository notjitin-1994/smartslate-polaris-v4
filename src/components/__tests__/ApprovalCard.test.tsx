import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApprovalCard } from '../Discovery/ApprovalCard';

describe('ApprovalCard', () => {
  const mockOnApprove = vi.fn();
  const mockOnReject = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders in default (pending) state with summary and next stage', () => {
    render(
      <ApprovalCard
        summary="Test summary"
        nextStage="Audience Analysis"
        onApprove={mockOnApprove}
        onReject={mockOnReject}
      />
    );

    expect(screen.getByText('Test summary')).toBeInTheDocument();
    expect(screen.getByText(/Audience Analysis/)).toBeInTheDocument();
    expect(screen.getByText('Approval Required')).toBeInTheDocument();
  });

  it('renders in streaming state', () => {
    render(
      <ApprovalCard
        summary="Test summary"
        nextStage="Audience Analysis"
        state="input-streaming"
        onApprove={mockOnApprove}
        onReject={mockOnReject}
      />
    );

    expect(screen.getByText(/preparing stage transition/i)).toBeInTheDocument();
    expect(screen.queryByText('Test summary')).not.toBeInTheDocument();
  });

  it('renders in complete state', () => {
    render(
      <ApprovalCard
        summary="Test summary"
        nextStage="Audience Analysis"
        state="output-available"
        onApprove={mockOnApprove}
        onReject={mockOnReject}
      />
    );

    expect(screen.getByText(/stage transition approved/i)).toBeInTheDocument();
    expect(screen.getByText(/Audience Analysis/)).toBeInTheDocument();
  });

  it('calls onApprove when approve button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ApprovalCard
        summary="Test summary"
        nextStage="Audience Analysis"
        onApprove={mockOnApprove}
        onReject={mockOnReject}
      />
    );

    const approveButton = screen.getByRole('button', { name: /approve/i });
    await user.click(approveButton);

    expect(mockOnApprove).toHaveBeenCalledTimes(1);
  });

  it('calls onReject when reject button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ApprovalCard
        summary="Test summary"
        nextStage="Audience Analysis"
        onApprove={mockOnApprove}
        onReject={mockOnReject}
      />
    );

    const rejectButton = screen.getByRole('button', { name: /request changes/i });
    await user.click(rejectButton);

    expect(mockOnReject).toHaveBeenCalledTimes(1);
    expect(mockOnReject).toHaveBeenCalledWith('I need more detail on this stage.');
  });

  it('does not render buttons in streaming state', () => {
    render(
      <ApprovalCard
        summary="Test summary"
        nextStage="Audience Analysis"
        state="input-streaming"
        onApprove={mockOnApprove}
        onReject={mockOnReject}
      />
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('does not render buttons in complete state', () => {
    render(
      <ApprovalCard
        summary="Test summary"
        nextStage="Audience Analysis"
        state="output-available"
        onApprove={mockOnApprove}
        onReject={mockOnReject}
      />
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
