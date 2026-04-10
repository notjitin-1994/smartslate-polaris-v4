import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApprovalCard } from '../Discovery/ApprovalCard';

describe('ApprovalCard', () => {
  const mockOnApprove = vi.fn();
  const mockOnReject = vi.fn();

  it('renders in pending state', () => {
    render(
      <ApprovalCard
        summary="Test summary"
        nextStage="Audience Analysis"
        state="pending"
        onApprove={mockOnApprove}
        onReject={mockOnReject}
      />
    );

    expect(screen.getByText('Test summary')).toBeInTheDocument();
    expect(screen.getByText(/Audience Analysis/)).toBeInTheDocument();
  });

  it('calls onApprove when approve button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ApprovalCard
        summary="Test summary"
        nextStage="Audience Analysis"
        state="pending"
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
        state="pending"
        onApprove={mockOnApprove}
        onReject={mockOnReject}
      />
    );

    const rejectButton = screen.getByRole('button', { name: /request changes/i });
    await user.click(rejectButton);

    expect(mockOnReject).toHaveBeenCalledWith('');
  });
});
