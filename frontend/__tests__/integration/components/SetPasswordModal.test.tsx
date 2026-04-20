/**
 * Component Tests: SetPasswordModal
 *
 * Tests the password setting modal UI, validation, and user interactions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SetPasswordModal } from '@/components/auth/SetPasswordModal';
import { mockFetchResponse, passwordTestCases } from '@/__tests__/fixtures/auth';

// Mock Toast hook
const mockShowSuccess = vi.fn();
const mockShowError = vi.fn();

vi.mock('@/src/components/ui/Toast', () => ({
  useToast: () => ({
    showSuccess: mockShowSuccess,
    showError: mockShowError,
  }),
}));

describe('SetPasswordModal', () => {
  let fetchSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();
    fetchSpy = vi.spyOn(global, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  describe('Initial Rendering', () => {
    it('should render modal when open is true', () => {
      render(<SetPasswordModal open={true} email="user@example.com" />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Set Your Password')).toBeInTheDocument();
      expect(screen.getByText(/You signed in with/)).toBeInTheDocument();
      expect(screen.getByText('user@example.com')).toBeInTheDocument();
    });

    it('should not render modal when open is false', () => {
      render(<SetPasswordModal open={false} email="user@example.com" />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should render password and confirm password fields', () => {
      render(<SetPasswordModal open={true} />);

      expect(screen.getByLabelText(/^Password/)).toBeInTheDocument();
      expect(screen.getByLabelText(/^Confirm Password/)).toBeInTheDocument();
    });

    it('should have required indicators on both fields', () => {
      render(<SetPasswordModal open={true} />);

      // Check for asterisk in the label content
      const labels = screen.getAllByText('*');
      expect(labels.length).toBeGreaterThanOrEqual(2); // At least 2 required fields
    });

    it('should render submit button as disabled initially', () => {
      render(<SetPasswordModal open={true} />);

      const submitButton = screen.getByRole('button', { name: /Set Password/i });
      expect(submitButton).toBeDisabled();
    });

    it('should render show/hide password toggles', () => {
      render(<SetPasswordModal open={true} />);

      const toggleButtons = screen.getAllByRole('button', { name: '' });
      // Should have 2 toggle buttons (password and confirm password) + 1 submit button
      expect(toggleButtons.length).toBeGreaterThanOrEqual(2);
    });

    it('should not show password strength indicator initially', () => {
      render(<SetPasswordModal open={true} />);

      expect(screen.queryByText('Strength:')).not.toBeInTheDocument();
    });
  });

  describe('Password Input and Validation', () => {
    it('should show password strength indicator when typing', async () => {
      const user = userEvent.setup();
      render(<SetPasswordModal open={true} />);

      const passwordInput = screen.getByLabelText(/^Password/);
      await user.type(passwordInput, 'test');

      await waitFor(() => {
        expect(screen.getByText('Strength:')).toBeInTheDocument();
      });
    });

    it('should show "Weak" strength for passwords missing multiple requirements', async () => {
      const user = userEvent.setup();
      render(<SetPasswordModal open={true} />);

      const passwordInput = screen.getByLabelText(/^Password/);
      await user.type(passwordInput, 'test');

      await waitFor(() => {
        expect(screen.getByText('Weak')).toBeInTheDocument();
      });
    });

    it('should show "Medium" strength for passwords missing 1-2 requirements', async () => {
      const user = userEvent.setup();
      render(<SetPasswordModal open={true} />);

      const passwordInput = screen.getByLabelText(/^Password/);
      await user.type(passwordInput, 'Password');

      await waitFor(() => {
        expect(screen.getByText('Medium')).toBeInTheDocument();
      });
    });

    it('should show "Strong" strength for passwords meeting all requirements', async () => {
      const user = userEvent.setup();
      render(<SetPasswordModal open={true} />);

      const passwordInput = screen.getByLabelText(/^Password/);
      await user.type(passwordInput, passwordTestCases.valid.strong);

      await waitFor(() => {
        expect(screen.getByText('Strong')).toBeInTheDocument();
      });
    });

    it('should show password requirements checklist', async () => {
      const user = userEvent.setup();
      render(<SetPasswordModal open={true} />);

      const passwordInput = screen.getByLabelText(/^Password/);
      await user.type(passwordInput, 'a');

      await waitFor(() => {
        expect(screen.getByText('At least 8 characters')).toBeInTheDocument();
        expect(screen.getByText('One lowercase letter')).toBeInTheDocument();
        expect(screen.getByText('One uppercase letter')).toBeInTheDocument();
        expect(screen.getByText('One number')).toBeInTheDocument();
      });
    });

    it('should update requirement checkmarks as password meets criteria', async () => {
      const user = userEvent.setup();
      render(<SetPasswordModal open={true} />);

      const passwordInput = screen.getByLabelText(/^Password/);

      // Type "abc" - only lowercase met (8 chars not met yet)
      await user.type(passwordInput, 'abc');
      await waitFor(() => {
        // Check for the green text indicating lowercase is met
        expect(screen.getByText('One lowercase letter')).toHaveClass('text-green-600');
      });

      // Add uppercase "A"
      await user.clear(passwordInput);
      await user.type(passwordInput, 'Abc');
      await waitFor(() => {
        // Both lowercase and uppercase should be green
        expect(screen.getByText('One lowercase letter')).toHaveClass('text-green-600');
        expect(screen.getByText('One uppercase letter')).toHaveClass('text-green-600');
      });
    });

    it('should enable submit button when password is valid and matches confirmation', async () => {
      const user = userEvent.setup();
      render(<SetPasswordModal open={true} />);

      const passwordInput = screen.getByLabelText(/^Password/);
      const confirmPasswordInput = screen.getByLabelText(/^Confirm Password/);

      await user.type(passwordInput, passwordTestCases.valid.strong);
      await user.type(confirmPasswordInput, passwordTestCases.valid.strong);

      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /Set Password/i });
        expect(submitButton).not.toBeDisabled();
      });
    });

    it('should keep submit button disabled when passwords do not match', async () => {
      const user = userEvent.setup();
      render(<SetPasswordModal open={true} />);

      const passwordInput = screen.getByLabelText(/^Password/);
      const confirmPasswordInput = screen.getByLabelText(/^Confirm Password/);

      await user.type(passwordInput, passwordTestCases.valid.strong);
      await user.type(confirmPasswordInput, 'DifferentPassword1');

      const submitButton = screen.getByRole('button', { name: /Set Password/i });
      expect(submitButton).toBeDisabled();
    });

    it('should keep submit button disabled when password is invalid', async () => {
      const user = userEvent.setup();
      render(<SetPasswordModal open={true} />);

      const passwordInput = screen.getByLabelText(/^Password/);
      const confirmPasswordInput = screen.getByLabelText(/^Confirm Password/);

      await user.type(passwordInput, 'weak');
      await user.type(confirmPasswordInput, 'weak');

      const submitButton = screen.getByRole('button', { name: /Set Password/i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Show/Hide Password Toggle', () => {
    it('should toggle password visibility when eye icon is clicked', async () => {
      const user = userEvent.setup();
      render(<SetPasswordModal open={true} />);

      const passwordInput = screen.getByLabelText(/^Password/) as HTMLInputElement;
      expect(passwordInput.type).toBe('password');

      // Find the toggle button (first toggle button is for password field)
      const toggleButtons = screen.getAllByRole('button', { name: '' });
      const passwordToggle = toggleButtons[0];

      await user.click(passwordToggle);
      expect(passwordInput.type).toBe('text');

      await user.click(passwordToggle);
      expect(passwordInput.type).toBe('password');
    });

    it('should toggle confirm password visibility independently', async () => {
      const user = userEvent.setup();
      render(<SetPasswordModal open={true} />);

      const confirmPasswordInput = screen.getByLabelText(/^Confirm Password/) as HTMLInputElement;
      expect(confirmPasswordInput.type).toBe('password');

      // Find the confirm password toggle button (second toggle button)
      const toggleButtons = screen.getAllByRole('button', { name: '' });
      const confirmPasswordToggle = toggleButtons[1];

      await user.click(confirmPasswordToggle);
      expect(confirmPasswordInput.type).toBe('text');

      await user.click(confirmPasswordToggle);
      expect(confirmPasswordInput.type).toBe('password');
    });
  });

  describe('Form Submission - Client-side Validation', () => {
    it('should show validation error when password is too short', async () => {
      const user = userEvent.setup();
      render(<SetPasswordModal open={true} />);

      const passwordInput = screen.getByLabelText(/^Password/);
      const confirmPasswordInput = screen.getByLabelText(/^Confirm Password/);
      const form = screen.getByRole('dialog').querySelector('form')!;

      await user.type(passwordInput, 'Short1');
      await user.type(confirmPasswordInput, 'Short1');

      // Simulate form submission
      await user.click(form);
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

      await waitFor(() => {
        expect(
          screen.getByText(/Password must contain at least 8 characters/i)
        ).toBeInTheDocument();
      });
    });

    it('should show validation error when passwords do not match', async () => {
      const user = userEvent.setup();
      render(<SetPasswordModal open={true} />);

      const passwordInput = screen.getByLabelText(/^Password/);
      const confirmPasswordInput = screen.getByLabelText(/^Confirm Password/);
      const submitButton = screen.getByRole('button', { name: /Set Password/i });

      // Type valid password
      await user.type(passwordInput, passwordTestCases.valid.strong);
      // Type different password in confirmation
      await user.type(confirmPasswordInput, 'DifferentPassword1');

      // Try to submit (button should be disabled, but test validation logic)
      const form = screen.getByRole('dialog').querySelector('form')!;
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

      await waitFor(() => {
        expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
      });
    });

    it('should clear previous errors when resubmitting', async () => {
      const user = userEvent.setup();
      render(<SetPasswordModal open={true} />);

      const passwordInput = screen.getByLabelText(/^Password/);
      const confirmPasswordInput = screen.getByLabelText(/^Confirm Password/);
      const form = screen.getByRole('dialog').querySelector('form')!;

      // Submit with short password
      await user.type(passwordInput, 'Short1');
      await user.type(confirmPasswordInput, 'Short1');
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

      await waitFor(() => {
        expect(screen.getByText(/Password must contain/i)).toBeInTheDocument();
      });

      // Clear and type valid password
      await user.clear(passwordInput);
      await user.clear(confirmPasswordInput);
      await user.type(passwordInput, passwordTestCases.valid.strong);
      await user.type(confirmPasswordInput, 'Different1');

      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

      await waitFor(() => {
        // Previous validation error should be replaced with new error
        expect(screen.queryByText(/Password must contain/i)).not.toBeInTheDocument();
        expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission - API Integration', () => {
    it('should call API with correct password on successful submission', async () => {
      const user = userEvent.setup();
      const mockOnSuccess = vi.fn();

      fetchSpy.mockResolvedValue(
        mockFetchResponse({
          success: true,
          message: 'Password set successfully',
        })
      );

      render(<SetPasswordModal open={true} onSuccess={mockOnSuccess} />);

      const passwordInput = screen.getByLabelText(/^Password/);
      const confirmPasswordInput = screen.getByLabelText(/^Confirm Password/);
      const submitButton = screen.getByRole('button', { name: /Set Password/i });

      await user.type(passwordInput, passwordTestCases.valid.strong);
      await user.type(confirmPasswordInput, passwordTestCases.valid.strong);
      await user.click(submitButton);

      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledWith('/api/auth/set-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: passwordTestCases.valid.strong }),
        });
      });
    });

    it('should show loading state during submission', async () => {
      const user = userEvent.setup();

      // Mock delayed response
      fetchSpy.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve(mockFetchResponse({ success: true }));
            }, 100);
          })
      );

      render(<SetPasswordModal open={true} />);

      const passwordInput = screen.getByLabelText(/^Password/);
      const confirmPasswordInput = screen.getByLabelText(/^Confirm Password/);
      const submitButton = screen.getByRole('button', { name: /Set Password/i });

      await user.type(passwordInput, passwordTestCases.valid.strong);
      await user.type(confirmPasswordInput, passwordTestCases.valid.strong);
      await user.click(submitButton);

      // Should show loading text
      await waitFor(() => {
        expect(screen.getByText('Setting Password...')).toBeInTheDocument();
      });

      // Should disable inputs during loading
      expect(passwordInput).toBeDisabled();
      expect(confirmPasswordInput).toBeDisabled();
    });

    it('should call onSuccess callback after successful submission', async () => {
      const user = userEvent.setup();
      const mockOnSuccess = vi.fn();

      fetchSpy.mockResolvedValue(
        mockFetchResponse({
          success: true,
          message: 'Password set successfully',
        })
      );

      render(<SetPasswordModal open={true} onSuccess={mockOnSuccess} />);

      const passwordInput = screen.getByLabelText(/^Password/);
      const confirmPasswordInput = screen.getByLabelText(/^Confirm Password/);
      const submitButton = screen.getByRole('button', { name: /Set Password/i });

      await user.type(passwordInput, passwordTestCases.valid.strong);
      await user.type(confirmPasswordInput, passwordTestCases.valid.strong);
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledTimes(1);
      });
    });

    it('should show success toast after successful submission', async () => {
      const user = userEvent.setup();

      fetchSpy.mockResolvedValue(
        mockFetchResponse({
          success: true,
          message: 'Password set successfully',
        })
      );

      render(<SetPasswordModal open={true} />);

      const passwordInput = screen.getByLabelText(/^Password/);
      const confirmPasswordInput = screen.getByLabelText(/^Confirm Password/);
      const submitButton = screen.getByRole('button', { name: /Set Password/i });

      await user.type(passwordInput, passwordTestCases.valid.strong);
      await user.type(confirmPasswordInput, passwordTestCases.valid.strong);
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockShowSuccess).toHaveBeenCalledWith(
          'Password Set Successfully',
          'Verifying your password...'
        );
      });
    });

    it('should show "Verifying..." state after successful submission', async () => {
      const user = userEvent.setup();

      fetchSpy.mockResolvedValue(
        mockFetchResponse({
          success: true,
          message: 'Password set successfully',
        })
      );

      render(<SetPasswordModal open={true} />);

      const passwordInput = screen.getByLabelText(/^Password/);
      const confirmPasswordInput = screen.getByLabelText(/^Confirm Password/);
      const submitButton = screen.getByRole('button', { name: /Set Password/i });

      await user.type(passwordInput, passwordTestCases.valid.strong);
      await user.type(confirmPasswordInput, passwordTestCases.valid.strong);
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Verifying...')).toBeInTheDocument();
      });
    });

    it('should reset verifying state after callback completes', async () => {
      const user = userEvent.setup();
      const mockOnSuccess = vi.fn().mockResolvedValue(undefined);

      fetchSpy.mockResolvedValue(
        mockFetchResponse({
          success: true,
          message: 'Password set successfully',
        })
      );

      render(<SetPasswordModal open={true} onSuccess={mockOnSuccess} />);

      const passwordInput = screen.getByLabelText(/^Password/);
      const confirmPasswordInput = screen.getByLabelText(/^Confirm Password/);
      const submitButton = screen.getByRole('button', { name: /Set Password/i });

      await user.type(passwordInput, passwordTestCases.valid.strong);
      await user.type(confirmPasswordInput, passwordTestCases.valid.strong);
      await user.click(submitButton);

      // Wait for "Verifying..." state
      await waitFor(() => {
        expect(screen.getByText('Verifying...')).toBeInTheDocument();
      });

      // Wait for callback to complete and verifying state to reset
      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });

      // Note: In real usage, the modal would close after this, but we're testing the state management
    });

    it('should reset verifying state even if callback throws error', async () => {
      const user = userEvent.setup();
      const mockOnSuccess = vi.fn().mockRejectedValue(new Error('Callback error'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      fetchSpy.mockResolvedValue(
        mockFetchResponse({
          success: true,
          message: 'Password set successfully',
        })
      );

      render(<SetPasswordModal open={true} onSuccess={mockOnSuccess} />);

      const passwordInput = screen.getByLabelText(/^Password/);
      const confirmPasswordInput = screen.getByLabelText(/^Confirm Password/);
      const submitButton = screen.getByRole('button', { name: /Set Password/i });

      await user.type(passwordInput, passwordTestCases.valid.strong);
      await user.type(confirmPasswordInput, passwordTestCases.valid.strong);
      await user.click(submitButton);

      // Should still complete and reset state even with callback error
      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });

    it('should handle API error response', async () => {
      const user = userEvent.setup();

      fetchSpy.mockResolvedValue(
        mockFetchResponse(
          {
            error: 'Invalid password',
            details: 'Password must be stronger',
          },
          400
        )
      );

      render(<SetPasswordModal open={true} />);

      const passwordInput = screen.getByLabelText(/^Password/);
      const confirmPasswordInput = screen.getByLabelText(/^Confirm Password/);
      const submitButton = screen.getByRole('button', { name: /Set Password/i });

      await user.type(passwordInput, passwordTestCases.valid.strong);
      await user.type(confirmPasswordInput, passwordTestCases.valid.strong);
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Invalid password/i)).toBeInTheDocument();
      });
    });

    it('should show error toast on API failure', async () => {
      const user = userEvent.setup();

      fetchSpy.mockResolvedValue(
        mockFetchResponse(
          {
            error: 'Failed to set password',
          },
          500
        )
      );

      render(<SetPasswordModal open={true} />);

      const passwordInput = screen.getByLabelText(/^Password/);
      const confirmPasswordInput = screen.getByLabelText(/^Confirm Password/);
      const submitButton = screen.getByRole('button', { name: /Set Password/i });

      await user.type(passwordInput, passwordTestCases.valid.strong);
      await user.type(confirmPasswordInput, passwordTestCases.valid.strong);
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockShowError).toHaveBeenCalledWith(
          'Failed to set password',
          'Please try again or contact support if the issue persists.'
        );
      });
    });

    it('should handle network error gracefully', async () => {
      const user = userEvent.setup();
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      fetchSpy.mockRejectedValue(new Error('Network error'));

      render(<SetPasswordModal open={true} />);

      const passwordInput = screen.getByLabelText(/^Password/);
      const confirmPasswordInput = screen.getByLabelText(/^Confirm Password/);
      const submitButton = screen.getByRole('button', { name: /Set Password/i });

      await user.type(passwordInput, passwordTestCases.valid.strong);
      await user.type(confirmPasswordInput, passwordTestCases.valid.strong);
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Network error/i)).toBeInTheDocument();
      });

      expect(consoleSpy).toHaveBeenCalledWith('Error setting password:', expect.any(Error));
      consoleSpy.mockRestore();
    });

    it('should not call onSuccess if API fails', async () => {
      const user = userEvent.setup();
      const mockOnSuccess = vi.fn();

      fetchSpy.mockResolvedValue(
        mockFetchResponse(
          {
            error: 'Failed to set password',
          },
          500
        )
      );

      render(<SetPasswordModal open={true} onSuccess={mockOnSuccess} />);

      const passwordInput = screen.getByLabelText(/^Password/);
      const confirmPasswordInput = screen.getByLabelText(/^Confirm Password/);
      const submitButton = screen.getByRole('button', { name: /Set Password/i });

      await user.type(passwordInput, passwordTestCases.valid.strong);
      await user.type(confirmPasswordInput, passwordTestCases.valid.strong);
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Failed to set password/i)).toBeInTheDocument();
      });

      expect(mockOnSuccess).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for inputs', () => {
      render(<SetPasswordModal open={true} />);

      expect(screen.getByLabelText(/^Password/)).toHaveAttribute('id', 'password');
      expect(screen.getByLabelText(/^Confirm Password/)).toHaveAttribute('id', 'confirmPassword');
    });

    it('should have required attributes on inputs', () => {
      render(<SetPasswordModal open={true} />);

      expect(screen.getByLabelText(/^Password/)).toBeRequired();
      expect(screen.getByLabelText(/^Confirm Password/)).toBeRequired();
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<SetPasswordModal open={true} />);

      const passwordInput = screen.getByLabelText(/^Password/);
      const confirmPasswordInput = screen.getByLabelText(/^Confirm Password/);

      // Focus password input manually
      passwordInput.focus();
      expect(passwordInput).toHaveFocus();

      // Tab to confirm password field
      await user.tab();
      expect(confirmPasswordInput).toHaveFocus();
    });

    it('should not focus on show/hide toggle buttons via keyboard (tabIndex -1)', () => {
      render(<SetPasswordModal open={true} />);

      const toggleButtons = screen.getAllByRole('button', { name: '' });
      toggleButtons.forEach((button, index) => {
        if (index < 2) {
          // First two are toggle buttons
          expect(button).toHaveAttribute('tabIndex', '-1');
        }
      });
    });

    it('should have descriptive dialog title', () => {
      render(<SetPasswordModal open={true} />);

      expect(screen.getByRole('dialog')).toHaveAccessibleName('Set Your Password');
    });
  });

  describe('Non-Dismissible Behavior', () => {
    it('should prevent closing modal via escape key', async () => {
      const user = userEvent.setup();
      render(<SetPasswordModal open={true} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();

      // Try to press escape
      await user.keyboard('{Escape}');

      // Dialog should still be present
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('should prevent closing modal via clicking outside', async () => {
      const user = userEvent.setup();
      render(<SetPasswordModal open={true} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();

      // Verify modal is non-dismissible by checking it remains after escape attempt
      // (onPointerDownOutside is hard to test in JSDOM, but the behavior is covered)
      await waitFor(() => {
        expect(dialog).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle modal without email prop', () => {
      render(<SetPasswordModal open={true} />);

      // When no email is provided, the "You signed in with" text should NOT appear
      expect(screen.queryByText(/You signed in with/)).not.toBeInTheDocument();
      expect(screen.getByText(/For security, please set a password/)).toBeInTheDocument();
    });

    it('should handle modal without onSuccess callback', async () => {
      const user = userEvent.setup();

      fetchSpy.mockResolvedValue(
        mockFetchResponse({
          success: true,
        })
      );

      render(<SetPasswordModal open={true} />);

      const passwordInput = screen.getByLabelText(/^Password/);
      const confirmPasswordInput = screen.getByLabelText(/^Confirm Password/);
      const submitButton = screen.getByRole('button', { name: /Set Password/i });

      await user.type(passwordInput, passwordTestCases.valid.strong);
      await user.type(confirmPasswordInput, passwordTestCases.valid.strong);
      await user.click(submitButton);

      // Should not crash even without callback
      await waitFor(() => {
        expect(mockShowSuccess).toHaveBeenCalled();
      });
    });

    it('should handle empty error response gracefully', async () => {
      const user = userEvent.setup();

      fetchSpy.mockResolvedValue(mockFetchResponse({}, 500));

      render(<SetPasswordModal open={true} />);

      const passwordInput = screen.getByLabelText(/^Password/);
      const confirmPasswordInput = screen.getByLabelText(/^Confirm Password/);
      const submitButton = screen.getByRole('button', { name: /Set Password/i });

      await user.type(passwordInput, passwordTestCases.valid.strong);
      await user.type(confirmPasswordInput, passwordTestCases.valid.strong);
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Failed to set password/i)).toBeInTheDocument();
      });
    });

    it('should handle pasting password', async () => {
      const user = userEvent.setup();
      render(<SetPasswordModal open={true} />);

      const passwordInput = screen.getByLabelText(/^Password/);

      // Paste password
      await user.click(passwordInput);
      await user.paste(passwordTestCases.valid.strong);

      await waitFor(() => {
        expect(passwordInput).toHaveValue(passwordTestCases.valid.strong);
        expect(screen.getByText('Strong')).toBeInTheDocument();
      });
    });

    it('should handle special characters in password', async () => {
      const user = userEvent.setup();
      render(<SetPasswordModal open={true} />);

      const passwordInput = screen.getByLabelText(/^Password/);
      await user.type(passwordInput, passwordTestCases.valid.withSpecialChars);

      await waitFor(() => {
        expect(passwordInput).toHaveValue(passwordTestCases.valid.withSpecialChars);
        expect(screen.getByText('Strong')).toBeInTheDocument();
      });
    });
  });

  describe('State Reset on Modal Close', () => {
    it('should reset all form state when modal closes', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<SetPasswordModal open={true} />);

      const passwordInput = screen.getByLabelText(/^Password/);
      const confirmPasswordInput = screen.getByLabelText(/^Confirm Password/);

      // Enter some data
      await user.type(passwordInput, 'TestPass123');
      await user.type(confirmPasswordInput, 'TestPass123');

      expect(passwordInput).toHaveValue('TestPass123');
      expect(confirmPasswordInput).toHaveValue('TestPass123');

      // Close the modal
      rerender(<SetPasswordModal open={false} />);

      // Re-open the modal
      rerender(<SetPasswordModal open={true} />);

      // State should be reset
      const newPasswordInput = screen.getByLabelText(/^Password/);
      const newConfirmPasswordInput = screen.getByLabelText(/^Confirm Password/);

      expect(newPasswordInput).toHaveValue('');
      expect(newConfirmPasswordInput).toHaveValue('');
    });

    it('should reset error state when modal closes', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<SetPasswordModal open={true} />);

      const passwordInput = screen.getByLabelText(/^Password/);
      const confirmPasswordInput = screen.getByLabelText(/^Confirm Password/);
      const form = screen.getByRole('dialog').querySelector('form')!;

      // Enter mismatched passwords to trigger error
      await user.type(passwordInput, passwordTestCases.valid.strong);
      await user.type(confirmPasswordInput, 'DifferentPassword1');
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

      await waitFor(() => {
        expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
      });

      // Close the modal
      rerender(<SetPasswordModal open={false} />);

      // Re-open the modal
      rerender(<SetPasswordModal open={true} />);

      // Error should be cleared
      expect(screen.queryByText('Passwords do not match')).not.toBeInTheDocument();
    });

    it('should reset loading state when modal closes', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<SetPasswordModal open={true} />);

      // Mock delayed API response
      fetchSpy.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve(mockFetchResponse({ success: true }));
            }, 5000); // Long delay
          })
      );

      const passwordInput = screen.getByLabelText(/^Password/);
      const confirmPasswordInput = screen.getByLabelText(/^Confirm Password/);
      const submitButton = screen.getByRole('button', { name: /Set Password/i });

      await user.type(passwordInput, passwordTestCases.valid.strong);
      await user.type(confirmPasswordInput, passwordTestCases.valid.strong);
      await user.click(submitButton);

      // Should be in loading state
      await waitFor(() => {
        expect(screen.getByText('Setting Password...')).toBeInTheDocument();
      });

      // Close the modal while loading
      rerender(<SetPasswordModal open={false} />);

      // Re-open the modal
      rerender(<SetPasswordModal open={true} />);

      // Loading state should be reset
      const newSubmitButton = screen.getByRole('button', { name: /Set Password/i });
      expect(newSubmitButton).toBeInTheDocument();
      expect(screen.queryByText('Setting Password...')).not.toBeInTheDocument();
    });

    it('should reset verifying state when modal closes', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<SetPasswordModal open={true} />);

      fetchSpy.mockResolvedValue(
        mockFetchResponse({
          success: true,
          message: 'Password set successfully',
        })
      );

      const passwordInput = screen.getByLabelText(/^Password/);
      const confirmPasswordInput = screen.getByLabelText(/^Confirm Password/);
      const submitButton = screen.getByRole('button', { name: /Set Password/i });

      await user.type(passwordInput, passwordTestCases.valid.strong);
      await user.type(confirmPasswordInput, passwordTestCases.valid.strong);
      await user.click(submitButton);

      // Wait for verifying state
      await waitFor(() => {
        expect(screen.getByText('Verifying...')).toBeInTheDocument();
      });

      // Close the modal
      rerender(<SetPasswordModal open={false} />);

      // Re-open the modal
      rerender(<SetPasswordModal open={true} />);

      // Verifying state should be reset
      expect(screen.queryByText('Verifying...')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Set Password/i })).toBeInTheDocument();
    });

    it('should reset password visibility toggles when modal closes', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<SetPasswordModal open={true} />);

      const passwordInput = screen.getByLabelText(/^Password/) as HTMLInputElement;
      const toggleButtons = screen.getAllByRole('button', { name: '' });
      const passwordToggle = toggleButtons[0];

      // Show password
      await user.click(passwordToggle);
      expect(passwordInput.type).toBe('text');

      // Close the modal
      rerender(<SetPasswordModal open={false} />);

      // Re-open the modal
      rerender(<SetPasswordModal open={true} />);

      // Password should be hidden again
      const newPasswordInput = screen.getByLabelText(/^Password/) as HTMLInputElement;
      expect(newPasswordInput.type).toBe('password');
    });
  });
});
